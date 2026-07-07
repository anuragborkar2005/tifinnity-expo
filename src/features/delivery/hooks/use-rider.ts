import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase/client';

export function useRider() {
  const queryClient = useQueryClient();

  // 1. Fetch available orders in the area awaiting delivery (ready_for_pickup)
  const availableOrdersQuery = useQuery({
    queryKey: ['availableDeliveries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, kitchens(*), user_addresses(*)')
        .eq('order_status', 'ready_for_pickup')
        .is('delivery_partner_id', null);
      if (error) throw error;
      return data;
    },
  });

  // 2. Fetch deliveries currently assigned to this rider
  const assignedOrdersQuery = useQuery({
    queryKey: ['assignedDeliveries'],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('AUTH_REQUIRED');

      const { data, error } = await supabase
        .from('orders')
        .select('*, kitchens(*), user_addresses(*)')
        .eq('delivery_partner_id', user.id)
        .in('order_status', ['delivery_assigned', 'picked_up', 'out_for_delivery']);
      if (error) throw error;
      return data;
    },
  });

  // 3. Accept delivery mutation
  const acceptDeliveryMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('AUTH_REQUIRED');

      const { data, error } = await supabase
        .from('orders')
        .update({
          delivery_partner_id: user.id,
          order_status: 'delivery_assigned',
        })
        .eq('id', orderId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availableDeliveries'] });
      queryClient.invalidateQueries({ queryKey: ['assignedDeliveries'] });
    },
  });

  // 4. Update delivery status mutation
  const updateDeliveryStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ order_status: status })
        .eq('id', orderId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignedDeliveries'] });
    },
  });

  // 5. Update GPS location mutation
  const updateLocationMutation = useMutation({
    mutationFn: async ({ lat, lng }: { lat: number; lng: number }) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('AUTH_REQUIRED');

      const { data, error } = await supabase
        .from('riders')
        .upsert(
          {
            id: user.id,
            current_latitude: lat,
            current_longitude: lng,
            status: 'active',
            last_updated: new Date().toISOString(),
          },
          {
            onConflict: 'id',
          }
        );
      if (error) throw error;
      return data;
    },
  });

  return {
    availableOrders: availableOrdersQuery.data || [],
    isLoadingAvailable: availableOrdersQuery.isLoading,
    assignedOrders: assignedOrdersQuery.data || [],
    isLoadingAssigned: assignedOrdersQuery.isLoading,
    acceptDelivery: acceptDeliveryMutation.mutateAsync,
    isAccepting: acceptDeliveryMutation.isPending,
    updateDeliveryStatus: updateDeliveryStatusMutation.mutateAsync,
    isUpdatingStatus: updateDeliveryStatusMutation.isPending,
    updateLocation: updateLocationMutation.mutateAsync,
  };
}
