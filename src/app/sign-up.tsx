import { Link } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { signUp } from '@/features/auth/api';

const MIN_PASSWORD_LENGTH = 6;

export default function SignUpScreen() {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    nickname.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= MIN_PASSWORD_LENGTH &&
    !isSubmitting;

  const handleSignUp = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);

    const { error, needsEmailConfirmation } = await signUp({
      nickname: nickname.trim(),
      email: email.trim(),
      password,
    });

    if (error) {
      setErrorMessage(error);
    } else if (needsEmailConfirmation) {
      setInfoMessage('가입 확인 메일을 보냈어요. 메일의 링크를 누른 뒤 로그인해주세요.');
    }
    // 이메일 확인이 꺼져 있으면 바로 세션이 생기면서 채팅 화면으로 이동함
    setIsSubmitting(false);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.safeArea}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ThemedView style={styles.form}>
            <ThemedText type="title">회원가입</ThemedText>

            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              placeholder="닉네임"
            />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="이메일"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={`비밀번호 (${MIN_PASSWORD_LENGTH}자 이상)`}
              secureTextEntry
              onSubmitEditing={handleSignUp}
              returnKeyType="done"
            />

            {errorMessage && (
              <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
            )}
            {infoMessage && <ThemedText>{infoMessage}</ThemedText>}

            <Pressable
              style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
              onPress={handleSignUp}
              disabled={!canSubmit}
            >
              <ThemedText style={styles.submitButtonLabel}>가입하기</ThemedText>
            </Pressable>

            <Link href="/sign-in" style={styles.switchLink}>
              <ThemedText type="link">이미 계정이 있나요? 로그인</ThemedText>
            </Link>
          </ThemedView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    color: '#dc2626',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonLabel: {
    color: '#fff',
  },
  switchLink: {
    alignSelf: 'center',
    marginTop: 8,
  },
});
