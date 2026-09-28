import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Cliente único usado pelas páginas para conversar com o Supabase.
export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
);
