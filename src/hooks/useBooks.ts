import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DbBook {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  author: string;
  cover_url: string;
  description: string;
  tags: string[];
  status: string;
  sort_order: number;
}

export interface DbChapter {
  id: string;
  book_id: string;
  chapter_number: number;
  title: string;
  content: string[];
  character_name: string;
  character_mood: string;
  character_persona: string;
  known_events: string[];
}

export function useDbBooks() {
  return useQuery({
    queryKey: ["db-books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books").select("*").order("sort_order");
      if (error) throw error;
      return (data || []) as DbBook[];
    },
  });
}

export function useDbChapters(bookId: string | undefined) {
  return useQuery({
    queryKey: ["db-chapters", bookId],
    queryFn: async () => {
      if (!bookId) return [];
      const { data, error } = await supabase
        .from("chapters").select("*").eq("book_id", bookId).order("chapter_number");
      if (error) throw error;
      return (data || []) as DbChapter[];
    },
    enabled: !!bookId,
  });
}
