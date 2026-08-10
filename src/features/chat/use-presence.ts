import { useEffect, useState } from 'react';

import { supabase, teardownStaleChannel } from '@/lib/supabase';

export function usePresence(roomId: number, userId: string | undefined, nickname: string) {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    // presence는 모두가 같은 채널 이름으로 모여야 해서, 정리 중인 이전 채널을 먼저 파기
    const topic = `presence:room:${roomId}`;
    teardownStaleChannel(topic);
    const channel = supabase.channel(topic, {
      config: { presence: { key: userId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        setOnlineCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.track({ nickname });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, userId, nickname]);

  return onlineCount;
}
