import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// These should be in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local'
  );
}

// Client-side Supabase client (uses anon key)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Server-side client with service role key (for admin operations)
// Only use this in API routes or server components, never expose to client
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Required for server-side operations.'
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Helper to get the current user's role from their email
export async function getUserRole(email: string): Promise<'meedo' | 'beedo' | null> {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('email', email)
    .single();

  if (error || !data) {
    return null;
  }

  return data.role;
}

// Helper to update coin balance (wrapper for the SQL function)
export async function updateCoinBalance(
  userRole: 'meedo' | 'beedo',
  amount: number,
  isEarning: boolean = true
): Promise<number | null> {
  const { data, error } = await supabase.rpc('update_coin_balance', {
    p_user_role: userRole,
    p_amount: amount,
    p_is_earning: isEarning,
  });

  if (error) {
    console.error('Failed to update coin balance:', error);
    return null;
  }

  return data;
}

// Helper to get user's current balance
export async function getUserBalance(userRole: 'meedo' | 'beedo') {
  const { data, error } = await supabase
    .from('user_balances')
    .select('*')
    .eq('user_role', userRole)
    .single();

  if (error) {
    console.error('Failed to get user balance:', error);
    return null;
  }

  return data;
}
