import { useCallback, useEffect, useState } from 'react';

import { supabase, uniqueChannelName } from '@/lib/supabase';

import {
  acceptFriendRequest,
  fetchFriendships,
  removeFriendship,
  sendFriendRequest,
  type FriendshipRow,
} from './api';
import type { Profile, Relation } from './types';

export function useFriends(myUserId: string | undefined) {
  const [rows, setRows] = useState<FriendshipRow[]>([]);

  const refresh = useCallback(async () => {
    if (!myUserId) return;
    setRows(await fetchFriendships(myUserId));
  }, [myUserId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // 상대가 수락·거절·신청하면 실시간으로 목록 갱신
  useEffect(() => {
    if (!myUserId) return;

    const channel = supabase
      .channel(uniqueChannelName(`friendships:${myUserId}`))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships' },
        (payload) => {
          const row = (payload.eventType === 'DELETE' ? payload.old : payload.new) as {
            requester_id?: string;
            addressee_id?: string;
          };
          // INSERT/UPDATE는 RLS 덕에 내 행만 오지만, DELETE는 모두에게 와서 직접 거름
          if (row.requester_id === myUserId || row.addressee_id === myUserId) {
            refresh();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myUserId, refresh]);

  // 관계 행에서 "상대방" 프로필을 꺼냄
  const otherOf = (row: FriendshipRow): Profile =>
    row.requester_id === myUserId ? row.addressee : row.requester;

  const friends = rows.filter((row) => row.status === 'accepted').map(otherOf);
  const receivedRequests = rows
    .filter((row) => row.status === 'pending' && row.addressee_id === myUserId)
    .map((row) => row.requester);
  const sentRequests = rows
    .filter((row) => row.status === 'pending' && row.requester_id === myUserId)
    .map((row) => row.addressee);

  const relationTo = (profileId: string): Relation => {
    if (friends.some((profile) => profile.id === profileId)) return 'friend';
    if (sentRequests.some((profile) => profile.id === profileId)) return 'sent';
    if (receivedRequests.some((profile) => profile.id === profileId)) return 'received';
    return 'none';
  };

  const sendRequest = async (targetId: string) => {
    if (!myUserId) return;
    await sendFriendRequest(myUserId, targetId);
    await refresh();
  };

  const accept = async (requesterId: string) => {
    if (!myUserId) return;
    await acceptFriendRequest(requesterId, myUserId);
    await refresh();
  };

  const remove = async (otherId: string) => {
    if (!myUserId) return;
    await removeFriendship(myUserId, otherId);
    await refresh();
  };

  return { friends, receivedRequests, sentRequests, relationTo, sendRequest, accept, remove };
}
