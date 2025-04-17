// app/news/[category]/route.ts
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

interface OpenAIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

const SOURCES = [
  "El País",
  "El Mundo",
  "ABC",
  "La Vanguardia",
  "El Confidencial",
];

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

export async function GET(
  req: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    const category = decodeURIComponent(params.category || "actualidad");

    // 1. Get trending news
    const trendingPrompt = `
Act as a Spanish news editor. Return the top 10 trending news from Spain today in the category "${category}".
Format the response as a valid JSON array with objects containing "title" and "summary" fields.
Example format: [{"title": "News Title", "summary": "News Summary"}]
`;

    const trendingRes = await callOpenAI(
      [{ role: "user", content: trendingPrompt }],
      0.7
    );

    const content = trendingRes.choices[0]?.message?.content;

    if (!content) {
      console.error(`[Route] No content received from OpenAI`);
      return Response.json({ newsList: [] });
    }

    let newsList;
    try {
      const parsed = JSON.parse(content);
      newsList = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error(`[Route] Parsing failed:`, err);
      return Response.json({ newsList: [] });
    }

    if (!newsList.length) {
      return Response.json({ newsList: [] });
    }

    // 2. Create objective view for each

    const processed = await Promise.all(
      newsList.map(async (item: NewsItem) => {
        const objectivityPrompt = `
You are an impartial journalist. Write an objective summary of the following news using insights from top Spanish outlets: ${SOURCES.join(
          ", "
        )}.

Title: ${item.title}
Summary: ${item.summary}

Return a clear, unbiased synthesis (max 150 words).
`;

        const result = await callOpenAI(
          [{ role: "user", content: objectivityPrompt }],
          0.5
        );

        return {
          title: item.title,
          summary: result.choices[0].message.content?.trim() || "",
        };
      })
    );

    return Response.json({ newsList: processed });
  } catch (error) {
    console.error(`[Route] Error:`, error);
    return Response.json({ newsList: [] }, { status: 500 });
  }
}

interface NewsItem {
  title: string;
  summary: string;
}
