import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AnalysisResult } from "./analysis-schema";

export type AnalysisRow = {
  id: string;
  analysis_type: "skin" | "hair";
  status: string;
  result: AnalysisResult;
  model: string | null;
  image_path: string | null;
  image_retained: boolean;
  created_at: string;
};

export const analysesQuery = (type?: "skin" | "hair") =>
  queryOptions({
    queryKey: ["analyses", "list", type ?? "all"],
    queryFn: async () => {
      let q = supabase.from("analyses").select("*").order("created_at", { ascending: false }).limit(100);
      if (type) q = q.eq("analysis_type", type);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as AnalysisRow[];
    },
  });

export const analysisQuery = (id: string) =>
  queryOptions({
    queryKey: ["analyses", "one", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("analyses").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as unknown as AnalysisRow | null;
    },
  });
