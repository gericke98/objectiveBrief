import { NextRequest } from "next/server";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const MODEL = "gpt-4o-mini";

interface OpenAIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

async function callOpenAI(
  messages: OpenAIMessage[],
  temperature: number,
  retryCount = 0
) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature,
      messages,
    }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    console.error(
      `[OpenAI Error] Status: ${response.status}, Body:`,
      responseText
    );

    if (
      retryCount < MAX_RETRIES &&
      (response.status === 429 || response.status >= 500)
    ) {
      const delay = RETRY_DELAY * Math.pow(2, retryCount);

      await new Promise((resolve) => setTimeout(resolve, delay));
      return callOpenAI(messages, temperature, retryCount + 1);
    }

    throw new Error(`OpenAI API error: ${response.status} ${responseText}`);
  }

  try {
    const data = JSON.parse(responseText);

    return data;
  } catch (error) {
    console.error(`[OpenAI Error] Failed to parse response:`, error);
    throw new Error(`Failed to parse OpenAI response: ${error}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, temperature } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: "Invalid request: messages must be an array" },
        { status: 400 }
      );
    }

    const result = await callOpenAI(messages, temperature || 0.7);
    return Response.json(result);
  } catch (error) {
    console.error(`[API Error]`, error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
