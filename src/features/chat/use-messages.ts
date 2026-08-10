import { useEffect, useState } from 'react';

import { supabase, uniqueChannelName } from '@/lib/supabase';

import type { Message } from './types';

const PAGE_SIZE = 30;

export function useMessages(roomId: number) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);

  useEffect(() => {
    setMessages([]);
    setHasMore(true);
    loadLatestMessages();

    const channel = supabase
      .channel(uniqueChannelName(`messages:${roomId}`))
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages((prev) => [payload.new as Message, ...prev]);
        },
      )
      // DELETE 이벤트에는 지워진 행의 id만 담겨 와서 room_id 필터를 걸 수 없음
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages' },
        (payload) => {
          const deletedId = (payload.old as { id: number }).id;
          setMessages((prev) => prev.filter((message) => message.id !== deletedId));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

    async function loadLatestMessages() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('id', { ascending: false })
        .limit(PAGE_SIZE);
      const latest = data ?? [];
      setMessages(latest);
      setHasMore(latest.length === PAGE_SIZE);
    }
  }, [roomId]);

  const loadOlderMessages = async () => {
    if (!hasMore || isLoadingOlder || messages.length === 0) return;
    setIsLoadingOlder(true);

    const oldestLoaded = messages[messages.length - 1];
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .lt('id', oldestLoaded.id)
      .order('id', { ascending: false })
      .limit(PAGE_SIZE);
    const older = data ?? [];

    setMessages((prev) => [...prev, ...older]);
    setHasMore(older.length === PAGE_SIZE);
    setIsLoadingOlder(false);
  };

  return { messages, loadOlderMessages, isLoadingOlder };
}

export async function deleteMessage(messageId: number) {
  await supabase.from('messages').delete().eq('id', messageId);
}

export async function sendMessage(params: {
  roomId: number;
  userId: string;
  nickname: string;
  avatarUrl: string | null;
  content: string;
  replyTo?: { id: number; nickname: string; content: string } | null;
}) {
  await supabase.from('messages').insert({
    room_id: params.roomId,
    user_id: params.userId,
    nickname: params.nickname,
    avatar_url: params.avatarUrl,
    content: params.content,
    reply_to_id: params.replyTo?.id ?? null,
    reply_to_nickname: params.replyTo?.nickname ?? null,
    reply_to_content: params.replyTo?.content ?? null,
  });
}
