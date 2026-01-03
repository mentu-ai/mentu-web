// Database types for Supabase
// These mirror the actual Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          display_name: string | null;
          created_at: string | null;
          created_by: string | null;
          genesis_key: Json | null;
          settings: Json;
        };
        Insert: {
          id?: string;
          name: string;
          display_name?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          genesis_key?: Json | null;
          settings?: Json;
        };
        Update: {
          id?: string;
          name?: string;
          display_name?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          genesis_key?: Json | null;
          settings?: Json;
        };
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: string;
          joined_at: string | null;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          role?: string;
          joined_at?: string | null;
        };
        Update: {
          workspace_id?: string;
          user_id?: string;
          role?: string;
          joined_at?: string | null;
        };
      };
      operations: {
        Row: {
          id: string;
          workspace_id: string;
          op: string;
          ts: string;
          actor: string;
          payload: Json;
          client_id: string | null;
          synced_at: string | null;
        };
        Insert: {
          id: string;
          workspace_id: string;
          op: string;
          ts: string;
          actor: string;
          payload: Json;
          client_id?: string | null;
          synced_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          op?: string;
          ts?: string;
          actor?: string;
          payload?: Json;
          client_id?: string | null;
          synced_at?: string | null;
        };
      };
      bridge_machines: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          name: string;
          hostname: string | null;
          agents_available: string[] | null;
          status: 'online' | 'busy' | 'offline';
          last_seen_at: string | null;
          current_command_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          workspace_id: string;
          user_id: string;
          name: string;
          hostname?: string | null;
          agents_available?: string[] | null;
          status?: 'online' | 'busy' | 'offline';
          last_seen_at?: string | null;
          current_command_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          name?: string;
          hostname?: string | null;
          agents_available?: string[] | null;
          status?: 'online' | 'busy' | 'offline';
          last_seen_at?: string | null;
          current_command_id?: string | null;
          created_at?: string;
        };
      };
      bridge_commands: {
        Row: {
          id: string;
          workspace_id: string;
          target_machine_id: string | null;
          prompt: string;
          working_directory: string;
          agent: string;
          flags: string[] | null;
          timeout_seconds: number | null;
          status: 'pending' | 'claimed' | 'running' | 'completed' | 'failed' | 'timeout' | 'cancelled';
          created_at: string;
          claimed_at: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_by: string | null;
          claimed_by_machine_id: string | null;
          commitment_id: string | null;
          meta: Json | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          target_machine_id?: string | null;
          prompt: string;
          working_directory: string;
          agent?: string;
          flags?: string[] | null;
          timeout_seconds?: number | null;
          status?: 'pending' | 'claimed' | 'running' | 'completed' | 'failed' | 'timeout' | 'cancelled';
          created_at?: string;
          claimed_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_by?: string | null;
          claimed_by_machine_id?: string | null;
          commitment_id?: string | null;
          meta?: Json | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          target_machine_id?: string | null;
          prompt?: string;
          working_directory?: string;
          agent?: string;
          flags?: string[] | null;
          timeout_seconds?: number | null;
          status?: 'pending' | 'claimed' | 'running' | 'completed' | 'failed' | 'timeout' | 'cancelled';
          created_at?: string;
          claimed_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_by?: string | null;
          claimed_by_machine_id?: string | null;
          commitment_id?: string | null;
          meta?: Json | null;
        };
      };
      bridge_results: {
        Row: {
          id: string;
          command_id: string;
          machine_id: string;
          started_at: string;
          completed_at: string;
          status: 'success' | 'failed' | 'timeout' | 'cancelled';
          exit_code: number | null;
          stdout: string | null;
          stderr: string | null;
          stdout_truncated: boolean | null;
          stderr_truncated: boolean | null;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          command_id: string;
          machine_id: string;
          started_at: string;
          completed_at: string;
          status: 'success' | 'failed' | 'timeout' | 'cancelled';
          exit_code?: number | null;
          stdout?: string | null;
          stderr?: string | null;
          stdout_truncated?: boolean | null;
          stderr_truncated?: boolean | null;
          error_message?: string | null;
        };
        Update: {
          id?: string;
          command_id?: string;
          machine_id?: string;
          started_at?: string;
          completed_at?: string;
          status?: 'success' | 'failed' | 'timeout' | 'cancelled';
          exit_code?: number | null;
          stdout?: string | null;
          stderr?: string | null;
          stdout_truncated?: boolean | null;
          stderr_truncated?: boolean | null;
          error_message?: string | null;
        };
      };
      actor_mappings: {
        Row: {
          id: string;
          workspace_id: string;
          external_system: string;
          external_id: string;
          mentu_actor: string;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          external_system: string;
          external_id: string;
          mentu_actor: string;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          external_system?: string;
          external_id?: string;
          mentu_actor?: string;
          created_at?: string;
          created_by?: string | null;
        };
      };
      webhook_logs: {
        Row: {
          id: string;
          workspace_id: string | null;
          source: string;
          event_type: string;
          event_action: string | null;
          payload: Json;
          processed_at: string | null;
          result: string | null;
          error_message: string | null;
          received_at: string;
        };
        Insert: {
          id?: string;
          workspace_id?: string | null;
          source: string;
          event_type: string;
          event_action?: string | null;
          payload: Json;
          processed_at?: string | null;
          result?: string | null;
          error_message?: string | null;
          received_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string | null;
          source?: string;
          event_type?: string;
          event_action?: string | null;
          payload?: Json;
          processed_at?: string | null;
          result?: string | null;
          error_message?: string | null;
          received_at?: string;
        };
      };
      // Knowledge Base Tables
      knowledge_sources: {
        Row: {
          id: string;
          workspace_id: string | null;
          url: string;
          source_type: 'website' | 'document' | 'api' | 'manual';
          title: string | null;
          last_fetched_at: string | null;
          content_hash: string | null;
          status: 'pending' | 'synced' | 'error' | 'stale' | null;
          metadata: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id?: string | null;
          url: string;
          source_type: 'website' | 'document' | 'api' | 'manual';
          title?: string | null;
          last_fetched_at?: string | null;
          content_hash?: string | null;
          status?: 'pending' | 'synced' | 'error' | 'stale' | null;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string | null;
          url?: string;
          source_type?: 'website' | 'document' | 'api' | 'manual';
          title?: string | null;
          last_fetched_at?: string | null;
          content_hash?: string | null;
          status?: 'pending' | 'synced' | 'error' | 'stale' | null;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      knowledge_documents: {
        Row: {
          id: string;
          source_id: string | null;
          workspace_id: string | null;
          slug: string;
          title: string;
          description: string | null;
          content_type: 'blog' | 'project' | 'about' | 'paper' | 'skill' | 'other';
          language: string | null;
          raw_content: string | null;
          clean_content: string | null;
          front_matter: Json | null;
          dimensions: Json | null;
          published_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          source_id?: string | null;
          workspace_id?: string | null;
          slug: string;
          title: string;
          description?: string | null;
          content_type: 'blog' | 'project' | 'about' | 'paper' | 'skill' | 'other';
          language?: string | null;
          raw_content?: string | null;
          clean_content?: string | null;
          front_matter?: Json | null;
          dimensions?: Json | null;
          published_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          source_id?: string | null;
          workspace_id?: string | null;
          slug?: string;
          title?: string;
          description?: string | null;
          content_type?: 'blog' | 'project' | 'about' | 'paper' | 'skill' | 'other';
          language?: string | null;
          raw_content?: string | null;
          clean_content?: string | null;
          front_matter?: Json | null;
          dimensions?: Json | null;
          published_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      knowledge_chunks: {
        Row: {
          id: string;
          document_id: string | null;
          workspace_id: string | null;
          chunk_index: number;
          content: string;
          token_count: number | null;
          embedding: string | null; // vector(1536) stored as string
          metadata: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          document_id?: string | null;
          workspace_id?: string | null;
          chunk_index: number;
          content: string;
          token_count?: number | null;
          embedding?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          document_id?: string | null;
          workspace_id?: string | null;
          chunk_index?: number;
          content?: string;
          token_count?: number | null;
          embedding?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
      };
      knowledge_entities: {
        Row: {
          id: string;
          workspace_id: string | null;
          entity_type: 'project' | 'skill' | 'person' | 'concept' | 'organization' | 'technology' | 'other';
          name: string;
          canonical_name: string | null;
          description: string | null;
          attributes: Json | null;
          linked_actor: string | null;
          embedding: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id?: string | null;
          entity_type: 'project' | 'skill' | 'person' | 'concept' | 'organization' | 'technology' | 'other';
          name: string;
          canonical_name?: string | null;
          description?: string | null;
          attributes?: Json | null;
          linked_actor?: string | null;
          embedding?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string | null;
          entity_type?: 'project' | 'skill' | 'person' | 'concept' | 'organization' | 'technology' | 'other';
          name?: string;
          canonical_name?: string | null;
          description?: string | null;
          attributes?: Json | null;
          linked_actor?: string | null;
          embedding?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      knowledge_relationships: {
        Row: {
          id: string;
          workspace_id: string | null;
          source_entity_id: string | null;
          target_entity_id: string | null;
          relationship_type: 'created' | 'uses' | 'knows' | 'related_to' | 'part_of' | 'authored' | 'mentioned_in' | 'works_with';
          evidence: Json | null;
          strength: number | null;
          metadata: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id?: string | null;
          source_entity_id?: string | null;
          target_entity_id?: string | null;
          relationship_type: 'created' | 'uses' | 'knows' | 'related_to' | 'part_of' | 'authored' | 'mentioned_in' | 'works_with';
          evidence?: Json | null;
          strength?: number | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string | null;
          source_entity_id?: string | null;
          target_entity_id?: string | null;
          relationship_type?: 'created' | 'uses' | 'knows' | 'related_to' | 'part_of' | 'authored' | 'mentioned_in' | 'works_with';
          evidence?: Json | null;
          strength?: number | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
      };
      actor_profiles: {
        Row: {
          id: string;
          workspace_id: string | null;
          actor: string;
          display_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          communication_style: Json | null;
          principles: Json | null;
          constraints: Json | null;
          linked_entities: string[] | null;
          context: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id?: string | null;
          actor: string;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          communication_style?: Json | null;
          principles?: Json | null;
          constraints?: Json | null;
          linked_entities?: string[] | null;
          context?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string | null;
          actor?: string;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          communication_style?: Json | null;
          principles?: Json | null;
          constraints?: Json | null;
          linked_entities?: string[] | null;
          context?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_knowledge: {
        Args: {
          query_embedding: string;
          match_count?: number;
          filter_workspace?: string | null;
          filter_content_type?: string | null;
          similarity_threshold?: number;
        };
        Returns: {
          chunk_id: string;
          document_id: string;
          document_title: string;
          document_slug: string;
          content_type: string;
          chunk_content: string;
          chunk_index: number;
          similarity: number;
        }[];
      };
      search_documents_fts: {
        Args: {
          search_query: string;
          match_count?: number;
          filter_workspace?: string | null;
          filter_content_type?: string | null;
        };
        Returns: {
          document_id: string;
          title: string;
          slug: string;
          content_type: string;
          description: string;
          rank: number;
        }[];
      };
    };
    Enums: Record<string, never>;
  };
}
