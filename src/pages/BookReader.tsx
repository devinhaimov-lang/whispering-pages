import { useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import NovelReader from "@/components/NovelReader";
import AIChatPanel from "@/components/AIChatPanel";
import { books } from "@/data/books";
import { chapters as staticChapters } from "@/data/novel";
import { useDbChapters, type DbChapter } from "@/hooks/useBooks";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ArrowLeft, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ReaderChapter {
  id: number;
  title: string;
  content: string[];
  characterState: {
    name: string;
    mood: string;
    persona: string;
    knownEvents: string[];
  };
}

function dbChapterToReader(ch: DbChapter, idx: number): ReaderChapter {
  return {
    id: idx + 1,
    title: ch.title,
    content: ch.content || [],
    characterState: {
      name: ch.character_name || "",
      mood: ch.character_mood || "",
      persona: ch.character_persona || "",
      knownEvents: ch.known_events || [],
    },
  };
}

const BookReader = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentChapter, setCurrentChapter] = useState(0);
  const [selectedText, setSelectedText] = useState("");
  const [showChat, setShowChat] = useState(true);

  const isDbBook = searchParams.get("source") === "db";

  // For DB books, fetch book info
  const { data: dbBook } = useQuery({
    queryKey: ["db-book", bookId],
    queryFn: async () => {
      const { data } = await supabase.from("books").select("*").eq("id", bookId!).single();
      return data;
    },
    enabled: isDbBook && !!bookId,
  });

  const { data: dbChapters = [] } = useDbChapters(isDbBook ? bookId : undefined);

  // Static book lookup
  const staticBook = !isDbBook ? books.find((b) => b.id === bookId) : null;

  const bookTitle = isDbBook ? dbBook?.title || "加载中..." : staticBook?.title || "";
  const bookSubtitle = isDbBook ? dbBook?.subtitle || "" : staticBook?.subtitle || "";
  const bookIdForChat = isDbBook ? bookId! : bookId!;

  const chapters: ReaderChapter[] = isDbBook
    ? dbChapters.map(dbChapterToReader)
    : staticChapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        content: ch.content,
        characterState: ch.characterState,
      }));

  const hasContent = isDbBook ? dbChapters.length > 0 : staticBook?.hasContent;

  const handleTextSelect = useCallback((text: string) => {
    setSelectedText(text);
    setShowChat(true);
  }, []);

  const handleSelectedTextUsed = useCallback(() => {
    setSelectedText("");
  }, []);

  if (!isDbBook && !staticBook) {
    return (
      <div className="h-screen flex items-center justify-center paper-texture">
        <div className="text-center space-y-4">
          <p className="text-2xl font-display text-foreground">未找到此书</p>
          <button onClick={() => navigate("/")} className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded text-sm hover:bg-cinnabar-glow transition-colors">
            返回书阁
          </button>
        </div>
      </div>
    );
  }

  if (!hasContent) {
    return (
      <div className="h-screen flex items-center justify-center paper-texture">
        <div className="text-center space-y-4">
          <p className="text-2xl font-display text-foreground">此卷尚未开启</p>
          <p className="text-muted-foreground">敬请期待</p>
          <button onClick={() => navigate("/")} className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded text-sm hover:bg-cinnabar-glow transition-colors">
            返回书阁
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft size={18} />
            <span className="text-sm hidden sm:inline">书阁</span>
          </button>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-cinnabar/15 border border-cinnabar/30 flex items-center justify-center">
              <BookOpen size={16} className="text-cinnabar" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-[0.2em] font-display text-foreground seal-stamp">{bookTitle}</h1>
              <p className="text-xs text-muted-foreground tracking-wider">{bookSubtitle}</p>
            </div>
          </div>
        </div>
        <button onClick={() => setShowChat(!showChat)} className="flex items-center gap-2 px-3 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors lg:hidden">
          <MessageSquare size={16} />
          <span>{showChat ? "隐藏对话" : "角色对话"}</span>
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 min-w-0 ${showChat ? "hidden lg:block" : "block"}`}>
          <NovelReader
            chapters={chapters}
            currentChapter={currentChapter}
            onChapterChange={setCurrentChapter}
            onTextSelect={handleTextSelect}
          />
        </div>
        <div className="hidden lg:block w-px bg-border" />
        <div className={`w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 ${showChat ? "block" : "hidden lg:block"}`}>
          <AIChatPanel
            bookId={bookIdForChat}
            chapters={chapters}
            currentChapter={currentChapter}
            selectedText={selectedText}
            onSelectedTextUsed={handleSelectedTextUsed}
          />
        </div>
      </div>
    </div>
  );
};

export default BookReader;
