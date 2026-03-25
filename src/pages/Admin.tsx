import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Plus, Edit2, Trash2, LogOut, ArrowLeft, Save, Upload, ChevronDown, ChevronUp, BookOpen,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

interface Book {
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

interface Chapter {
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

const emptyBook: Omit<Book, "id"> = {
  slug: "", title: "", subtitle: "", author: "佚名", cover_url: "",
  description: "", tags: [], status: "连载中", sort_order: 0,
};

const emptyChapter: Omit<Chapter, "id" | "book_id"> = {
  chapter_number: 1, title: "", content: [], character_name: "",
  character_mood: "", character_persona: "", known_events: [],
};

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [chapterDialogOpen, setChapterDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Partial<Book>>(emptyBook);
  const [editingChapter, setEditingChapter] = useState<Partial<Chapter>>(emptyChapter);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/admin/login");
  }, [user, authLoading, navigate]);

  useEffect(() => { loadBooks(); }, []);

  useEffect(() => {
    if (selectedBook) loadChapters(selectedBook.id);
  }, [selectedBook]);

  const loadBooks = async () => {
    const { data } = await supabase
      .from("books").select("*").order("sort_order");
    if (data) setBooks(data as Book[]);
  };

  const loadChapters = async (bookId: string) => {
    const { data } = await supabase
      .from("chapters").select("*").eq("book_id", bookId).order("chapter_number");
    if (data) setChapters(data as Chapter[]);
  };

  const uploadCover = async (file: File, slug: string): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${slug}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("book-covers").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("book-covers").getPublicUrl(path);
    return data.publicUrl;
  };

  const saveBook = async () => {
    setSaving(true);
    try {
      let cover_url = editingBook.cover_url || "";
      if (coverFile) {
        cover_url = await uploadCover(coverFile, editingBook.slug || "cover");
      }

      const bookData = {
        slug: editingBook.slug!,
        title: editingBook.title!,
        subtitle: editingBook.subtitle || "",
        author: editingBook.author || "佚名",
        cover_url,
        description: editingBook.description || "",
        tags: editingBook.tags || [],
        status: editingBook.status || "连载中",
        sort_order: editingBook.sort_order || 0,
      };

      if (editingBook.id) {
        const { error } = await supabase.from("books").update(bookData).eq("id", editingBook.id);
        if (error) throw error;
        toast.success("书籍已更新");
      } else {
        const { error } = await supabase.from("books").insert(bookData);
        if (error) throw error;
        toast.success("书籍已添加");
      }

      setBookDialogOpen(false);
      setCoverFile(null);
      loadBooks();
    } catch (err: any) {
      toast.error(err.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const deleteBook = async (id: string) => {
    if (!confirm("确定删除这本书及所有章节？")) return;
    const { error } = await supabase.from("books").delete().eq("id", id);
    if (error) toast.error("删除失败");
    else {
      toast.success("已删除");
      if (selectedBook?.id === id) { setSelectedBook(null); setChapters([]); }
      loadBooks();
    }
  };

  const saveChapter = async () => {
    setSaving(true);
    try {
      const chapterData = {
        book_id: selectedBook!.id,
        chapter_number: editingChapter.chapter_number!,
        title: editingChapter.title!,
        content: editingChapter.content || [],
        character_name: editingChapter.character_name || "",
        character_mood: editingChapter.character_mood || "",
        character_persona: editingChapter.character_persona || "",
        known_events: editingChapter.known_events || [],
      };

      if (editingChapter.id) {
        const { error } = await supabase.from("chapters").update(chapterData).eq("id", editingChapter.id);
        if (error) throw error;
        toast.success("章节已更新");
      } else {
        const { error } = await supabase.from("chapters").insert(chapterData);
        if (error) throw error;
        toast.success("章节已添加");
      }

      setChapterDialogOpen(false);
      loadChapters(selectedBook!.id);
    } catch (err: any) {
      toast.error(err.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const deleteChapter = async (id: string) => {
    if (!confirm("确定删除这个章节？")) return;
    const { error } = await supabase.from("chapters").delete().eq("id", id);
    if (error) toast.error("删除失败");
    else { toast.success("已删除"); loadChapters(selectedBook!.id); }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center paper-texture"><p className="text-muted-foreground">加载中...</p></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen paper-texture">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-display tracking-wider text-foreground">后台管理</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/admin/login"); }}>
          <LogOut size={16} /> 退出
        </Button>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 书籍列表 */}
          <div className="lg:w-1/3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-display tracking-wider flex items-center gap-2">
                <BookOpen size={16} className="text-primary" /> 书籍管理
              </h2>
              <Button size="sm" onClick={() => { setEditingBook(emptyBook); setCoverFile(null); setBookDialogOpen(true); }}>
                <Plus size={14} /> 新增
              </Button>
            </div>

            <div className="space-y-2">
              {books.map((book) => (
                <div
                  key={book.id}
                  onClick={() => setSelectedBook(book)}
                  className={`p-3 rounded border cursor-pointer transition-colors ${
                    selectedBook?.id === book.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {book.cover_url && (
                      <img src={book.cover_url} alt={book.title} className="w-10 h-14 object-cover rounded-sm" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{book.title}</p>
                      <p className="text-xs text-muted-foreground">{book.subtitle}</p>
                      <span className="text-xs px-1.5 py-0.5 bg-muted rounded mt-1 inline-block">{book.status}</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingBook(book); setCoverFile(null); setBookDialogOpen(true); }}
                        className="p-1 text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteBook(book.id); }}
                        className="p-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {books.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">暂无书籍，点击"新增"添加</p>
              )}
            </div>
          </div>

          {/* 章节列表 */}
          <div className="lg:w-2/3 space-y-4">
            {selectedBook ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-display tracking-wider">
                    《{selectedBook.title}》章节管理
                  </h2>
                  <Button size="sm" onClick={() => {
                    setEditingChapter({ ...emptyChapter, chapter_number: chapters.length + 1 });
                    setChapterDialogOpen(true);
                  }}>
                    <Plus size={14} /> 新增章节
                  </Button>
                </div>

                <div className="space-y-2">
                  {chapters.map((ch) => (
                    <div key={ch.id} className="border border-border rounded">
                      <div
                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/30"
                        onClick={() => setExpandedChapter(expandedChapter === ch.id ? null : ch.id)}
                      >
                        <div className="flex items-center gap-2">
                          {expandedChapter === ch.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          <span className="text-sm font-medium">第{ch.chapter_number}章: {ch.title}</span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingChapter(ch); setChapterDialogOpen(true); }}
                            className="p-1 text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteChapter(ch.id); }}
                            className="p-1 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      {expandedChapter === ch.id && (
                        <div className="px-3 pb-3 border-t border-border pt-2 space-y-2 text-xs text-muted-foreground">
                          <p><strong>AI角色:</strong> {ch.character_name || "未设置"}</p>
                          <p><strong>情绪:</strong> {ch.character_mood || "未设置"}</p>
                          <p><strong>段落数:</strong> {ch.content.length}</p>
                          {ch.content.length > 0 && (
                            <p className="line-clamp-2">{ch.content[0]}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {chapters.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">暂无章节</p>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                <p>请从左侧选择一本书来管理章节</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Book Dialog */}
      <Dialog open={bookDialogOpen} onOpenChange={setBookDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBook.id ? "编辑书籍" : "新增书籍"}</DialogTitle>
            <DialogDescription>填写书籍基本信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">标题 *</label>
                <Input value={editingBook.title || ""} onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">标识符(slug) *</label>
                <Input value={editingBook.slug || ""} onChange={(e) => setEditingBook({ ...editingBook, slug: e.target.value })} placeholder="如: mozheng" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">副标题</label>
                <Input value={editingBook.subtitle || ""} onChange={(e) => setEditingBook({ ...editingBook, subtitle: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">作者</label>
                <Input value={editingBook.author || ""} onChange={(e) => setEditingBook({ ...editingBook, author: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">简介</label>
              <textarea
                className="w-full min-h-[80px] rounded border border-input bg-background px-3 py-2 text-sm"
                value={editingBook.description || ""}
                onChange={(e) => setEditingBook({ ...editingBook, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">状态</label>
                <select
                  className="w-full h-10 rounded border border-input bg-background px-3 text-sm"
                  value={editingBook.status || "连载中"}
                  onChange={(e) => setEditingBook({ ...editingBook, status: e.target.value })}
                >
                  <option value="连载中">连载中</option>
                  <option value="已完结">已完结</option>
                  <option value="即将上线">即将上线</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">排序</label>
                <Input type="number" value={editingBook.sort_order ?? 0} onChange={(e) => setEditingBook({ ...editingBook, sort_order: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">标签（逗号分隔）</label>
              <Input
                value={(editingBook.tags || []).join(", ")}
                onChange={(e) => setEditingBook({ ...editingBook, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                placeholder="志怪, 人妖恋, 山野奇谈"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">封面图片</label>
              <div className="flex items-center gap-3 mt-1">
                {(coverFile || editingBook.cover_url) && (
                  <img
                    src={coverFile ? URL.createObjectURL(coverFile) : editingBook.cover_url}
                    alt="封面预览"
                    className="w-12 h-16 object-cover rounded-sm border"
                  />
                )}
                <label className="flex items-center gap-1 px-3 py-1.5 bg-muted rounded text-sm cursor-pointer hover:bg-muted/80">
                  <Upload size={14} /> 上传封面
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>
            <Button onClick={saveBook} disabled={saving || !editingBook.title || !editingBook.slug} className="w-full">
              <Save size={14} /> {saving ? "保存中..." : "保存"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chapter Dialog */}
      <Dialog open={chapterDialogOpen} onOpenChange={setChapterDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingChapter.id ? "编辑章节" : "新增章节"}</DialogTitle>
            <DialogDescription>填写章节内容和 AI 角色设定</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">章节序号 *</label>
                <Input type="number" value={editingChapter.chapter_number ?? 1} onChange={(e) => setEditingChapter({ ...editingChapter, chapter_number: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">章节标题 *</label>
                <Input value={editingChapter.title || ""} onChange={(e) => setEditingChapter({ ...editingChapter, title: e.target.value })} placeholder="第一章 · 山中遇狐" />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">正文（每段一行，用空行分隔段落）</label>
              <textarea
                className="w-full min-h-[200px] rounded border border-input bg-background px-3 py-2 text-sm font-serif leading-relaxed"
                value={(editingChapter.content || []).join("\n\n")}
                onChange={(e) => setEditingChapter({
                  ...editingChapter,
                  content: e.target.value.split("\n\n").filter(Boolean),
                })}
                placeholder="在此输入章节正文，每段之间用一个空行隔开..."
              />
            </div>

            <div className="border-t border-border pt-3 space-y-3">
              <p className="text-xs font-medium text-foreground">AI 角色设定（可选）</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">角色名</label>
                  <Input value={editingChapter.character_name || ""} onChange={(e) => setEditingChapter({ ...editingChapter, character_name: e.target.value })} placeholder="白狐·初遇" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">情绪</label>
                  <Input value={editingChapter.character_mood || ""} onChange={(e) => setEditingChapter({ ...editingChapter, character_mood: e.target.value })} placeholder="好奇、感恩" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">角色人设（给 AI 的提示词）</label>
                <textarea
                  className="w-full min-h-[80px] rounded border border-input bg-background px-3 py-2 text-sm"
                  value={editingChapter.character_persona || ""}
                  onChange={(e) => setEditingChapter({ ...editingChapter, character_persona: e.target.value })}
                  placeholder="你是一只修炼百年的白狐..."
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">已知事件（逗号分隔）</label>
                <Input
                  value={(editingChapter.known_events || []).join(", ")}
                  onChange={(e) => setEditingChapter({
                    ...editingChapter,
                    known_events: e.target.value.split(",").map(t => t.trim()).filter(Boolean),
                  })}
                  placeholder="莫争救了白狐, 白狐留下玉佩"
                />
              </div>
            </div>

            <Button onClick={saveChapter} disabled={saving || !editingChapter.title} className="w-full">
              <Save size={14} /> {saving ? "保存中..." : "保存"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
