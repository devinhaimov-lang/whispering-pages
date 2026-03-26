import { useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import NovelReader from "@/components/NovelReader";
import AIChatPanel from "@/components/AIChatPanel";
import CharacterPicker from "@/components/CharacterPicker";
import { books } from "@/data/books";
import { chapters as staticChapters } from "@/data/novel";
import { useDbChapters, type DbChapter } from "@/hooks/useBooks";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ArrowLeft, Sparkles, X, ChevronLeft } from "lucide-react";
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

interface SelectedCharacter {
  name: string;
  mood: string;
  persona: string;
  knownEvents: string[];
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
  const [showPanel, setShowPanel] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<SelectedCharacter | null>(null);

  const isDbBook = searchParams.get("source") === "db";

  const { data: dbBook } = useQuery({
    queryKey: ["db-book", bookId],
    queryFn: async () => {
      const { data } = await supabase.from("books").select("*").eq("id", bookId!).single();
      return data;
    },
    enabled: isDbBook && !!bookId,
  });

  const { data: dbChapters = [] } = useDbChapters(isDbBook ? bookId : undefined);

  const staticBook = !isDbBook ? books.find((b) => b.id === bookId) : null;
  const bookTitle = isDbBook ? dbBook?.title || "加载中..." : staticBook?.title || "";
  const bookSubtitle = isDbBook ? dbBook?.subtitle || "" : staticBook?.subtitle || "";

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
    if (!showPanel) setShowPanel(true);
    // If no character selected yet, stay on picker; user will pick then text is ready
  }, [showPanel]);

  const handleSelectedTextUsed = useCallback(() => {
    setSelectedText("");
  }, []);

  const handleCharacterSelect = useCallback((char: SelectedCharacter) => {
    setSelectedCharacter(char);
  }, []);

  const handleBackToPicker = useCallback(() => {
    setSelectedCharacter(null);
  }, []);

  // Reset character selection when chapter changes
  const handleChapterChange = useCallback((ch: number) => {
    setCurrentChapter(ch);
    setSelectedCharacter(null);
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

  const chapter = chapters[currentChapter];

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
      </header>

      <div className="flex-1 overflow-hidden relative">
        <NovelReader
          chapters={chapters}
          currentChapter={currentChapter}
          onChapterChange={handleChapterChange}
          onTextSelect={handleTextSelect}
        />

        {/* 浮窗 */}
        <AnimatePresence>
          {showPanel && chapter && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-20 right-6 w-[360px] h-[520px] max-h-[70vh] rounded-xl shadow-2xl border border-border overflow-hidden z-50 flex flex-col"
              style={{ boxShadow: "0 25px 60px -12px rgba(0,0,0,0.35)" }}
            >
              {selectedCharacter ? (
                <>
                  <div className="flex items-center justify-between px-4 py-2 bg-secondary border-b border-wood-light/30">
                    <button onClick={handleBackToPicker} className="flex items-center gap-1 text-xs text-secondary-foreground/60 hover:text-gold transition-colors">
                      <ChevronLeft size={14} />
                      <span>换角色</span>
                    </button>
                    <span className="text-sm font-display text-gold tracking-wider">{selectedCharacter.name}</span>
                    <button onClick={() => setShowPanel(false)} className="p-1 rounded hover:bg-wood-light/30 text-secondary-foreground/60 hover:text-secondary-foreground transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex-1 min-h-0">
                    <AIChatPanel
                      bookId={bookId!}
                      chapters={chapters}
                      currentChapter={currentChapter}
                      selectedText={selectedText}
                      onSelectedTextUsed={handleSelectedTextUsed}
                      characterOverride={selectedCharacter}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between px-4 py-2 bg-secondary border-b border-wood-light/30">
                    <span className="text-sm font-display text-gold tracking-wider">召唤角色</span>
                    <button onClick={() => setShowPanel(false)} className="p-1 rounded hover:bg-wood-light/30 text-secondary-foreground/60 hover:text-secondary-foreground transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex-1 min-h-0">
                    <CharacterPicker
                      bookTitle={bookTitle}
                      chapterTitle={chapter.title}
                      chapterContent={chapter.content}
                      onSelect={handleCharacterSelect}
                      onClose={() => setShowPanel(false)}
                    />
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 召唤角色按钮 */}
        <motion.button
          onClick={() => {
            if (showPanel) {
              setShowPanel(false);
              setSelectedCharacter(null);
            } else {
              setShowPanel(true);
            }
          }}
          className="absolute bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-cinnabar hover:bg-cinnabar-glow text-primary-foreground shadow-lg flex items-center justify-center transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          style={{ boxShadow: "0 8px 24px -4px hsla(12, 55%, 34%, 0.5)" }}
        >
          {showPanel ? <X size={22} /> : <Sparkles size={22} />}
        </motion.button>
      </div>
    </div>
  );
};

export default BookReader;
