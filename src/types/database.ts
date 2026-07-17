export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AdminRole = 'super_admin' | 'admin'

export type AuditAction =
  | 'content.created' | 'content.updated' | 'content.deleted'
  | 'content.published' | 'content.unpublished'
  | 'category.created' | 'category.updated' | 'category.deleted'
  | 'admin.invited' | 'admin.accepted' | 'admin.removed' | 'admin.role_changed'
  | 'attachment.uploaded' | 'attachment.deleted'
  | 'author.created' | 'author.updated' | 'author.deleted'
  | 'editorial_tag.created' | 'editorial_tag.updated' | 'editorial_tag.deleted'

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          content_type: 'manual' | 'prophecy' | 'article' | 'blog' | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          content_type?: 'manual' | 'prophecy' | 'article' | 'blog' | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          content_type?: 'manual' | 'prophecy' | 'article' | 'blog' | null
          created_at?: string
        }
      }
      content: {
        Row: {
          id: string
          slug: string | null
          title: string
          content_type: 'manual' | 'prophecy' | 'article' | 'blog'
          source_mode: 'pdf' | 'editor'
          category: string
          tags: string[]
          theme: string | null
          lesson_number: string | null
          speaker: string | null
          series: string | null
          date_preached: string | null
          scripture_refs: string[]
          extracted_text: string | null
          body_html: string | null
          summary_points: string[] | null
          pdf_url: string | null
          cover_image_url: string | null
          status: 'draft' | 'published'
          language: 'en' | 'es' | 'fr' | 'pt' | 'ar'
          search_vector: string | null
          /** Pass 5a — trigger-maintained 220wpm estimate. NULL on legacy rows;
           *  readers should fall back to lib/read-time.ts when null. */
          read_time_minutes: number | null
          created_by: string | null
          last_edited_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content_type: 'manual' | 'prophecy' | 'article' | 'blog'
          source_mode?: 'pdf' | 'editor'
          category?: string
          tags?: string[]
          theme?: string | null
          lesson_number?: string | null
          speaker?: string | null
          series?: string | null
          date_preached?: string | null
          scripture_refs?: string[]
          extracted_text?: string | null
          body_html?: string | null
          summary_points?: string[] | null
          pdf_url?: string | null
          cover_image_url?: string | null
          status?: 'draft' | 'published'
          language?: 'en' | 'es' | 'fr' | 'pt' | 'ar'
          search_vector?: string | null
          /** Pass 5a — usually omit; the trigger computes it. Optional override
           *  only present for completeness / forwards-compat with backfills. */
          read_time_minutes?: number | null
          created_by?: string | null
          last_edited_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content_type?: 'manual' | 'prophecy' | 'article' | 'blog'
          source_mode?: 'pdf' | 'editor'
          category?: string
          tags?: string[]
          theme?: string | null
          lesson_number?: string | null
          speaker?: string | null
          series?: string | null
          date_preached?: string | null
          scripture_refs?: string[]
          extracted_text?: string | null
          body_html?: string | null
          summary_points?: string[] | null
          pdf_url?: string | null
          cover_image_url?: string | null
          status?: 'draft' | 'published'
          language?: 'en' | 'es' | 'fr' | 'pt' | 'ar'
          search_vector?: string | null
          /** Pass 5a — typically not written by app code; the trigger
           *  recomputes on changes to extracted_text or body_html. */
          read_time_minutes?: number | null
          created_by?: string | null
          last_edited_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      content_attachments: {
        Row: {
          id: string
          content_id: string
          file_url: string
          file_name: string
          file_type: 'pdf' | 'image' | 'audio' | 'other'
          mime_type: string
          size_bytes: number
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          content_id: string
          file_url: string
          file_name: string
          file_type: 'pdf' | 'image' | 'audio' | 'other'
          mime_type: string
          size_bytes: number
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          content_id?: string
          file_url?: string
          file_name?: string
          file_type?: 'pdf' | 'image' | 'audio' | 'other'
          mime_type?: string
          size_bytes?: number
          display_order?: number
          created_at?: string
        }
      }
      content_translations: {
        Row: {
          id: string
          content_id: string
          locale: 'en' | 'es' | 'fr' | 'pt' | 'ar'
          title: string
          theme: string | null
          series: string | null
          speaker: string | null
          body_html: string | null
          extracted_text: string | null
          summary_points: string[] | null
          scripture_refs: string[]
          is_machine_translated: boolean
          translated_at: string
          created_at: string
          updated_at: string
          search_vector: string | null
        }
        Insert: {
          id?: string
          content_id: string
          locale: 'en' | 'es' | 'fr' | 'pt' | 'ar'
          title: string
          theme?: string | null
          series?: string | null
          speaker?: string | null
          body_html?: string | null
          extracted_text?: string | null
          summary_points?: string[] | null
          scripture_refs?: string[]
          is_machine_translated?: boolean
          translated_at?: string
          created_at?: string
          updated_at?: string
          search_vector?: string | null
        }
        Update: {
          id?: string
          content_id?: string
          locale?: 'en' | 'es' | 'fr' | 'pt' | 'ar'
          title?: string
          theme?: string | null
          series?: string | null
          speaker?: string | null
          body_html?: string | null
          extracted_text?: string | null
          summary_points?: string[] | null
          scripture_refs?: string[]
          is_machine_translated?: boolean
          translated_at?: string
          created_at?: string
          updated_at?: string
          search_vector?: string | null
        }
      }
      admin_users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          role: AdminRole
          invited_by: string | null
          invited_at: string | null
          accepted_at: string | null
          last_active_at: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          role?: AdminRole
          invited_by?: string | null
          invited_at?: string | null
          accepted_at?: string | null
          last_active_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          role?: AdminRole
          invited_by?: string | null
          invited_at?: string | null
          accepted_at?: string | null
          last_active_at?: string | null
          created_at?: string
        }
      }
      audit_log: {
        Row: {
          id: string
          actor_id: string | null
          actor_email: string
          action: AuditAction
          resource_type: string
          resource_id: string | null
          resource_label: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_id?: string | null
          actor_email: string
          action: AuditAction
          resource_type: string
          resource_id?: string | null
          resource_label?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          actor_id?: string | null
          actor_email?: string
          action?: AuditAction
          resource_type?: string
          resource_id?: string | null
          resource_label?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      recent_searches: {
        Row: {
          id: number
          query: string
          locale: 'en' | 'es' | 'fr' | 'pt' | 'ar'
          occurred_at: string
        }
        Insert: {
          id?: number
          query: string
          locale: 'en' | 'es' | 'fr' | 'pt' | 'ar'
          occurred_at?: string
        }
        Update: {
          id?: number
          query?: string
          locale?: 'en' | 'es' | 'fr' | 'pt' | 'ar'
          occurred_at?: string
        }
        editorial_tags: {
        Row: {
          id: string
          tag: string
          position: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tag: string
          position?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tag?: string
          position?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      search_content: {
        Args: { q: string; search_locale?: string }
        Returns: { id: string; rank: number }[]
      }
      top_recent_search_terms: {
        Args: { window_hours?: number; n?: number }
        Returns: { term: string; occurrences: number }[]
      }
      /** Pass 5a — pure 220 wpm read-time helper. Used by the
       *  content_read_time trigger; exposed here in case any future RPC
       *  needs to call it directly. */
      compute_read_time_minutes: {
        Args: { input: string | null }
        Returns: number
      }
    }
    Enums: {
      content_type: 'manual' | 'prophecy' | 'article' | 'blog'
      content_status: 'draft' | 'published'
      supported_locale: 'en' | 'es' | 'fr' | 'pt' | 'ar'
      admin_role: AdminRole
      audit_action: AuditAction
    }
  }
}