export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity: {
        Row: {
          created_at: string
          detail: string | null
          id: string
          type: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: string
          type: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: string
          type?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      global_messages: {
        Row: {
          box_size: string
          created_at: string
          duration_ms: number
          from_id: string | null
          from_user: string
          id: string
          text: string
          text_size: number
        }
        Insert: {
          box_size?: string
          created_at?: string
          duration_ms?: number
          from_id?: string | null
          from_user: string
          id?: string
          text: string
          text_size?: number
        }
        Update: {
          box_size?: string
          created_at?: string
          duration_ms?: number
          from_id?: string | null
          from_user?: string
          id?: string
          text?: string
          text_size?: number
        }
        Relationships: []
      }
      presence: {
        Row: {
          current_app: string | null
          last_seen: string
          mouse_x: number | null
          mouse_y: number | null
          route: string | null
          user_id: string
          username: string
          viewport_h: number | null
          viewport_w: number | null
        }
        Insert: {
          current_app?: string | null
          last_seen?: string
          mouse_x?: number | null
          mouse_y?: number | null
          route?: string | null
          user_id: string
          username: string
          viewport_h?: number | null
          viewport_w?: number | null
        }
        Update: {
          current_app?: string | null
          last_seen?: string
          mouse_x?: number | null
          mouse_y?: number | null
          route?: string | null
          user_id?: string
          username?: string
          viewport_h?: number | null
          viewport_w?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          banned: boolean
          created_at: string
          custom_font: Json | null
          custom_jumpscare: string | null
          custom_wallpaper: string | null
          desktop_icons: Json
          dock_order: Json
          dock_shape: string
          dock_side: string
          id: string
          jasoncat_unlocked: boolean
          leo_unlocked: boolean
          pinned_apps: Json
          screen_lock_message: string | null
          screen_locked: boolean
          sebastian_unlocked: boolean
          theme: string
          updated_at: string
          username: string
          web_apps: Json
        }
        Insert: {
          banned?: boolean
          created_at?: string
          custom_font?: Json | null
          custom_jumpscare?: string | null
          custom_wallpaper?: string | null
          desktop_icons?: Json
          dock_order?: Json
          dock_shape?: string
          dock_side?: string
          id: string
          jasoncat_unlocked?: boolean
          leo_unlocked?: boolean
          pinned_apps?: Json
          screen_lock_message?: string | null
          screen_locked?: boolean
          sebastian_unlocked?: boolean
          theme?: string
          updated_at?: string
          username: string
          web_apps?: Json
        }
        Update: {
          banned?: boolean
          created_at?: string
          custom_font?: Json | null
          custom_jumpscare?: string | null
          custom_wallpaper?: string | null
          desktop_icons?: Json
          dock_order?: Json
          dock_shape?: string
          dock_side?: string
          id?: string
          jasoncat_unlocked?: boolean
          leo_unlocked?: boolean
          pinned_apps?: Json
          screen_lock_message?: string | null
          screen_locked?: boolean
          sebastian_unlocked?: boolean
          theme?: string
          updated_at?: string
          username?: string
          web_apps?: Json
        }
        Relationships: []
      }
      troll_events: {
        Row: {
          created_at: string
          dismissed: boolean
          id: string
          image_url: string | null
          target_id: string
        }
        Insert: {
          created_at?: string
          dismissed?: boolean
          id?: string
          image_url?: string | null
          target_id: string
        }
        Update: {
          created_at?: string
          dismissed?: boolean
          id?: string
          image_url?: string | null
          target_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
