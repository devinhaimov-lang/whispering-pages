
-- Books table
CREATE TABLE public.books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text DEFAULT '',
  author text DEFAULT '佚名',
  cover_url text DEFAULT '',
  description text DEFAULT '',
  tags text[] DEFAULT '{}',
  status text DEFAULT '连载中' CHECK (status IN ('连载中', '已完结', '即将上线')),
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chapters table
CREATE TABLE public.chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  chapter_number integer NOT NULL,
  title text NOT NULL,
  content text[] DEFAULT '{}',
  character_name text DEFAULT '',
  character_mood text DEFAULT '',
  character_persona text DEFAULT '',
  known_events text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(book_id, chapter_number)
);

-- Enable RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read books" ON public.books FOR SELECT USING (true);
CREATE POLICY "Anyone can read chapters" ON public.chapters FOR SELECT USING (true);

-- Authenticated users can manage books/chapters
CREATE POLICY "Authenticated users can insert books" ON public.books FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update books" ON public.books FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete books" ON public.books FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert chapters" ON public.chapters FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update chapters" ON public.chapters FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete chapters" ON public.chapters FOR DELETE TO authenticated USING (true);

-- Storage bucket for book covers
INSERT INTO storage.buckets (id, name, public) VALUES ('book-covers', 'book-covers', true);

-- Storage policies
CREATE POLICY "Anyone can view covers" ON storage.objects FOR SELECT USING (bucket_id = 'book-covers');
CREATE POLICY "Authenticated users can upload covers" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'book-covers');
CREATE POLICY "Authenticated users can update covers" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'book-covers');
CREATE POLICY "Authenticated users can delete covers" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'book-covers');
