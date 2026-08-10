import { useEffect, useRef, useState } from 'react';

import { supabase, uniqueChannelName } from '@/lib/supabase';

type RoomRead = {
  room_id: number;
  user_id: string;
  last_read_message_id: number;
};

export function useReadReceipts(roomId: number, userId: string | undefined) {
  const [lastReadByUserId, setLastReadByUserId] = useState<Record<string, number>>({});
  // 이미 보고한 값보다 작거나 같으면 다시 보내지 않기 위한 기록
  const myReportedRef = useRef(0);

  useEffect(() => {
    myReportedRef.current = 0;
    setLastReadByUserId({});
    loadReads();

    const channel = supabase
      .channel(uniqueChannelName(`reads:room:${roomId}`))
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_reads',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const read = payload.new as RoomRead;
          if (!read?.user_id) return;
          setLastReadByUserId((prev) => ({
            ...prev,
            [read.user_id]: read.last_read_message_id,
          }));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

    async function loadReads() {
      const { data } = await supabase
        .from('room_reads')
        .select('*')
        .eq('room_id', roomId);

      const byUser: Record<string, number> = {};
      for (const read of (data ?? []) as RoomRead[]) {
        byUser[read.user_id] = read.last_read_message_id;
        if (read.user_id === userId) {
          myReportedRef.current = read.last_read_message_id;
        }
      }
      setLastReadByUserId(byUser);
    }
  }, [roomId, userId]);

  const markAsRead = async (messageId: number) => {
    if (!userId || messageId <= myReportedRef.current) return;
    myReportedRef.current = messageId;

    await supabase.from('room_reads').upsert(
      { room_id: roomId, user_id: userId, last_read_message_id: messageId },
      { onConflict: 'room_id,user_id' },
    );
  };

  // 나를 제외하고, 이 메시지까지 읽은 사람 수
  const countReaders = (messageId: number) =>
    Object.entries(lastReadByUserId).filter(
      ([readerId, lastReadId]) => readerId !== userId && lastReadId >= messageId,
    ).length;

  return { markAsRead, countReaders };
}
