
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18'
  }
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "admin_users": {
                  Row: {
                    "created_at": string,"name": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"name": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"name"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"artwork_images": {
                  Row: {
                    "alt": string,"artwork_id": string,"created_at": string,"focal_x": number,"focal_y": number,"height": number,"id": string,"is_cover": boolean,"path": string,"sort_order": number,"width": number
                  }
                  ComputedFields: never
                  Insert: {
                    "alt": string,"artwork_id": string,"created_at"?: string,"focal_x"?: number,"focal_y"?: number,"height": number,"id"?: string,"is_cover"?: boolean,"path": string,"sort_order"?: number,"width": number
                  }
                  Update: {
                    "alt"?: string,"artwork_id"?: string,"created_at"?: string,"focal_x"?: number,"focal_y"?: number,"height"?: number,"id"?: string,"is_cover"?: boolean,"path"?: string,"sort_order"?: number,"width"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "artwork_images_artwork_id_fkey"
      columns: ["artwork_id"]
isOneToOne: false
      referencedRelation: "artworks"
      referencedColumns: ["id"]
    }
                  ]
                },"artworks": {
                  Row: {
                    "category_id": string,"created_at": string,"dimensions": string,"featured": boolean,"id": string,"modality_id": string,"published_at": string | null,"short_description": string,"slug": string,"sort_order": number,"status": Database["public"]['Enums']["artwork_status"],"story": string,"technique_label": string,"technique_option_id": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id": string,"created_at"?: string,"dimensions"?: string,"featured"?: boolean,"id"?: string,"modality_id": string,"published_at"?: string | null,"short_description"?: string,"slug": string,"sort_order"?: number,"status"?: Database["public"]['Enums']["artwork_status"],"story"?: string,"technique_label"?: string,"technique_option_id"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "category_id"?: string,"created_at"?: string,"dimensions"?: string,"featured"?: boolean,"id"?: string,"modality_id"?: string,"published_at"?: string | null,"short_description"?: string,"slug"?: string,"sort_order"?: number,"status"?: Database["public"]['Enums']["artwork_status"],"story"?: string,"technique_label"?: string,"technique_option_id"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "artworks_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "artworks_modality_id_fkey"
      columns: ["modality_id"]
isOneToOne: false
      referencedRelation: "modalities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "artworks_technique_option_id_fkey"
      columns: ["technique_option_id"]
isOneToOne: false
      referencedRelation: "options"
      referencedColumns: ["id"]
    }
                  ]
                },"categories": {
                  Row: {
                    "active": boolean,"created_at": string,"id": string,"image": NonNullable<Json>,"name": string,"show_on_home": boolean,"slug": string,"sort_order": number,"tagline": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"id"?: string,"image": NonNullable<Json>,"name": string,"show_on_home"?: boolean,"slug": string,"sort_order"?: number,"tagline"?: string,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"id"?: string,"image"?: NonNullable<Json>,"name"?: string,"show_on_home"?: boolean,"slug"?: string,"sort_order"?: number,"tagline"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"category_modalities": {
                  Row: {
                    "category_id": string,"modality_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id": string,"modality_id": string
                  }
                  Update: {
                    "category_id"?: string,"modality_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "category_modalities_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "category_modalities_modality_id_fkey"
      columns: ["modality_id"]
isOneToOne: false
      referencedRelation: "modalities"
      referencedColumns: ["id"]
    }
                  ]
                },"modalities": {
                  Row: {
                    "active": boolean,"created_at": string,"delivery_kind": Database["public"]['Enums']["delivery_kind"],"description": string,"id": string,"image": Json | null,"name": string,"slug": string,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"delivery_kind": Database["public"]['Enums']["delivery_kind"],"description"?: string,"id"?: string,"image"?: Json | null,"name": string,"slug": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"delivery_kind"?: Database["public"]['Enums']["delivery_kind"],"description"?: string,"id"?: string,"image"?: Json | null,"name"?: string,"slug"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"options": {
                  Row: {
                    "active": boolean,"allows_custom": boolean,"created_at": string,"description": string,"id": string,"kind": Database["public"]['Enums']["option_kind"],"label": string,"modality_id": string,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"allows_custom"?: boolean,"created_at"?: string,"description"?: string,"id"?: string,"kind": Database["public"]['Enums']["option_kind"],"label": string,"modality_id": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"allows_custom"?: boolean,"created_at"?: string,"description"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["option_kind"],"label"?: string,"modality_id"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "options_modality_id_fkey"
      columns: ["modality_id"]
isOneToOne: false
      referencedRelation: "modalities"
      referencedColumns: ["id"]
    }
                  ]
                },"order_counters": {
                  Row: {
                    "last_value": number,"year": number
                  }
                  ComputedFields: never
                  Insert: {
                    "last_value"?: number,"year": number
                  }
                  Update: {
                    "last_value"?: number,"year"?: number
                  }
                  Relationships: [
                    
                  ]
                },"order_events": {
                  Row: {
                    "author_id": string | null,"body": string | null,"created_at": string,"from_status": Database["public"]['Enums']["order_status"] | null,"id": string,"order_id": string,"to_status": Database["public"]['Enums']["order_status"] | null,"type": Database["public"]['Enums']["order_event_type"]
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"body"?: string | null,"created_at"?: string,"from_status"?: Database["public"]['Enums']["order_status"] | null,"id"?: string,"order_id": string,"to_status"?: Database["public"]['Enums']["order_status"] | null,"type": Database["public"]['Enums']["order_event_type"]
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: string | null,"created_at"?: string,"from_status"?: Database["public"]['Enums']["order_status"] | null,"id"?: string,"order_id"?: string,"to_status"?: Database["public"]['Enums']["order_status"] | null,"type"?: Database["public"]['Enums']["order_event_type"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_events_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"order_references": {
                  Row: {
                    "created_at": string,"id": string,"mime_type": string,"order_id": string,"original_name": string,"size_bytes": number,"storage_path": string,"thumbnail_path": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"mime_type": string,"order_id": string,"original_name": string,"size_bytes": number,"storage_path": string,"thumbnail_path"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"mime_type"?: string,"order_id"?: string,"original_name"?: string,"size_bytes"?: number,"storage_path"?: string,"thumbnail_path"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_references_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"orders": {
                  Row: {
                    "artwork_ref_id": string | null,"category_id": string | null,"choices": NonNullable<Json>,"city": string,"confirmed_deadline": string | null,"created_at": string,"custom_size": string | null,"custom_technique": string | null,"customer_email": string,"customer_name": string,"customer_whatsapp": string,"description": string,"desired_date": string | null,"email_status": Database["public"]['Enums']["email_status"],"file_format_option_id": string | null,"finish_option_id": string | null,"id": string,"idempotency_key": string,"ip_hash": string | null,"modality_id": string | null,"notes": string | null,"number": string,"portfolio_consent": boolean,"privacy_accepted_at": string,"privacy_version": string,"quote_cents": number | null,"size_option_id": string | null,"state": string,"status": Database["public"]['Enums']["order_status"],"technique_option_id": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "artwork_ref_id"?: string | null,"category_id"?: string | null,"choices"?: NonNullable<Json>,"city": string,"confirmed_deadline"?: string | null,"created_at"?: string,"custom_size"?: string | null,"custom_technique"?: string | null,"customer_email": string,"customer_name": string,"customer_whatsapp": string,"description": string,"desired_date"?: string | null,"email_status"?: Database["public"]['Enums']["email_status"],"file_format_option_id"?: string | null,"finish_option_id"?: string | null,"id"?: string,"idempotency_key": string,"ip_hash"?: string | null,"modality_id"?: string | null,"notes"?: string | null,"number": string,"portfolio_consent"?: boolean,"privacy_accepted_at": string,"privacy_version": string,"quote_cents"?: number | null,"size_option_id"?: string | null,"state": string,"status"?: Database["public"]['Enums']["order_status"],"technique_option_id"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "artwork_ref_id"?: string | null,"category_id"?: string | null,"choices"?: NonNullable<Json>,"city"?: string,"confirmed_deadline"?: string | null,"created_at"?: string,"custom_size"?: string | null,"custom_technique"?: string | null,"customer_email"?: string,"customer_name"?: string,"customer_whatsapp"?: string,"description"?: string,"desired_date"?: string | null,"email_status"?: Database["public"]['Enums']["email_status"],"file_format_option_id"?: string | null,"finish_option_id"?: string | null,"id"?: string,"idempotency_key"?: string,"ip_hash"?: string | null,"modality_id"?: string | null,"notes"?: string | null,"number"?: string,"portfolio_consent"?: boolean,"privacy_accepted_at"?: string,"privacy_version"?: string,"quote_cents"?: number | null,"size_option_id"?: string | null,"state"?: string,"status"?: Database["public"]['Enums']["order_status"],"technique_option_id"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "orders_artwork_ref_id_fkey"
      columns: ["artwork_ref_id"]
isOneToOne: false
      referencedRelation: "artworks"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_file_format_option_id_fkey"
      columns: ["file_format_option_id"]
isOneToOne: false
      referencedRelation: "options"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_finish_option_id_fkey"
      columns: ["finish_option_id"]
isOneToOne: false
      referencedRelation: "options"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_modality_id_fkey"
      columns: ["modality_id"]
isOneToOne: false
      referencedRelation: "modalities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_size_option_id_fkey"
      columns: ["size_option_id"]
isOneToOne: false
      referencedRelation: "options"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_technique_option_id_fkey"
      columns: ["technique_option_id"]
isOneToOne: false
      referencedRelation: "options"
      referencedColumns: ["id"]
    }
                  ]
                },"rate_limits": {
                  Row: {
                    "hits": number,"key": string,"window_start": string
                  }
                  ComputedFields: never
                  Insert: {
                    "hits"?: number,"key": string,"window_start": string
                  }
                  Update: {
                    "hits"?: number,"key"?: string,"window_start"?: string
                  }
                  Relationships: [
                    
                  ]
                },"settings": {
                  Row: {
                    "is_public": boolean,"key": string,"updated_at": string,"value": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "is_public"?: boolean,"key": string,"updated_at"?: string,"value": NonNullable<Json>
                  }
                  Update: {
                    "is_public"?: boolean,"key"?: string,"updated_at"?: string,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"testimonials": {
                  Row: {
                    "body": string,"consent_note": string,"created_at": string,"id": string,"is_demo": boolean,"location": string | null,"name": string,"published": boolean,"rating": number | null,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"consent_note"?: string,"created_at"?: string,"id"?: string,"is_demo"?: boolean,"location"?: string | null,"name": string,"published"?: boolean,"rating"?: number | null,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "body"?: string,"consent_note"?: string,"created_at"?: string,"id"?: string,"is_demo"?: boolean,"location"?: string | null,"name"?: string,"published"?: boolean,"rating"?: number | null,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_image_asset":
{ Args: { "value": Json }; Returns: boolean
                           }
          }
          Enums: {
            "artwork_status": "rascunho"|"publicada"|"arquivada","delivery_kind": "digital"|"fisica","email_status": "pendente"|"enviado"|"falhou","option_kind": "technique"|"size"|"finish"|"file_format","order_event_type": "criado"|"status"|"nota"|"email_enviado"|"email_falhou","order_status": "nova"|"em_analise"|"orcamento_enviado"|"aguardando_aprovacao"|"aprovado"|"em_producao"|"concluido"|"cancelado"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "artwork_status": ["rascunho", "publicada", "arquivada"],"delivery_kind": ["digital", "fisica"],"email_status": ["pendente", "enviado", "falhou"],"option_kind": ["technique", "size", "finish", "file_format"],"order_event_type": ["criado", "status", "nota", "email_enviado", "email_falhou"],"order_status": ["nova", "em_analise", "orcamento_enviado", "aguardando_aprovacao", "aprovado", "em_producao", "concluido", "cancelado"]
          }
        }
} as const
