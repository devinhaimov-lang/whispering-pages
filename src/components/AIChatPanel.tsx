import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Send, Sparkles, User, Scroll } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface CharacterState {
  name: string;
  mood: string;
  persona: string;
  knownEvents: string[];
}

interface ChapterData {
  id: number;
  title: string;
  content: string[];
  characterState: CharacterState;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AIChatPanelProps {
  bookId: string;
  chapters: ChapterData[];
  currentChapter: number;
  selectedText: string;
  onSelectedTextUsed: () => void;
  characterOverride?: CharacterState;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/novel-chat`;
const SESSION_ID = crypto.randomUUID();

function getGreeting(chapter: ChapterData): string {
  if (chapter.characterState.name) {
    return `……我是${chapter.characterState.name}。你想聊些什么？`;
  }
  return "你好，有什么想聊的吗？";
}

const AIChatPanel = ({ bookId, chapters, currentChapter, selectedText, onSelectedTextUsed }: AIChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const chapter = chapters[currentChapter];

  useEffect(() => {
    abortRef.current?.abort();
    if (!chapter) return;
    setMessages([{ id: Date.now().toString(), role: "assistant", content: getGreeting(chapter) }]);
    setIsStreaming(false);
  }, [currentChapter, chapters]);

  useEffect(() => {
    if (selectedText) {
      setInput(`「${selectedText}」\n\n——你对这段话怎么看？`);
      onSelectedTextUsed();
      inputRef.current?.focus();
    }
  }, [selectedText, onSelectedTextUsed]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveMessage = useCallback(
    async (role: string, content: string) => {
      try {
        await supabase.from("chat_messages").insert({
          session_id: SESSION_ID,
          book_id: bookId,
          chapter_id: chapter?.id || 1,
          role,
          content,
        });
      } catch (e) {
        console.error("Failed to save message:", e);
      }
    },
    [bookId, chapter?.id]
  );

  const handleSend = async () => {
    if (!input.trim() || isStreaming || !chapter) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);

    saveMessage("user", userMsg.content);

    const chatHistory = updatedMessages
      .filter((m) => m.role === "user" || (m.role === "assistant" && updatedMessages.indexOf(m) > 0))
      .map((m) => ({ role: m.role, content: m.content }));

    const controller = new AbortController();
    abortRef.current = controller;
    let assistantContent = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: chatHistory,
          characterState: chapter.characterState,
          bookTitle: bookId,
          chapterTitle: chapter.title,
        }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `请求失败 (${resp.status})`);
      }
      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      const upsertAssistant = (chunk: string) => {
        assistantContent += chunk;
        const currentContent = assistantContent;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.id.startsWith("stream-")) {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: currentContent } : m);
          }
          return [...prev, { id: `stream-${Date.now()}`, role: "assistant", content: currentContent }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (assistantContent) saveMessage("assistant", assistantContent);
    } catch (e: any) {
      if (e.name === "AbortError") return;
      console.error("Stream error:", e);
      toast.error(e.message || "对话出错了，请稍后再试");
      if (!assistantContent) {
        setMessages((prev) => [...prev, { id: `error-${Date.now()}`, role: "assistant", content: "……抱歉，我方才走了会儿神。公子可否再说一遍？" }]);
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!chapter) {
    return <div className="flex items-center justify-center h-full wood-grain text-secondary-foreground/50">暂无角色</div>;
  }

  return (
    <div className="flex flex-col h-full wood-grain text-secondary-foreground">
      <div className="px-5 py-4 border-b border-wood-light/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cinnabar/20 border border-cinnabar/40 flex items-center justify-center">
            <Sparkles size={18} className="text-cinnabar-glow" />
          </div>
          <div>
            <h3 className="font-bold text-gold text-sm tracking-wider font-display">{chapter.characterState.name || "AI 角色"}</h3>
            <p className="text-xs text-secondary-foreground/60 mt-0.5">{chapter.characterState.mood || "等待对话"}</p>
          </div>
        </div>
        {chapter.characterState.knownEvents.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-secondary-foreground/40">
            <Scroll size={12} />
            <span>已知事件：{chapter.characterState.knownEvents.length} 件</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "bg-cinnabar/20 text-secondary-foreground border border-cinnabar/30" : "bg-wood-light/60 text-secondary-foreground/90 border border-wood-light/30"}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  {msg.role === "assistant" ? <Sparkles size={12} className="text-gold" /> : <User size={12} className="text-cinnabar-glow" />}
                  <span className="text-xs text-secondary-foreground/50">{msg.role === "assistant" ? (chapter.characterState.name || "AI") : "你"}</span>
                </div>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-wood-light/60 border border-wood-light/30 rounded-lg px-4 py-3 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-gold text-xs">执笔中</span>
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-gold/60" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                  ))}
                </span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 py-3 border-t border-wood-light/30">
        <div className="flex gap-2">
          <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="与角色对话，或选中小说文字……" rows={2} className="flex-1 bg-wood-light/30 border border-wood-light/40 rounded-lg px-3 py-2 text-sm text-secondary-foreground placeholder:text-secondary-foreground/30 focus:outline-none focus:border-cinnabar/50 resize-none" />
          <button onClick={handleSend} disabled={!input.trim() || isStreaming} className="self-end p-2.5 bg-cinnabar hover:bg-cinnabar-glow text-primary-foreground rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs text-secondary-foreground/30 mt-2 text-center">AI 角色 · 选中左侧文字可自动填入对话</p>
      </div>
    </div>
  );
};

export default AIChatPanel;
