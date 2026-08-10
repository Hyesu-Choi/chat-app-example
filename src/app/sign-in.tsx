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
import { signIn } from '@/features/auth/api';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isSubmitting;

  const handleSignIn = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await signIn(email.trim(), password);
    if (error) {
      setErrorMessage('이메일 또는 비밀번호를 확인해주세요.');
    }
    // 성공하면 세션이 생기면서 루트 레이아웃이 채팅 화면으로 보내줌
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
            <ThemedText type="title">로그인</ThemedText>

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
              placeholder="비밀번호"
              secureTextEntry
              onSubmitEditing={handleSignIn}
              returnKeyType="done"
            />

            {errorMessage && (
              <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
            )}

            <Pressable
              style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
              onPress={handleSignIn}
              disabled={!canSubmit}
            >
              <ThemedText style={styles.submitButtonLabel}>로그인</ThemedText>
            </Pressable>

            <Link href="/sign-up" style={styles.switchLink}>
              <ThemedText type="link">계정이 없나요? 회원가입</ThemedText>
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
