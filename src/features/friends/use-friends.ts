import { useCallback, useEffect, useState } from 'react';

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
