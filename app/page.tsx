// app/page.tsx
import Link from "next/link";
import { NewsListContainer } from "@/components/NewsListContainer";
import { callOpenAI } from "@/lib/openai";

interface NewsItem {
  title: string;
  summary: string;
  sources: {
    name: string;
    summary: string;
  }[];
}

const CATEGORIES = [
  "actualidad",
  "economía",
  "tecnología",
  "política",
  "deportes",
  "cultura",
  "sociedad",
  "internacional",
];

const SOURCES = [
  "El País",
  "El Mundo",
  "ABC",
  "La Vanguardia",
  "El Confidencial",
];

function cleanJsonResponse(content: string): string {
  // Remove markdown code block syntax if present
  return content.replace(/```json\n?|\n?```/g, "").trim();
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  let newsList: NewsItem[] = [];
  const currentCategory = (await searchParams).category || "actualidad";

  try {
    // 1. Get trending news
    const trendingPrompt = `
Act as a Spanish news editor. Return the top 10 trending news from Spain today in the category "${currentCategory}".
Return ONLY a valid JSON array with objects containing "title" and "summary" fields.
Do not include any markdown formatting or additional text.
Example format: [{"title": "News Title", "summary": "News Summary"}]
`;

    const trendingRes = await callOpenAI(
      [{ role: "user", content: trendingPrompt }],
      0.7
    );

    const content = trendingRes.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    // 2. Parse and process news
    const cleanedContent = cleanJsonResponse(content);

    const parsedNews = JSON.parse(cleanedContent);
    if (!Array.isArray(parsedNews)) {
      throw new Error("Invalid news format");
    }

    // 3. Create objective view for each
    newsList = await Promise.all(
      parsedNews.map(async (item: NewsItem) => {
        const objectivityPrompt = `
Eres un periodista imparcial. Escribe un resumen objetivo de la siguiente noticia utilizando información de los principales medios españoles: ${SOURCES.join(
          ", "
        )}.

Título: ${item.title}
Resumen: ${item.summary}

Proporciona una síntesis clara e imparcial (máximo 150 palabras).
Además, para cada fuente (${SOURCES.join(
          ", "
        )}), proporciona un resumen muy breve (máximo 50 palabras) de su perspectiva sobre esta noticia.
Formatea la respuesta como un objeto JSON con los campos "summary" y "sources", donde "sources" es un array de objetos con los campos "name" y "summary".
Formato de ejemplo:
{
  "summary": "Resumen objetivo aquí...",
  "sources": [
    {
      "name": "Nombre de la Fuente",
      "summary": "Resumen breve de esta fuente..."
    }
  ]
}
`;

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
                The Objective Brief
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
            © {new Date().getFullYear()} The Objective Brief. Todas las noticias
            son generadas por IA.
          </p>
        </div>
      </footer>
    </div>
  );
}
