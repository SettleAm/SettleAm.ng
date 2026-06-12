import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jkkkjqrdfqzllrxjukzl.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_TiRHrg6Er7qW0bUPFfymNw_leljKki6";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
