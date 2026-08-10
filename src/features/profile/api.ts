import { supabase } from '@/lib/supabase';

export async function updateNickname(nickname: string) {
  const { error } = await supabase.auth.updateUser({ data: { nickname } });
  return { error: error?.message ?? null };
}

export async function uploadAvatar(params: {
  userId: string;
  uri: string;
  mimeType: string | undefined;
}) {
  const contentType = params.mimeType ?? 'image/jpeg';
  const extension = contentType.split('/')[1] ?? 'jpg';
  // 업로드마다 새 파일명을 써서 이전 이미지 캐시가 남는 문제를 피함
  const path = `${params.userId}/${Date.now()}.${extension}`;

  const fileData = await fetch(params.uri).then((response) => response.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, fileData, { contentType });
  if (uploadError) return { error: uploadError.message };

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  const { error: updateError } = await supabase.auth.updateUser({
    data: { avatar_url: data.publicUrl },
  });
  return { error: updateError?.message ?? null };
}
