import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getBoardId() {
  let id = localStorage.getItem("fern-board-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("fern-board-id", id);
  }
  return id;
}

export function setBoardId(id) {
  localStorage.setItem("fern-board-id", id);
}
