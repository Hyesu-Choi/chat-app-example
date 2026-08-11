import { supabase } from '@/lib/supabase';

import type { FriendshipStatus, Profile } from './types';

export type FriendshipRow = {
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  requester: Profile;
  addressee: Profile;
};

// 닉네임으로 유저 검색 (나 자신은 제외)
export async function searchProfiles(keyword: string, myUserId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('id, nickname, avatar_url')
    .ilike('nickname', `%${keyword}%`)
    .neq('id', myUserId)
    .limit(20);
  return (data ?? []) as Profile[];
}

// 내가 얽힌 모든 친구 관계를 양쪽 프로필과 함께 조회
export async function fetchFriendships(myUserId: string) {
  const { data } = await supabase
    .from('friendships')
    .select(
      `requester_id, addressee_id, status,
       requester:profiles!friendships_requester_id_fkey (id, nickname, avatar_url),
       addressee:profiles!friendships_addressee_id_fkey (id, nickname, avatar_url)`,
    )
    .or(`requester_id.eq.${myUserId},addressee_id.eq.${myUserId}`);
  return (data ?? []) as unknown as FriendshipRow[];
}

export async function sendFriendRequest(myUserId: string, targetId: string) {
  const { error } = await supabase
    .from('friendships')
    .insert({ requester_id: myUserId, addressee_id: targetId });
  return { error: error?.message ?? null };
}

export async function acceptFriendRequest(requesterId: string, myUserId: string) {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('requester_id', requesterId)
    .eq('addressee_id', myUserId);
  return { error: error?.message ?? null };
}

// 거절·신청 취소·친구 삭제 모두 행 삭제 (방향을 모르므로 양방향으로 지움)
export async function removeFriendship(myUserId: string, otherId: string) {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(
      `and(requester_id.eq.${myUserId},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${myUserId})`,
    );
  return { error: error?.message ?? null };
}
