export function cleanJsonResponse(content: string): string {
  return content.replace(/```json\n?|\n?```/g, "").trim();
}
