import { useState, useRef, useEffect } from "react";
import { chapters, type Chapter } from "@/data/novel";
import { Send, Sparkles, User, Scroll } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AIChatPanelProps {
  currentChapter: number;
  selectedText: string;
  onSelectedTextUsed: () => void;
}

// 模拟 AI 响应（后续接入 Lovable Cloud）
function generateResponse(chapter: Chapter, userMessage: string): string {
  const { characterState } = chapter;
  const responses: Record<number, string[]> = {
    1: [
      "公子说的这段……倒让我想起那日山中的情形。那时我伤了前腿，疼得厉害，忽然看见一个背着竹篓的年轻人走过来，目光温和。那一刻，我便知道这个人不会伤我。",
      "嗯？公子对这段文字感兴趣？那日山风甚冷，我本以为自己要在山中冻死了。你施的金创药虽是凡物，却带着暖意……说来惭愧，堂堂一个修行百年的狐，竟被一个凡人所救。",
      "那枚玉佩是我族中之物，我犹豫了许久才决定留给你。毕竟……我们狐族有个规矩，玉佩赠人，便是欠下了一段因果。",
      "我在这山中修行已久，见过许多人上山采药，却从没见过像公子这般心善的。旁人见了狐，不是害怕就是起了贪念，只有你……只想着给我敷药。",
    ],
    2: [
      "公子莫怪我那夜突然造访。实在是……那伤好了之后，心中总记挂着那个替我敷药的人。辗转反侧了好几日，才鼓起勇气来见你。",
      "那三滴灵露，是我花了三年才凝聚而成的。送给公子，我并不觉得可惜。只是……你千万别告诉旁人我是狐，人间对我们这些异类，向来不太友善。",
      "那几个字……'莫忘，莫争'……我刻的时候想了很久。莫忘，是希望你不要忘记那日的善意。莫争，是你的名字，也是我对自己说的——莫要争这不该有的心思。可是……",
      "那老槐树开的花，是我施了一点小法术。我知道这样不好，可是……看到满树白花的时候，你笑了，对吗？你笑起来的样子，很好看。",
    ],
    3: [
      "镇上的怪事，确实让我忧心。那个东西的气息我在山中就感应到了，比我修行更久，心性也更加阴沉。公子千万要小心。",
      "我不会让那东西伤害这个小镇的。公子愿意和我同行，我……我很高兴，也很担心。妖与人并肩，在这世间并不容易。",
      "那玉佩的护身之力是真的，但也有限。若是那东西全力出手，我也不确定能不能护住你。所以公子，若到了危险的时候，你一定要先跑，答应我。",
      "和公子在一起的这半个月，是我修行以来最快乐的时光。教你认草药的时候，看你笨手笨脚的样子，我总是想笑……啊，不是，我不是在笑你。",
    ],
  };

  const chapterResponses = responses[chapter.id] || responses[1];
  return chapterResponses[Math.floor(Math.random() * chapterResponses.length)];
}

const AIChatPanel = ({ currentChapter, selectedText, onSelectedTextUsed }: AIChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const chapter = chapters[currentChapter];

  // 章节切换时清空对话并发送欢迎
  useEffect(() => {
    const greeting = getGreeting(chapter);
    setMessages([
      {
        id: Date.now().toString(),
        role: "assistant",
        content: greeting,
      },
    ]);
  }, [currentChapter]);

  // 选中文字自动填入
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

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // 模拟延迟响应
    setTimeout(() => {
      const response = generateResponse(chapter, userMsg.content);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response,
        },
      ]);
      setIsTyping(false);
    }, 800 + Math.random() * 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full wood-grain text-secondary-foreground">
      {/* 角色信息头 */}
      <div className="px-5 py-4 border-b border-wood-light/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cinnabar/20 border border-cinnabar/40 flex items-center justify-center">
            <Sparkles size={18} className="text-cinnabar-glow" />
          </div>
          <div>
            <h3 className="font-bold text-gold text-sm tracking-wider font-display">
              {chapter.characterState.name}
            </h3>
            <p className="text-xs text-secondary-foreground/60 mt-0.5">
              {chapter.characterState.mood}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-secondary-foreground/40">
          <Scroll size={12} />
          <span>已知事件：{chapter.characterState.knownEvents.length} 件</span>
        </div>
      </div>

      {/* 对话区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-cinnabar/20 text-secondary-foreground border border-cinnabar/30"
                    : "bg-wood-light/60 text-secondary-foreground/90 border border-wood-light/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {msg.role === "assistant" ? (
                    <Sparkles size={12} className="text-gold" />
                  ) : (
                    <User size={12} className="text-cinnabar-glow" />
                  )}
                  <span className="text-xs text-secondary-foreground/50">
                    {msg.role === "assistant" ? chapter.characterState.name : "你"}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-wood-light/60 border border-wood-light/30 rounded-lg px-4 py-3 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-gold text-xs">执笔中</span>
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-gold/60"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="px-4 py-3 border-t border-wood-light/30">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="与角色对话，或选中小说文字……"
            rows={2}
            className="flex-1 bg-wood-light/30 border border-wood-light/40 rounded-lg px-3 py-2 text-sm text-secondary-foreground placeholder:text-secondary-foreground/30 focus:outline-none focus:border-cinnabar/50 resize-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="self-end p-2.5 bg-cinnabar hover:bg-cinnabar-glow text-primary-foreground rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs text-secondary-foreground/30 mt-2 text-center">
          选中左侧文字可自动填入对话
        </p>
      </div>
    </div>
  );
};

function getGreeting(chapter: Chapter): string {
  const greetings: Record<number, string> = {
    1: "……你是那个采药人？我方才在山路上见过你。你手上的那枚玉佩，可要收好了。",
    2: "公子，别来无恙。上次匆匆一别，未能好好答谢。今夜月色甚好，不知你可愿听我说几句话？",
    3: "公子，镇上最近的事，你也注意到了吧？我们需要好好谈谈。那东西……不好对付。",
  };
  return greetings[chapter.id] || greetings[1];
}

export default AIChatPanel;
