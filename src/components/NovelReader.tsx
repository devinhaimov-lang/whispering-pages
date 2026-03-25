import { useState, useCallback, useEffect, useRef } from "react";
import { chapters } from "@/data/novel";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NovelReaderProps {
  currentChapter: number;
  onChapterChange: (chapter: number) => void;
  onTextSelect: (text: string) => void;
}

const NovelReader = ({ currentChapter, onChapterChange, onTextSelect }: NovelReaderProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const chapter = chapters[currentChapter];

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    if (selectedText && selectedText.length > 0) {
      onTextSelect(selectedText);
    }
  }, [onTextSelect]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentChapter]);

  return (
    <div className="flex flex-col h-full">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <button
          onClick={() => onChapterChange(Math.max(0, currentChapter - 1))}
          disabled={currentChapter === 0}
          className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={18} />
          <span className="text-sm">上一章</span>
        </button>

        <div className="flex items-center gap-2 text-muted-foreground">
          <BookOpen size={16} />
          <span className="text-sm">
            {currentChapter + 1} / {chapters.length}
          </span>
        </div>

        <button
          onClick={() => onChapterChange(Math.min(chapters.length - 1, currentChapter + 1))}
          disabled={currentChapter === chapters.length - 1}
          className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <span className="text-sm">下一章</span>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* 阅读区域 */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto paper-texture vignette"
        onMouseUp={handleMouseUp}
      >
        <div className="max-w-2xl mx-auto px-8 py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {/* 章节标题 */}
              <h2 className="text-2xl font-bold text-center mb-8 text-foreground tracking-widest font-display">
                {chapter.title}
              </h2>

              {/* 装饰分隔线 */}
              <div className="flex items-center justify-center mb-8">
                <div className="h-px w-16 bg-cinnabar/30" />
                <div className="mx-3 w-2 h-2 rotate-45 bg-cinnabar/50" />
                <div className="h-px w-16 bg-cinnabar/30" />
              </div>

              {/* 正文 */}
              <div className="space-y-6">
                {chapter.content.map((paragraph, idx) => (
                  <motion.p
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05, duration: 0.4 }}
                    className="text-lg leading-[2] text-foreground/90 indent-8 selection:bg-cinnabar/20 selection:text-foreground cursor-text"
                  >
                    {paragraph}
                  </motion.p>
                ))}
              </div>

              {/* 章末装饰 */}
              <div className="flex items-center justify-center mt-12 mb-8">
                <div className="h-px w-24 bg-border" />
                <span className="mx-4 text-muted-foreground text-sm">— 本章完 —</span>
                <div className="h-px w-24 bg-border" />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 底部章节选择 */}
      <div className="flex items-center gap-2 px-6 py-3 border-t border-border bg-card/50">
        {chapters.map((ch, idx) => (
          <button
            key={ch.id}
            onClick={() => onChapterChange(idx)}
            className={`text-xs px-3 py-1.5 rounded transition-all ${
              idx === currentChapter
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {ch.title.split("·")[0].trim()}
          </button>
        ))}
      </div>
    </div>
  );
};

export default NovelReader;
