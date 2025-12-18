import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type GiftColor = "red" | "green" | "yellow";

export type ItemType = "ornament" | "gift";

// 예: 'sock', 'candy_cane', 'ball', 'star', 'red_box'...
export type ItemDesign = string;

export type MessageRow = {
  id: string | number;
  tree_id?: string | null;
  created_at: string;
  sender_name: string;
  content: string;
  gift_color: GiftColor;
  item_type?: ItemType | null;
  item_design?: ItemDesign | null;
  question_category?: string | null;
  position_x?: number | null; // 0~100%
  position_y?: number | null; // 0~100%
  is_read?: boolean | null;
};

export type TreeRow = {
  id: string; // tree_id와 동일
  host_name: string;
  host_gender: "female" | "male" | "nonbinary" | "other";
  host_age: number;
  tree_style: string;
  user_id?: string | null; // Supabase Auth user.id
  created_at: string;
  updated_at: string;
};
