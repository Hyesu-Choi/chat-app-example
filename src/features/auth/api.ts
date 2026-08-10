import { supabase } from '@/lib/supabase';

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}

export async function signUp(params: {
  nickname: string;
  email: string;
  password: string;
}) {
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: { data: { nickname: params.nickname } },
  });

  if (error) {
    return { error: error.message, needsEmailConfirmation: false };
  }
  // 이메일 확인이 켜져 있으면 세션 없이 가입만 되고, 메일의 링크를 눌러야 로그인됨
  return { error: null, needsEmailConfirmation: !data.session };
}

export async function signOut() {
  await supabase.auth.signOut();
}
