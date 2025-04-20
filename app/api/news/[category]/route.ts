import { getObjectivityPrompt, getTrendingPrompt } from "@/placeholder";
import { OpenAIMessage } from "@/types";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const TIMEOUT = 30000; // 30 seconds timeout

async function callOpenAI(messages: OpenAIMessage[], temperature: number) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/openai`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          temperature,
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    return response.json();
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const pathnameParts = url.pathname.split("/");
  const category = decodeURIComponent(
    pathnameParts[pathnameParts.length - 1] || "actualidad"
  );

  console.log(`[News API] Processing request for category: ${category}`);

  try {
    // 1. Get trending news
    console.log(`[News API] Fetching trending news for ${category}`);
    const trendingPrompt = getTrendingPrompt(category);

    const trendingRes = await callOpenAI(
      [{ role: "user", content: trendingPrompt }],
      0.7
    );

    const content = trendingRes.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    // 2. Parse and process news
    console.log(`[News API] Processing trending news for ${category}`);
    let parsedNews;
    try {
      // First try to parse directly
      parsedNews = JSON.parse(content);
    } catch {
      // If that fails, try to clean the content
      const cleanedContent = content
        .replace(/```json\n?|\n?```/g, "") // Remove markdown code blocks
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
        .trim();

      try {
        parsedNews = JSON.parse(cleanedContent);
      } catch {
        console.error("[News API] Failed to parse JSON:", cleanedContent);
        throw new Error("Invalid JSON format in OpenAI response");
      }
    }

    if (!Array.isArray(parsedNews)) {
      throw new Error("Invalid news format: expected an array");
    }

    // 3. Create objective view for each
    console.log(`[News API] Creating objective views for ${category}`);
    const newsList = await Promise.all(
      parsedNews.map(async (item: { title: string; summary: string }) => {
        try {
          const objectivityPrompt = getObjectivityPrompt(item);
          const result = await callOpenAI(
            [{ role: "user", content: objectivityPrompt }],
            0.5
          );

          let parsedResult;
          try {
            const resultContent =
              result.choices[0].message.content?.trim() || "{}";
            parsedResult = JSON.parse(resultContent);
          } catch {
            // If parsing fails, try to clean the content
            const cleanedContent =
              result.choices[0].message.content
                ?.replace(/```json\n?|\n?```/g, "")
                .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
                .trim() || "{}";

            try {
              parsedResult = JSON.parse(cleanedContent);
            } catch {
              console.error(
                "[News API] Failed to parse objective result:",
                cleanedContent
              );
              parsedResult = { summary: "", sources: [] };
            }
          }

          return {
            title: item.title,
            summary: parsedResult.summary || "",
            sources: parsedResult.sources || [],
          };
        } catch (error) {
          console.error(
            `[News API] Error processing item: ${item.title}`,
            error
          );
          return {
            title: item.title,
            summary: "No se pudo generar un resumen en este momento.",
            sources: [],
          };
        }
      })
    );

    console.log(
      `[News API] Successfully processed ${newsList.length} items for ${category}`
    );
    return Response.json({ newsList });
  } catch (error: unknown) {
    console.error(`[News API] Error fetching news for ${category}:`, error);
    const isTimeout = error instanceof Error && error.name === "AbortError";
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch news",
        code: isTimeout ? "TIMEOUT" : "INTERNAL_ERROR",
      },
      {
        status: isTimeout ? 504 : 500,
      }
    );
  }
}
