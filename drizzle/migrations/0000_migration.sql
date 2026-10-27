CREATE TABLE public.analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  analysis_type text NOT NULL CHECK (analysis_type IN ('skin','hair')),
  status text NOT NULL DEFAULT 'completed',
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  model text,
  image_path text,
  image_retained boolean NOT NULL DEFAULT false,
  consent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.analyses TO authenticated;
GRANT ALL ON public.analyses TO service_role;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.analyses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.analyses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.analyses FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX analyses_user_created ON public.analyses(user_id, created_at DESC);

CREATE POLICY "own images select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'analysis-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own images insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'analysis-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own images delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'analysis-images' AND (storage.foldername(name))[1] = auth.uid()::text);