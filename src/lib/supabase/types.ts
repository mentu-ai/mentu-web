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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
