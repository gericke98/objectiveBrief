import { OpenAIMessage } from "@/types";
import { NextRequest } from "next/server";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const TIMEOUT = 25000; // 25 seconds timeout
const MODEL = process.env.MODEL;

async function callOpenAI(
  messages: OpenAIMessage[],
  temperature: number,
  retryCount = 0
) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

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
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

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
        console.log(
          `[OpenAI] Retrying in ${delay}ms (attempt ${
            retryCount + 1
          }/${MAX_RETRIES})`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        return callOpenAI(messages, temperature, retryCount + 1);
      }

      throw new Error(`OpenAI API error: ${response.status} ${responseText}`);
    }

    try {
      const data = JSON.parse(responseText);
      return data;
    } catch (error: unknown) {
      console.error(`[OpenAI Error] Failed to parse response:`, error);
      // Try to clean the response
      const cleanedResponse = responseText
        .replace(/```json\n?|\n?```/g, "")
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
        .trim();

      try {
        return JSON.parse(cleanedResponse);
      } catch {
        console.error(
          `[OpenAI Error] Failed to parse cleaned response:`,
          cleanedResponse
        );
        throw new Error(
          `Failed to parse OpenAI response: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[OpenAI Error] Request timed out");
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(2, retryCount);
        console.log(
          `[OpenAI] Retrying after timeout in ${delay}ms (attempt ${
            retryCount + 1
          }/${MAX_RETRIES})`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return callOpenAI(messages, temperature, retryCount + 1);
      }
    }
    throw error;
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
  } catch (error: unknown) {
    console.error(`[API Error]`, error);
    const isTimeout = error instanceof Error && error.name === "AbortError";
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        code: isTimeout ? "TIMEOUT" : "INTERNAL_ERROR",
      },
      {
        status: isTimeout ? 504 : 500,
      }
    );
  }
}
