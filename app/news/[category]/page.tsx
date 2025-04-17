// app/news/[category]/page.tsx

import { NewsItem } from "@/types";
import React from "react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ category: string }>;
}

export default async function NewsPage({ params }: PageProps) {
  const { category } = await params;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/news/${category}`,
    {
      cache: "no-store",
    }
  );

  const data = await res.json();
  const newsList: NewsItem[] = data.newsList || [];

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">
        Últimas noticias en {category}
      </h1>
      {newsList.length === 0 ? (
        <p className="text-gray-600">No se encontraron noticias hoy.</p>
      ) : (
        <ul className="space-y-6">
          {newsList.map((news, index) => (
            <li key={index} className="p-4 border rounded shadow bg-white">
              <h2 className="text-xl font-semibold mb-2">{news.title}</h2>
              <p className="text-gray-700 mb-4">{news.summary}</p>
              {news.sources && news.sources.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">
                    Perspectivas de los medios:
                  </h3>
                  <ul className="space-y-2">
                    {news.sources.map((source, sourceIndex) => (
                      <li key={sourceIndex} className="text-sm">
                        <span className="font-medium">{source.name}:</span>{" "}
                        {source.summary}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
