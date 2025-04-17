import { getObjectivityPrompt, getTrendingPrompt } from "@/placeholder";
import { OpenAIMessage } from "@/types";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

async function callOpenAI(messages: OpenAIMessage[], temperature: number) {
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
    }
  );

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const pathnameParts = url.pathname.split("/");
  const category = decodeURIComponent(
    pathnameParts[pathnameParts.length - 1] || "actualidad"
  );
  try {
    // 1. Get trending news
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
    const cleanedContent = content.replace(/```json\n?|\n?```/g, "").trim();
    const parsedNews = JSON.parse(cleanedContent);
    if (!Array.isArray(parsedNews)) {
      throw new Error("Invalid news format");
    }

    // 3. Create objective view for each
    const newsList = await Promise.all(
      parsedNews.map(async (item: { title: string; summary: string }) => {
        const objectivityPrompt = getObjectivityPrompt(item);

        const result = await callOpenAI(
          [{ role: "user", content: objectivityPrompt }],
          0.5
        );

        const parsedResult = JSON.parse(
          result.choices[0].message.content?.trim() || "{}"
        );

        return {
          title: item.title,
          summary: parsedResult.summary || "",
          sources: parsedResult.sources || [],
        };
      })
    );

    return Response.json({ newsList });
  } catch (error) {
    console.error("Error fetching news:", error);
    return Response.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
