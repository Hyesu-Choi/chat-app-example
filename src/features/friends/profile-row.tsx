import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import type { Profile } from './types';

// 프로필 한 줄. 오른쪽에 올 버튼은 화면마다 달라서 children으로 받음 (합성)
export function ProfileRow({ profile, children }: { profile: Profile; children?: ReactNode }) {
  return (
    <ThemedView style={styles.row}>
      {profile.avatar_url ? (
        <Image style={styles.avatar} source={{ uri: profile.avatar_url }} />
      ) : (
        <ThemedView style={[styles.avatar, styles.avatarPlaceholder]}>
          <ThemedText style={styles.avatarPlaceholderText}>
            {profile.nickname.slice(0, 1) || '?'}
          </ThemedText>
        </ThemedView>
      )}
      <ThemedText style={styles.nickname}>{profile.nickname}</ThemedText>
      {children}
    </ThemedView>
  );
}

export function RowButton({
  label,
  onPress,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <Pressable
      style={[styles.button, variant === 'secondary' && styles.buttonSecondary]}
      onPress={onPress}
    >
      <ThemedText
        type="small"
        style={variant === 'secondary' ? styles.buttonSecondaryLabel : styles.buttonLabel}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

// 버튼 대신 상태만 보여줄 때 (이미 친구, 신청됨)
export function RowStatus({ label }: { label: string }) {
  return (
    <ThemedText type="small" style={styles.statusText}>
      {label}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 20,
  },
  nickname: {
    flex: 1,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buttonLabel: {
    color: '#fff',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  buttonSecondaryLabel: {
    opacity: 0.7,
  },
  statusText: {
    opacity: 0.5,
  },
});
