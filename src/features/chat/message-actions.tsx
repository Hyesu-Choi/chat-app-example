import { Modal, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import type { Message } from './types';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢'];

// 메시지를 길게 눌렀을 때 뜨는 메뉴: 이모지 반응 · 답장 · (내 메시지면) 삭제
export function MessageActions({
  message,
  isMine,
  onClose,
  onReact,
  onReply,
  onDelete,
}: {
  message: Message | null;
  isMine: boolean;
  onClose: () => void;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onDelete: () => void;
}) {
  return (
    <Modal visible={message !== null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <ThemedView style={styles.sheet}>
          <ThemedView style={styles.emojiRow}>
            {EMOJIS.map((emoji) => (
              <Pressable key={emoji} style={styles.emojiButton} onPress={() => onReact(emoji)}>
                <ThemedText style={styles.emoji}>{emoji}</ThemedText>
              </Pressable>
            ))}
          </ThemedView>
          <Pressable style={styles.actionRow} onPress={onReply}>
            <ThemedText>답장</ThemedText>
          </Pressable>
          {isMine && (
            <Pressable style={styles.actionRow} onPress={onDelete}>
              <ThemedText style={styles.deleteText}>삭제</ThemedText>
            </Pressable>
          )}
        </ThemedView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 8,
    paddingBottom: 24,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 12,
  },
  emojiButton: {
    padding: 8,
  },
  emoji: {
    fontSize: 28,
    lineHeight: 34,
  },
  actionRow: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  deleteText: {
    color: '#dc2626',
  },
});
