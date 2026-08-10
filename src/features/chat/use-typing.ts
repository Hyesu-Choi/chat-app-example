import type { RealtimeChannel } from '@supabase/supabase-js';
import { useEffect, useRef, useState } from 'react';

import { supabase, teardownStaleChannel } from '@/lib/supabase';

// 신호가 이 시간 동안 안 오면 "입력 중"에서 지움
const TYPING_EXPIRE_MS = 3000;
// 타이핑 신호를 너무 자주 보내지 않도록 제한
const TYPING_NOTIFY_THROTTLE_MS = 1500;

type TypingPayload = { userId: string; nickname: string };

export function useTyping(roomId: number, userId: string | undefined, nickname: string) {
  const [typingNicknamesByUserId, setTypingNicknamesByUserId] = useState<
    Record<string, string>
  >({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  const expireTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const lastNotifiedAtRef = useRef(0);

  useEffect(() => {
    const timers = expireTimersRef.current;

    // broadcast는 모두가 같은 채널 이름으로 모여야 해서, 정리 중인 이전 채널을 먼저 파기
    const topic = `typing:room:${roomId}`;
    teardownStaleChannel(topic);
    const channel = supabase
      .channel(topic)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const sender = payload as TypingPayload;
        if (sender.userId === userId) return;

        setTypingNicknamesByUserId((prev) => ({
          ...prev,
          [sender.userId]: sender.nickname,
        }));

        clearTimeout(timers[sender.userId]);
        timers[sender.userId] = setTimeout(() => {
          setTypingNicknamesByUserId((prev) => {
            const { [sender.userId]: _expired, ...rest } = prev;
            return rest;
          });
        }, TYPING_EXPIRE_MS);
      })
      .subscribe();
    channelRef.current = channel;

    return () => {
      Object.values(timers).forEach(clearTimeout);
      expireTimersRef.current = {};
      setTypingNicknamesByUserId({});
      supabase.removeChannel(channel);
    };
  }, [roomId, userId]);

  const notifyTyping = () => {
    if (!userId) return;

    const now = Date.now();
    if (now - lastNotifiedAtRef.current < TYPING_NOTIFY_THROTTLE_MS) return;
    lastNotifiedAtRef.current = now;

    channelRef.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId, nickname } satisfies TypingPayload,
    });
  };

  return { typingNicknames: Object.values(typingNicknamesByUserId), notifyTyping };
}
