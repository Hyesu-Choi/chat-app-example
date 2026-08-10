import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TopTabInset } from '@/constants/theme';
import { updateNickname, uploadAvatar } from '@/features/profile/api';
import { useSession } from '@/features/auth/use-session';

export default function ProfileScreen() {
  const { session } = useSession();
  const [nickname, setNickname] = useState(
    session?.user.user_metadata.nickname ?? '',
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const avatarUrl = session?.user.user_metadata.avatar_url as string | undefined;
  const canSave = nickname.trim().length > 0 && !isSaving;

  const handlePickAvatar = async () => {
    if (!session || isUploading) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    setIsUploading(true);
    setStatusMessage(null);
    const asset = result.assets[0];
    const { error } = await uploadAvatar({
      userId: session.user.id,
      uri: asset.uri,
      mimeType: asset.mimeType ?? undefined,
    });
    setStatusMessage(error ? `업로드 실패: ${error}` : '프로필 사진을 변경했어요.');
    setIsUploading(false);
  };

  const handleSaveNickname = async () => {
    if (!canSave) return;

    setIsSaving(true);
    setStatusMessage(null);
    const { error } = await updateNickname(nickname.trim());
    setStatusMessage(error ? `저장 실패: ${error}` : '닉네임을 변경했어요.');
    setIsSaving(false);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">프로필</ThemedText>
        </ThemedView>

        <ThemedView style={styles.content}>
          <Pressable style={styles.avatarSection} onPress={handlePickAvatar}>
            {avatarUrl ? (
              <Image style={styles.avatar} source={{ uri: avatarUrl }} />
            ) : (
              <ThemedView style={[styles.avatar, styles.avatarPlaceholder]}>
                <ThemedText style={styles.avatarPlaceholderText}>
                  {nickname.slice(0, 1) || '?'}
                </ThemedText>
              </ThemedView>
            )}
            {isUploading ? (
              <ActivityIndicator />
            ) : (
              <ThemedText type="link">사진 변경</ThemedText>
            )}
          </Pressable>

          <ThemedView style={styles.field}>
            <ThemedText type="smallBold">닉네임</ThemedText>
            <ThemedView style={styles.nicknameRow}>
              <TextInput
                style={styles.nicknameInput}
                value={nickname}
                onChangeText={setNickname}
                placeholder="닉네임"
                onSubmitEditing={handleSaveNickname}
                returnKeyType="done"
              />
              <Pressable
                style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
                onPress={handleSaveNickname}
                disabled={!canSave}
              >
                <ThemedText style={styles.saveButtonLabel}>저장</ThemedText>
              </Pressable>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.field}>
            <ThemedText type="smallBold">이메일</ThemedText>
            <ThemedText style={styles.emailText}>{session?.user.email}</ThemedText>
          </ThemedView>

          {statusMessage && <ThemedText>{statusMessage}</ThemedText>}
        </ThemedView>
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
    paddingTop: TopTabInset,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    paddingHorizontal: 16,
    gap: 24,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    color: '#fff',
    fontSize: 36,
    lineHeight: 44,
  },
  field: {
    gap: 6,
  },
  nicknameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nicknameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonLabel: {
    color: '#fff',
  },
  emailText: {
    opacity: 0.7,
  },
});
