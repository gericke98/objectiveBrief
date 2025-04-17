// components/NewsList.tsx
"use client";

import { NewsItem } from "@/types";
import { useState } from "react";

interface NewsListProps {
  newsList: NewsItem[];
  category: string;
  isLoading?: boolean;
}

export function NewsList({
  newsList,
  category,
  isLoading = false,
}: NewsListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <article
            key={i}
            className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center gap-x-4 text-xs mb-4">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-blue-100 rounded-full animate-pulse"></div>
              </div>
              <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  }

  if (!newsList || newsList.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm">
        <div className="max-w-md mx-auto">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No hay noticias disponibles
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Inténtalo de nuevo más tarde.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {newsList.map((item, index) => (
        <NewsCard key={index} item={item} category={category} />
      ))}
    </div>
  );
}

function NewsCard({ item, category }: { item: NewsItem; category: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const summaryLines = item.summary.split("\n");
  const shouldShowReadMore =
    summaryLines.length > 4 || item.summary.length > 200;

  return (
    <article className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-x-4 text-xs mb-4">
          <time dateTime="2024-01-01" className="text-gray-500">
            Hoy
          </time>
          <span className="relative z-10 rounded-full bg-blue-50 px-3 py-1.5 font-medium text-blue-600">
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </span>
        </div>
        <h3 className="text-lg font-semibold leading-6 text-gray-900 group-hover:text-blue-600 transition-colors duration-200 mb-3">
          {item.title}
        </h3>
        <div className="relative">
          <p
            className={`text-sm leading-6 text-gray-600 ${
              !isExpanded ? "line-clamp-4" : ""
            }`}
          >
            {item.summary}
          </p>
          {shouldShowReadMore && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isExpanded ? "Mostrar menos" : "Leer más"}
            </button>
          )}
        </div>

        {item.sources && item.sources.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowSources(!showSources)}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              {showSources ? "Ocultar fuentes" : "Ver fuentes"}
              <svg
                className={`w-4 h-4 transition-transform ${
                  showSources ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showSources && (
              <div className="mt-3 space-y-3">
                {item.sources.map((source, index) => (
                  <div key={index} className="border-l-4 border-blue-200 pl-3">
                    <p className="text-sm font-medium text-gray-900">
                      {source.name}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {source.summary}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
    </article>
  );
}
