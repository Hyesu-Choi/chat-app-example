-- Supabase 대시보드 > SQL Editor에서 실행하세요.
-- 주의: 기존 테이블을 지우고 다시 만듭니다 (기존 방/메시지는 사라져요).

drop table if exists public.messages;
drop table if exists public.rooms;

create table public.rooms (
  id bigint generated always as identity primary key,
  name text not null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.rooms enable row level security;

create policy "authenticated can read rooms" on public.rooms
  for select to authenticated using (true);

create policy "users create own rooms" on public.rooms
  for insert to authenticated with check ((select auth.uid()) = created_by);

create table public.messages (
  id bigint generated always as identity primary key,
  room_id bigint not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  nickname text not null,
  avatar_url text,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

-- 로그인한 사람만 읽을 수 있음
create policy "authenticated can read" on public.messages
  for select to authenticated using (true);

-- 본인 user_id로만 메시지를 쓸 수 있음
create policy "users insert own messages" on public.messages
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- 본인 메시지만 삭제할 수 있음
create policy "users delete own messages" on public.messages
  for delete to authenticated using ((select auth.uid()) = user_id);

-- 실시간 구독 활성화
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.rooms;

-- 읽음 표시: 방×사람마다 어디까지 읽었는지 기록
create table public.room_reads (
  room_id bigint not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  last_read_message_id bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

alter table public.room_reads enable row level security;

create policy "authenticated can read reads" on public.room_reads
  for select to authenticated using (true);

create policy "users insert own reads" on public.room_reads
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "users update own reads" on public.room_reads
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter publication supabase_realtime add table public.room_reads;

-- 프로필 이미지 버킷 (공개 읽기, 본인 폴더에만 업로드 가능)
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

create policy "users upload own avatar" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
