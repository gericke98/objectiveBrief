"use server";

interface OpenAIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function callOpenAI(
  messages: OpenAIMessage[],
  temperature: number = 0.7
) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/openai`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
      temperature,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  return response.json();
}
