// Hand-written to match supabase/migrations/*.sql.
// Regenerate with `supabase gen types typescript` once a live project exists.

export type ItemStatus = "wanted" | "purchased" | "deferred";
export type MemberRole = "owner" | "member";

export interface Database {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string;
          name: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["groups"]["Insert"]>;
        Relationships: [];
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: MemberRole;
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: MemberRole;
          joined_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["group_members"]["Insert"]
        >;
        Relationships: [];
      };
      group_invites: {
        Row: {
          id: string;
          group_id: string;
          group_name: string;
          created_by: string;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          group_name: string;
          created_by: string;
          created_at?: string;
          expires_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["group_invites"]["Insert"]
        >;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      wishlist_items: {
        Row: {
          id: string;
          owner_id: string;
          group_id: string | null;
          name: string;
          cost: number;
          priority: number;
          status: ItemStatus;
          target_month: string | null;
          purchased_by: string | null;
          purchased_at: string | null;
          product_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          group_id?: string | null;
          name: string;
          cost: number;
          priority?: number;
          status?: ItemStatus;
          target_month?: string | null;
          purchased_by?: string | null;
          purchased_at?: string | null;
          product_url?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["wishlist_items"]["Insert"]
        >;
        Relationships: [];
      };
      balance_entries: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          month: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          month: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["balance_entries"]["Insert"]
        >;
        Relationships: [];
      };
      group_balance_entries: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          amount: number;
          month: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          amount: number;
          month: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["group_balance_entries"]["Insert"]
        >;
        Relationships: [];
      };
      feedback: {
        Row: {
          id: string;
          user_id: string;
          overall_satisfaction: number;
          affordability_clarity: number;
          most_used_feature: string | null;
          confusing_or_broken: string | null;
          additional_comments: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          overall_satisfaction: number;
          affordability_clarity: number;
          most_used_feature?: string | null;
          confusing_or_broken?: string | null;
          additional_comments?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["feedback"]["Insert"]>;
        Relationships: [];
      };
      contributions: {
        Row: {
          id: string;
          wishlist_item_id: string;
          group_member_id: string;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          wishlist_item_id: string;
          group_member_id: string;
          amount: number;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["contributions"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
