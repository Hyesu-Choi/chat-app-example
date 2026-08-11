export type Profile = {
  id: string;
  nickname: string;
  avatar_url: string | null;
};

export type FriendshipStatus = 'pending' | 'accepted';

// 검색 결과의 상대와 나의 관계
export type Relation = 'none' | 'friend' | 'sent' | 'received';
