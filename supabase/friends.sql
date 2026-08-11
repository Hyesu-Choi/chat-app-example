-- Supabase 대시보드 > SQL Editor에서 실행하세요.
-- 친구 시스템: 공개 프로필 테이블 + 친구 신청/수락

-- 1) profiles: 유저 검색을 위한 공개 프로필.
-- 닉네임은 auth.users의 메타데이터에만 있어서 다른 유저가 조회할 수 없음 →
-- 트리거로 자동 복사되는 공개 테이블을 둔다 (Supabase 대표 패턴).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "authenticated can read profiles" on public.profiles
  for select to authenticated using (true);
-- insert/update 정책 없음: 아래 트리거(security definer)만 쓰기 가능

-- 가입하거나 닉네임·아바타를 바꾸면 프로필을 자동 생성/갱신
create or replace function public.handle_user_change()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, nickname, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nickname', '익명'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
    set nickname = excluded.nickname,
        avatar_url = excluded.avatar_url;
  return new;
end;
$$;

create trigger on_auth_user_changed
  after insert or update of raw_user_meta_data on auth.users
  for each row execute function public.handle_user_change();

-- 기존 가입자 백필
insert into public.profiles (id, nickname, avatar_url)
select
  id,
  coalesce(raw_user_meta_data ->> 'nickname', '익명'),
  raw_user_meta_data ->> 'avatar_url'
from auth.users
on conflict (id) do nothing;

-- 2) friendships: requester가 신청하고 addressee가 수락하면 친구.
-- auth.users 대신 profiles를 참조해야 PostgREST로 프로필을 조인해서 가져올 수 있음.
create table public.friendships (
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

-- A→B와 B→A가 동시에 존재하는 중복 관계 방지 (방향과 무관하게 한 쌍당 한 행)
create unique index friendships_unique_pair on public.friendships (
  least(requester_id, addressee_id),
  greatest(requester_id, addressee_id)
);

alter table public.friendships enable row level security;

-- 나와 관련된 관계만 보임
create policy "participants read own friendships" on public.friendships
  for select to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));

-- 신청은 본인 이름으로, pending 상태로만
create policy "users send own requests" on public.friendships
  for insert to authenticated
  with check ((select auth.uid()) = requester_id and status = 'pending');

-- 수락은 신청을 받은 사람만
create policy "addressee accepts requests" on public.friendships
  for update to authenticated
  using ((select auth.uid()) = addressee_id)
  with check (status = 'accepted');

-- 거절·신청 취소·친구 삭제는 양쪽 다 가능 (모두 행 삭제로 처리)
create policy "participants delete friendships" on public.friendships
  for delete to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));
