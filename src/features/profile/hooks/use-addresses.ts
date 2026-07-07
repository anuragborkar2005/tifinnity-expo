import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase/client';

export interface UserAddress {
  id: string;
  user_id: string;
  label: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  landmark?: string;
  address_type: 'home' | 'work' | 'other';
  recipient_name?: string;
  recipient_phone?: string;
  created_at: string;
}

export function useAddresses() {
  const queryClient = useQueryClient();

  const addressesQuery = useQuery<UserAddress[]>({
    queryKey: ['addresses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as UserAddress[];
    },
  });

  const createAddressMutation = useMutation({
    mutationFn: async (address: Omit<UserAddress, 'id' | 'user_id' | 'created_at'>) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('AUTH_REQUIRED');

      if (address.is_default) {
        await supabase
          .from('user_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('user_addresses')
        .insert([{ ...address, user_id: user.id }])
        .select()
        .single();
      if (error) throw error;
      return data as UserAddress;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<UserAddress> }) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('AUTH_REQUIRED');

      if (updates.is_default) {
        await supabase
          .from('user_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('user_addresses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as UserAddress;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('user_addresses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  return {
    addresses: addressesQuery.data || [],
    isLoading: addressesQuery.isLoading,
    error: addressesQuery.error,
    createAddress: createAddressMutation.mutateAsync,
    updateAddress: updateAddressMutation.mutateAsync,
    deleteAddress: deleteAddressMutation.mutateAsync,
    isCreating: createAddressMutation.isPending,
    isUpdating: updateAddressMutation.isPending,
    isDeleting: deleteAddressMutation.isPending,
  };
}
