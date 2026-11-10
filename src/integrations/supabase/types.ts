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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_intro_wallets: {
        Row: {
          created_at: string
          granted_usd: number
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_usd: number
          user_id: string
        }
        Update: {
          created_at?: string
          granted_usd?: number
          user_id?: string
        }
        Relationships: []
      }
      ai_spend_reservations: {
        Row: {
          attempt: number
          created_at: string
          id: string
          model: string
          provider: string
          request_id: string
          reserved_usd: number
          scope: string
          settled_usd: number | null
          state: string
          user_id: string
        }
        Insert: {
          attempt: number
          created_at?: string
          id?: string
          model: string
          provider: string
          request_id: string
          reserved_usd: number
          scope: string
          settled_usd?: number | null
          state?: string
          user_id: string
        }
        Update: {
          attempt?: number
          created_at?: string
          id?: string
          model?: string
          provider?: string
          request_id?: string
          reserved_usd?: number
          scope?: string
          settled_usd?: number | null
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_sponsor_policy: {
        Row: {
          allow_fallback: boolean
          claude_enabled: boolean
          claude_tasks: string[]
          daily_questions: number
          eligible_since: string | null
          emergency_stop: boolean
          enabled: boolean
          id: boolean
          intro_usd: number
          key_owner: string | null
          openai_enabled: boolean
          per_user_usd: number
          total_usd: number
          updated_at: string
        }
        Insert: {
          allow_fallback?: boolean
          claude_enabled?: boolean
          claude_tasks?: string[]
          daily_questions?: number
          eligible_since?: string | null
          emergency_stop?: boolean
          enabled?: boolean
          id?: boolean
          intro_usd?: number
          key_owner?: string | null
          openai_enabled?: boolean
          per_user_usd?: number
          total_usd?: number
          updated_at?: string
        }
        Update: {
          allow_fallback?: boolean
          claude_enabled?: boolean
          claude_tasks?: string[]
          daily_questions?: number
          eligible_since?: string | null
          emergency_stop?: boolean
          enabled?: boolean
          id?: boolean
          intro_usd?: number
          key_owner?: string | null
          openai_enabled?: boolean
          per_user_usd?: number
          total_usd?: number
          updated_at?: string
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          bucket: string
          count: number
          window_start: string
        }
        Insert: {
          bucket: string
          count?: number
          window_start: string
        }
        Update: {
          bucket?: string
          count?: number
          window_start?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          role: string
          user_id: string
        }
        Insert: {
          role: string
          user_id: string
        }
        Update: {
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      visitor_ai_events: {
        Row: {
          buddy: string
          created_at: string
          estimated_usd: number | null
          funding_source: string
          id: string
          input_tokens: number | null
          modality_usage: Json | null
          model: string
          outcome: string
          output_tokens: number | null
          provider: string
          rate_version: string | null
          request_id: string | null
          request_scope: string
          user_id: string
        }
        Insert: {
          buddy: string
          created_at?: string
          estimated_usd?: number | null
          funding_source?: string
          id?: string
          input_tokens?: number | null
          modality_usage?: Json | null
          model: string
          outcome?: string
          output_tokens?: number | null
          provider: string
          rate_version?: string | null
          request_id?: string | null
          request_scope?: string
          user_id: string
        }
        Update: {
          buddy?: string
          created_at?: string
          estimated_usd?: number | null
          funding_source?: string
          id?: string
          input_tokens?: number | null
          modality_usage?: Json | null
          model?: string
          outcome?: string
          output_tokens?: number | null
          provider?: string
          rate_version?: string | null
          request_id?: string | null
          request_scope?: string
          user_id?: string
        }
        Relationships: []
      }
      visitor_ai_keys: {
        Row: {
          ciphertext: string
          key_hint: string | null
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ciphertext: string
          key_hint?: string | null
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ciphertext?: string
          key_hint?: string | null
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      visitor_ai_settings: {
        Row: {
          adult_confirmed_at: string
          daily_budget_usd: number
          funding_mode: string
          timezone: string
          user_id: string
        }
        Insert: {
          adult_confirmed_at?: string
          daily_budget_usd?: number
          funding_mode?: string
          timezone?: string
          user_id: string
        }
        Update: {
          adult_confirmed_at?: string
          daily_budget_usd?: number
          funding_mode?: string
          timezone?: string
          user_id?: string
        }
        Relationships: []
      }
      visitor_site_visits: {
        Row: {
          created_at: string
          id: string
          path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          path: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bump_monthly_usage: { Args: { _provider: string }; Returns: number }
      consume_ai_quota: {
        Args: {
          _per_day: number
          _per_hour: number
          _scope: string
          _visitor: string
        }
        Returns: string
      }
      ensure_intro_allowance: { Args: { _user: string }; Returns: undefined }
      is_usage_admin: { Args: never; Returns: boolean }
      monthly_ai_usage: {
        Args: never
        Returns: {
          provider: string
          total: number
        }[]
      }
      reserve_sponsor_spend: {
        Args: {
          _attempt: number
          _cost: number
          _model: string
          _provider: string
          _request: string
          _scope: string
          _user: string
        }
        Returns: string
      }
      settle_sponsor_spend: {
        Args: { _cost: number; _id: string }
        Returns: undefined
      }
      sponsor_balance: { Args: { _user: string }; Returns: Json }
      visitor_daily_totals: { Args: never; Returns: Json }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
