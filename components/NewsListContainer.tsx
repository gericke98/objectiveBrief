"use client";

import { useState, useEffect } from "react";
import { NewsList } from "./NewsList";
import { usePathname, useSearchParams } from "next/navigation";

interface NewsItem {
  title: string;
  summary: string;
}

interface NewsListContainerProps {
  newsList: NewsItem[];
  category: string;
}

export function NewsListContainer({
  newsList,
  category,
}: NewsListContainerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Show loading state immediately when URL changes
    setIsLoading(true);
  }, [pathname, searchParams]);

  // Keep loading state until new data arrives
  useEffect(() => {
    if (newsList.length > 0) {
      setIsLoading(false);
    }
  }, [newsList]);

  return (
    <NewsList newsList={newsList} category={category} isLoading={isLoading} />
  );
}
