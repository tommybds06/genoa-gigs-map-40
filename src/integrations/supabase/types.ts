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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          applicant_id: string
          created_at: string
          employer_name: string | null
          id: string
          is_reviewed: boolean
          job_id: string
          job_title: string | null
          status: string
          updated_at: string
        }
        Insert: {
          applicant_id: string
          created_at?: string
          employer_name?: string | null
          id?: string
          is_reviewed?: boolean
          job_id: string
          job_title?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          created_at?: string
          employer_name?: string | null
          id?: string
          is_reviewed?: boolean
          job_id?: string
          job_title?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "statistiche_annunci_test"
            referencedColumns: ["id"]
          },
        ]
      }
      cartellini: {
        Row: {
          application_id: string
          assunto_il: string | null
          created_at: string
          cuore: boolean | null
          data_fine: string | null
          data_inizio: string | null
          employer_id: string
          esito_il: string | null
          giorni: number[] | null
          id: string
          job_id: string
          orari: string | null
          paga_importo: number | null
          paga_unita: string | null
          ultimo_controllo: string | null
          updated_at: string
          worker_id: string
        }
        Insert: {
          application_id: string
          assunto_il?: string | null
          created_at?: string
          cuore?: boolean | null
          data_fine?: string | null
          data_inizio?: string | null
          employer_id: string
          esito_il?: string | null
          giorni?: number[] | null
          id?: string
          job_id: string
          orari?: string | null
          paga_importo?: number | null
          paga_unita?: string | null
          ultimo_controllo?: string | null
          updated_at?: string
          worker_id: string
        }
        Update: {
          application_id?: string
          assunto_il?: string | null
          created_at?: string
          cuore?: boolean | null
          data_fine?: string | null
          data_inizio?: string | null
          employer_id?: string
          esito_il?: string | null
          giorni?: number[] | null
          id?: string
          job_id?: string
          orari?: string | null
          paga_importo?: number | null
          paga_unita?: string | null
          ultimo_controllo?: string | null
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cartellini_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cartellini_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cartellini_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cartellini_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "statistiche_annunci_test"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cartellini_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string
          employer_id: string
          id: string
          job_id: string
          updated_at: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          employer_id: string
          id?: string
          job_id: string
          updated_at?: string
          worker_id: string
        }
        Update: {
          created_at?: string
          employer_id?: string
          id?: string
          job_id?: string
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "statistiche_annunci_test"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      impostazioni_server: {
        Row: {
          chiave: string
          valore: string
        }
        Insert: {
          chiave: string
          valore: string
        }
        Update: {
          chiave?: string
          valore?: string
        }
        Relationships: []
      }
      iscrizioni_push: {
        Row: {
          auth: string | null
          creata_il: string
          endpoint: string
          id: string
          p256dh: string | null
          piattaforma: string
          usata_il: string
          utente_id: string
        }
        Insert: {
          auth?: string | null
          creata_il?: string
          endpoint: string
          id?: string
          p256dh?: string | null
          piattaforma?: string
          usata_il?: string
          utente_id: string
        }
        Update: {
          auth?: string | null
          creata_il?: string
          endpoint?: string
          id?: string
          p256dh?: string | null
          piattaforma?: string
          usata_il?: string
          utente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "iscrizioni_push_utente_id_fkey"
            columns: ["utente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          area_raggio: number | null
          category: string | null
          created_at: string
          description: string | null
          giorni: number | null
          id: string
          inizio_il: string | null
          is_demo: boolean
          lat: number | null
          lng: number | null
          neighborhood: string | null
          opzione: string
          ore_giorno: number | null
          ore_settimana: number | null
          ore_totali: number | null
          owner_id: string
          paga_importo: number | null
          paga_lorda: boolean | null
          paga_tipo: string | null
          prezzo_allungamento: number | null
          prezzo_pacchetto: number | null
          prezzo_potenziamento: number | null
          price: string | null
          scade_il: string
          scadenza_vista: boolean
          schedule: string | null
          settimane: number | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          area_raggio?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          giorni?: number | null
          id?: string
          inizio_il?: string | null
          is_demo?: boolean
          lat?: number | null
          lng?: number | null
          neighborhood?: string | null
          opzione?: string
          ore_giorno?: number | null
          ore_settimana?: number | null
          ore_totali?: number | null
          owner_id: string
          paga_importo?: number | null
          paga_lorda?: boolean | null
          paga_tipo?: string | null
          prezzo_allungamento?: number | null
          prezzo_pacchetto?: number | null
          prezzo_potenziamento?: number | null
          price?: string | null
          scade_il?: string
          scadenza_vista?: boolean
          schedule?: string | null
          settimane?: number | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          area_raggio?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          giorni?: number | null
          id?: string
          inizio_il?: string | null
          is_demo?: boolean
          lat?: number | null
          lng?: number | null
          neighborhood?: string | null
          opzione?: string
          ore_giorno?: number | null
          ore_settimana?: number | null
          ore_totali?: number | null
          owner_id?: string
          paga_importo?: number | null
          paga_lorda?: boolean | null
          paga_tipo?: string | null
          prezzo_allungamento?: number | null
          prezzo_pacchetto?: number | null
          prezzo_potenziamento?: number | null
          price?: string | null
          scade_il?: string
          scadenza_vista?: boolean
          schedule?: string | null
          settimane?: number | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_url: string | null
          chat_id: string
          content: string
          created_at: string
          id: string
          is_read: boolean
          is_system: boolean
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          attachment_url?: string | null
          chat_id: string
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          is_system?: boolean
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          attachment_url?: string | null
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          is_system?: boolean
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifiche: {
        Row: {
          aggiornata_il: string
          azione: string | null
          canali: string[]
          categoria: string
          chiave: string | null
          conteggio: number
          creata_il: string
          email_dopo: string | null
          email_inviata_il: string | null
          giorno: string
          id: string
          letta_il: string | null
          mostra_dal: string
          push_inviata_il: string | null
          riferimento: string | null
          testo: string
          tipo: string
          titolo: string
          utente_id: string
        }
        Insert: {
          aggiornata_il?: string
          azione?: string | null
          canali?: string[]
          categoria: string
          chiave?: string | null
          conteggio?: number
          creata_il?: string
          email_dopo?: string | null
          email_inviata_il?: string | null
          giorno: string
          id?: string
          letta_il?: string | null
          mostra_dal?: string
          push_inviata_il?: string | null
          riferimento?: string | null
          testo: string
          tipo: string
          titolo: string
          utente_id: string
        }
        Update: {
          aggiornata_il?: string
          azione?: string | null
          canali?: string[]
          categoria?: string
          chiave?: string | null
          conteggio?: number
          creata_il?: string
          email_dopo?: string | null
          email_inviata_il?: string | null
          giorno?: string
          id?: string
          letta_il?: string | null
          mostra_dal?: string
          push_inviata_il?: string | null
          riferimento?: string | null
          testo?: string
          tipo?: string
          titolo?: string
          utente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifiche_utente_id_fkey"
            columns: ["utente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      preferenze_notifiche: {
        Row: {
          aggiornate_il: string
          candidature: boolean
          messaggi: boolean
          promemoria: boolean
          scadenze: boolean
          utente_id: string
          vicini: boolean
        }
        Insert: {
          aggiornate_il?: string
          candidature?: boolean
          messaggi?: boolean
          promemoria?: boolean
          scadenze?: boolean
          utente_id: string
          vicini?: boolean
        }
        Update: {
          aggiornate_il?: string
          candidature?: boolean
          messaggi?: boolean
          promemoria?: boolean
          scadenze?: boolean
          utente_id?: string
          vicini?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "preferenze_notifiche_utente_id_fkey"
            columns: ["utente_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_text: string | null
          area_raggio: number | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          experience: string | null
          full_name: string | null
          id: string
          identita_verificata: boolean
          identita_verificata_il: string | null
          is_demo: boolean
          is_onboarded: boolean | null
          lat: number | null
          level: number
          lng: number | null
          looking_for: string | null
          neighborhood: string | null
          photos: string[] | null
          piva_verificata: boolean
          piva_verificata_il: string | null
          role: Database["public"]["Enums"]["user_role"]
          social_links: Json | null
          tags: string[] | null
          tipo_employer: string | null
          updated_at: string
          username: string | null
          xp_points: number
        }
        Insert: {
          address_text?: string | null
          area_raggio?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          experience?: string | null
          full_name?: string | null
          id: string
          identita_verificata?: boolean
          identita_verificata_il?: string | null
          is_demo?: boolean
          is_onboarded?: boolean | null
          lat?: number | null
          level?: number
          lng?: number | null
          looking_for?: string | null
          neighborhood?: string | null
          photos?: string[] | null
          piva_verificata?: boolean
          piva_verificata_il?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          social_links?: Json | null
          tags?: string[] | null
          tipo_employer?: string | null
          updated_at?: string
          username?: string | null
          xp_points?: number
        }
        Update: {
          address_text?: string | null
          area_raggio?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          experience?: string | null
          full_name?: string | null
          id?: string
          identita_verificata?: boolean
          identita_verificata_il?: string | null
          is_demo?: boolean
          is_onboarded?: boolean | null
          lat?: number | null
          level?: number
          lng?: number | null
          looking_for?: string | null
          neighborhood?: string | null
          photos?: string[] | null
          piva_verificata?: boolean
          piva_verificata_il?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          social_links?: Json | null
          tags?: string[] | null
          tipo_employer?: string | null
          updated_at?: string
          username?: string | null
          xp_points?: number
        }
        Relationships: []
      }
      profili_riservati: {
        Row: {
          area_lat: number | null
          area_lng: number | null
          area_raggio: number | null
          created_at: string
          data_nascita: string | null
          id: string
          maggiorenne_confermato_il: string | null
          partita_iva: string | null
          piva_nome_vies: string | null
          spostamento_est_m: number | null
          spostamento_nord_m: number | null
          updated_at: string
        }
        Insert: {
          area_lat?: number | null
          area_lng?: number | null
          area_raggio?: number | null
          created_at?: string
          data_nascita?: string | null
          id: string
          maggiorenne_confermato_il?: string | null
          partita_iva?: string | null
          piva_nome_vies?: string | null
          spostamento_est_m?: number | null
          spostamento_nord_m?: number | null
          updated_at?: string
        }
        Update: {
          area_lat?: number | null
          area_lng?: number | null
          area_raggio?: number | null
          created_at?: string
          data_nascita?: string | null
          id?: string
          maggiorenne_confermato_il?: string | null
          partita_iva?: string | null
          piva_nome_vies?: string | null
          spostamento_est_m?: number | null
          spostamento_nord_m?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profili_riservati_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quartieri: {
        Row: {
          lat: number
          lng: number
          nome: string
        }
        Insert: {
          lat: number
          lng: number
          nome: string
        }
        Update: {
          lat?: number
          lng?: number
          nome?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          employer_id: string
          id: string
          job_id: string
          rating: number
          worker_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          employer_id: string
          id?: string
          job_id: string
          rating: number
          worker_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          employer_id?: string
          id?: string
          job_id?: string
          rating?: number
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "statistiche_annunci_test"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      statistiche_annunci: {
        Row: {
          aggiornate_il: string
          aperture: number
          job_id: string
          viste: number
        }
        Insert: {
          aggiornate_il?: string
          aperture?: number
          job_id: string
          viste?: number
        }
        Update: {
          aggiornate_il?: string
          aperture?: number
          job_id?: string
          viste?: number
        }
        Relationships: [
          {
            foreignKeyName: "statistiche_annunci_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "statistiche_annunci_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "statistiche_annunci_test"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      chat_overview: {
        Row: {
          application_status: string | null
          created_at: string | null
          employer_avatar_url: string | null
          employer_full_name: string | null
          employer_id: string | null
          employer_photos: string[] | null
          id: string | null
          job_id: string | null
          job_title: string | null
          last_message_content: string | null
          last_message_created_at: string | null
          last_message_has_attachment: boolean | null
          last_message_sender_id: string | null
          unread_for_employer: number | null
          unread_for_worker: number | null
          updated_at: string | null
          worker_avatar_url: string | null
          worker_full_name: string | null
          worker_id: string | null
          worker_photos: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "statistiche_annunci_test"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["last_message_sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      statistiche_annunci_test: {
        Row: {
          aperture: number | null
          candidature: number | null
          created_at: string | null
          id: string | null
          opzione: string | null
          prezzo_allungamento: number | null
          prezzo_pacchetto: number | null
          prezzo_potenziamento: number | null
          scade_il: string | null
          title: string | null
          viste: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      chiama_invio_notifiche: { Args: never; Returns: undefined }
      chiudi_lavori_scaduti: { Args: never; Returns: number }
      crea_notifica: {
        Args: {
          p_azione?: string
          p_chiave?: string
          p_modo?: string
          p_riferimento?: string
          p_testo: string
          p_testo_gruppo?: string
          p_tipo: string
          p_titolo: string
          p_utente: string
        }
        Returns: string
      }
      cuori_del_worker: { Args: { p_worker: string }; Returns: string[] }
      distanza_m: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      nome_di: { Args: { p_utente: string }; Returns: string }
      notifiche_a_orario: { Args: never; Returns: undefined }
      orario_silenzio: { Args: { t: string }; Returns: string }
      preferenza_notifiche: {
        Args: { p_categoria: string; p_utente: string }
        Returns: boolean
      }
      prova_gratuita: { Args: never; Returns: boolean }
      registra_apertura: { Args: { annuncio: string }; Returns: undefined }
      registra_dispositivo: {
        Args: {
          p_auth?: string
          p_endpoint: string
          p_p256dh?: string
          p_piattaforma: string
        }
        Returns: undefined
      }
      registra_viste: { Args: { annunci: string[] }; Returns: undefined }
      ruolo_annuncio: {
        Args: { p_tags: string[]; p_titolo: string }
        Returns: string
      }
    }
    Enums: {
      user_role: "worker" | "employer"
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
    Enums: {
      user_role: ["worker", "employer"],
    },
  },
} as const
