// app/news/[category]/page.tsx
import React from "react";

export const dynamic = "force-dynamic"; // optional: force SSR

type NewsItem = {
  title: string;
  summary: string;
};

export default async function NewsPage({
  params,
}: {
  params: { category: string };
}) {
  const category = decodeURIComponent(params.category);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/news/${category}`,
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
              <p className="text-gray-700">{news.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
