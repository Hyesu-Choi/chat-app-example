import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TopTabInset } from '@/constants/theme';
import { signOut } from '@/features/auth/api';
import { useSession } from '@/features/auth/use-session';
import { createRoom, useRooms } from '@/features/rooms/use-rooms';
import type { Room } from '@/features/rooms/types';

export default function RoomListScreen() {
  const router = useRouter();
  const { session } = useSession();
  const rooms = useRooms();
  const [newRoomName, setNewRoomName] = useState('');

  const nickname = session?.user.user_metadata.nickname ?? '익명';
  const canCreate = newRoomName.trim().length > 0;

  const handleCreateRoom = () => {
    if (!canCreate || !session) return;
    createRoom({ name: newRoomName.trim(), createdBy: session.user.id });
    setNewRoomName('');
  };

  const openRoom = (room: Room) => {
    router.push({
      pathname: '/room/[id]',
      params: { id: String(room.id), name: room.name },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">채팅방</ThemedText>
          <ThemedView style={styles.headerRight}>
            <ThemedText type="smallBold">{nickname}</ThemedText>
            <Pressable onPress={signOut}>
              <ThemedText type="link">로그아웃</ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.createRow}>
          <TextInput
            style={styles.createInput}
            value={newRoomName}
            onChangeText={setNewRoomName}
            placeholder="새 방 이름"
            onSubmitEditing={handleCreateRoom}
            returnKeyType="done"
          />
          <Pressable
            style={[styles.createButton, !canCreate && styles.createButtonDisabled]}
            onPress={handleCreateRoom}
            disabled={!canCreate}
          >
            <ThemedText style={styles.createButtonLabel}>만들기</ThemedText>
          </Pressable>
        </ThemedView>

        <FlatList
          data={rooms}
          keyExtractor={(room) => String(room.id)}
          renderItem={({ item }) => (
            <Pressable style={styles.roomRow} onPress={() => openRoom(item)}>
              <ThemedView style={styles.roomInfo}>
                <ThemedText style={styles.roomName}>{item.name}</ThemedText>
                <ThemedText type="small" numberOfLines={1} style={styles.previewText}>
                  {item.lastMessage
                    ? `${item.lastMessage.nickname}: ${item.lastMessage.content}`
                    : '아직 메시지가 없어요'}
                </ThemedText>
              </ThemedView>
              {item.lastMessage && (
                <ThemedText type="small" style={styles.previewTime}>
                  {formatPreviewTime(item.lastMessage.created_at)}
                </ThemedText>
              )}
            </Pressable>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>
              아직 방이 없어요. 첫 번째 방을 만들어보세요!
            </ThemedText>
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

function formatPreviewTime(createdAt: string) {
  const date = new Date(createdAt);
  const isToday = date.toDateString() === new Date().toDateString();
  if (isToday) {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  createInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  createButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  createButtonDisabled: {
    opacity: 0.4,
  },
  createButtonLabel: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 4,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  roomInfo: {
    flex: 1,
    gap: 2,
  },
  roomName: {
    fontWeight: '600',
  },
  previewText: {
    opacity: 0.6,
  },
  previewTime: {
    opacity: 0.5,
    marginLeft: 12,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    opacity: 0.6,
  },
});
