import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// supabase.channel()은 같은 이름의 채널이 살아 있으면 새로 만들지 않고 그걸 돌려준다.
// 채널 제거(removeChannel)는 서버 응답을 기다리는 비동기라, 화면을 빠르게 나갔다
// 다시 들어오면 아직 정리 중인 옛 채널을 돌려받아 "cannot add ... callbacks after
// subscribe()" 에러가 난다. 그래서 구독마다 이름을 다르게 만든다.
// (postgres_changes는 채널 이름이 서버 라우팅에 쓰이지 않아 이름을 바꿔도 됨)
let channelSequence = 0;
export function uniqueChannelName(prefix: string) {
  channelSequence += 1;
  return `${prefix}:${channelSequence}`;
}

// broadcast·presence 채널은 모든 클라이언트가 같은 이름으로 모여야 해서 이름을 바꿀 수
// 없다. 대신 정리 중인 이전 채널이 남아 있으면 즉시 파기해 깨끗하게 다시 쓸 수 있게 한다.
export function teardownStaleChannel(topic: string) {
  const stale = supabase
    .getChannels()
    .find((channel) => channel.topic === `realtime:${topic}`);
  stale?.teardown();
}
