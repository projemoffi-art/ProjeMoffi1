// Supabase veritabanı şeması — OTOMATİK ÜRETİLİR (Supabase generate_typescript_types). Elle düzenleme;
// şema değişince yeniden üret (scratchpad/gentypes.cjs). Kullanım: Tables<'pets'> satır tipi, Database['public']['Functions'].

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
      activity_locations: {
        Row: {
          created_at: string | null
          id: string
          latitude: number
          longitude: number
          name: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          latitude: number
          longitude: number
          name: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          type?: string | null
        }
        Relationships: []
      }
      adoption_applications: {
        Row: {
          adoption_id: string
          applicant_id: string
          children_ages: string | null
          created_at: string
          decided_at: string | null
          experience: string | null
          experience_note: string | null
          full_name: string
          home_features: string[]
          home_type: string
          household: string[]
          id: string
          interview_at: string | null
          interview_note: string | null
          message: string
          owner_id: string
          owner_note: string | null
          reference_note: string | null
          status: string
          updated_at: string
        }
        Insert: {
          adoption_id: string
          applicant_id: string
          children_ages?: string | null
          created_at?: string
          decided_at?: string | null
          experience?: string | null
          experience_note?: string | null
          full_name: string
          home_features?: string[]
          home_type: string
          household?: string[]
          id?: string
          interview_at?: string | null
          interview_note?: string | null
          message: string
          owner_id: string
          owner_note?: string | null
          reference_note?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          adoption_id?: string
          applicant_id?: string
          children_ages?: string | null
          created_at?: string
          decided_at?: string | null
          experience?: string | null
          experience_note?: string | null
          full_name?: string
          home_features?: string[]
          home_type?: string
          household?: string[]
          id?: string
          interview_at?: string | null
          interview_note?: string | null
          message?: string
          owner_id?: string
          owner_note?: string | null
          reference_note?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "adoption_applications_adoption_id_fkey"
            columns: ["adoption_id"]
            isOneToOne: false
            referencedRelation: "adoption_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adoption_applications_adoption_id_fkey"
            columns: ["adoption_id"]
            isOneToOne: false
            referencedRelation: "adoption_pets"
            referencedColumns: ["id"]
          },
        ]
      }
      adoption_favorites: {
        Row: {
          adoption_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          adoption_id: string
          created_at?: string
          user_id?: string
        }
        Update: {
          adoption_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "adoption_favorites_adoption_id_fkey"
            columns: ["adoption_id"]
            isOneToOne: false
            referencedRelation: "adoption_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adoption_favorites_adoption_id_fkey"
            columns: ["adoption_id"]
            isOneToOne: false
            referencedRelation: "adoption_pets"
            referencedColumns: ["id"]
          },
        ]
      }
      adoption_pets: {
        Row: {
          adopted_at: string | null
          adopted_by: string | null
          age_group: string | null
          contact_mode: string
          created_at: string | null
          description: string | null
          gender: string | null
          good_with_cats: boolean
          good_with_dogs: boolean
          good_with_kids: boolean
          good_with_others: boolean
          health_note: string | null
          health_unknown: boolean
          id: string
          images: string[] | null
          img_url: string | null
          is_shelter: boolean
          latitude: number | null
          location_text: string | null
          longitude: number | null
          microchipped: boolean
          neutered: boolean
          notified_at: string | null
          notified_count: number
          pet_age: string | null
          pet_breed: string | null
          pet_id: string | null
          pet_name: string
          pet_type: string | null
          phone: string | null
          share_count: number
          status: string | null
          updated_at: string
          user_id: string | null
          vaccinated: boolean
          view_count: number
        }
        Insert: {
          adopted_at?: string | null
          adopted_by?: string | null
          age_group?: string | null
          contact_mode?: string
          created_at?: string | null
          description?: string | null
          gender?: string | null
          good_with_cats?: boolean
          good_with_dogs?: boolean
          good_with_kids?: boolean
          good_with_others?: boolean
          health_note?: string | null
          health_unknown?: boolean
          id?: string
          images?: string[] | null
          img_url?: string | null
          is_shelter?: boolean
          latitude?: number | null
          location_text?: string | null
          longitude?: number | null
          microchipped?: boolean
          neutered?: boolean
          notified_at?: string | null
          notified_count?: number
          pet_age?: string | null
          pet_breed?: string | null
          pet_id?: string | null
          pet_name: string
          pet_type?: string | null
          phone?: string | null
          share_count?: number
          status?: string | null
          updated_at?: string
          user_id?: string | null
          vaccinated?: boolean
          view_count?: number
        }
        Update: {
          adopted_at?: string | null
          adopted_by?: string | null
          age_group?: string | null
          contact_mode?: string
          created_at?: string | null
          description?: string | null
          gender?: string | null
          good_with_cats?: boolean
          good_with_dogs?: boolean
          good_with_kids?: boolean
          good_with_others?: boolean
          health_note?: string | null
          health_unknown?: boolean
          id?: string
          images?: string[] | null
          img_url?: string | null
          is_shelter?: boolean
          latitude?: number | null
          location_text?: string | null
          longitude?: number | null
          microchipped?: boolean
          neutered?: boolean
          notified_at?: string | null
          notified_count?: number
          pet_age?: string | null
          pet_breed?: string | null
          pet_id?: string | null
          pet_name?: string
          pet_type?: string | null
          phone?: string | null
          share_count?: number
          status?: string | null
          updated_at?: string
          user_id?: string | null
          vaccinated?: boolean
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "adoption_pets_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pet_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adoption_pets_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage: {
        Row: {
          cost_usd: number
          created_at: string
          endpoint: string
          id: string
          input_tokens: number | null
          kind: string
          model: string | null
          output_tokens: number | null
          pawcoin_spent: number
          source: string
          status: string
          user_id: string
        }
        Insert: {
          cost_usd?: number
          created_at?: string
          endpoint: string
          id?: string
          input_tokens?: number | null
          kind: string
          model?: string | null
          output_tokens?: number | null
          pawcoin_spent?: number
          source: string
          status?: string
          user_id: string
        }
        Update: {
          cost_usd?: number
          created_at?: string
          endpoint?: string
          id?: string
          input_tokens?: number | null
          kind?: string
          model?: string | null
          output_tokens?: number | null
          pawcoin_spent?: number
          source?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      app_feedbacks: {
        Row: {
          category: string | null
          created_at: string | null
          email: string
          id: string
          message: string
          rating: number | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          email: string
          id?: string
          message: string
          rating?: number | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          rating?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          attendance_status: string | null
          clinic_id: string | null
          clinic_name: string | null
          created_at: string | null
          created_by: string
          doctor_id: string | null
          doctor_name: string | null
          duration_minutes: number | null
          guest_name: string | null
          guest_pet_name: string | null
          guest_phone: string | null
          id: string
          notes: string | null
          payment_amount: number | null
          payment_id: string | null
          payment_status: string | null
          pet_id: string | null
          reason: string | null
          reschedule_requested_at: string | null
          reschedule_requested_start: string | null
          shared_passport: Json | null
          status: string | null
          status_reason: string | null
          unclaimed_patient_id: string | null
          user_id: string | null
        }
        Insert: {
          appointment_date: string
          attendance_status?: string | null
          clinic_id?: string | null
          clinic_name?: string | null
          created_at?: string | null
          created_by?: string
          doctor_id?: string | null
          doctor_name?: string | null
          duration_minutes?: number | null
          guest_name?: string | null
          guest_pet_name?: string | null
          guest_phone?: string | null
          id?: string
          notes?: string | null
          payment_amount?: number | null
          payment_id?: string | null
          payment_status?: string | null
          pet_id?: string | null
          reason?: string | null
          reschedule_requested_at?: string | null
          reschedule_requested_start?: string | null
          shared_passport?: Json | null
          status?: string | null
          status_reason?: string | null
          unclaimed_patient_id?: string | null
          user_id?: string | null
        }
        Update: {
          appointment_date?: string
          attendance_status?: string | null
          clinic_id?: string | null
          clinic_name?: string | null
          created_at?: string | null
          created_by?: string
          doctor_id?: string | null
          doctor_name?: string | null
          duration_minutes?: number | null
          guest_name?: string | null
          guest_pet_name?: string | null
          guest_phone?: string | null
          id?: string
          notes?: string | null
          payment_amount?: number | null
          payment_id?: string | null
          payment_status?: string | null
          pet_id?: string | null
          reason?: string | null
          reschedule_requested_at?: string | null
          reschedule_requested_start?: string | null
          shared_passport?: Json | null
          status?: string | null
          status_reason?: string | null
          unclaimed_patient_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pet_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_unclaimed_patient_id_fkey"
            columns: ["unclaimed_patient_id"]
            isOneToOne: false
            referencedRelation: "unclaimed_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_data_export"
            referencedColumns: ["user_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          target_id: string | null
          target_table: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_table?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_table?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      business_invitations: {
        Row: {
          accepted_by: string | null
          business_id: string
          created_at: string
          doctor_id: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_by?: string | null
          business_id: string
          created_at?: string
          doctor_id?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role: string
          status?: string
          token?: string
          updated_at?: string
        }
        Update: {
          accepted_by?: string | null
          business_id?: string
          created_at?: string
          doctor_id?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_invitations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_invitations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_invitations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      business_members: {
        Row: {
          business_id: string
          created_at: string
          doctor_id: string | null
          role: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          doctor_id?: string | null
          role: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          doctor_id?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_members_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          approved: boolean
          business_type: string | null
          cancellation_notice_hours: number
          cover_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          district: string | null
          gallery_urls: string[]
          iban: string | null
          id: string
          kyb_rejection_reason: string | null
          kyb_status: string
          lat: number | null
          lng: number | null
          logo_url: string | null
          name: string
          onboarding_completed: boolean
          owner_name: string | null
          phone: string | null
          province: string | null
          settings: Json
          tax_id: string | null
          updated_at: string
          website: string | null
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          approved?: boolean
          business_type?: string | null
          cancellation_notice_hours?: number
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          district?: string | null
          gallery_urls?: string[]
          iban?: string | null
          id?: string
          kyb_rejection_reason?: string | null
          kyb_status?: string
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name: string
          onboarding_completed?: boolean
          owner_name?: string | null
          phone?: string | null
          province?: string | null
          settings?: Json
          tax_id?: string | null
          updated_at?: string
          website?: string | null
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          approved?: boolean
          business_type?: string | null
          cancellation_notice_hours?: number
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          district?: string | null
          gallery_urls?: string[]
          iban?: string | null
          id?: string
          kyb_rejection_reason?: string | null
          kyb_status?: string
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name?: string
          onboarding_completed?: boolean
          owner_name?: string | null
          phone?: string | null
          province?: string | null
          settings?: Json
          tax_id?: string | null
          updated_at?: string
          website?: string | null
          working_hours?: Json | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          clinic_id: string | null
          coupon_code: string | null
          created_at: string | null
          current_uses: number | null
          description: string | null
          discount_value: string | null
          expires_at: string | null
          id: string
          max_uses: number | null
          media_url: string | null
          status: string | null
          target_pet_type: string | null
          title: string
        }
        Insert: {
          clinic_id?: string | null
          coupon_code?: string | null
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_value?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          media_url?: string | null
          status?: string | null
          target_pet_type?: string | null
          title: string
        }
        Update: {
          clinic_id?: string | null
          coupon_code?: string | null
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_value?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          media_url?: string | null
          status?: string | null
          target_pet_type?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          created_at: string | null
          product_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          product_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          product_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: []
      }
      clinic_campaigns: {
        Row: {
          clinic_id: string
          coupon_code: string | null
          created_at: string | null
          current_uses: number | null
          description: string | null
          discount_value: string | null
          ends_at: string | null
          expires_at: string | null
          id: string
          max_uses: number | null
          media_url: string | null
          starts_at: string | null
          status: string | null
          target_pet_type: string | null
          title: string
        }
        Insert: {
          clinic_id: string
          coupon_code?: string | null
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_value?: string | null
          ends_at?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          media_url?: string | null
          starts_at?: string | null
          status?: string | null
          target_pet_type?: string | null
          title: string
        }
        Update: {
          clinic_id?: string
          coupon_code?: string | null
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_value?: string | null
          ends_at?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          media_url?: string | null
          starts_at?: string | null
          status?: string | null
          target_pet_type?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_campaigns_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_campaigns_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_client_notes: {
        Row: {
          client_key: string
          clinic_id: string
          note: string
          updated_at: string
        }
        Insert: {
          client_key: string
          clinic_id: string
          note?: string
          updated_at?: string
        }
        Update: {
          client_key?: string
          clinic_id?: string
          note?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_client_notes_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_client_notes_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_reviews: {
        Row: {
          appointment_id: string
          clinic_id: string
          clinic_replied_at: string | null
          clinic_reply: string | null
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          user_id: string | null
        }
        Insert: {
          appointment_id: string
          clinic_id: string
          clinic_replied_at?: string | null
          clinic_reply?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          user_id?: string | null
        }
        Update: {
          appointment_id?: string
          clinic_id?: string
          clinic_replied_at?: string | null
          clinic_reply?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_reviews_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_reviews_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_schedule_exceptions: {
        Row: {
          clinic_id: string
          close_time: string | null
          created_at: string | null
          exception_date: string
          id: string
          is_closed: boolean
          note: string | null
          open_time: string | null
        }
        Insert: {
          clinic_id: string
          close_time?: string | null
          created_at?: string | null
          exception_date: string
          id?: string
          is_closed?: boolean
          note?: string | null
          open_time?: string | null
        }
        Update: {
          clinic_id?: string
          close_time?: string | null
          created_at?: string | null
          exception_date?: string
          id?: string
          is_closed?: boolean
          note?: string | null
          open_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_schedule_exceptions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_schedule_exceptions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_services: {
        Row: {
          clinic_id: string
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_custom: boolean | null
          price: number | null
          service_name: string
        }
        Insert: {
          clinic_id: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_custom?: boolean | null
          price?: number | null
          service_name: string
        }
        Update: {
          clinic_id?: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_custom?: boolean | null
          price?: number | null
          service_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_services_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_services_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_settings: {
        Row: {
          clinic_id: string
          end_time: string | null
          lunch_end: string | null
          lunch_start: string | null
          slot_duration: number | null
          start_time: string | null
          updated_at: string | null
          working_days: Json | null
        }
        Insert: {
          clinic_id: string
          end_time?: string | null
          lunch_end?: string | null
          lunch_start?: string | null
          slot_duration?: number | null
          start_time?: string | null
          updated_at?: string | null
          working_days?: Json | null
        }
        Update: {
          clinic_id?: string
          end_time?: string | null
          lunch_end?: string | null
          lunch_start?: string | null
          slot_duration?: number | null
          start_time?: string | null
          updated_at?: string | null
          working_days?: Json | null
        }
        Relationships: []
      }
      clinic_sms_settings: {
        Row: {
          api_key: string | null
          api_username: string | null
          clinic_id: string
          created_at: string | null
          is_active: boolean | null
          provider: string | null
          sender_id: string | null
        }
        Insert: {
          api_key?: string | null
          api_username?: string | null
          clinic_id: string
          created_at?: string | null
          is_active?: boolean | null
          provider?: string | null
          sender_id?: string | null
        }
        Update: {
          api_key?: string | null
          api_username?: string | null
          clinic_id?: string
          created_at?: string | null
          is_active?: boolean | null
          provider?: string | null
          sender_id?: string | null
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          edited_at: string | null
          id: string
          likes_count: number | null
          parent_id: string | null
          post_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          edited_at?: string | null
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          post_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          post_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_data_export"
            referencedColumns: ["user_id"]
          },
        ]
      }
      content_events: {
        Row: {
          content_id: string
          created_at: string
          kind: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          kind: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          kind?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_events_content_fk"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          body: string | null
          business_id: string | null
          campaign_id: string | null
          channel: string
          created_at: string
          created_by: string | null
          cta_label: string | null
          cta_url: string | null
          ends_at: string | null
          id: string
          media_url: string | null
          priority: number
          radius_km: number
          reject_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          starts_at: string
          status: string
          target_species: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          business_id?: string | null
          campaign_id?: string | null
          channel: string
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          cta_url?: string | null
          ends_at?: string | null
          id?: string
          media_url?: string | null
          priority?: number
          radius_km?: number
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          starts_at?: string
          status?: string
          target_species?: string
          title?: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          business_id?: string | null
          campaign_id?: string | null
          channel?: string
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          cta_url?: string | null
          ends_at?: string | null
          id?: string
          media_url?: string | null
          priority?: number
          radius_km?: number
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          starts_at?: string
          status?: string
          target_species?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_items_business_fk"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_business_fk"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_campaign_fk"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "clinic_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_prefs: {
        Row: {
          accepted_at: string | null
          cleared_at: string | null
          conversation_id: string
          muted: boolean
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          cleared_at?: string | null
          conversation_id: string
          muted?: boolean
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          cleared_at?: string | null
          conversation_id?: string
          muted?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_prefs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          associated_ad_id: string | null
          context_type: string | null
          created_at: string | null
          id: string
          last_message: string | null
          last_message_at: string | null
          participant_1: string | null
          participant_2: string | null
        }
        Insert: {
          associated_ad_id?: string | null
          context_type?: string | null
          created_at?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          participant_1?: string | null
          participant_2?: string | null
        }
        Update: {
          associated_ad_id?: string | null
          context_type?: string | null
          created_at?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          participant_1?: string | null
          participant_2?: string | null
        }
        Relationships: []
      }
      cosmetic_items: {
        Row: {
          created_at: string
          icon: string
          id: string
          is_active: boolean
          is_starter: boolean
          item_key: string
          name: string
          price_pp: number
          rarity: string
          slot: string
        }
        Insert: {
          created_at?: string
          icon: string
          id?: string
          is_active?: boolean
          is_starter?: boolean
          item_key: string
          name: string
          price_pp?: number
          rarity: string
          slot: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          is_starter?: boolean
          item_key?: string
          name?: string
          price_pp?: number
          rarity?: string
          slot?: string
        }
        Relationships: []
      }
      daily_stars: {
        Row: {
          badge: string
          created_at: string
          date: string
          description: string
          id: string
          media_url: string
          pet_id: string
          rank: number
          status: string
          title: string
        }
        Insert: {
          badge: string
          created_at?: string
          date?: string
          description: string
          id?: string
          media_url: string
          pet_id: string
          rank: number
          status: string
          title: string
        }
        Update: {
          badge?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          media_url?: string
          pet_id?: string
          rank?: number
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_stars_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pet_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_stars_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_time_off: {
        Row: {
          clinic_id: string
          created_at: string
          doctor_id: string
          id: string
          note: string | null
          off_date: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          doctor_id: string
          id?: string
          note?: string | null
          off_date: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          doctor_id?: string
          id?: string
          note?: string | null
          off_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_time_off_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_time_off_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_time_off_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          photo_url: string | null
          title: string | null
          working_hours: Json | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          photo_url?: string | null
          title?: string | null
          working_hours?: Json | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          photo_url?: string | null
          title?: string | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctors_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      email_outbox: {
        Row: {
          attempts: number
          body: string
          claimed_at: string | null
          created_at: string
          cta_url: string | null
          dedupe_key: string | null
          heading: string
          id: string
          last_error: string | null
          recipient_email: string | null
          sent_at: string | null
          status: string
          subject: string
          user_id: string | null
        }
        Insert: {
          attempts?: number
          body: string
          claimed_at?: string | null
          created_at?: string
          cta_url?: string | null
          dedupe_key?: string | null
          heading: string
          id?: string
          last_error?: string | null
          recipient_email?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          user_id?: string | null
        }
        Update: {
          attempts?: number
          body?: string
          claimed_at?: string | null
          created_at?: string
          cta_url?: string | null
          dedupe_key?: string | null
          heading?: string
          id?: string
          last_error?: string | null
          recipient_email?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          user_id?: string | null
        }
        Relationships: []
      }
      favorite_clinics: {
        Row: {
          clinic_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_clinics_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_clinics_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      game_modules: {
        Row: {
          color_gradient: string
          created_at: string | null
          description: string
          difficulty: number | null
          game_key: string
          icon_name: string
          id: string
          is_active: boolean | null
          reward_multiplier: number | null
          title: string
        }
        Insert: {
          color_gradient: string
          created_at?: string | null
          description: string
          difficulty?: number | null
          game_key: string
          icon_name: string
          id?: string
          is_active?: boolean | null
          reward_multiplier?: number | null
          title: string
        }
        Update: {
          color_gradient?: string
          created_at?: string | null
          description?: string
          difficulty?: number | null
          game_key?: string
          icon_name?: string
          id?: string
          is_active?: boolean | null
          reward_multiplier?: number | null
          title?: string
        }
        Relationships: []
      }
      game_reward_days: {
        Row: {
          coins: number
          day: string
          user_id: string
          xp: number
        }
        Insert: {
          coins?: number
          day: string
          user_id: string
          xp?: number
        }
        Update: {
          coins?: number
          day?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      health_reminder_log: {
        Row: {
          created_at: string
          key: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          key: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          key?: string
          user_id?: string | null
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string | null
          id: number
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_pets: {
        Row: {
          age_text: string | null
          approach_note: string | null
          breed: string | null
          chip_status: string | null
          color: string | null
          contact_mode: string
          contact_phone: string | null
          created_at: string | null
          description: string | null
          features: string[]
          gender: string | null
          id: string
          images: string[] | null
          img_url: string | null
          kind: string
          last_seen_date: string | null
          latitude: number | null
          location_point: unknown
          location_text: string | null
          longitude: number | null
          notified_at: string | null
          notified_count: number
          notify_radius_km: number
          pet_id: string | null
          pet_name: string | null
          pet_type: string | null
          resolution: string | null
          resolved_at: string | null
          reward_amount: number | null
          reward_enabled: boolean | null
          share_count: number
          situation: string | null
          status: string | null
          updated_at: string
          user_id: string | null
          view_count: number
        }
        Insert: {
          age_text?: string | null
          approach_note?: string | null
          breed?: string | null
          chip_status?: string | null
          color?: string | null
          contact_mode?: string
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          features?: string[]
          gender?: string | null
          id?: string
          images?: string[] | null
          img_url?: string | null
          kind?: string
          last_seen_date?: string | null
          latitude?: number | null
          location_point?: unknown
          location_text?: string | null
          longitude?: number | null
          notified_at?: string | null
          notified_count?: number
          notify_radius_km?: number
          pet_id?: string | null
          pet_name?: string | null
          pet_type?: string | null
          resolution?: string | null
          resolved_at?: string | null
          reward_amount?: number | null
          reward_enabled?: boolean | null
          share_count?: number
          situation?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
          view_count?: number
        }
        Update: {
          age_text?: string | null
          approach_note?: string | null
          breed?: string | null
          chip_status?: string | null
          color?: string | null
          contact_mode?: string
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          features?: string[]
          gender?: string | null
          id?: string
          images?: string[] | null
          img_url?: string | null
          kind?: string
          last_seen_date?: string | null
          latitude?: number | null
          location_point?: unknown
          location_text?: string | null
          longitude?: number | null
          notified_at?: string | null
          notified_count?: number
          notify_radius_km?: number
          pet_id?: string | null
          pet_name?: string | null
          pet_type?: string | null
          resolution?: string | null
          resolved_at?: string | null
          reward_amount?: number | null
          reward_enabled?: boolean | null
          share_count?: number
          situation?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "lost_pets_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pet_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_pets_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      map_marks: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          lat: number
          likes: number | null
          lng: number
          message: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          lat: number
          likes?: number | null
          lng: number
          message: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          lat?: number
          likes?: number | null
          lng?: number
          message?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      medical_records: {
        Row: {
          appointment_id: string | null
          attachments: Json | null
          clinic_id: string | null
          cost: number | null
          created_at: string | null
          critical_notes: string | null
          diagnosis: string
          external_clinic_name: string | null
          id: string
          medications: Json | null
          pet_id: string
          source: string
          temperature_c: number | null
          vaccines: Json
          vet_name: string | null
          visit_date: string | null
          weight_kg: number | null
        }
        Insert: {
          appointment_id?: string | null
          attachments?: Json | null
          clinic_id?: string | null
          cost?: number | null
          created_at?: string | null
          critical_notes?: string | null
          diagnosis: string
          external_clinic_name?: string | null
          id?: string
          medications?: Json | null
          pet_id: string
          source?: string
          temperature_c?: number | null
          vaccines?: Json
          vet_name?: string | null
          visit_date?: string | null
          weight_kg?: number | null
        }
        Update: {
          appointment_id?: string | null
          attachments?: Json | null
          clinic_id?: string | null
          cost?: number | null
          created_at?: string | null
          critical_notes?: string | null
          diagnosis?: string
          external_clinic_name?: string | null
          id?: string
          medications?: Json | null
          pet_id?: string
          source?: string
          temperature_c?: number | null
          vaccines?: Json
          vet_name?: string | null
          visit_date?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pet_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_doses: {
        Row: {
          dose_date: string
          given_at: string
          given_by: string | null
          id: string
          medication_id: string
          pet_id: string
          slot: string
        }
        Insert: {
          dose_date: string
          given_at?: string
          given_by?: string | null
          id?: string
          medication_id: string
          pet_id: string
          slot: string
        }
        Update: {
          dose_date?: string
          given_at?: string
          given_by?: string | null
          id?: string
          medication_id?: string
          pet_id?: string
          slot?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_doses_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_doses_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pet_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_doses_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          dosage: string | null
          dose_times: string[]
          end_date: string | null
          frequency: string | null
          id: string
          instructions: string | null
          is_active: boolean | null
          last_log: string | null
          medical_record_id: string | null
          name: string
          pet_id: string | null
          prescribed_by: string | null
          source: string
          start_date: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          dosage?: string | null
          dose_times?: string[]
          end_date?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          last_log?: string | null
          medical_record_id?: string | null
          name: string
          pet_id?: string | null
          prescribed_by?: string | null
          source?: string
          start_date?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          dosage?: string | null
          dose_times?: string[]
          end_date?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          last_log?: string | null
          medical_record_id?: string | null
          name?: string
          pet_id?: string | null
          prescribed_by?: string | null
          source?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medications_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medications_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medications_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medications_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pet_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medications_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          message_id: string
          peer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          message_id: string
          peer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          message_id?: string
          peer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_url: string | null
          avatar: string | null
          content: string | null
          conversation_id: string | null
          created_at: string | null
          id: string
          is_deleted: boolean
          is_read: boolean | null
          is_system: boolean | null
          issystem: boolean | null
          location_link: string | null
          pet_name: string | null
          read: boolean | null
          receiver_id: string | null
          reply_to: string | null
          sender_id: string | null
          text: string | null
          type: string | null
          user: string | null
        }
        Insert: {
          attachment_url?: string | null
          avatar?: string | null
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean
          is_read?: boolean | null
          is_system?: boolean | null
          issystem?: boolean | null
          location_link?: string | null
          pet_name?: string | null
          read?: boolean | null
          receiver_id?: string | null
          reply_to?: string | null
          sender_id?: string | null
          text?: string | null
          type?: string | null
          user?: string | null
        }
        Update: {
          attachment_url?: string | null
          avatar?: string | null
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean
          is_read?: boolean | null
          is_system?: boolean | null
          issystem?: boolean | null
          location_link?: string | null
          pet_name?: string | null
          read?: boolean | null
          receiver_id?: string | null
          reply_to?: string | null
          sender_id?: string | null
          text?: string | null
          type?: string | null
          user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          business_id: string | null
          content: string | null
          created_at: string | null
          entity_id: string | null
          id: string
          is_read: boolean | null
          title: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          actor_id?: string | null
          business_id?: string | null
          content?: string | null
          created_at?: string | null
          entity_id?: string | null
          id?: string
          is_read?: boolean | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          actor_id?: string | null
          business_id?: string | null
          content?: string | null
          created_at?: string | null
          entity_id?: string | null
          id?: string
          is_read?: boolean | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_plans: {
        Row: {
          created_at: string | null
          daily_calories: number | null
          feeding_times: string[] | null
          food_type: string | null
          id: string
          notes: string | null
          pet_id: string
          updated_at: string | null
          vet_approved: boolean | null
        }
        Insert: {
          created_at?: string | null
          daily_calories?: number | null
          feeding_times?: string[] | null
          food_type?: string | null
          id?: string
          notes?: string | null
          pet_id: string
          updated_at?: string | null
          vet_approved?: boolean | null
        }
        Update: {
          created_at?: string | null
          daily_calories?: number | null
          feeding_times?: string[] | null
          food_type?: string | null
          id?: string
          notes?: string | null
          pet_id?: string
          updated_at?: string | null
          vet_approved?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_plans_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: true
            referencedRelation: "pet_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_plans_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: true
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          business_id: string | null
          created_at: string | null
          id: string
          order_id: string
          price_at_purchase: number
          product_id: string
          quantity: number
          status: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          order_id: string
          price_at_purchase: number
          product_id: string
          quantity: number
          status?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          order_id?: string
          price_at_purchase?: number
          product_id?: string
          quantity?: number
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          carrier: string | null
          commission_amount: number | null
          commission_rate: number | null
          created_at: string | null
          expires_at: string | null
          id: string
          shipped_at: string | null
          shipping_address: string | null
          status: string | null
          total_amount: number
          tracking_number: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          carrier?: string | null
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          shipped_at?: string | null
          shipping_address?: string | null
          status?: string | null
          total_amount: number
          tracking_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          carrier?: string | null
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          shipped_at?: string | null
          shipping_address?: string | null
          status?: string | null
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      parasite_treatments: {
        Row: {
          applied_on: string | null
          clinic_id: string | null
          created_at: string
          id: string
          kind: string
          next_due_on: string | null
          notes: string | null
          pet_id: string
          product: string | null
          source: string
          status: string
        }
        Insert: {
          applied_on?: string | null
          clinic_id?: string | null
          created_at?: string
          id?: string
          kind: string
          next_due_on?: string | null
          notes?: string | null
          pet_id: string
          product?: string | null
          source?: string
          status?: string
        }
        Update: {
          applied_on?: string | null
          clinic_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          next_due_on?: string | null
          notes?: string | null
          pet_id?: string
          product?: string | null
          source?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "parasite_treatments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parasite_treatments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parasite_treatments_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pet_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parasite_treatments_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          conversation_id: string | null
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pet_daily_stats: {
        Row: {
          calories_intake: number | null
          calories_target: number | null
          date: string
          food_log: Json | null
          id: string
          meals_given: number
          pet_id: string | null
          updated_at: string | null
          water_intake: number | null
          water_refreshed_at: string | null
          water_target: number | null
        }
        Insert: {
          calories_intake?: number | null
          calories_target?: number | null
          date?: string
          food_log?: Json | null
          id?: string
          meals_given?: number
          pet_id?: string | null
          updated_at?: string | null
          water_intake?: number | null
          water_refreshed_at?: string | null
          water_target?: number | null
        }
        Update: {
          calories_intake?: number | null
          calories_target?: number | null
          date?: string
          food_log?: Json | null
          id?: string
          meals_given?: number
          pet_id?: string | null
          updated_at?: string | null
          water_intake?: number | null
          water_refreshed_at?: string | null
          water_target?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_daily_stats_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pet_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_daily_stats_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_documents: {
        Row: {
          category: string
          created_at: string
          doc_date: string
          id: string
          medical_record_id: string | null
          mime_type: string | null
          pet_id: string
          size_bytes: number | null
          storage_path: string
          title: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          doc_date?: string
          id?: string
          medical_record_id?: string | null
          mime_type?: string | null
          pet_id: string
          size_bytes?: number | null
          storage_path: string
          title: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          doc_date?: string
          id?: string
          medical_record_id?: string | null
          mime_type?: string | null
          pet_id?: string
          size_bytes?: number | null
          storage_path?: string
          title?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_documents_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_documents_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pet_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_documents_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_health_profile: {
        Row: {
          allergies: string[]
          alt_contact_name: string | null
          alt_contact_phone: string | null
          blood_type: string | null
          chronic_conditions: string[]
          contact_name: string | null
          contact_phone: string | null
          notes: string | null
          pet_id: string
          primary_clinic_id: string | null
          primary_vet_name: string | null
          primary_vet_phone: string | null
          show_on_lost: boolean
          show_on_qr: boolean
          updated_at: string
        }
        Insert: {
          allergies?: string[]
          alt_contact_name?: string | null
          alt_contact_phone?: string | null
          blood_type?: string | null
          chronic_conditions?: string[]
          contact_name?: string | null
          contact_phone?: string | null
          notes?: string | null
          pet_id: string
          primary_clinic_id?: string | null
          primary_vet_name?: string | null
          primary_vet_phone?: string | null
          show_on_lost?: boolean
          show_on_qr?: boolean
          updated_at?: string
        }
        Update: {
          allergies?: string[]
          alt_contact_name?: string | null
          alt_contact_phone?: string | null
          blood_type?: string | null
          chronic_conditions?: string[]
          contact_name?: string | null
          contact_phone?: string | null
          notes?: string | null
          pet_id?: string
          primary_clinic_id?: string | null
          primary_vet_name?: string | null
          primary_vet_phone?: string | null
          show_on_lost?: boolean
          show_on_qr?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_health_profile_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: true
            referencedRelation: "pet_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_health_profile_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: true
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_health_profile_primary_clinic_id_fkey"
            columns: ["primary_clinic_id"]
            isOneToOne: false
            referencedRelation: "profile_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_health_profile_primary_clinic_id_fkey"
            columns: ["primary_clinic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_health_profile_primary_clinic_id_fkey"
            columns: ["primary_clinic_id"]
            isOneToOne: false
            referencedRelation: "user_data_export"
            referencedColumns: ["user_id"]
          },
        ]
      }
      pet_media: {
        Row: {
          bytes: number
          created_at: string
          duration_seconds: number | null
          height: number | null
          id: string
          kind: string
          memory_id: string | null
          mime_type: string
          owner_id: string
          path: string
          pet_id: string
          status: string
          taken_at: string | null
          thumb_path: string
          width: number | null
        }
        Insert: {
          bytes: number
          created_at?: string
          duration_seconds?: number | null
          height?: number | null
          id?: string
          kind: string
          memory_id?: string | null
          mime_type: string
          owner_id: string
          path: string
          pet_id: string
          status?: string
          taken_at?: string | null
          thumb_path: string
          width?: number | null
        }
        Update: {
          bytes?: number
          created_at?: string
          duration_seconds?: number | null
          height?: number | null
          id?: string
          kind?: string
          memory_id?: string | null
          mime_type?: string
          owner_id?: string
          path?: string
          pet_id?: string
          status?: string
          taken_at?: string | null
          thumb_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_media_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "pet_memories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_media_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pet_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_media_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_memories: {
        Row: {
          created_at: string
          id: string
          memory_date: string
          note: string | null
          owner_id: string
          pet_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          memory_date: string
          note?: string | null
          owner_id: string
          pet_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          memory_date?: string
          note?: string | null
          owner_id?: string
          pet_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_memories_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pet_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_memories_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_ownership_transfers: {
        Row: {
          adoption_id: string | null
          created_at: string | null
          expires_at: string | null
          from_owner_id: string
          id: string
          pet_id: string
          responded_at: string | null
          status: string
          to_email: string | null
          to_owner_id: string | null
        }
        Insert: {
          adoption_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          from_owner_id: string
          id?: string
          pet_id: string
          responded_at?: string | null
          status?: string
          to_email?: string | null
          to_owner_id?: string | null
        }
        Update: {
          adoption_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          from_owner_id?: string
          id?: string
          pet_id?: string
          responded_at?: string | null
          status?: string
          to_email?: string | null
          to_owner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_ownership_transfers_adoption_id_fkey"
            columns: ["adoption_id"]
            isOneToOne: false
            referencedRelation: "adoption_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_ownership_transfers_adoption_id_fkey"
            columns: ["adoption_id"]
            isOneToOne: false
            referencedRelation: "adoption_pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_ownership_transfers_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pet_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_ownership_transfers_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_share_links: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          last_viewed_at: string | null
          owner_id: string
          pet_id: string
          revoked_at: string | null
          sections: string[]
          token: string
          view_count: number
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          last_viewed_at?: string | null
          owner_id?: string
          pet_id: string
          revoked_at?: string | null
          sections: string[]
          token?: string
          view_count?: number
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          last_viewed_at?: string | null
          owner_id?: string
          pet_id?: string
          revoked_at?: string | null
          sections?: string[]
          token?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "pet_share_links_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pet_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_share_links_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_sightings: {
        Row: {
          contact: string | null
          created_at: string
          description: string
          id: string
          latitude: number
          longitude: number
          lost_pet_id: string | null
          photo_url: string | null
          reporter_id: string | null
          seen_at: string | null
        }
        Insert: {
          contact?: string | null
          created_at?: string
          description: string
          id?: string
          latitude: number
          longitude: number
          lost_pet_id?: string | null
          photo_url?: string | null
          reporter_id?: string | null
          seen_at?: string | null
        }
        Update: {
          contact?: string | null
          created_at?: string
          description?: string
          id?: string
          latitude?: number
          longitude?: number
          lost_pet_id?: string | null
          photo_url?: string | null
          reporter_id?: string | null
          seen_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_sightings_lost_pet_id_fkey"
            columns: ["lost_pet_id"]
            isOneToOne: false
            referencedRelation: "lost_pet_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_sightings_lost_pet_id_fkey"
            columns: ["lost_pet_id"]
            isOneToOne: false
            referencedRelation: "lost_pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_tag_reports: {
        Row: {
          contact: string | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          message: string | null
          pet_id: string
        }
        Insert: {
          contact?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          message?: string | null
          pet_id: string
        }
        Update: {
          contact?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          message?: string | null
          pet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_tag_reports_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pet_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_tag_reports_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_weight_logs: {
        Row: {
          created_at: string
          id: string
          measured_on: string
          medical_record_id: string | null
          pet_id: string
          source: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          id?: string
          measured_on: string
          medical_record_id?: string | null
          pet_id: string
          source?: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          id?: string
          measured_on?: string
          medical_record_id?: string | null
          pet_id?: string
          source?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "pet_weight_logs_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_weight_logs_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pet_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_weight_logs_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          age: string | null
          avatar_background: string | null
          avatar_body_color: string
          avatar_url: string | null
          birth_date: string | null
          birth_date_estimated: boolean
          breed: string | null
          character: string | null
          color: string | null
          cover_url: string | null
          created_at: string | null
          equipped_apparel: Json
          features: string[]
          gallery_urls: string[]
          gender: string | null
          health_notes: string | null
          id: string
          is_lost: boolean | null
          is_neutered: boolean | null
          level: number | null
          meals_per_day: number | null
          microchip_no: string | null
          name: string
          owner_id: string | null
          passport_no: string | null
          petvet_no: string | null
          show_phone: boolean | null
          size: string | null
          sos_settings: Json | null
          type: string | null
          weight: number | null
          xp: number | null
        }
        Insert: {
          age?: string | null
          avatar_background?: string | null
          avatar_body_color?: string
          avatar_url?: string | null
          birth_date?: string | null
          birth_date_estimated?: boolean
          breed?: string | null
          character?: string | null
          color?: string | null
          cover_url?: string | null
          created_at?: string | null
          equipped_apparel?: Json
          features?: string[]
          gallery_urls?: string[]
          gender?: string | null
          health_notes?: string | null
          id?: string
          is_lost?: boolean | null
          is_neutered?: boolean | null
          level?: number | null
          meals_per_day?: number | null
          microchip_no?: string | null
          name: string
          owner_id?: string | null
          passport_no?: string | null
          petvet_no?: string | null
          show_phone?: boolean | null
          size?: string | null
          sos_settings?: Json | null
          type?: string | null
          weight?: number | null
          xp?: number | null
        }
        Update: {
          age?: string | null
          avatar_background?: string | null
          avatar_body_color?: string
          avatar_url?: string | null
          birth_date?: string | null
          birth_date_estimated?: boolean
          breed?: string | null
          character?: string | null
          color?: string | null
          cover_url?: string | null
          created_at?: string | null
          equipped_apparel?: Json
          features?: string[]
          gallery_urls?: string[]
          gender?: string | null
          health_notes?: string | null
          id?: string
          is_lost?: boolean | null
          is_neutered?: boolean | null
          level?: number | null
          meals_per_day?: number | null
          microchip_no?: string | null
          name?: string
          owner_id?: string | null
          passport_no?: string | null
          petvet_no?: string | null
          show_phone?: boolean | null
          size?: string | null
          sos_settings?: Json | null
          type?: string | null
          weight?: number | null
          xp?: number | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      point_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string | null
          reference_id: string | null
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason?: string | null
          reference_id?: string | null
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string | null
          reference_id?: string | null
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_data_export"
            referencedColumns: ["user_id"]
          },
        ]
      }
      post_paws: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_paws_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_saves: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_saves_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          allow_comments: boolean | null
          area_lat: number | null
          area_lng: number | null
          comment_privacy: string | null
          comments_count: number | null
          content: string | null
          created_at: string | null
          edited_at: string | null
          has_young_pet: boolean
          id: string
          is_video: boolean | null
          likes_count: number | null
          location_text: string | null
          media_filter: string | null
          media_url: string | null
          media_urls: string[]
          paws_count: number
          pet_names: string
          pet_species: string[]
          post_type: string | null
          show_on_profile: boolean
          status: string | null
          tagged_pet_ids: string[]
          topic: string | null
          trim_end: number | null
          trim_start: number | null
          user_id: string
        }
        Insert: {
          allow_comments?: boolean | null
          area_lat?: number | null
          area_lng?: number | null
          comment_privacy?: string | null
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          edited_at?: string | null
          has_young_pet?: boolean
          id?: string
          is_video?: boolean | null
          likes_count?: number | null
          location_text?: string | null
          media_filter?: string | null
          media_url?: string | null
          media_urls?: string[]
          paws_count?: number
          pet_names?: string
          pet_species?: string[]
          post_type?: string | null
          show_on_profile?: boolean
          status?: string | null
          tagged_pet_ids?: string[]
          topic?: string | null
          trim_end?: number | null
          trim_start?: number | null
          user_id: string
        }
        Update: {
          allow_comments?: boolean | null
          area_lat?: number | null
          area_lng?: number | null
          comment_privacy?: string | null
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          edited_at?: string | null
          has_young_pet?: boolean
          id?: string
          is_video?: boolean | null
          likes_count?: number | null
          location_text?: string | null
          media_filter?: string | null
          media_url?: string | null
          media_urls?: string[]
          paws_count?: number
          pet_names?: string
          pet_species?: string[]
          post_type?: string | null
          show_on_profile?: boolean
          status?: string | null
          tagged_pet_ids?: string[]
          topic?: string | null
          trim_end?: number | null
          trim_start?: number | null
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_prime_only: boolean | null
          is_vet_approved: boolean | null
          name: string
          old_price: number | null
          owner_id: string | null
          price: number
          stock: number | null
          tag: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_prime_only?: boolean | null
          is_vet_approved?: boolean | null
          name: string
          old_price?: number | null
          owner_id?: string | null
          price: number
          stock?: number | null
          tag?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_prime_only?: boolean | null
          is_vet_approved?: boolean | null
          name?: string
          old_price?: number | null
          owner_id?: string | null
          price?: number
          stock?: number | null
          tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string | null
          active_business_id: string | null
          active_pet_id: string | null
          address: string | null
          adoption_alerts_enabled: boolean
          alert_lat: number | null
          alert_lng: number | null
          alert_updated_at: string | null
          aura_settings: Json | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          business_approved: boolean | null
          business_lat: number | null
          business_lng: number | null
          business_name: string | null
          business_type: string | null
          cancellation_notice_hours: number
          coin_balance: number | null
          comment_filter_words: string[] | null
          cover_url: string | null
          created_at: string | null
          data_deletion_requested_at: string | null
          default_allow_comments: boolean | null
          default_comment_privacy: string | null
          deletion_requested_at: string | null
          deletion_scheduled_for: string | null
          district: string | null
          full_name: string | null
          gallery_urls: string[]
          gender: string | null
          iban: string | null
          id: string
          kvkk_consent_given_at: string | null
          kvkk_consent_version: string | null
          kyb_rejection_reason: string | null
          kyb_status: string | null
          last_seen_at: string | null
          location: unknown
          lost_alerts_enabled: boolean
          marketing_consent: boolean
          marketing_consent_at: string | null
          onboarding_completed: boolean
          onboarding_completed_at: string | null
          owner_name: string | null
          pati_puan_balance: number
          pet_name: string | null
          phone: string | null
          prime_until: string | null
          province: string | null
          reminder_prefs: Json
          role: string | null
          settings: Json | null
          sos_status: string | null
          streak_shield_available: boolean
          streak_shield_week_start: string | null
          tax_id: string | null
          terms_accepted_at: string | null
          terms_version: string | null
          updated_at: string
          username: string | null
          wallet_balance: number | null
          website: string | null
          working_hours: Json | null
        }
        Insert: {
          account_status?: string | null
          active_business_id?: string | null
          active_pet_id?: string | null
          address?: string | null
          adoption_alerts_enabled?: boolean
          alert_lat?: number | null
          alert_lng?: number | null
          alert_updated_at?: string | null
          aura_settings?: Json | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          business_approved?: boolean | null
          business_lat?: number | null
          business_lng?: number | null
          business_name?: string | null
          business_type?: string | null
          cancellation_notice_hours?: number
          coin_balance?: number | null
          comment_filter_words?: string[] | null
          cover_url?: string | null
          created_at?: string | null
          data_deletion_requested_at?: string | null
          default_allow_comments?: boolean | null
          default_comment_privacy?: string | null
          deletion_requested_at?: string | null
          deletion_scheduled_for?: string | null
          district?: string | null
          full_name?: string | null
          gallery_urls?: string[]
          gender?: string | null
          iban?: string | null
          id: string
          kvkk_consent_given_at?: string | null
          kvkk_consent_version?: string | null
          kyb_rejection_reason?: string | null
          kyb_status?: string | null
          last_seen_at?: string | null
          location?: unknown
          lost_alerts_enabled?: boolean
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          owner_name?: string | null
          pati_puan_balance?: number
          pet_name?: string | null
          phone?: string | null
          prime_until?: string | null
          province?: string | null
          reminder_prefs?: Json
          role?: string | null
          settings?: Json | null
          sos_status?: string | null
          streak_shield_available?: boolean
          streak_shield_week_start?: string | null
          tax_id?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string
          username?: string | null
          wallet_balance?: number | null
          website?: string | null
          working_hours?: Json | null
        }
        Update: {
          account_status?: string | null
          active_business_id?: string | null
          active_pet_id?: string | null
          address?: string | null
          adoption_alerts_enabled?: boolean
          alert_lat?: number | null
          alert_lng?: number | null
          alert_updated_at?: string | null
          aura_settings?: Json | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          business_approved?: boolean | null
          business_lat?: number | null
          business_lng?: number | null
          business_name?: string | null
          business_type?: string | null
          cancellation_notice_hours?: number
          coin_balance?: number | null
          comment_filter_words?: string[] | null
          cover_url?: string | null
          created_at?: string | null
          data_deletion_requested_at?: string | null
          default_allow_comments?: boolean | null
          default_comment_privacy?: string | null
          deletion_requested_at?: string | null
          deletion_scheduled_for?: string | null
          district?: string | null
          full_name?: string | null
          gallery_urls?: string[]
          gender?: string | null
          iban?: string | null
          id?: string
          kvkk_consent_given_at?: string | null
          kvkk_consent_version?: string | null
          kyb_rejection_reason?: string | null
          kyb_status?: string | null
          last_seen_at?: string | null
          location?: unknown
          lost_alerts_enabled?: boolean
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          owner_name?: string | null
          pati_puan_balance?: number
          pet_name?: string | null
          phone?: string | null
          prime_until?: string | null
          province?: string | null
          reminder_prefs?: Json
          role?: string | null
          settings?: Json | null
          sos_status?: string | null
          streak_shield_available?: boolean
          streak_shield_week_start?: string | null
          tax_id?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string
          username?: string | null
          wallet_balance?: number | null
          website?: string | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_business_id_fkey"
            columns: ["active_business_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_active_business_id_fkey"
            columns: ["active_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_active_pet_id_fkey"
            columns: ["active_pet_id"]
            isOneToOne: false
            referencedRelation: "pet_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_active_pet_id_fkey"
            columns: ["active_pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quests: {
        Row: {
          clinic_id: string | null
          completions: number | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          participants: number | null
          quest_type: string
          reward: string
          start_date: string | null
          status: string | null
          target_count: number | null
          title: string
        }
        Insert: {
          clinic_id?: string | null
          completions?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          participants?: number | null
          quest_type: string
          reward: string
          start_date?: string | null
          status?: string | null
          target_count?: number | null
          title: string
        }
        Update: {
          clinic_id?: string | null
          completions?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          participants?: number | null
          quest_type?: string
          reward?: string
          start_date?: string | null
          status?: string | null
          target_count?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quests_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quests_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          reason: string
          reported_entity_id: string | null
          reported_entity_type: string | null
          reporter_id: string
          status: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          reason: string
          reported_entity_id?: string | null
          reported_entity_type?: string | null
          reporter_id: string
          status?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          reason?: string
          reported_entity_id?: string | null
          reported_entity_type?: string | null
          reporter_id?: string
          status?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      reward_products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          price_pp: number
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          price_pp: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          price_pp?: number
        }
        Relationships: []
      }
      reward_rules: {
        Row: {
          counts_toward_daily_cap: boolean
          is_active: boolean
          key: string
          label: string
          period: string
          pp: number
        }
        Insert: {
          counts_toward_daily_cap?: boolean
          is_active?: boolean
          key: string
          label: string
          period: string
          pp: number
        }
        Update: {
          counts_toward_daily_cap?: boolean
          is_active?: boolean
          key?: string
          label?: string
          period?: string
          pp?: number
        }
        Relationships: []
      }
      sms_log: {
        Row: {
          clinic_id: string
          created_at: string | null
          delivered_at: string | null
          delivery_status: string | null
          id: string
          message: string
          mode: string
          phone: string
          provider_message_id: string | null
          provider_response: string | null
          status: string
          unclaimed_patient_id: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string | null
          delivered_at?: string | null
          delivery_status?: string | null
          id?: string
          message: string
          mode: string
          phone: string
          provider_message_id?: string | null
          provider_response?: string | null
          status: string
          unclaimed_patient_id?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string | null
          delivered_at?: string | null
          delivery_status?: string | null
          id?: string
          message?: string
          mode?: string
          phone?: string
          provider_message_id?: string | null
          provider_response?: string | null
          status?: string
          unclaimed_patient_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_log_unclaimed_patient_id_fkey"
            columns: ["unclaimed_patient_id"]
            isOneToOne: false
            referencedRelation: "unclaimed_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      social_challenges: {
        Row: {
          created_at: string
          creator_id: string
          duration_days: number
          ends_at: string | null
          id: string
          mode: string
          partner_id: string
          reward_pp: number
          starts_at: string | null
          status: string
          target_km: number | null
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          creator_id: string
          duration_days: number
          ends_at?: string | null
          id?: string
          mode: string
          partner_id: string
          reward_pp?: number
          starts_at?: string | null
          status?: string
          target_km?: number | null
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          creator_id?: string
          duration_days?: number
          ends_at?: string | null
          id?: string
          mode?: string
          partner_id?: string
          reward_pp?: number
          starts_at?: string | null
          status?: string
          target_km?: number | null
          winner_id?: string | null
        }
        Relationships: []
      }
      social_mentions: {
        Row: {
          created_at: string
          source_id: string
          source_kind: string
          user_id: string
        }
        Insert: {
          created_at?: string
          source_id: string
          source_kind: string
          user_id: string
        }
        Update: {
          created_at?: string
          source_id?: string
          source_kind?: string
          user_id?: string
        }
        Relationships: []
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      store_events: {
        Row: {
          created_at: string
          environment: string | null
          event_id: string
          event_type: string
          payload: Json
          product_id: string | null
          result: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          environment?: string | null
          event_id: string
          event_type: string
          payload: Json
          product_id?: string | null
          result: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          environment?: string | null
          event_id?: string
          event_type?: string
          payload?: Json
          product_id?: string | null
          result?: string
          user_id?: string | null
        }
        Relationships: []
      }
      store_products: {
        Row: {
          active: boolean
          created_at: string
          kind: string
          pawcoin_amount: number | null
          product_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          kind: string
          pawcoin_amount?: number | null
          product_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          kind?: string
          pawcoin_amount?: number | null
          product_id?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          caption: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          image_url: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          image_url: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
      story_views: {
        Row: {
          is_liked: boolean | null
          story_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          is_liked?: boolean | null
          story_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          is_liked?: boolean | null
          story_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profile_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "user_data_export"
            referencedColumns: ["user_id"]
          },
        ]
      }
      streak_shield_uses: {
        Row: {
          covered_date: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          covered_date: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          covered_date?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "streak_shield_uses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "streak_shield_uses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "streak_shield_uses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_data_export"
            referencedColumns: ["user_id"]
          },
        ]
      }
      subscription_intents: {
        Row: {
          amount: number
          created_at: string
          merchant_oid: string
          plan_id: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          merchant_oid: string
          plan_id: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          merchant_oid?: string
          plan_id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      theme_participations: {
        Row: {
          created_at: string
          post_id: string | null
          theme_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id?: string | null
          theme_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string | null
          theme_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "theme_participations_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "theme_participations_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "weekly_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          clinic_id: string | null
          date: string | null
          description: string | null
          id: string
          reference_id: string | null
          status: string
          type: string
        }
        Insert: {
          amount: number
          clinic_id?: string | null
          date?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          status: string
          type: string
        }
        Update: {
          amount?: number
          clinic_id?: string | null
          date?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      unclaimed_patients: {
        Row: {
          claim_code: string | null
          claim_requested_by: string | null
          claimed_at: string | null
          claimed_by_user_id: string | null
          claimed_pet_id: string | null
          clinic_id: string
          consent_sms_sent_at: string | null
          created_at: string | null
          id: string
          legacy_notes: string | null
          normalized_phone: string | null
          pet_breed: string | null
          pet_name: string | null
          pet_species: string | null
          raw_name: string
          raw_phone: string
          status: string
        }
        Insert: {
          claim_code?: string | null
          claim_requested_by?: string | null
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          claimed_pet_id?: string | null
          clinic_id: string
          consent_sms_sent_at?: string | null
          created_at?: string | null
          id?: string
          legacy_notes?: string | null
          normalized_phone?: string | null
          pet_breed?: string | null
          pet_name?: string | null
          pet_species?: string | null
          raw_name: string
          raw_phone: string
          status?: string
        }
        Update: {
          claim_code?: string | null
          claim_requested_by?: string | null
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          claimed_pet_id?: string | null
          clinic_id?: string
          consent_sms_sent_at?: string | null
          created_at?: string | null
          id?: string
          legacy_notes?: string | null
          normalized_phone?: string | null
          pet_breed?: string | null
          pet_name?: string | null
          pet_species?: string | null
          raw_name?: string
          raw_phone?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "unclaimed_patients_claimed_pet_id_fkey"
            columns: ["claimed_pet_id"]
            isOneToOne: false
            referencedRelation: "pet_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unclaimed_patients_claimed_pet_id_fkey"
            columns: ["claimed_pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_active_perks: {
        Row: {
          expires_at: string
          perk_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          expires_at: string
          perk_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          expires_at?: string
          perk_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_connections: {
        Row: {
          access_token: string | null
          created_at: string | null
          handle_name: string | null
          id: string
          is_connected: boolean | null
          provider: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          handle_name?: string | null
          id?: string
          is_connected?: boolean | null
          provider: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          handle_name?: string | null
          id?: string
          is_connected?: boolean | null
          provider?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_cosmetic_items: {
        Row: {
          item_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          item_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          item_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_cosmetic_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "cosmetic_items"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccine_definitions: {
        Row: {
          description: string | null
          frequency_months: number
          id: string
          is_core: boolean
          min_age_weeks: number
          name: string
          sort: number
          species: string
        }
        Insert: {
          description?: string | null
          frequency_months: number
          id: string
          is_core?: boolean
          min_age_weeks?: number
          name: string
          sort?: number
          species: string
        }
        Update: {
          description?: string | null
          frequency_months?: number
          id?: string
          is_core?: boolean
          min_age_weeks?: number
          name?: string
          sort?: number
          species?: string
        }
        Relationships: []
      }
      vaccine_reminder_log: {
        Row: {
          id: string
          sent_at: string | null
          stage: string
          vaccine_id: string
        }
        Insert: {
          id?: string
          sent_at?: string | null
          stage: string
          vaccine_id: string
        }
        Update: {
          id?: string
          sent_at?: string | null
          stage?: string
          vaccine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccine_reminder_log_vaccine_id_fkey"
            columns: ["vaccine_id"]
            isOneToOne: false
            referencedRelation: "vaccines"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccines: {
        Row: {
          batch_no: string | null
          clinic_id: string | null
          created_at: string | null
          date_administered: string | null
          definition_id: string | null
          id: string
          name: string
          next_due_date: string | null
          notes: string | null
          pet_id: string | null
          reminder_sent_at: string | null
          source: string
          status: string | null
          vet_name: string | null
        }
        Insert: {
          batch_no?: string | null
          clinic_id?: string | null
          created_at?: string | null
          date_administered?: string | null
          definition_id?: string | null
          id?: string
          name: string
          next_due_date?: string | null
          notes?: string | null
          pet_id?: string | null
          reminder_sent_at?: string | null
          source?: string
          status?: string | null
          vet_name?: string | null
        }
        Update: {
          batch_no?: string | null
          clinic_id?: string | null
          created_at?: string | null
          date_administered?: string | null
          definition_id?: string | null
          id?: string
          name?: string
          next_due_date?: string | null
          notes?: string | null
          pet_id?: string | null
          reminder_sent_at?: string | null
          source?: string
          status?: string | null
          vet_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vaccines_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccines_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccines_definition_id_fkey"
            columns: ["definition_id"]
            isOneToOne: false
            referencedRelation: "vaccine_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccines_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pet_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccines_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_perks: {
        Row: {
          created_at: string
          description: string
          duration_hours: number
          icon: string
          id: string
          is_active: boolean
          name: string
          perk_key: string
          price_pp: number
          rarity: string
        }
        Insert: {
          created_at?: string
          description: string
          duration_hours: number
          icon: string
          id?: string
          is_active?: boolean
          name: string
          perk_key: string
          price_pp: number
          rarity: string
        }
        Update: {
          created_at?: string
          description?: string
          duration_hours?: number
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          perk_key?: string
          price_pp?: number
          rarity?: string
        }
        Relationships: []
      }
      walk_beacons: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          lat: number | null
          lng: number | null
          pet_name: string | null
          session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          pet_name?: string | null
          session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          pet_name?: string | null
          session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "walk_beacons_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "walk_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      walk_routes: {
        Row: {
          color: string | null
          created_at: string | null
          distance_km: number
          icon: string | null
          id: string
          is_sponsored: boolean | null
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          distance_km: number
          icon?: string | null
          id?: string
          is_sponsored?: boolean | null
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          distance_km?: number
          icon?: string | null
          id?: string
          is_sponsored?: boolean | null
          name?: string
        }
        Relationships: []
      }
      walk_sessions: {
        Row: {
          active_seconds: number | null
          calories_kcal: number | null
          distance_meters: number | null
          end_time: string | null
          id: string
          last_point_at: string | null
          path_coordinates: Json | null
          pet_id: string | null
          photo_urls: string[]
          route_preview: Json | null
          start_lat: number | null
          start_lng: number | null
          start_time: string | null
          status: string | null
          steps: number | null
          user_id: string | null
        }
        Insert: {
          active_seconds?: number | null
          calories_kcal?: number | null
          distance_meters?: number | null
          end_time?: string | null
          id?: string
          last_point_at?: string | null
          path_coordinates?: Json | null
          pet_id?: string | null
          photo_urls?: string[]
          route_preview?: Json | null
          start_lat?: number | null
          start_lng?: number | null
          start_time?: string | null
          status?: string | null
          steps?: number | null
          user_id?: string | null
        }
        Update: {
          active_seconds?: number | null
          calories_kcal?: number | null
          distance_meters?: number | null
          end_time?: string | null
          id?: string
          last_point_at?: string | null
          path_coordinates?: Json | null
          pet_id?: string | null
          photo_urls?: string[]
          route_preview?: Json | null
          start_lat?: number | null
          start_lng?: number | null
          start_time?: string | null
          status?: string | null
          steps?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      weekly_themes: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          ends_on: string
          hashtag: string
          id: string
          reward_points: number
          starts_on: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_on: string
          hashtag: string
          id?: string
          reward_points?: number
          starts_on: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_on?: string
          hashtag?: string
          id?: string
          reward_points?: number
          starts_on?: string
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      adoption_cards: {
        Row: {
          adopted_at: string | null
          age_group: string | null
          contact_mode: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          gender: string | null
          good_with_cats: boolean | null
          good_with_dogs: boolean | null
          good_with_kids: boolean | null
          good_with_others: boolean | null
          health_note: string | null
          health_unknown: boolean | null
          id: string | null
          images: string[] | null
          img_url: string | null
          is_favorite: boolean | null
          is_mine: boolean | null
          is_shelter: boolean | null
          latitude: number | null
          location_text: string | null
          longitude: number | null
          microchipped: boolean | null
          my_application_id: string | null
          my_application_status: string | null
          neutered: boolean | null
          notified_count: number | null
          open_applications: number | null
          pet_age: string | null
          pet_breed: string | null
          pet_id: string | null
          pet_name: string | null
          pet_type: string | null
          share_count: number | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          vaccinated: boolean | null
          view_count: number | null
        }
        Insert: {
          adopted_at?: string | null
          age_group?: string | null
          contact_mode?: string | null
          contact_phone?: never
          created_at?: string | null
          description?: string | null
          gender?: string | null
          good_with_cats?: boolean | null
          good_with_dogs?: boolean | null
          good_with_kids?: boolean | null
          good_with_others?: boolean | null
          health_note?: string | null
          health_unknown?: boolean | null
          id?: string | null
          images?: string[] | null
          img_url?: string | null
          is_favorite?: never
          is_mine?: never
          is_shelter?: boolean | null
          latitude?: never
          location_text?: string | null
          longitude?: never
          microchipped?: boolean | null
          my_application_id?: never
          my_application_status?: never
          neutered?: boolean | null
          notified_count?: number | null
          open_applications?: never
          pet_age?: string | null
          pet_breed?: string | null
          pet_id?: string | null
          pet_name?: string | null
          pet_type?: string | null
          share_count?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          vaccinated?: boolean | null
          view_count?: number | null
        }
        Update: {
          adopted_at?: string | null
          age_group?: string | null
          contact_mode?: string | null
          contact_phone?: never
          created_at?: string | null
          description?: string | null
          gender?: string | null
          good_with_cats?: boolean | null
          good_with_dogs?: boolean | null
          good_with_kids?: boolean | null
          good_with_others?: boolean | null
          health_note?: string | null
          health_unknown?: boolean | null
          id?: string | null
          images?: string[] | null
          img_url?: string | null
          is_favorite?: never
          is_mine?: never
          is_shelter?: boolean | null
          latitude?: never
          location_text?: string | null
          longitude?: never
          microchipped?: boolean | null
          my_application_id?: never
          my_application_status?: never
          neutered?: boolean | null
          notified_count?: number | null
          open_applications?: never
          pet_age?: string | null
          pet_breed?: string | null
          pet_id?: string | null
          pet_name?: string | null
          pet_type?: string | null
          share_count?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          vaccinated?: boolean | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "adoption_pets_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pet_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adoption_pets_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      business_cards: {
        Row: {
          address: string | null
          approved: boolean | null
          business_type: string | null
          cancellation_notice_hours: number | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          district: string | null
          gallery_urls: string[] | null
          id: string | null
          lat: number | null
          lng: number | null
          logo_url: string | null
          name: string | null
          phone: string | null
          province: string | null
          website: string | null
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          approved?: boolean | null
          business_type?: never
          cancellation_notice_hours?: number | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          district?: string | null
          gallery_urls?: string[] | null
          id?: string | null
          lat?: never
          lng?: never
          logo_url?: string | null
          name?: never
          phone?: never
          province?: string | null
          website?: string | null
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          approved?: boolean | null
          business_type?: never
          cancellation_notice_hours?: number | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          district?: string | null
          gallery_urls?: string[] | null
          id?: string | null
          lat?: never
          lng?: never
          logo_url?: string | null
          name?: never
          phone?: never
          province?: string | null
          website?: string | null
          working_hours?: Json | null
        }
        Relationships: []
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      lost_pet_cards: {
        Row: {
          age_text: string | null
          approach_note: string | null
          breed: string | null
          chip_status: string | null
          color: string | null
          contact_mode: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          features: string[] | null
          gender: string | null
          id: string | null
          images: string[] | null
          img_url: string | null
          is_mine: boolean | null
          kind: string | null
          last_seen_date: string | null
          latitude: number | null
          location_text: string | null
          longitude: number | null
          notified_count: number | null
          notify_radius_km: number | null
          pet_id: string | null
          pet_name: string | null
          pet_type: string | null
          resolution: string | null
          resolved_at: string | null
          reward_amount: number | null
          reward_enabled: boolean | null
          share_count: number | null
          situation: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          view_count: number | null
        }
        Insert: {
          age_text?: string | null
          approach_note?: string | null
          breed?: string | null
          chip_status?: string | null
          color?: string | null
          contact_mode?: string | null
          contact_phone?: never
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          gender?: string | null
          id?: string | null
          images?: string[] | null
          img_url?: string | null
          is_mine?: never
          kind?: string | null
          last_seen_date?: string | null
          latitude?: never
          location_text?: string | null
          longitude?: never
          notified_count?: number | null
          notify_radius_km?: number | null
          pet_id?: string | null
          pet_name?: string | null
          pet_type?: string | null
          resolution?: string | null
          resolved_at?: string | null
          reward_amount?: number | null
          reward_enabled?: boolean | null
          share_count?: number | null
          situation?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Update: {
          age_text?: string | null
          approach_note?: string | null
          breed?: string | null
          chip_status?: string | null
          color?: string | null
          contact_mode?: string | null
          contact_phone?: never
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          gender?: string | null
          id?: string | null
          images?: string[] | null
          img_url?: string | null
          is_mine?: never
          kind?: string | null
          last_seen_date?: string | null
          latitude?: never
          location_text?: string | null
          longitude?: never
          notified_count?: number | null
          notify_radius_km?: number | null
          pet_id?: string | null
          pet_name?: string | null
          pet_type?: string | null
          resolution?: string | null
          resolved_at?: string | null
          reward_amount?: number | null
          reward_enabled?: boolean | null
          share_count?: number | null
          situation?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lost_pets_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pet_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_pets_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_cards: {
        Row: {
          age: string | null
          avatar_background: string | null
          avatar_body_color: string | null
          avatar_url: string | null
          breed: string | null
          character: string | null
          cover_url: string | null
          created_at: string | null
          equipped_apparel: Json | null
          gender: string | null
          id: string | null
          is_lost: boolean | null
          level: number | null
          lost_message: string | null
          name: string | null
          owner_id: string | null
          reward_amount: number | null
          reward_enabled: boolean | null
          size: string | null
          type: string | null
          xp: number | null
        }
        Relationships: []
      }
      profile_cards: {
        Row: {
          account_status: string | null
          address: string | null
          aura_settings: Json | null
          avatar_url: string | null
          bio: string | null
          business_approved: boolean | null
          business_lat: number | null
          business_lng: number | null
          business_name: string | null
          business_type: string | null
          cancellation_notice_hours: number | null
          cover_url: string | null
          created_at: string | null
          default_allow_comments: boolean | null
          default_comment_privacy: string | null
          district: string | null
          full_name: string | null
          gallery_urls: string[] | null
          id: string | null
          is_prime: boolean | null
          last_seen_at: string | null
          pet_name: string | null
          phone: string | null
          province: string | null
          role: string | null
          username: string | null
          website: string | null
          working_hours: Json | null
        }
        Relationships: []
      }
      user_data_export: {
        Row: {
          account_created: string | null
          bio: string | null
          full_name: string | null
          kvkk_consent_given_at: string | null
          pet_count: number | null
          total_orders: number | null
          total_posts: number | null
          total_walks: number | null
          user_id: string | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      accept_chat_request: { Args: { p_other: string }; Returns: undefined }
      add_game_reward: {
        Args: { p_coins_earned: number; p_pet_id: string; p_xp_earned: number }
        Returns: boolean
      }
      add_walk_photo: {
        Args: { p_session_id: string; p_url: string }
        Returns: string[]
      }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      admin_cancel_account_deletion: {
        Args: { p_user: string }
        Returns: undefined
      }
      admin_daily_star_candidates: {
        Args: { p_limit?: number }
        Returns: {
          avatar_url: string
          breed: string
          name: string
          owner_username: string
          pet_id: string
          walks: number
          week_km: number
        }[]
      }
      admin_review_business: {
        Args: { p_approve: boolean; p_business: string; p_reason?: string }
        Returns: undefined
      }
      admin_schedule_account_deletion: {
        Args: { p_user: string }
        Returns: string
      }
      admin_user_emails: {
        Args: { p_ids: string[] }
        Returns: {
          email: string
          id: string
          last_sign_in_at: string
        }[]
      }
      ai_consume: {
        Args: { p_endpoint: string; p_kind: string; p_pay?: boolean }
        Returns: Json
      }
      ai_finish: {
        Args: {
          p_id: string
          p_input_tokens?: number
          p_model?: string
          p_ok: boolean
          p_output_tokens?: number
        }
        Returns: undefined
      }
      ai_limits: { Args: never; Returns: Json }
      ai_quota_status: { Args: never; Returns: Json }
      album_limits: { Args: never; Returns: Json }
      album_status: { Args: { p_pet: string }; Returns: Json }
      append_walk_points: {
        Args: { p_points: Json; p_session_id: string }
        Returns: Json
      }
      apply_store_event: {
        Args: {
          p_environment: string
          p_event_id: string
          p_expires_at: string
          p_payload: Json
          p_product: string
          p_type: string
          p_user: string
        }
        Returns: string
      }
      appointment_policy_ok: {
        Args: { p_clinic_id: string; p_start: string }
        Returns: boolean
      }
      appointment_slot: {
        Args: { p_minutes: number; p_start: string }
        Returns: unknown
      }
      approve_manual_claim: {
        Args: { p_unclaimed_id: string }
        Returns: string
      }
      award_pati_puan: {
        Args: {
          p_amount: number
          p_reason: string
          p_reference_id?: string
          p_source: string
        }
        Returns: number
      }
      award_pati_puan_internal: {
        Args: {
          p_amount: number
          p_reason: string
          p_reference_id?: string
          p_source: string
          p_user_id: string
        }
        Returns: number
      }
      block_user: { Args: { p_target: string }; Returns: undefined }
      business_display_name: { Args: { p_id: string }; Returns: string }
      business_member_role: { Args: { p_business: string }; Returns: string }
      can_handle_appointment: {
        Args: { p_business: string; p_doctor: string }
        Returns: boolean
      }
      can_manage_business: { Args: { p_business: string }; Returns: boolean }
      can_manage_business_t: { Args: { p_business: string }; Returns: boolean }
      cancel_account_deletion: { Args: never; Returns: undefined }
      cancel_staff_invitation: {
        Args: { p_invitation_id: string }
        Returns: undefined
      }
      chat_conversation_for: {
        Args: { p_clinic: boolean; p_other: string }
        Returns: string
      }
      chat_is_request: {
        Args: { p_conv: string; p_me: string }
        Returns: boolean
      }
      check_unclaimed_matches: {
        Args: { p_phone: string }
        Returns: {
          clinic_id: string
          id: string
          pet_name: string
          sms_verified_available: boolean
        }[]
      }
      claim_email_outbox: {
        Args: { p_limit?: number }
        Returns: {
          attempts: number
          body: string
          claimed_at: string | null
          created_at: string
          cta_url: string | null
          dedupe_key: string | null
          heading: string
          id: string
          last_error: string | null
          recipient_email: string | null
          sent_at: string | null
          status: string
          subject: string
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "email_outbox"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claim_reward: { Args: { p_key: string }; Returns: Json }
      clinic_day_hours: {
        Args: { p_clinic_id: string; p_date: string }
        Returns: Record<string, unknown>
      }
      close_open_adoption_applications: {
        Args: { p_adoption_id: string; p_except: string; p_note: string }
        Returns: undefined
      }
      complete_adoption: {
        Args: {
          p_application_id: string
          p_id: string
          p_transfer_passport: boolean
        }
        Returns: string
      }
      complete_onboarding: { Args: never; Returns: undefined }
      confirm_pet_media: { Args: { p_id: string }; Returns: Json }
      content_admin_list: {
        Args: { p_status?: string }
        Returns: {
          body: string
          business_id: string
          business_name: string
          channel: string
          coupon_code: string
          created_at: string
          cta_label: string
          cta_url: string
          discount: string
          ends_at: string
          id: string
          media_url: string
          priority: number
          radius_km: number
          reject_reason: string
          starts_at: string
          status: string
          taps: number
          target_species: string
          title: string
          views: number
        }[]
      }
      content_admin_save: {
        Args: {
          p_body: string
          p_channel: string
          p_cta_label: string
          p_cta_url: string
          p_ends_at: string
          p_id: string
          p_media_url: string
          p_priority: number
          p_species: string
          p_starts_at: string
          p_title: string
        }
        Returns: string
      }
      content_archive: { Args: { p_id: string }; Returns: undefined }
      content_feed: {
        Args: { p_lat?: number; p_lng?: number; p_species?: string[] }
        Returns: {
          body: string
          business_id: string
          business_logo: string
          business_name: string
          channel: string
          coupon_code: string
          cta_label: string
          cta_url: string
          discount: string
          distance_km: number
          ends_at: string
          id: string
          media_url: string
          seen: boolean
          starts_at: string
          title: string
        }[]
      }
      content_my_items: {
        Args: { p_business: string }
        Returns: {
          body: string
          campaign_id: string
          channel: string
          created_at: string
          ends_at: string
          id: string
          media_url: string
          reject_reason: string
          starts_at: string
          status: string
          taps: number
          title: string
          views: number
        }[]
      }
      content_promote_campaign: {
        Args: { p_campaign: string; p_days?: number }
        Returns: string
      }
      content_review: {
        Args: { p_approve: boolean; p_id: string; p_reason?: string }
        Returns: undefined
      }
      content_submit_vet: {
        Args: {
          p_body: string
          p_business: string
          p_days?: number
          p_media_url: string
          p_species?: string
          p_title: string
        }
        Returns: string
      }
      content_track: {
        Args: { p_id: string; p_kind: string }
        Returns: undefined
      }
      content_withdraw: { Args: { p_id: string }; Returns: undefined }
      count_lost_alert_users: {
        Args: { p_lat: number; p_lng: number; p_radius_km: number }
        Returns: number
      }
      create_business_appointment: {
        Args: {
          p_doctor_id?: string
          p_guest_name?: string
          p_guest_pet_name?: string
          p_guest_pet_species?: string
          p_guest_phone?: string
          p_ignore_hours?: boolean
          p_minutes: number
          p_notes?: string
          p_pet_id?: string
          p_service_name: string
          p_start: string
          p_user_id?: string
        }
        Returns: string
      }
      create_social_challenge: {
        Args: {
          p_duration_days: number
          p_mode: string
          p_partner_id: string
          p_target_km?: number
        }
        Returns: string
      }
      current_business_id: { Args: never; Returns: string }
      current_weekly_theme_id: { Args: never; Returns: string }
      disablelongtransactions: { Args: never; Returns: string }
      discard_walk: { Args: { p_session_id: string }; Returns: undefined }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      due_account_deletions: { Args: { p_limit?: number }; Returns: string[] }
      enablelongtransactions: { Args: never; Returns: string }
      enqueue_appointment_reminders: { Args: never; Returns: number }
      enqueue_email: {
        Args: {
          p_body: string
          p_cta_url?: string
          p_dedupe_key?: string
          p_heading: string
          p_subject: string
          p_user_id: string
        }
        Returns: undefined
      }
      enqueue_email_address: {
        Args: {
          p_body: string
          p_cta_url?: string
          p_email: string
          p_heading: string
          p_subject: string
        }
        Returns: undefined
      }
      enqueue_health_due_reminders: { Args: never; Returns: number }
      enqueue_medication_dose_reminders: { Args: never; Returns: number }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      expand_lost_listing_radius: {
        Args: { p_listing_id: string; p_radius_km: number }
        Returns: number
      }
      expire_old_unclaimed_patients: { Args: never; Returns: number }
      finalize_paid_order: {
        Args: { p_amount_kurus: number; p_order_id: string }
        Returns: string
      }
      finalize_social_challenge: {
        Args: { p_challenge_id: string }
        Returns: undefined
      }
      find_slot_doctor: {
        Args: {
          p_clinic_id: string
          p_doctor_id?: string
          p_exclude_id?: string
          p_ignore_hours?: boolean
          p_minutes: number
          p_start: string
        }
        Returns: Record<string, unknown>
      }
      finish_email_outbox: {
        Args: { p_error?: string; p_id: string; p_sent: boolean }
        Returns: undefined
      }
      finish_walk: {
        Args: {
          p_active_seconds?: number
          p_end_at_last_point?: boolean
          p_points?: Json
          p_session_id: string
          p_steps?: number
        }
        Returns: {
          active_seconds: number | null
          calories_kcal: number | null
          distance_meters: number | null
          end_time: string | null
          id: string
          last_point_at: string | null
          path_coordinates: Json | null
          pet_id: string | null
          photo_urls: string[]
          route_preview: Json | null
          start_lat: number | null
          start_lng: number | null
          start_time: string | null
          status: string | null
          steps: number | null
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "walk_sessions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      game_continue: { Args: never; Returns: number }
      game_status: { Args: { p_pet_id?: string }; Returns: Json }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_active_users_at_location: {
        Args: { loc_lat: number; loc_lng: number; radius_km: number }
        Returns: number
      }
      get_adoption_owner_stats: {
        Args: { p_id: string }
        Returns: {
          applications: number
          favorites: number
          interviews: number
          notified: number
          shares: number
          views: number
        }[]
      }
      get_auth_email: { Args: { p_uid: string }; Returns: string }
      get_available_slots: {
        Args: {
          p_clinic_id: string
          p_date: string
          p_doctor_id?: string
          p_minutes?: number
        }
        Returns: {
          available: boolean
          slot_time: string
        }[]
      }
      get_business_team: {
        Args: { p_business_id: string }
        Returns: {
          avatar_url: string
          created_at: string
          doctor_id: string
          doctor_name: string
          email: string
          full_name: string
          role: string
          user_id: string
        }[]
      }
      get_chat_request_ids: { Args: never; Returns: string[] }
      get_clinic_calendar: {
        Args: { p_clinic_id: string; p_days?: number; p_from: string }
        Returns: {
          day: string
          is_open: boolean
        }[]
      }
      get_clinic_clients: {
        Args: never
        Returns: {
          avatar_url: string
          breed: string
          client_key: string
          kind: string
          last_visit: string
          next_visit: string
          no_show_count: number
          note: string
          owner_id: string
          owner_name: string
          pet_id: string
          pet_name: string
          phone: string
          species: string
          visit_count: number
        }[]
      }
      get_clinics_open_status: {
        Args: { p_clinic_ids: string[] }
        Returns: {
          clinic_id: string
          closes_at: string
          is_open: boolean
          opens_at: string
        }[]
      }
      get_coin_leaderboard: {
        Args: { p_limit?: number; p_role: string }
        Returns: {
          avatar_url: string
          coin_balance: number
          full_name: string
          id: string
          pet_name: string
        }[]
      }
      get_current_theme: {
        Args: never
        Returns: {
          description: string
          ends_on: string
          hashtag: string
          id: string
          joined: boolean
          participant_count: number
          reward_points: number
          starts_on: string
          title: string
        }[]
      }
      get_distance_leaderboard: {
        Args: { p_limit?: number; p_period: string; p_user_ids?: string[] }
        Returns: {
          total_meters: number
          user_id: string
          walk_count: number
        }[]
      }
      get_invitation_by_token: { Args: { p_token: string }; Returns: Json }
      get_listing_matches: {
        Args: { p_listing_id: string }
        Returns: {
          age_text: string | null
          approach_note: string | null
          breed: string | null
          chip_status: string | null
          color: string | null
          contact_mode: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          features: string[] | null
          gender: string | null
          id: string | null
          images: string[] | null
          img_url: string | null
          is_mine: boolean | null
          kind: string | null
          last_seen_date: string | null
          latitude: number | null
          location_text: string | null
          longitude: number | null
          notified_count: number | null
          notify_radius_km: number | null
          pet_id: string | null
          pet_name: string | null
          pet_type: string | null
          resolution: string | null
          resolved_at: string | null
          reward_amount: number | null
          reward_enabled: boolean | null
          share_count: number | null
          situation: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          view_count: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "lost_pet_cards"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_listing_owner_stats: {
        Args: { p_listing_id: string }
        Returns: {
          messages: number
          notified: number
          shares: number
          sightings: number
          views: number
        }[]
      }
      get_my_coin_rank: { Args: never; Returns: number }
      get_my_role: { Args: never; Returns: string }
      get_my_sms_status: {
        Args: never
        Returns: {
          is_active: boolean
          provider: string
          sender_id: string
        }[]
      }
      get_my_unclaimed_patients: {
        Args: never
        Returns: {
          claim_code: string | null
          claim_requested_by: string | null
          claimed_at: string | null
          claimed_by_user_id: string | null
          claimed_pet_id: string | null
          clinic_id: string
          consent_sms_sent_at: string | null
          created_at: string | null
          id: string
          legacy_notes: string | null
          normalized_phone: string | null
          pet_breed: string | null
          pet_name: string | null
          pet_species: string | null
          raw_name: string
          raw_phone: string
          status: string
        }[]
        SetofOptions: {
          from: "*"
          to: "unclaimed_patients"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_pet_tag_info: {
        Args: { p_pet_id: string }
        Returns: {
          age: string
          avatar_url: string
          breed: string
          finder_message: string
          gender: string
          is_lost: boolean
          owner_phone: string
          pet_name: string
          reward_amount: number
          species: string
        }[]
      }
      get_pet_verification_info: {
        Args: { p_pet_id: string }
        Returns: {
          avatar_url: string
          breed: string
          finder_message: string
          is_lost: boolean
          is_vaccination_current: boolean
          latest_vaccines: Json
          owner_phone: string
          pet_name: string
          reward_amount: number
          reward_enabled: boolean
          species: string
        }[]
      }
      get_profile_posts: {
        Args: { p_saved: boolean; p_user: string }
        Returns: {
          comments_count: number
          id: string
          is_video: boolean
          likes_count: number
          media_count: number
          media_filter: string
          media_url: string
        }[]
      }
      get_profile_summary: {
        Args: { p_user: string }
        Returns: {
          blocked_by_me: boolean
          followers: number
          following: number
          follows_me: boolean
          is_following: boolean
          posts: number
        }[]
      }
      get_public_emergency_info: {
        Args: { p_context: string; p_pet_id: string }
        Returns: {
          allergies: string[]
          alt_contact_name: string
          alt_contact_phone: string
          blood_type: string
          chronic_conditions: string[]
          contact_name: string
          contact_phone: string
          medications: string[]
          notes: string
          vet_name: string
          vet_phone: string
        }[]
      }
      get_same_city_user_ids: { Args: never; Returns: string[] }
      get_shared_passport: { Args: { p_token: string }; Returns: Json }
      get_social_challenge_progress: {
        Args: { p_challenge_id: string }
        Returns: {
          creator_km: number
          partner_km: number
        }[]
      }
      get_social_feed: {
        Args: { p_before: string; p_limit: number; p_mode: string }
        Returns: {
          author_avatar: string
          author_is_business: boolean
          author_name: string
          author_username: string
          comment_privacy: string
          comments_count: number
          content: string
          created_at: string
          edited_at: string
          follows_author: boolean
          id: string
          is_liked: boolean
          is_mine: boolean
          is_saved: boolean
          is_video: boolean
          likes_count: number
          location_text: string
          media_filter: string
          media_urls: string[]
          tagged_pets: Json
          topic: string
          user_id: string
        }[]
      }
      get_user_comment_likes: {
        Args: { p_comment_ids: string[]; p_user_id: string }
        Returns: {
          comment_id: string
        }[]
      }
      get_walk_beacon: {
        Args: { p_beacon_id: string }
        Returns: {
          expires_at: string
          lat: number
          lng: number
          pet_name: string
          updated_at: string
        }[]
      }
      gettransactionid: { Args: never; Returns: unknown }
      grant_prime_monthly_pawcoin: { Args: never; Returns: number }
      has_prime: { Args: { p_user: string }; Returns: boolean }
      haversine_distance: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      hhmm_to_min: { Args: { p: string }; Returns: number }
      iban_is_valid: { Args: { p_iban: string }; Returns: boolean }
      insert_unclaimed_patient: {
        Args: {
          p_legacy_notes: string
          p_pet_breed: string
          p_pet_name: string
          p_pet_species: string
          p_raw_name: string
          p_raw_phone: string
        }
        Returns: string
      }
      invite_staff: {
        Args: {
          p_business_id: string
          p_doctor_id?: string
          p_email: string
          p_role: string
        }
        Returns: Json
      }
      is_approved_shelter: { Args: { p_user: string }; Returns: boolean }
      is_blocked_between: { Args: { p_other: string }; Returns: boolean }
      is_business_member: { Args: { p_business: string }; Returns: boolean }
      is_business_member_t: { Args: { p_business: string }; Returns: boolean }
      is_order_item_seller: {
        Args: { p_business_id: string; p_product_id: string }
        Returns: boolean
      }
      is_order_seller: { Args: { p_order_id: string }; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      km_between: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      log_pet_care: {
        Args: { p_kind: string; p_pet: string; p_undo?: boolean }
        Returns: Json
      }
      longtransactionsenabled: { Args: never; Returns: boolean }
      mark_chat_read: {
        Args: { p_clinic?: boolean; p_other: string }
        Returns: number
      }
      mark_order_payment_failed: {
        Args: { p_order_id: string }
        Returns: undefined
      }
      moderate_adoption_listing: {
        Args: { p_action: string; p_id: string }
        Returns: undefined
      }
      my_businesses: {
        Args: never
        Returns: {
          approved: boolean
          business_type: string
          id: string
          is_active: boolean
          kyb_status: string
          logo_url: string
          name: string
          role: string
        }[]
      }
      my_unclaimed_matches: {
        Args: never
        Returns: {
          clinic_name: string
          id: string
          pet_name: string
          requested: boolean
        }[]
      }
      normalize_tr_phone: { Args: { p_phone: string }; Returns: string }
      notify_business: {
        Args: {
          p_actor: string
          p_business: string
          p_content: string
          p_doctor: string
          p_entity_id: string
          p_title: string
          p_type: string
        }
        Returns: undefined
      }
      notify_mentions: {
        Args: {
          p_author: string
          p_kind: string
          p_post: string
          p_skip: string[]
          p_source: string
          p_text: string
        }
        Returns: undefined
      }
      notify_user: {
        Args: {
          p_actor_id: string
          p_content: string
          p_entity_id: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      owns_pet: { Args: { p_pet_id: string }; Returns: boolean }
      owns_pet_folder: { Args: { p_object_name: string }; Returns: boolean }
      pet_care_today: { Args: { p_pet: string }; Returns: Json }
      pet_meals_target: { Args: { p_pet: string }; Returns: number }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      post_paw_state: {
        Args: { p_ids: string[] }
        Returns: {
          is_pawed: boolean
          paws_count: number
          post_id: string
        }[]
      }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      prepare_account_purge: { Args: { p_user: string }; Returns: boolean }
      publish_adoption_listing: { Args: { p_id: string }; Returns: number }
      publish_lost_listing: { Args: { p_listing_id: string }; Returns: number }
      purge_expired_unclaimed_patients: { Args: never; Returns: number }
      recall_chat_message: { Args: { p_id: string }; Returns: undefined }
      record_adoption_event: {
        Args: { p_event: string; p_id: string }
        Returns: undefined
      }
      record_consultation: {
        Args: {
          p_appointment_id: string
          p_critical_notes?: string
          p_diagnosis: string
          p_medications?: Json
          p_temperature_c?: number
          p_vaccines?: Json
          p_weight_kg?: number
        }
        Returns: string
      }
      record_listing_event: {
        Args: { p_event: string; p_listing_id: string }
        Returns: undefined
      }
      redeem_cosmetic_item: { Args: { p_item_id: string }; Returns: number }
      redeem_vip_perk: { Args: { p_perk_id: string }; Returns: string }
      remove_business_member: {
        Args: { p_business_id: string; p_user_id: string }
        Returns: undefined
      }
      remove_pet_media: { Args: { p_id: string }; Returns: undefined }
      remove_pet_memory: { Args: { p_id: string }; Returns: undefined }
      remove_stale_pet_media: { Args: never; Returns: string[] }
      request_account_deletion: { Args: never; Returns: string }
      request_data_deletion: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      request_manual_claim: {
        Args: { p_unclaimed_id: string }
        Returns: boolean
      }
      request_reschedule: {
        Args: { p_appointment_id: string; p_new_start: string }
        Returns: undefined
      }
      reschedule_appointment: {
        Args: {
          p_appointment_id: string
          p_doctor_id?: string
          p_ignore_hours?: boolean
          p_new_start: string
        }
        Returns: undefined
      }
      reserve_pet_media: {
        Args: {
          p_bytes: number
          p_duration?: number
          p_height?: number
          p_kind: string
          p_memory?: string
          p_mime: string
          p_pet: string
          p_taken_at?: string
          p_width?: number
        }
        Returns: Json
      }
      resolve_lost_listing: {
        Args: {
          p_listing_id: string
          p_resolution: string
          p_thank_helpers: boolean
        }
        Returns: undefined
      }
      respond_adoption_application: {
        Args: {
          p_action: string
          p_application_id: string
          p_interview_at: string
          p_note: string
        }
        Returns: undefined
      }
      respond_pet_transfer: {
        Args: { p_accept: boolean; p_transfer_id: string }
        Returns: undefined
      }
      respond_reschedule: {
        Args: { p_accept: boolean; p_appointment_id: string }
        Returns: undefined
      }
      respond_social_challenge: {
        Args: { p_accept: boolean; p_challenge_id: string }
        Returns: undefined
      }
      respond_staff_invitation: {
        Args: { p_accept: boolean; p_token: string }
        Returns: Json
      }
      save_pet_memory: {
        Args: {
          p_date: string
          p_id: string
          p_note: string
          p_pet: string
          p_title: string
        }
        Returns: string
      }
      search_social_posts: {
        Args: {
          p_filter: string
          p_lat: number
          p_limit: number
          p_lng: number
          p_offset: number
          p_query: string
        }
        Returns: {
          comments_count: number
          id: string
          is_video: boolean
          likes_count: number
          media_count: number
          media_filter: string
          media_url: string
        }[]
      }
      send_chat_message: {
        Args: {
          p_ad?: string
          p_attachment?: string
          p_clinic?: boolean
          p_content: string
          p_receiver: string
          p_reply_to?: string
        }
        Returns: {
          conversation_id: string
          created_at: string
          id: string
        }[]
      }
      set_active_business: { Args: { p_business: string }; Returns: undefined }
      set_adoption_listing_status: {
        Args: { p_id: string; p_status: string }
        Returns: undefined
      }
      set_appointment_attendance: {
        Args: { p_appointment_id: string; p_attendance: string }
        Returns: undefined
      }
      set_clinic_sms_settings: {
        Args: {
          p_api_key: string
          p_api_username: string
          p_provider: string
          p_sender_id: string
        }
        Returns: boolean
      }
      set_community_alerts: {
        Args: {
          p_adoption: boolean
          p_lat: number
          p_lng: number
          p_lost: boolean
        }
        Returns: undefined
      }
      set_conversation_pref: {
        Args: {
          p_clear?: boolean
          p_clinic?: boolean
          p_muted?: boolean
          p_other: string
        }
        Returns: undefined
      }
      set_marketing_consent: { Args: { p_value: boolean }; Returns: undefined }
      set_order_tracking: {
        Args: {
          p_carrier: string
          p_order_id: string
          p_tracking_number: string
        }
        Returns: undefined
      }
      set_pet_meals_per_day: {
        Args: { p_meals: number; p_pet: string }
        Returns: Json
      }
      set_pet_media_memory: {
        Args: { p_media: string; p_memory: string }
        Returns: undefined
      }
      social_post_rows: {
        Args: { p_ids: string[] }
        Returns: {
          author_avatar: string
          author_is_business: boolean
          author_name: string
          author_username: string
          comment_privacy: string
          comments_count: number
          content: string
          created_at: string
          edited_at: string
          follows_author: boolean
          id: string
          is_liked: boolean
          is_mine: boolean
          is_saved: boolean
          is_video: boolean
          likes_count: number
          location_text: string
          media_filter: string
          media_urls: string[]
          tagged_pets: Json
          topic: string
          user_id: string
        }[]
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      staff_doctor_id: { Args: { p_business: string }; Returns: string }
      start_walk: {
        Args: { p_pet_id?: string }
        Returns: {
          active_seconds: number | null
          calories_kcal: number | null
          distance_meters: number | null
          end_time: string | null
          id: string
          last_point_at: string | null
          path_coordinates: Json | null
          pet_id: string | null
          photo_urls: string[]
          route_preview: Json | null
          start_lat: number | null
          start_lng: number | null
          start_time: string | null
          status: string | null
          steps: number | null
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "walk_sessions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      start_walk_session: {
        Args: { p_pet_id?: string; p_started_at?: string }
        Returns: {
          active_seconds: number | null
          calories_kcal: number | null
          distance_meters: number | null
          end_time: string | null
          id: string
          last_point_at: string | null
          path_coordinates: Json | null
          pet_id: string | null
          photo_urls: string[]
          route_preview: Json | null
          start_lat: number | null
          start_lng: number | null
          start_time: string | null
          status: string | null
          steps: number | null
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "walk_sessions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_adoption_application: {
        Args: {
          p_adoption_id: string
          p_children_ages: string
          p_experience: string
          p_experience_note: string
          p_full_name: string
          p_home_features: string[]
          p_home_type: string
          p_household: string[]
          p_message: string
          p_reference: string
        }
        Returns: string
      }
      submit_business_application: {
        Args: {
          p_address: string
          p_business: string
          p_district: string
          p_iban: string
          p_lat: number
          p_lng: number
          p_name: string
          p_owner_name: string
          p_phone: string
          p_province: string
          p_tax_id: string
          p_type: string
        }
        Returns: string
      }
      submit_sighting: {
        Args: {
          p_contact: string
          p_lat: number
          p_listing_id: string
          p_lng: number
          p_note: string
          p_photo_url: string
          p_seen_at: string
        }
        Returns: undefined
      }
      submit_tag_report: {
        Args: {
          p_contact: string
          p_lat: number
          p_lng: number
          p_message: string
          p_pet_id: string
        }
        Returns: undefined
      }
      toggle_comment_like: {
        Args: { p_comment_id: string }
        Returns: {
          liked: boolean
          likes_count: number
        }[]
      }
      toggle_message_reaction: {
        Args: { p_emoji: string; p_message: string }
        Returns: string
      }
      toggle_post_like: {
        Args: { p_post_id: string }
        Returns: {
          liked: boolean
          likes_count: number
        }[]
      }
      toggle_post_paw: {
        Args: { p_post: string }
        Returns: {
          pawed: boolean
          paws_count: number
        }[]
      }
      transition_appointment: {
        Args: { p_appointment_id: string; p_reason?: string; p_status: string }
        Returns: undefined
      }
      unblock_user: { Args: { p_target: string }; Returns: undefined }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      use_streak_shield: { Args: { p_covered_date: string }; Returns: boolean }
      verify_and_claim: {
        Args: { p_code: string; p_unclaimed_id: string }
        Returns: string
      }
      walk_calories: {
        Args: { p_distance_m: number; p_weight_kg: number }
        Returns: number
      }
      walk_route_preview: { Args: { p_path: Json }; Returns: Json }
      walk_segment_m: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      wall_now: { Args: never; Returns: string }
      weekday_key: { Args: { p_date: string }; Returns: string }
      withdraw_adoption_application: {
        Args: { p_application_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
