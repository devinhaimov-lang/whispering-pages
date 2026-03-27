
CREATE TABLE public.reader_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname text NOT NULL DEFAULT '匿名读者',
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.reader_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comments" ON public.reader_comments
  FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can insert comments" ON public.reader_comments
  FOR INSERT TO public WITH CHECK (true);
