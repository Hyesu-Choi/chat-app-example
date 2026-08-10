// messages 테이블에 INSERT가 일어나면 Database Webhook이 이 함수를 호출합니다.
// 보낸 사람을 제외한 모든 기기에 Expo Push API로 알림을 보냅니다.
import { createClient } from 'npm:@supabase/supabase-js@2';

type WebhookPayload = {
  type: 'INSERT';
  table: string;
  record: {
    id: number;
    room_id: number;
    user_id: string;
    nickname: string;
    content: string;
    image_url: string | null;
  };
};

// Expo Push API는 요청 하나에 알림 100개까지 받음
const PUSH_CHUNK_SIZE = 100;

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json();
  if (payload.type !== 'INSERT' || payload.table !== 'messages') {
    return new Response('ignored', { status: 200 });
  }
  const message = payload.record;

  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token')
    .neq('user_id', message.user_id);

  if (!tokens || tokens.length === 0) {
    return new Response('no tokens', { status: 200 });
  }

  const { data: room } = await supabase
    .from('rooms')
    .select('name')
    .eq('id', message.room_id)
    .single();

  const body = message.image_url ? '사진을 보냈어요 📷' : message.content;
  const notifications = tokens.map(({ token }) => ({
    to: token,
    title: room?.name ?? '새 메시지',
    body: `${message.nickname}: ${body}`,
    data: { roomId: message.room_id },
    channelId: 'default',
  }));

  const invalidTokens: string[] = [];

  for (let i = 0; i < notifications.length; i += PUSH_CHUNK_SIZE) {
    const chunk = notifications.slice(i, i + PUSH_CHUNK_SIZE);
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chunk),
    });

    // 티켓을 확인해서 앱 삭제 등으로 무효해진 토큰을 걸러냄
    const { data: tickets } = await response.json();
    tickets?.forEach((ticket: { status: string; details?: { error?: string } }, index: number) => {
      if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
        invalidTokens.push(chunk[index].to);
      }
    });
  }

  if (invalidTokens.length > 0) {
    await supabase.from('push_tokens').delete().in('token', invalidTokens);
  }

  return new Response('ok', { status: 200 });
});
