import { useEffect, useMemo, useState } from 'react';

import { supabase, uniqueChannelName } from '@/lib/supabase';

type ReactionRow = {
  message_id: number;
  user_id: string;
  emoji: string;
};

// 화면에 그리기 좋은 형태로 합친 것: 메시지 하나의 이모지별 집계
export type MessageReaction = {
  emoji: string;
  count: number;
  reactedByMe: boolean;
};

export function useReactions(roomId: number, userId: string | undefined) {
  const [rows, setRows] = useState<ReactionRow[]>([]);

  useEffect(() => {
    setRows([]);
    supabase
      .from('message_reactions')
      .select('message_id, user_id, emoji')
      .eq('room_id', roomId)
      .then(({ data }) => setRows(data ?? []));

    const channel = supabase
      .channel(uniqueChannelName(`reactions:${roomId}`))
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reactions',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setRows((prev) => [...prev, payload.new as ReactionRow]);
        },
      )
      // DELETE 이벤트에는 기본 키(message_id, user_id, emoji)만 담겨 와서 room_id 필터를 걸 수 없음
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'message_reactions' },
        (payload) => {
          const deleted = payload.old as ReactionRow;
          setRows((prev) =>
            prev.filter(
              (row) =>
                !(
                  row.message_id === deleted.message_id &&
                  row.user_id === deleted.user_id &&
                  row.emoji === deleted.emoji
                ),
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // messageId → 이모지별 집계 목록
  const reactionsByMessage = useMemo(() => {
    const byMessage = new Map<number, MessageReaction[]>();
    for (const row of rows) {
      const list = byMessage.get(row.message_id) ?? [];
      const existing = list.find((reaction) => reaction.emoji === row.emoji);
      if (existing) {
        existing.count += 1;
        existing.reactedByMe ||= row.user_id === userId;
      } else {
        list.push({ emoji: row.emoji, count: 1, reactedByMe: row.user_id === userId });
      }
      byMessage.set(row.message_id, list);
    }
    return byMessage;
  }, [rows, userId]);

  const reactionsFor = (messageId: number) => reactionsByMessage.get(messageId) ?? [];

  // 이미 단 이모지면 취소, 아니면 추가
  const toggleReaction = async (messageId: number, emoji: string) => {
    if (!userId) return;
    const alreadyReacted = rows.some(
      (row) => row.message_id === messageId && row.user_id === userId && row.emoji === emoji,
    );

    if (alreadyReacted) {
      await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .eq('emoji', emoji);
    } else {
      await supabase
        .from('message_reactions')
        .insert({ message_id: messageId, room_id: roomId, user_id: userId, emoji });
    }
  };

  return { reactionsFor, toggleReaction };
}
