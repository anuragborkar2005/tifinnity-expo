import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase/client';

export interface UserProfile {
  id: string;
  role: 'diner' | 'partner' | 'delivery_partner' | 'admin';
  full_name: string;
  email?: string;
  phone?: string;
  wallet_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  transaction_type: 'cashback' | 'refund' | 'referral' | 'order_payment' | 'adjustment';
  amount: number;
  direction: 'credit' | 'debit';
  reference_type?: string;
  reference_id?: string;
  description?: string;
  balance_after: number;
  created_at: string;
}

export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('AUTH_REQUIRED');

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data as UserProfile;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { full_name?: string; email?: string; phone?: string }) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('AUTH_REQUIRED');

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      if (error) throw error;
      return data as UserProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useWalletHistory() {
  return useQuery<WalletTransaction[]>({
    queryKey: ['walletHistory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as WalletTransaction[];
    },
  });
}
