import { supabase } from '@/lib/supabase';

export async function savePushToken(userId: string, token: string) {
  const { error } = await supabase
    .from('push_tokens')
    .upsert({ user_id: userId, token, updated_at: new Date().toISOString() });
  return { error: error?.message ?? null };
}

export async function deletePushToken(token: string) {
  const { error } = await supabase.from('push_tokens').delete().eq('token', token);
  return { error: error?.message ?? null };
}
