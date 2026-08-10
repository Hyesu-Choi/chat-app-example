export type Message = {
  id: number;
  room_id: number;
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  content: string;
  image_url: string | null;
  reply_to_id: number | null;
  reply_to_nickname: string | null;
  reply_to_content: string | null;
  created_at: string;
};
