import { createClient } from '@supabase/supabase-js';

export const supabaseBrowser = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

export const supabaseServer = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_SECRET_KEY! // 仅服务端
  );

export const RESUME_BUCKET = process.env.SUPABASE_BUCKET || 'resumes';
