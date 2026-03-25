-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  chapter_id INTEGER NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow public read/write (tighten later with auth)
CREATE POLICY "Anyone can read chat messages"
  ON public.chat_messages FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (true);

-- Index for fast session lookups
CREATE INDEX idx_chat_messages_session ON public.chat_messages(session_id, book_id, chapter_id, created_at);