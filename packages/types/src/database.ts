export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      ai_candidates: {
        Row: {
          confidence: number | null;
          created_at: string;
          final_food_id: string | null;
          final_quantity: number | null;
          final_unit_id: string | null;
          id: string;
          job_id: string;
          label: string;
          matched_food_id: string | null;
          outcome: Database["public"]["Enums"]["ai_candidate_outcome"];
          suggested_quantity: number | null;
          suggested_unit_id: string | null;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          confidence?: number | null;
          created_at?: string;
          final_food_id?: string | null;
          final_quantity?: number | null;
          final_unit_id?: string | null;
          id?: string;
          job_id: string;
          label: string;
          matched_food_id?: string | null;
          outcome?: Database["public"]["Enums"]["ai_candidate_outcome"];
          suggested_quantity?: number | null;
          suggested_unit_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          confidence?: number | null;
          created_at?: string;
          final_food_id?: string | null;
          final_quantity?: number | null;
          final_unit_id?: string | null;
          id?: string;
          job_id?: string;
          label?: string;
          matched_food_id?: string | null;
          outcome?: Database["public"]["Enums"]["ai_candidate_outcome"];
          suggested_quantity?: number | null;
          suggested_unit_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_candidates_final_food_id_fkey";
            columns: ["final_food_id"];
            isOneToOne: false;
            referencedRelation: "foods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_candidates_final_unit_id_fkey";
            columns: ["final_unit_id"];
            isOneToOne: false;
            referencedRelation: "serving_units";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_candidates_job_id_user_id_fkey";
            columns: ["job_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "ai_recognition_jobs";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "ai_candidates_matched_food_id_fkey";
            columns: ["matched_food_id"];
            isOneToOne: false;
            referencedRelation: "foods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_candidates_suggested_unit_id_fkey";
            columns: ["suggested_unit_id"];
            isOneToOne: false;
            referencedRelation: "serving_units";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_recognition_jobs: {
        Row: {
          completed_at: string | null;
          created_at: string;
          error: string | null;
          id: string;
          input_text: string | null;
          input_type: Database["public"]["Enums"]["ai_input_type"];
          model: string | null;
          photo_path: string | null;
          raw_output: Json | null;
          status: Database["public"]["Enums"]["ai_job_status"];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          error?: string | null;
          id?: string;
          input_text?: string | null;
          input_type: Database["public"]["Enums"]["ai_input_type"];
          model?: string | null;
          photo_path?: string | null;
          raw_output?: Json | null;
          status?: Database["public"]["Enums"]["ai_job_status"];
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          error?: string | null;
          id?: string;
          input_text?: string | null;
          input_type?: Database["public"]["Enums"]["ai_input_type"];
          model?: string | null;
          photo_path?: string | null;
          raw_output?: Json | null;
          status?: Database["public"]["Enums"]["ai_job_status"];
          user_id?: string;
        };
        Relationships: [];
      };
      ai_usage: {
        Row: {
          count: number;
          feature: Database["public"]["Enums"]["ai_feature"];
          period_start: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          count?: number;
          feature: Database["public"]["Enums"]["ai_feature"];
          period_start: string;
          user_id: string;
        };
        Update: {
          count?: number;
          feature?: Database["public"]["Enums"]["ai_feature"];
          period_start?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      assistant_conversations: {
        Row: {
          created_at: string;
          id: string;
          title: string | null;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          title?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          title?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      assistant_messages: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string;
          id: string;
          input_tokens: number | null;
          model: string | null;
          output_tokens: number | null;
          role: Database["public"]["Enums"]["assistant_role"];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          input_tokens?: number | null;
          model?: string | null;
          output_tokens?: number | null;
          role: Database["public"]["Enums"]["assistant_role"];
          user_id: string;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          input_tokens?: number | null;
          model?: string | null;
          output_tokens?: number | null;
          role?: Database["public"]["Enums"]["assistant_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assistant_messages_conversation_id_user_id_fkey";
            columns: ["conversation_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "assistant_conversations";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          after: Json | null;
          before: Json | null;
          created_at: string;
          id: number;
          record_id: string | null;
          table_name: string;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor_id?: string | null;
          after?: Json | null;
          before?: Json | null;
          created_at?: string;
          id?: never;
          record_id?: string | null;
          table_name: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          after?: Json | null;
          before?: Json | null;
          created_at?: string;
          id?: never;
          record_id?: string | null;
          table_name?: string;
        };
        Relationships: [];
      };
      cooking_methods: {
        Row: {
          created_at: string;
          id: string;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      data_sources: {
        Row: {
          citation: string | null;
          created_at: string;
          id: string;
          licence: string | null;
          name: string;
          notes: string | null;
          updated_at: string;
          url: string | null;
        };
        ComputedFields: never;
        Insert: {
          citation?: string | null;
          created_at?: string;
          id?: string;
          licence?: string | null;
          name: string;
          notes?: string | null;
          updated_at?: string;
          url?: string | null;
        };
        Update: {
          citation?: string | null;
          created_at?: string;
          id?: string;
          licence?: string | null;
          name?: string;
          notes?: string | null;
          updated_at?: string;
          url?: string | null;
        };
        Relationships: [];
      };
      entitlements: {
        Row: {
          created_at: string;
          source: Database["public"]["Enums"]["entitlement_source"] | null;
          tier: Database["public"]["Enums"]["subscription_tier"];
          updated_at: string;
          user_id: string;
          valid_until: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          source?: Database["public"]["Enums"]["entitlement_source"] | null;
          tier?: Database["public"]["Enums"]["subscription_tier"];
          updated_at?: string;
          user_id: string;
          valid_until?: string | null;
        };
        Update: {
          created_at?: string;
          source?: Database["public"]["Enums"]["entitlement_source"] | null;
          tier?: Database["public"]["Enums"]["subscription_tier"];
          updated_at?: string;
          user_id?: string;
          valid_until?: string | null;
        };
        Relationships: [];
      };
      food_aliases: {
        Row: {
          alias: string;
          created_at: string;
          food_id: string;
          id: string;
          language: string;
        };
        ComputedFields: never;
        Insert: {
          alias: string;
          created_at?: string;
          food_id: string;
          id?: string;
          language?: string;
        };
        Update: {
          alias?: string;
          created_at?: string;
          food_id?: string;
          id?: string;
          language?: string;
        };
        Relationships: [
          {
            foreignKeyName: "food_aliases_food_id_fkey";
            columns: ["food_id"];
            isOneToOne: false;
            referencedRelation: "foods";
            referencedColumns: ["id"];
          },
        ];
      };
      food_log_entries: {
        Row: {
          ai_candidate_id: string | null;
          carbs_g: number | null;
          created_at: string;
          energy_kcal: number | null;
          entry_method: Database["public"]["Enums"]["entry_method"];
          fat_g: number | null;
          fibre_g: number | null;
          food_id: string;
          food_name: string;
          grams: number;
          id: string;
          log_date: string;
          meal_slot: Database["public"]["Enums"]["meal_slot"];
          protein_g: number | null;
          quantity: number;
          serving_unit_id: string;
          sodium_mg: number | null;
          sugar_g: number | null;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          ai_candidate_id?: string | null;
          carbs_g?: number | null;
          created_at?: string;
          energy_kcal?: number | null;
          entry_method?: Database["public"]["Enums"]["entry_method"];
          fat_g?: number | null;
          fibre_g?: number | null;
          food_id: string;
          food_name: string;
          grams: number;
          id?: string;
          log_date: string;
          meal_slot: Database["public"]["Enums"]["meal_slot"];
          protein_g?: number | null;
          quantity: number;
          serving_unit_id: string;
          sodium_mg?: number | null;
          sugar_g?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          ai_candidate_id?: string | null;
          carbs_g?: number | null;
          created_at?: string;
          energy_kcal?: number | null;
          entry_method?: Database["public"]["Enums"]["entry_method"];
          fat_g?: number | null;
          fibre_g?: number | null;
          food_id?: string;
          food_name?: string;
          grams?: number;
          id?: string;
          log_date?: string;
          meal_slot?: Database["public"]["Enums"]["meal_slot"];
          protein_g?: number | null;
          quantity?: number;
          serving_unit_id?: string;
          sodium_mg?: number | null;
          sugar_g?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "food_log_entries_ai_candidate_fkey";
            columns: ["ai_candidate_id"];
            isOneToOne: false;
            referencedRelation: "ai_candidates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "food_log_entries_food_id_fkey";
            columns: ["food_id"];
            isOneToOne: false;
            referencedRelation: "foods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "food_log_entries_serving_unit_id_fkey";
            columns: ["serving_unit_id"];
            isOneToOne: false;
            referencedRelation: "serving_units";
            referencedColumns: ["id"];
          },
        ];
      };
      food_nutrients: {
        Row: {
          carbs_g: number | null;
          energy_kcal: number | null;
          fat_g: number | null;
          fibre_g: number | null;
          food_id: string;
          protein_g: number | null;
          sodium_mg: number | null;
          sugar_g: number | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          carbs_g?: number | null;
          energy_kcal?: number | null;
          fat_g?: number | null;
          fibre_g?: number | null;
          food_id: string;
          protein_g?: number | null;
          sodium_mg?: number | null;
          sugar_g?: number | null;
          updated_at?: string;
        };
        Update: {
          carbs_g?: number | null;
          energy_kcal?: number | null;
          fat_g?: number | null;
          fibre_g?: number | null;
          food_id?: string;
          protein_g?: number | null;
          sodium_mg?: number | null;
          sugar_g?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "food_nutrients_food_id_fkey";
            columns: ["food_id"];
            isOneToOne: true;
            referencedRelation: "foods";
            referencedColumns: ["id"];
          },
        ];
      };
      food_servings: {
        Row: {
          created_at: string;
          data_source_id: string | null;
          food_id: string;
          grams: number;
          id: string;
          is_estimate: boolean;
          notes: string | null;
          serving_unit_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          data_source_id?: string | null;
          food_id: string;
          grams: number;
          id?: string;
          is_estimate?: boolean;
          notes?: string | null;
          serving_unit_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          data_source_id?: string | null;
          food_id?: string;
          grams?: number;
          id?: string;
          is_estimate?: boolean;
          notes?: string | null;
          serving_unit_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "food_servings_data_source_id_fkey";
            columns: ["data_source_id"];
            isOneToOne: false;
            referencedRelation: "data_sources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "food_servings_food_id_fkey";
            columns: ["food_id"];
            isOneToOne: false;
            referencedRelation: "foods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "food_servings_serving_unit_id_fkey";
            columns: ["serving_unit_id"];
            isOneToOne: false;
            referencedRelation: "serving_units";
            referencedColumns: ["id"];
          },
        ];
      };
      food_submissions: {
        Row: {
          created_at: string;
          id: string;
          payload: NonNullable<Json>;
          reviewed_at: string | null;
          reviewed_by: string | null;
          reviewer_notes: string | null;
          status: Database["public"]["Enums"]["submission_status"];
          submitted_by: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          payload: NonNullable<Json>;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          reviewer_notes?: string | null;
          status?: Database["public"]["Enums"]["submission_status"];
          submitted_by?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          payload?: NonNullable<Json>;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          reviewer_notes?: string | null;
          status?: Database["public"]["Enums"]["submission_status"];
          submitted_by?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      foods: {
        Row: {
          category: string | null;
          cooking_method_id: string | null;
          created_at: string;
          data_source_id: string | null;
          id: string;
          is_composite: boolean;
          name: string;
          notes: string | null;
          owner_user_id: string | null;
          recipe_yield_grams: number | null;
          updated_at: string;
          verification_status: Database["public"]["Enums"]["verification_status"];
        };
        ComputedFields: never;
        Insert: {
          category?: string | null;
          cooking_method_id?: string | null;
          created_at?: string;
          data_source_id?: string | null;
          id?: string;
          is_composite?: boolean;
          name: string;
          notes?: string | null;
          owner_user_id?: string | null;
          recipe_yield_grams?: number | null;
          updated_at?: string;
          verification_status?: Database["public"]["Enums"]["verification_status"];
        };
        Update: {
          category?: string | null;
          cooking_method_id?: string | null;
          created_at?: string;
          data_source_id?: string | null;
          id?: string;
          is_composite?: boolean;
          name?: string;
          notes?: string | null;
          owner_user_id?: string | null;
          recipe_yield_grams?: number | null;
          updated_at?: string;
          verification_status?: Database["public"]["Enums"]["verification_status"];
        };
        Relationships: [
          {
            foreignKeyName: "foods_cooking_method_id_fkey";
            columns: ["cooking_method_id"];
            isOneToOne: false;
            referencedRelation: "cooking_methods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "foods_data_source_id_fkey";
            columns: ["data_source_id"];
            isOneToOne: false;
            referencedRelation: "data_sources";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          activity_level: Database["public"]["Enums"]["activity_level"] | null;
          consent_version: string | null;
          created_at: string;
          date_of_birth: string | null;
          display_name: string | null;
          health_data_consent_at: string | null;
          height_cm: number | null;
          id: string;
          onboarding_completed_at: string | null;
          photo_evaluation_opt_in: boolean;
          sex: Database["public"]["Enums"]["sex"] | null;
          strength_trains: boolean | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null;
          consent_version?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          display_name?: string | null;
          health_data_consent_at?: string | null;
          height_cm?: number | null;
          id: string;
          onboarding_completed_at?: string | null;
          photo_evaluation_opt_in?: boolean;
          sex?: Database["public"]["Enums"]["sex"] | null;
          strength_trains?: boolean | null;
          updated_at?: string;
        };
        Update: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null;
          consent_version?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          display_name?: string | null;
          health_data_consent_at?: string | null;
          height_cm?: number | null;
          id?: string;
          onboarding_completed_at?: string | null;
          photo_evaluation_opt_in?: boolean;
          sex?: Database["public"]["Enums"]["sex"] | null;
          strength_trains?: boolean | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      recipe_ingredients: {
        Row: {
          created_at: string;
          grams: number;
          id: string;
          ingredient_food_id: string;
          recipe_food_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          grams: number;
          id?: string;
          ingredient_food_id: string;
          recipe_food_id: string;
        };
        Update: {
          created_at?: string;
          grams?: number;
          id?: string;
          ingredient_food_id?: string;
          recipe_food_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_ingredient_food_id_fkey";
            columns: ["ingredient_food_id"];
            isOneToOne: false;
            referencedRelation: "foods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_food_id_fkey";
            columns: ["recipe_food_id"];
            isOneToOne: false;
            referencedRelation: "foods";
            referencedColumns: ["id"];
          },
        ];
      };
      serving_units: {
        Row: {
          created_at: string;
          grams_per_unit: number | null;
          id: string;
          kind: Database["public"]["Enums"]["serving_unit_kind"];
          name: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          grams_per_unit?: number | null;
          id?: string;
          kind: Database["public"]["Enums"]["serving_unit_kind"];
          name: string;
        };
        Update: {
          created_at?: string;
          grams_per_unit?: number | null;
          id?: string;
          kind?: Database["public"]["Enums"]["serving_unit_kind"];
          name?: string;
        };
        Relationships: [];
      };
      user_goals: {
        Row: {
          calorie_target: number;
          carbs_g: number;
          created_at: string;
          effective_from: string;
          fat_g: number;
          goal_type: Database["public"]["Enums"]["goal_type"];
          id: string;
          is_override: boolean;
          protein_g: number;
          target_rate_kg_per_week: number | null;
          target_weight_kg: number | null;
          user_id: string;
          water_ml: number;
        };
        ComputedFields: never;
        Insert: {
          calorie_target: number;
          carbs_g: number;
          created_at?: string;
          effective_from?: string;
          fat_g: number;
          goal_type: Database["public"]["Enums"]["goal_type"];
          id?: string;
          is_override?: boolean;
          protein_g: number;
          target_rate_kg_per_week?: number | null;
          target_weight_kg?: number | null;
          user_id?: string;
          water_ml: number;
        };
        Update: {
          calorie_target?: number;
          carbs_g?: number;
          created_at?: string;
          effective_from?: string;
          fat_g?: number;
          goal_type?: Database["public"]["Enums"]["goal_type"];
          id?: string;
          is_override?: boolean;
          protein_g?: number;
          target_rate_kg_per_week?: number | null;
          target_weight_kg?: number | null;
          user_id?: string;
          water_ml?: number;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      water_entries: {
        Row: {
          amount_ml: number;
          created_at: string;
          id: string;
          logged_at: string;
          unit_label: string | null;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          amount_ml: number;
          created_at?: string;
          id?: string;
          logged_at?: string;
          unit_label?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          amount_ml?: number;
          created_at?: string;
          id?: string;
          logged_at?: string;
          unit_label?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      weight_entries: {
        Row: {
          created_at: string;
          id: string;
          measured_on: string;
          updated_at: string;
          user_id: string;
          weight_kg: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          measured_on: string;
          updated_at?: string;
          user_id?: string;
          weight_kg: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          measured_on?: string;
          updated_at?: string;
          user_id?: string;
          weight_kg?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_edit_food: { Args: { p_food_id: string }; Returns: boolean };
      complete_onboarding: {
        Args: {
          p_activity_level: Database["public"]["Enums"]["activity_level"];
          p_calorie_target: number;
          p_carbs_g: number;
          p_consent_version: string;
          p_date_of_birth: string;
          p_display_name: string;
          p_fat_g: number;
          p_goal_type: Database["public"]["Enums"]["goal_type"];
          p_height_cm: number;
          p_measured_on: string;
          p_protein_g: number;
          p_sex: Database["public"]["Enums"]["sex"];
          p_strength_trains: boolean;
          p_target_rate_kg_per_week: number;
          p_target_weight_kg?: number;
          p_water_ml: number;
          p_weight_kg: number;
        };
        Returns: undefined;
      };
      create_custom_food: {
        Args: {
          p_carbs_g: number;
          p_category: string;
          p_energy_kcal: number;
          p_fat_g: number;
          p_fibre_g?: number;
          p_name: string;
          p_protein_g: number;
          p_serving_grams?: number;
          p_serving_unit?: string;
          p_sodium_mg?: number;
          p_sugar_g?: number;
        };
        Returns: string;
      };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      search_foods: {
        Args: { p_limit?: number; p_query: string };
        Returns: {
          carbs_g: number;
          category: string;
          energy_kcal: number;
          fat_g: number;
          id: string;
          is_custom: boolean;
          matched_alias: string;
          matched_language: string;
          name: string;
          protein_g: number;
          score: number;
          source_name: string;
          verification_status: Database["public"]["Enums"]["verification_status"];
        }[];
      };
    };
    Enums: {
      activity_level: "sedentary" | "light" | "moderate" | "active" | "very_active";
      ai_candidate_outcome: "pending" | "accepted" | "edited" | "removed";
      ai_feature: "text_parse" | "photo_recognition" | "assistant";
      ai_input_type: "text" | "photo";
      ai_job_status: "pending" | "completed" | "failed";
      app_role: "admin";
      assistant_role: "user" | "assistant";
      entitlement_source: "paystack" | "revenuecat" | "manual";
      entry_method: "manual" | "text" | "photo";
      goal_type: "lose" | "maintain" | "gain";
      meal_slot: "breakfast" | "lunch" | "dinner" | "snack";
      serving_unit_kind: "mass" | "volume" | "count";
      sex: "female" | "male";
      submission_status: "pending" | "approved" | "rejected";
      subscription_tier: "free" | "premium";
      verification_status: "verified" | "unverified" | "rejected";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      activity_level: ["sedentary", "light", "moderate", "active", "very_active"],
      ai_candidate_outcome: ["pending", "accepted", "edited", "removed"],
      ai_feature: ["text_parse", "photo_recognition", "assistant"],
      ai_input_type: ["text", "photo"],
      ai_job_status: ["pending", "completed", "failed"],
      app_role: ["admin"],
      assistant_role: ["user", "assistant"],
      entitlement_source: ["paystack", "revenuecat", "manual"],
      entry_method: ["manual", "text", "photo"],
      goal_type: ["lose", "maintain", "gain"],
      meal_slot: ["breakfast", "lunch", "dinner", "snack"],
      serving_unit_kind: ["mass", "volume", "count"],
      sex: ["female", "male"],
      submission_status: ["pending", "approved", "rejected"],
      subscription_tier: ["free", "premium"],
      verification_status: ["verified", "unverified", "rejected"],
    },
  },
} as const;
