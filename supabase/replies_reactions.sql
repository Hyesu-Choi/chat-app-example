-- Supabase 대시보드 > SQL Editor에서 실행하세요.
-- 답장 + 이모지 반응

-- 답장: 원본 메시지를 가리키는 자기참조 컬럼.
-- 닉네임·내용은 스냅샷으로 함께 저장합니다 (messages의 nickname처럼 —
-- 원본이 화면에 로드 안 됐거나 삭제돼도 인용을 보여줄 수 있음).
alter table public.messages
  add column reply_to_id bigint references public.messages (id) on delete set null,
  add column reply_to_nickname text,
  add column reply_to_content text;

-- 이모지 반응: 누가 어떤 메시지에 어떤 이모지를 달았는지.
-- 복합 기본 키로 "같은 사람이 같은 메시지에 같은 이모지는 한 번만"을 DB가 보장합니다.
create table public.message_reactions (
  message_id bigint not null references public.messages (id) on delete cascade,
  room_id bigint not null references public.rooms (id) on delete cascade, -- realtime 필터용
  user_id uuid not null references auth.users (id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

alter table public.message_reactions enable row level security;

create policy "authenticated can read reactions" on public.message_reactions
  for select to authenticated using (true);

create policy "users insert own reactions" on public.message_reactions
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "users delete own reactions" on public.message_reactions
  for delete to authenticated using ((select auth.uid()) = user_id);

alter publication supabase_realtime add table public.message_reactions;
