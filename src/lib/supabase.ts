
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Default values for development - these will be overridden by actual env vars when available
const supabaseUrl = 'https://fqqyfoznvstdbmmuvhwr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxcXlmb3pudnN0ZGJtbXV2aHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxODAxNDksImV4cCI6MjA1OTc1NjE0OX0.0-RIjJQ8uSMjYxQDsYaWeVfwp6ViQFkBb5wUz7VOSpg';

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
