import { useState, useCallback } from "react";
import NovelReader from "@/components/NovelReader";
import AIChatPanel from "@/components/AIChatPanel";
import { novelTitle, novelSubtitle } from "@/data/novel";
import { BookOpen, MessageSquare } from "lucide-react";

const Index = () => {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [selectedText, setSelectedText] = useState("");
  const [showChat, setShowChat] = useState(true);

  const handleTextSelect = useCallback((text: string) => {
    setSelectedText(text);
    setShowChat(true);
  }, []);

  const handleSelectedTextUsed = useCallback(() => {
    setSelectedText("");
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* 顶部标题栏 */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-cinnabar/15 border border-cinnabar/30 flex items-center justify-center">
              <BookOpen size={16} className="text-cinnabar" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-[0.2em] font-display text-foreground seal-stamp">
                {novelTitle}
              </h1>
              <p className="text-xs text-muted-foreground tracking-wider">{novelSubtitle}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowChat(!showChat)}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors lg:hidden"
        >
          <MessageSquare size={16} />
          <span>{showChat ? "隐藏对话" : "角色对话"}</span>
        </button>
      </header>

      {/* 主体分栏 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：阅读器 */}
        <div className={`flex-1 min-w-0 ${showChat ? "hidden lg:block" : "block"}`}>
          <NovelReader
            currentChapter={currentChapter}
            onChapterChange={setCurrentChapter}
            onTextSelect={handleTextSelect}
          />
        </div>

        {/* 分隔线 */}
        <div className="hidden lg:block w-px bg-border" />

        {/* 右侧：AI 对话 */}
        <div
          className={`w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 ${
            showChat ? "block" : "hidden lg:block"
          }`}
        >
          <AIChatPanel
            currentChapter={currentChapter}
            selectedText={selectedText}
            onSelectedTextUsed={handleSelectedTextUsed}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
