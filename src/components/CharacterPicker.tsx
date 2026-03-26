import { useState, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface CharacterState {
  name: string;
  mood: string;
  persona: string;
  knownEvents: string[];
}

interface CharacterPickerProps {
  bookTitle: string;
  chapterTitle: string;
  chapterContent: string[];
  onSelect: (character: CharacterState) => void;
  onClose: () => void;
}

const EXTRACT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-characters`;

// Cache per chapter title
const characterCache = new Map<string, CharacterState[]>();

const CharacterPicker = ({ bookTitle, chapterTitle, chapterContent, onSelect, onClose }: CharacterPickerProps) => {
  const [characters, setCharacters] = useState<CharacterState[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cacheKey = `${bookTitle}:${chapterTitle}`;
    if (characterCache.has(cacheKey)) {
      setCharacters(characterCache.get(cacheKey)!);
      setLoading(false);
      return;
    }

    const fetchCharacters = async () => {
      try {
        const resp = await fetch(EXTRACT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ bookTitle, chapterTitle, chapterContent }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.error || "提取角色失败");
        }

        const data = await resp.json();
        const chars: CharacterState[] = data.characters || [];
        characterCache.set(cacheKey, chars);
        setCharacters(chars);
      } catch (e: any) {
        console.error("Extract characters error:", e);
        toast.error(e.message || "提取角色失败");
      } finally {
        setLoading(false);
      }
    };

    fetchCharacters();
  }, [bookTitle, chapterTitle, chapterContent]);

  const moodEmoji = (mood: string) => {
    if (mood.includes("怒") || mood.includes("愤")) return "😠";
    if (mood.includes("喜") || mood.includes("开心") || mood.includes("高兴")) return "😊";
    if (mood.includes("悲") || mood.includes("伤") || mood.includes("哭")) return "😢";
    if (mood.includes("惧") || mood.includes("恐") || mood.includes("怕")) return "😨";
    if (mood.includes("冷") || mood.includes("淡")) return "😐";
    if (mood.includes("疑") || mood.includes("惑")) return "🤔";
    return "✨";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-wood-light/30 bg-secondary">
        <h3 className="text-sm font-display text-gold tracking-wider">选择角色对话</h3>
        <p className="text-xs text-secondary-foreground/50 mt-1">{chapterTitle}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-gold" />
            <p className="text-sm text-secondary-foreground/60">正在识别章节角色…</p>
          </div>
        ) : characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <p className="text-sm text-secondary-foreground/50">未能识别出角色</p>
            <button onClick={onClose} className="text-xs text-cinnabar hover:underline">关闭</button>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {characters.map((char, i) => (
                <motion.button
                  key={char.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => onSelect(char)}
                  className="w-full text-left p-4 rounded-lg bg-wood-light/40 border border-wood-light/50 hover:border-cinnabar/50 hover:bg-wood-light/60 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cinnabar/15 border border-cinnabar/30 flex items-center justify-center text-lg shrink-0 group-hover:bg-cinnabar/25 transition-colors">
                      {moodEmoji(char.mood)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gold text-sm font-display tracking-wider">{char.name}</span>
                        <span className="text-xs text-secondary-foreground/40">{char.mood}</span>
                      </div>
                      <p className="text-xs text-secondary-foreground/60 mt-1 line-clamp-2">{char.persona}</p>
                    </div>
                    <Sparkles size={14} className="text-cinnabar/40 group-hover:text-cinnabar transition-colors shrink-0" />
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterPicker;
