import { useNavigate } from "react-router-dom";
import { books as staticBooks } from "@/data/books";
import { useDbBooks, type DbBook } from "@/hooks/useBooks";
import { BookOpen, Sparkles } from "lucide-react";
import GuestBook from "@/components/GuestBook";
import { motion } from "framer-motion";

interface DisplayBook {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  cover: string;
  description: string;
  tags: string[];
  chapterCount: number;
  status: string;
  hasContent: boolean;
  isDb?: boolean;
}

function dbToDisplay(b: DbBook): DisplayBook {
  return {
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    author: b.author,
    cover: b.cover_url,
    description: b.description,
    tags: b.tags || [],
    chapterCount: 0, // will show from chapters
    status: b.status,
    hasContent: true,
    isDb: true,
  };
}

const BookCard = ({ book, index }: { book: DisplayBook; index: number }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (book.isDb) {
      navigate(`/book/${book.id}?source=db`);
    } else {
      navigate(`/book/${book.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onClick={handleClick}
      className="group cursor-pointer"
    >
      <div className="relative aspect-[2/3] rounded-sm overflow-hidden shadow-lg group-hover:shadow-2xl transition-shadow duration-500">
        {book.cover ? (
          <img
            src={book.cover}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
            width={640}
            height={960}
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <BookOpen size={40} className="text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />

        {book.status !== "连载中" && (
          <div className="absolute top-3 right-3 px-2 py-0.5 bg-wood/80 text-gold text-xs rounded-sm backdrop-blur-sm">
            {book.status}
          </div>
        )}
        {book.status === "连载中" && (
          <div className="absolute top-3 right-3 px-2 py-0.5 bg-cinnabar/80 text-primary-foreground text-xs rounded-sm backdrop-blur-sm">
            连载中
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-xl font-bold font-display text-primary-foreground tracking-wider mb-1">
            {book.title}
          </h3>
          <p className="text-xs text-primary-foreground/60 tracking-wider">{book.subtitle}</p>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {book.description}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {book.tags.map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-sm">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground/60">
          <span>{book.author}</span>
        </div>
      </div>
    </motion.div>
  );
};

const Library = () => {
  const { data: dbBooks = [] } = useDbBooks();

  const allBooks: DisplayBook[] = [
    ...dbBooks.map(dbToDisplay),
    ...staticBooks.map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      author: b.author,
      cover: b.cover,
      description: b.description,
      tags: b.tags,
      chapterCount: b.chapterCount,
      status: b.status,
      hasContent: b.hasContent,
    })),
  ];

  return (
    <div className="min-h-screen paper-texture">
      <header className="relative overflow-hidden">
        <div className="wood-grain py-12 sm:py-16 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-12 bg-gold/30" />
                <Sparkles size={16} className="text-gold/60" />
                <div className="h-px w-12 bg-gold/30" />
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-[0.3em] text-secondary-foreground seal-stamp mb-3">
                莫争·故事集
              </h1>
              <p className="text-sm sm:text-base text-secondary-foreground/50 tracking-[0.2em] font-serif">
                以笔为刃，以墨为魂，书写属于莫争的传奇
              </p>
              <p className="text-xs text-secondary-foreground/35 tracking-wider mt-3">
                书本已更新，首次加载可能需要稍等片刻
              </p>

              <div className="flex items-center justify-center gap-3 mt-6">
                <div className="h-px w-16 bg-gold/20" />
                <div className="w-1.5 h-1.5 rotate-45 bg-gold/40" />
                <div className="h-px w-16 bg-gold/20" />
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <BookOpen size={18} className="text-cinnabar" />
          <h2 className="text-lg font-display text-foreground tracking-wider">全部卷册</h2>
          <span className="text-xs text-muted-foreground">共 {allBooks.length} 卷</span>
          <div className="flex-1 h-px bg-border ml-4" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8">
          {allBooks.map((book, index) => (
            <BookCard key={book.id} book={book} index={index} />
          ))}
        </div>
      </main>

      <GuestBook />

      <footer className="border-t border-border py-8 text-center">
        <p className="text-xs text-muted-foreground/40 tracking-wider">
          志怪录 · 沉浸式 AI 小说阅读平台
        </p>
      </footer>
    </div>
  );
};

export default Library;
