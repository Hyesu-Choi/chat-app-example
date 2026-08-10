-- Supabase 대시보드 > SQL Editor에서 실행하세요.
-- 푸시 알림용 기기 토큰: 사용자 한 명이 기기 여러 대를 쓸 수 있어서 토큰이 기본 키입니다.

create table public.push_tokens (
  token text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  updated_at timestamptz not null default now()
);

alter table public.push_tokens enable row level security;

-- 본인 토큰만 읽기·등록·갱신·삭제 가능
-- (알림을 보내는 Edge Function은 service role 키를 써서 RLS를 통과함)
create policy "users read own tokens" on public.push_tokens
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "users insert own tokens" on public.push_tokens
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "users update own tokens" on public.push_tokens
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "users delete own tokens" on public.push_tokens
  for delete to authenticated using ((select auth.uid()) = user_id);
