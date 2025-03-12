export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string | null
          full_name: string
          phone: string
          role: "admin" | "participant" | "validator"
          state: string | null
          lga: string | null
          chapter: string | null
          organization: string | null
          position: string | null
          avatar_url: string | null
          payment_status: "pending" | "paid" | "failed"
          payment_reference: string | null
          payment_amount: number | null
          payment_date: string | null
          accreditation_status: "pending" | "approved" | "rejected"
          accreditation_date: string | null
          qr_code: string | null
          unique_id: string | null
          school_name: string | null
          school_address: string | null
          school_city: string | null
          school_state: string | null
          school_type: string | null
          napps_position: string | null
          napps_chapter: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email?: string | null
          full_name: string
          phone: string
          role?: "admin" | "participant" | "validator"
          state?: string | null
          lga?: string | null
          chapter?: string | null
          organization?: string | null
          position?: string | null
          avatar_url?: string | null
          payment_status?: "pending" | "paid" | "failed"
          payment_reference?: string | null
          payment_amount?: number | null
          payment_date?: string | null
          accreditation_status?: "pending" | "approved" | "rejected"
          accreditation_date?: string | null
          qr_code?: string | null
          unique_id?: string | null
          school_name?: string | null
          school_address?: string | null
          school_city?: string | null
          school_state?: string | null
          school_type?: string | null
          napps_position?: string | null
          napps_chapter?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string | null
          full_name?: string
          phone?: string
          role?: "admin" | "participant" | "validator"
          state?: string | null
          lga?: string | null
          chapter?: string | null
          organization?: string | null
          position?: string | null
          avatar_url?: string | null
          payment_status?: "pending" | "paid" | "failed"
          payment_reference?: string | null
          payment_amount?: number | null
          payment_date?: string | null
          accreditation_status?: "pending" | "approved" | "rejected"
          accreditation_date?: string | null
          qr_code?: string | null
          unique_id?: string | null
          school_name?: string | null
          school_address?: string | null
          school_city?: string | null
          school_state?: string | null
          school_type?: string | null
          napps_position?: string | null
          napps_chapter?: string | null
        }
      }
      config: {
        Row: {
          id: string
          created_at: string
          key: string
          value: Json
          description: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          key: string
          value: Json
          description?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          key?: string
          value?: Json
          description?: string | null
        }
      }
      bookings: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          hotel_id: string
          room_type: string
          check_in_date: string
          check_out_date: string
          total_nights: number
          price_per_night: number
          total_amount: number
          special_requests: string | null
          status: "pending" | "confirmed" | "cancelled"
          payment_status: "pending" | "paid" | "failed"
          payment_reference: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          hotel_id: string
          room_type: string
          check_in_date: string
          check_out_date: string
          total_nights: number
          price_per_night: number
          total_amount: number
          special_requests?: string | null
          status?: "pending" | "confirmed" | "cancelled"
          payment_reference?: string | null
          payment_status?: "pending" | "paid" | "failed"
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          hotel_id?: string
          room_type?: string
          check_in_date?: string
          check_out_date?: string
          total_nights?: number
          price_per_night?: number
          total_amount?: number
          special_requests?: string | null
          status?: "pending" | "confirmed" | "cancelled"
          payment_reference?: string | null
          payment_status?: "pending" | "paid" | "failed"
        }
      }
      hotels: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          address: string | null
          price_per_night: number
          price_category: "economy" | "standard" | "premium"
          distance_from_venue: number
          rating: number
          reviews_count: number
          image_url: string | null
          available_rooms: number
          amenities: string[] | null
          contact_phone: string | null
          contact_whatsapp: string | null
          featured: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description?: string | null
          address?: string | null
          price_per_night: number
          price_category: "economy" | "standard" | "premium"
          distance_from_venue: number
          rating?: number
          reviews_count?: number
          image_url?: string | null
          available_rooms?: number
          amenities?: string[] | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          featured?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string | null
          address?: string | null
          price_per_night?: number
          price_category?: "economy" | "standard" | "premium"
          distance_from_venue?: number
          rating?: number
          reviews_count?: number
          image_url?: string | null
          available_rooms?: number
          amenities?: string[] | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          featured?: boolean
        }
      }
      resources: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string | null
          file_url: string | null
          type: string | null
          is_public: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          description?: string | null
          file_url?: string | null
          type?: string | null
          is_public?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string | null
          file_url?: string | null
          type?: string | null
          is_public?: boolean
        }
      }
      scans: {
        Row: {
          id: string
          created_at: string
          user_id: string
          scanned_by: string
          scan_type: string
          location: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          scanned_by: string
          scan_type?: string
          location?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          scanned_by?: string
          scan_type?: string
          location?: string | null
          notes?: string | null
        }
      }
    }
  }
}
