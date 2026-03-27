import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Comment {
  id: string;
  nickname: string;
  content: string;
  created_at: string;
}

const GuestBook = () => {
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["reader-comments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reader_comments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Comment[];
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const trimmed = content.trim();
      if (!trimmed) throw new Error("留言不能为空");
      if (trimmed.length > 500) throw new Error("留言不能超过500字");
      const nick = nickname.trim() || "匿名读者";
      if (nick.length > 20) throw new Error("昵称不能超过20字");

      const { error } = await supabase
        .from("reader_comments")
        .insert({ nickname: nick, content: trimmed });
      if (error) throw error;
    },
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["reader-comments"] });
      toast.success("留言成功！");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <section className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-8">
        <MessageSquare size={18} className="text-cinnabar" />
        <h2 className="text-lg font-display text-foreground tracking-wider">读者留言</h2>
        <div className="flex-1 h-px bg-border ml-4" />
      </div>

      {/* 留言表单 */}
      <div className="bg-card border border-border rounded-lg p-5 mb-8 space-y-3">
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="你的笔名（选填）"
          maxLength={20}
          className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写下你的感想..."
          maxLength={500}
          rows={3}
          className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{content.length}/500</span>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !content.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-sm rounded hover:bg-cinnabar-glow transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={14} />
            <span>{mutation.isPending ? "发送中..." : "留言"}</span>
          </button>
        </div>
      </div>

      {/* 留言列表 */}
      {isLoading ? (
        <p className="text-center text-sm text-muted-foreground py-8">加载中...</p>
      ) : comments.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">暂无留言，来写下第一条吧！</p>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {comments.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-card/50 border border-border rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-display text-foreground tracking-wider">{c.nickname}</span>
                  <span className="text-xs text-muted-foreground">{formatTime(c.created_at)}</span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap break-words">{c.content}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
};

export default GuestBook;
