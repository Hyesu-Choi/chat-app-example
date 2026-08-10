import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

const IMAGE_QUALITY = 0.7;

// 갤러리에서 사진을 고릅니다. 취소하면 null을 반환합니다.
export async function pickImage() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: IMAGE_QUALITY,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  return { uri: asset.uri, mimeType: asset.mimeType };
}

// 사진을 Storage에 올리고, 그 URL로 메시지를 보냅니다.
export async function sendImageMessage(params: {
  roomId: number;
  userId: string;
  nickname: string;
  avatarUrl: string | null;
  uri: string;
  mimeType: string | undefined;
}) {
  const contentType = params.mimeType ?? 'image/jpeg';
  const extension = contentType.split('/')[1] ?? 'jpg';
  const path = `${params.userId}/${Date.now()}.${extension}`;

  const fileData = await fetch(params.uri).then((response) => response.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from('chat-images')
    .upload(path, fileData, { contentType });
  if (uploadError) return { error: uploadError.message };

  const { data } = supabase.storage.from('chat-images').getPublicUrl(path);
  const { error: insertError } = await supabase.from('messages').insert({
    room_id: params.roomId,
    user_id: params.userId,
    nickname: params.nickname,
    avatar_url: params.avatarUrl,
    content: '',
    image_url: data.publicUrl,
  });
  return { error: insertError?.message ?? null };
}
