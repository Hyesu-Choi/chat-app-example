-- Supabase 대시보드 > SQL Editor에서 실행하세요.
-- 사진 메시지: messages에 이미지 URL 컬럼을 추가하고, 채팅 이미지 버킷을 만듭니다.

alter table public.messages add column image_url text;

-- 텍스트가 비어 있으면 이미지라도 있어야 함 (둘 다 없는 빈 메시지 방지)
alter table public.messages
  add constraint message_has_content check (content <> '' or image_url is not null);

-- 채팅 이미지 버킷 (공개 읽기, 본인 폴더에만 업로드 가능 — avatars 버킷과 같은 구조)
insert into storage.buckets (id, name, public) values ('chat-images', 'chat-images', true);

create policy "users upload own chat images" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'chat-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
