import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import type { Message } from './types';
import type { MessageReaction } from './use-reactions';

type RowActions = {
  onLongPress: (message: Message) => void;
  onPressImage: (url: string) => void;
  onToggleReaction: (messageId: number, emoji: string) => void;
};

export function MyMessageRow({
  message,
  readCount,
  reactions,
  onLongPress,
  onPressImage,
  onToggleReaction,
}: RowActions & {
  message: Message;
  readCount: number;
  reactions: MessageReaction[];
}) {
  const imageUrl = message.image_url;
  return (
    <ThemedView style={styles.myMessageRow}>
      <ThemedView style={styles.myMessageMeta}>
        {readCount > 0 && (
          <ThemedText style={styles.readText}>읽음 {readCount}</ThemedText>
        )}
        <ThemedText style={styles.timeText}>{formatTime(message.created_at)}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.bubbleColumnEnd}>
        {imageUrl ? (
          <Pressable
            onPress={() => onPressImage(imageUrl)}
            onLongPress={() => onLongPress(message)}
          >
            <Image style={styles.imageBubble} source={{ uri: imageUrl }} />
          </Pressable>
        ) : (
          <Pressable
            style={[styles.bubble, styles.myBubble]}
            onLongPress={() => onLongPress(message)}
          >
            <ReplyQuote message={message} myOwn />
            <ThemedText style={styles.myBubbleText}>{message.content}</ThemedText>
          </Pressable>
        )}
        <ReactionChips
          reactions={reactions}
          onToggle={(emoji) => onToggleReaction(message.id, emoji)}
        />
      </ThemedView>
    </ThemedView>
  );
}

export function OtherMessageRow({
  message,
  reactions,
  onLongPress,
  onPressImage,
  onToggleReaction,
}: RowActions & {
  message: Message;
  reactions: MessageReaction[];
}) {
  const imageUrl = message.image_url;
  return (
    <ThemedView style={styles.otherMessageRow}>
      <Avatar nickname={message.nickname} avatarUrl={message.avatar_url} />
      <ThemedView style={styles.otherMessageContent}>
        <ThemedText type="smallBold">{message.nickname}</ThemedText>
        <ThemedView style={styles.otherMessageBody}>
          <ThemedView style={styles.bubbleColumnStart}>
            {imageUrl ? (
              <Pressable
                onPress={() => onPressImage(imageUrl)}
                onLongPress={() => onLongPress(message)}
              >
                <Image style={styles.imageBubble} source={{ uri: imageUrl }} />
              </Pressable>
            ) : (
              <Pressable
                style={[styles.bubble, styles.otherBubble]}
                onLongPress={() => onLongPress(message)}
              >
                <ReplyQuote message={message} />
                <ThemedText style={styles.otherBubbleText}>{message.content}</ThemedText>
              </Pressable>
            )}
            <ReactionChips
              reactions={reactions}
              onToggle={(emoji) => onToggleReaction(message.id, emoji)}
            />
          </ThemedView>
          <ThemedText style={styles.timeText}>{formatTime(message.created_at)}</ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

// 업로드가 끝나기 전에 먼저 보여주는 내 사진 메시지 (낙관적 UI)
export function PendingImageRow({ uri }: { uri: string }) {
  return (
    <ThemedView style={styles.myMessageRow}>
      <ThemedView>
        <Image style={[styles.imageBubble, styles.pendingImage]} source={{ uri }} />
        <ActivityIndicator style={StyleSheet.absoluteFill} color="#fff" />
      </ThemedView>
    </ThemedView>
  );
}

// 답장 메시지 안에 표시되는 원본 인용 블록
function ReplyQuote({ message, myOwn = false }: { message: Message; myOwn?: boolean }) {
  if (!message.reply_to_nickname) return null;
  return (
    <ThemedView style={[styles.quote, myOwn ? styles.myQuote : styles.otherQuote]}>
      <ThemedText style={[styles.quoteName, myOwn ? styles.myBubbleText : styles.otherBubbleText]}>
        {message.reply_to_nickname}
      </ThemedText>
      <ThemedText
        numberOfLines={1}
        style={[styles.quoteContent, myOwn ? styles.myBubbleText : styles.otherBubbleText]}
      >
        {message.reply_to_content}
      </ThemedText>
    </ThemedView>
  );
}

function ReactionChips({
  reactions,
  onToggle,
}: {
  reactions: MessageReaction[];
  onToggle: (emoji: string) => void;
}) {
  if (reactions.length === 0) return null;
  return (
    <ThemedView style={styles.chipRow}>
      {reactions.map((reaction) => (
        <Pressable
          key={reaction.emoji}
          style={[styles.chip, reaction.reactedByMe && styles.chipMine]}
          onPress={() => onToggle(reaction.emoji)}
        >
          <ThemedText style={styles.chipText}>
            {reaction.emoji} {reaction.count}
          </ThemedText>
        </Pressable>
      ))}
    </ThemedView>
  );
}

function Avatar({ nickname, avatarUrl }: { nickname: string; avatarUrl: string | null }) {
  if (avatarUrl) {
    return <Image style={styles.avatar} source={{ uri: avatarUrl }} />;
  }
  return (
    <ThemedView style={[styles.avatar, styles.avatarPlaceholder]}>
      <ThemedText style={styles.avatarPlaceholderText}>
        {nickname.slice(0, 1) || '?'}
      </ThemedText>
    </ThemedView>
  );
}

function formatTime(createdAt: string) {
  return new Date(createdAt).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  myMessageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    gap: 6,
  },
  myMessageMeta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  readText: {
    fontSize: 11,
    color: '#2563eb',
  },
  otherMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  otherMessageContent: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 4,
    // 말풍선이 화면 오른쪽 끝까지 붙지 않도록 여백 확보
    marginRight: 24,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
  },
  otherMessageBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  // 말풍선과 그 아래 반응 칩을 세로로 묶는 컬럼
  bubbleColumnEnd: {
    alignItems: 'flex-end',
    gap: 4,
    // 부모가 화면 전체 너비의 행이라 여기서는 퍼센트가 안전함
    maxWidth: '75%',
  },
  bubbleColumnStart: {
    alignItems: 'flex-start',
    gap: 4,
    flexShrink: 1,
  },
  bubble: {
    flexShrink: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  myBubble: {
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 4,
  },
  myBubbleText: {
    color: '#fff',
  },
  otherBubble: {
    backgroundColor: '#e5e7eb',
    borderBottomLeftRadius: 4,
  },
  otherBubbleText: {
    color: '#111',
  },
  imageBubble: {
    width: 200,
    height: 200,
    borderRadius: 16,
    // 로딩되는 동안 빈 공간 대신 회색 배경을 보여줌
    backgroundColor: '#e5e7eb',
  },
  pendingImage: {
    opacity: 0.6,
  },
  quote: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 6,
    gap: 2,
  },
  myQuote: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  otherQuote: {
    backgroundColor: 'rgba(0, 0, 0, 0.07)',
  },
  quoteName: {
    fontSize: 11,
    fontWeight: '600',
  },
  quoteContent: {
    fontSize: 12,
    opacity: 0.8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  chip: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#e5e7eb',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipMine: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  chipText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#111',
  },
  timeText: {
    fontSize: 11,
    opacity: 0.5,
  },
});
