import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

import type { Message } from '../chat/types';
import type { Room } from './types';

type LastMessage = Pick<Message, 'content' | 'created_at' | 'nickname'>;

export type RoomPreview = Room & { lastMessage: LastMessage | null };

export function useRooms() {
  const [rooms, setRooms] = useState<RoomPreview[]>([]);

  useEffect(() => {
    loadRooms();

    const channel = supabase
      .channel('rooms')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'rooms' },
        (payload) => {
          const room = payload.new as Room;
          setRooms((prev) => sortByLastActivity([{ ...room, lastMessage: null }, ...prev]));
        },
      )
      // 어느 방이든 새 메시지가 오면 그 방의 미리보기를 갱신하고 맨 위로 올림
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const message = payload.new as Message;
          setRooms((prev) =>
            sortByLastActivity(
              prev.map((room) =>
                room.id === message.room_id ? { ...room, lastMessage: message } : room,
              ),
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

    async function loadRooms() {
      const { data } = await supabase
        .from('rooms')
        .select('*, messages(content, created_at, nickname)')
        .order('id', { ascending: false, referencedTable: 'messages' })
        .limit(1, { referencedTable: 'messages' });

      const loaded = (data ?? []).map(({ messages, ...room }) => ({
        ...room,
        lastMessage: (messages[0] ?? null) as LastMessage | null,
      }));
      setRooms(sortByLastActivity(loaded));
    }
  }, []);

  return rooms;
}

function sortByLastActivity(rooms: RoomPreview[]) {
  return [...rooms].sort((a, b) => {
    const aTime = a.lastMessage?.created_at ?? a.created_at;
    const bTime = b.lastMessage?.created_at ?? b.created_at;
    return aTime < bTime ? 1 : -1;
  });
}

export async function createRoom(params: { name: string; createdBy: string }) {
  await supabase.from('rooms').insert({
    name: params.name,
    created_by: params.createdBy,
  });
}
