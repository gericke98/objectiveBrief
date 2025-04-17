// app/page.tsx
import Link from "next/link";
import { NewsListContainer } from "@/components/NewsListContainer";
import { callOpenAI } from "@/lib/openai";
import { NewsItem } from "@/types";
import {
  CATEGORIES,
  getObjectivityPrompt,
  getTrendingPrompt,
  NAME,
} from "@/placeholder";
import { cleanJsonResponse } from "./utils";

interface PageProps {
  params: Promise<{ category: string }>;
}

export default async function HomePage({ params }: PageProps) {
  let newsList: NewsItem[] = [];
  const { category } = await params;
  const currentCategory = category || "actualidad";

  try {
    // Paso 1: Obtengo las noticias trendy del dia (Extraigo el top 10 de la categoría seleccionada)
    const trendingPrompt = getTrendingPrompt(currentCategory);

    const trendingRes = await callOpenAI(
      [{ role: "user", content: trendingPrompt }],
      0.7
    );

    const content = trendingRes.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    const cleanedContent = cleanJsonResponse(content);
    const parsedNews = JSON.parse(cleanedContent);
    if (!Array.isArray(parsedNews)) {
      throw new Error("Invalid news format");
    }

    // Paso 2: Extraigo la noticia objetiva cruzándola con todas las fuentes (Fuentes predefinidas en placeholder)
    newsList = await Promise.all(
      parsedNews.map(async (item: NewsItem) => {
        const objectivityPrompt = getObjectivityPrompt(item);
        let retries = 3;

        while (retries > 0) {
          try {
            console.log(
              `[HomePage] Attempting OpenAI call for "${item.title}" (${retries} retries left)`
            );

            const result = await Promise.race([
              callOpenAI([{ role: "user", content: objectivityPrompt }], 0.5),
              new Promise((_, reject) =>
                setTimeout(
                  () => reject(new Error("OpenAI request timeout")),
                  30000
                )
              ),
            ]);

            console.log("[HomePage] OpenAI raw response:", result);

            if (!result.choices?.[0]?.message?.content) {
              console.error(
                "[HomePage] Invalid OpenAI response structure:",
                result
              );
              throw new Error("Invalid OpenAI response structure");
            }

            const content = result.choices[0].message.content.trim();
            console.log("[HomePage] OpenAI content before parsing:", content);

            const parsedResult = JSON.parse(content);
            console.log("[HomePage] Parsed result:", parsedResult);

            return {
              title: item.title,
              summary: parsedResult.summary || "",
              sources: parsedResult.sources || [],
            };
          } catch (error) {
            console.error(`[HomePage] Error in attempt ${4 - retries}:`, error);
            retries--;

            if (retries > 0) {
              // Wait before retrying (exponential backoff)
              await new Promise((resolve) =>
                setTimeout(resolve, Math.pow(2, 3 - retries) * 1000)
              );
            }
          }
        }

        // If we've exhausted all retries, return a fallback
        console.error("[HomePage] All retries failed for:", item.title);
        return {
          title: item.title,
          summary:
            "No se pudo generar un resumen en este momento. Por favor, inténtalo de nuevo más tarde.",
          sources: [],
        };
      })
    );
    console.log(newsList[0].sources);
  } catch (error) {
    console.error("Error fetching news:", error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-blue-600">📰</span>
                {NAME}
              </h1>
            </div>
            <nav className="mt-4 sm:mt-0">
              <ul className="flex flex-wrap gap-2">
                {CATEGORIES.map((category) => (
                  <li key={category}>
                    <Link
                      href={`/?category=${category}`}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        category === currentCategory
                          ? "text-blue-600 bg-blue-50"
                          : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                      }`}
                      prefetch={false}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Noticias Destacadas
              </h2>
              <p className="mt-2 text-gray-600">
                Las noticias más relevantes del día en {currentCategory},
                resumidas objetivamente por inteligencia artificial.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Actualizado hace unos minutos
              </span>
            </div>
          </div>
        </div>

        <NewsListContainer newsList={newsList} category={currentCategory} />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} ${NAME}. Todas las noticias son
            generadas por IA.
          </p>
        </div>
      </footer>
    </div>
  );
}
