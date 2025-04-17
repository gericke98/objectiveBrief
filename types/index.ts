export type NewsItem = {
  title: string;
  summary: string;
  sources: {
    name: string;
    summary: string;
  }[];
};

export type OpenAIMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};
