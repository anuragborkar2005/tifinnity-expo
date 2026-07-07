import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase/client';

export interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: any;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export function useNotifications() {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as NotificationItem[];
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const registerDeviceTokenMutation = useMutation({
    mutationFn: async (params: { token: string; platform: string; deviceId?: string }) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('AUTH_REQUIRED');

      const { data, error } = await supabase
        .from('device_tokens')
        .upsert(
          {
            user_id: user.id,
            expo_push_token: params.token,
            platform: params.platform,
            device_id: params.deviceId || null,
            is_active: true,
            last_seen_at: new Date().toISOString(),
          },
          {
            onConflict: 'expo_push_token',
          }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  });

  return {
    notifications: notificationsQuery.data || [],
    isLoading: notificationsQuery.isLoading,
    error: notificationsQuery.error,
    markAsRead: markReadMutation.mutateAsync,
    registerDeviceToken: registerDeviceTokenMutation.mutateAsync,
  };
}
