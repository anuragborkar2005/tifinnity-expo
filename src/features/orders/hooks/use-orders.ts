import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/src/lib/supabase/client';

export interface Order {
  id: string;
  user_id: string;
  kitchen_id: string;
  address_id: string;
  subscription_id?: string;
  order_type: 'one-time' | 'subscription';
  order_status: string;
  subtotal: number;
  delivery_fee: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  placed_at: string;
  delivered_at?: string;
  kitchens?: {
    name: string;
    logo_url?: string;
  };
}

export interface OrderItem {
  id: string;
  order_id: string;
  meal_box_id: string;
  meal_box_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

export interface OrderPriceBreakdown {
  id: string;
  order_id: string;
  item_total: number;
  kitchen_discount: number;
  coupon_discount: number;
  subscription_discount: number;
  delivery_charge: number;
  tax_amount: number;
  grand_total: number;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  old_status?: string;
  new_status: string;
  changed_by?: string;
  reason?: string;
  created_at: string;
}

export function useOrders() {
  return useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, kitchens(name, logo_url)')
        .order('placed_at', { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });
}

export function useOrder(orderId: string) {
  return useQuery<{
    order: Order;
    items: OrderItem[];
    breakdown: OrderPriceBreakdown;
    history: OrderStatusHistory[];
  }>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const [orderRes, itemsRes, breakdownRes, historyRes] = await Promise.all([
        supabase.from('orders').select('*, kitchens(*)').eq('id', orderId).single(),
        supabase.from('order_items').select('*').eq('order_id', orderId),
        supabase.from('order_price_breakdowns').select('*').eq('order_id', orderId).single(),
        supabase.from('order_status_history').select('*').eq('order_id', orderId).order('created_at', { ascending: true }),
      ]);

      if (orderRes.error) throw orderRes.error;
      if (itemsRes.error) throw itemsRes.error;
      if (breakdownRes.error) throw breakdownRes.error;
      
      return {
        order: orderRes.data as Order,
        items: itemsRes.data as OrderItem[],
        breakdown: breakdownRes.data as OrderPriceBreakdown,
        history: (historyRes.data || []) as OrderStatusHistory[],
      };
    },
    enabled: !!orderId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      kitchen_id: string;
      address_id: string;
      items: Array<{ meal_box_id: string; quantity: number }>;
      coupon_code?: string;
      payment_method?: string;
      delivery_instructions?: string;
    }) => {
      const { data, error } = await supabase.rpc('create_order', {
        p_kitchen_id: parseInt(params.kitchen_id),
        p_address_id: parseInt(params.address_id),
        p_items: params.items,
        p_coupon_code: params.coupon_code || null,
        p_payment_method: params.payment_method || 'upi',
        p_delivery_instructions: params.delivery_instructions || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useOrderRealtime(orderId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`order-updates-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          queryClient.setQueryData(['order', orderId], (oldData: any) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              order: { ...oldData.order, ...payload.new },
            };
          });
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, queryClient]);
}
