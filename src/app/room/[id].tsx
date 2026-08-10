import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSession } from '@/features/auth/use-session';
import { pickImage, sendImageMessage } from '@/features/chat/image-message';
import { ImageViewer } from '@/features/chat/image-viewer';
import { MessageActions } from '@/features/chat/message-actions';
import { MyMessageRow, OtherMessageRow, PendingImageRow } from '@/features/chat/message-rows';
import { deleteMessage, sendMessage, useMessages } from '@/features/chat/use-messages';
import { useReactions } from '@/features/chat/use-reactions';
import type { Message } from '@/features/chat/types';
import { usePresence } from '@/features/chat/use-presence';
import { useReadReceipts } from '@/features/chat/use-read-receipts';
import { useTyping } from '@/features/chat/use-typing';

export default function RoomScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const roomId = Number(id);

  const { session } = useSession();
  const { messages, loadOlderMessages, isLoadingOlder } = useMessages(roomId);
  const [draft, setDraft] = useState('');
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [viewerImageUrl, setViewerImageUrl] = useState<string | null>(null);
  const [actionTarget, setActionTarget] = useState<Message | null>(null);
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);

  const nickname = session?.user.user_metadata.nickname ?? '익명';
  const avatarUrl = (session?.user.user_metadata.avatar_url as string | undefined) ?? null;
  const onlineCount = usePresence(roomId, session?.user.id, nickname);
  const { typingNicknames, notifyTyping } = useTyping(roomId, session?.user.id, nickname);
  const { markAsRead, countReaders } = useReadReceipts(roomId, session?.user.id);
  const { reactionsFor, toggleReaction } = useReactions(roomId, session?.user.id);
  const canSend = draft.trim().length > 0;

  // 방을 보고 있는 동안은 도착한 최신 메시지까지 읽은 것으로 기록
  const newestMessageId = messages[0]?.id;
  useEffect(() => {
    if (newestMessageId) markAsRead(newestMessageId);
  }, [newestMessageId, markAsRead]);

  const handleChangeDraft = (text: string) => {
    setDraft(text);
    if (text.length > 0) notifyTyping();
  };

  const handleSend = () => {
    if (!canSend || !session) return;
    sendMessage({
      roomId,
      userId: session.user.id,
      nickname,
      avatarUrl,
      content: draft.trim(),
      replyTo: replyTarget && {
        id: replyTarget.id,
        nickname: replyTarget.nickname,
        content: replyPreviewText(replyTarget),
      },
    });
    setDraft('');
    setReplyTarget(null);
  };

  const handlePickImage = async () => {
    if (!session || pendingImageUri) return;
    const picked = await pickImage();
    if (!picked) return;

    // 업로드가 끝나기 전에 미리보기를 먼저 보여줌 (낙관적 UI)
    setPendingImageUri(picked.uri);
    const { error } = await sendImageMessage({
      roomId,
      userId: session.user.id,
      nickname,
      avatarUrl,
      uri: picked.uri,
      mimeType: picked.mimeType,
    });
    setPendingImageUri(null);
    if (error) alertError('사진을 보내지 못했어요. 다시 시도해주세요.');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.safeArea}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ThemedView style={styles.header}>
            <Pressable onPress={() => router.back()}>
              <ThemedText type="link">‹ 목록</ThemedText>
            </Pressable>
            <ThemedText type="subtitle">{name ?? '채팅'}</ThemedText>
            {onlineCount > 0 && (
              <ThemedText type="small" style={styles.onlineCount}>
                {onlineCount}명 접속 중
              </ThemedText>
            )}
          </ThemedView>

          <FlatList
            data={messages}
            keyExtractor={(message) => String(message.id)}
            renderItem={({ item }) =>
              item.user_id === session?.user.id ? (
                <MyMessageRow
                  message={item}
                  readCount={countReaders(item.id)}
                  reactions={reactionsFor(item.id)}
                  onLongPress={setActionTarget}
                  onPressImage={setViewerImageUrl}
                  onToggleReaction={toggleReaction}
                />
              ) : (
                <OtherMessageRow
                  message={item}
                  reactions={reactionsFor(item.id)}
                  onLongPress={setActionTarget}
                  onPressImage={setViewerImageUrl}
                  onToggleReaction={toggleReaction}
                />
              )
            }
            inverted
            // inverted 리스트라 헤더가 화면 맨 아래(최신 메시지 자리)에 그려짐
            ListHeaderComponent={
              pendingImageUri ? <PendingImageRow uri={pendingImageUri} /> : null
            }
            contentContainerStyle={styles.listContent}
            onEndReached={loadOlderMessages}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              isLoadingOlder ? <ActivityIndicator style={styles.loadingOlder} /> : null
            }
          />

          {typingNicknames.length > 0 && (
            <ThemedText type="small" style={styles.typingText}>
              {typingNicknames.join(', ')} 입력 중...
            </ThemedText>
          )}

          {replyTarget && (
            <ThemedView style={styles.replyBar}>
              <ThemedView style={styles.replyBarBody}>
                <ThemedText type="smallBold">{replyTarget.nickname}에게 답장</ThemedText>
                <ThemedText type="small" numberOfLines={1} style={styles.replyBarContent}>
                  {replyPreviewText(replyTarget)}
                </ThemedText>
              </ThemedView>
              <Pressable onPress={() => setReplyTarget(null)} style={styles.replyBarClose}>
                <ThemedText>✕</ThemedText>
              </Pressable>
            </ThemedView>
          )}

          <ThemedView style={styles.inputRow}>
            <Pressable
              style={styles.photoButton}
              onPress={handlePickImage}
              disabled={pendingImageUri !== null}
            >
              <ThemedText style={styles.photoButtonLabel}>＋</ThemedText>
            </Pressable>
            <TextInput
              style={styles.messageInput}
              value={draft}
              onChangeText={handleChangeDraft}
              placeholder="메시지를 입력하세요"
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <Pressable
              style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!canSend}
            >
              <ThemedText style={styles.sendButtonLabel}>전송</ThemedText>
            </Pressable>
          </ThemedView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <ImageViewer url={viewerImageUrl} onClose={() => setViewerImageUrl(null)} />

      <MessageActions
        message={actionTarget}
        isMine={actionTarget?.user_id === session?.user.id}
        onClose={() => setActionTarget(null)}
        onReact={(emoji) => {
          if (actionTarget) toggleReaction(actionTarget.id, emoji);
          setActionTarget(null);
        }}
        onReply={() => {
          setReplyTarget(actionTarget);
          setActionTarget(null);
        }}
        onDelete={() => {
          const target = actionTarget;
          setActionTarget(null);
          if (target) confirmDelete(() => deleteMessage(target.id));
        }}
      />
    </ThemedView>
  );
}

// 답장 인용에 보여줄 원본 요약 (사진 메시지는 텍스트가 없으므로)
function replyPreviewText(message: Message) {
  return message.image_url ? '사진 📷' : message.content;
}

function alertError(message: string) {
  if (Platform.OS === 'web') {
    window.alert(message);
    return;
  }
  Alert.alert('오류', message);
}

function confirmDelete(onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm('이 메시지를 삭제할까요?')) onConfirm();
    return;
  }
  Alert.alert('메시지 삭제', '이 메시지를 삭제할까요?', [
    { text: '취소', style: 'cancel' },
    { text: '삭제', style: 'destructive', onPress: onConfirm },
  ]);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  loadingOlder: {
    paddingVertical: 12,
  },
  onlineCount: {
    marginLeft: 'auto',
    opacity: 0.6,
  },
  typingText: {
    paddingHorizontal: 16,
    opacity: 0.6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  replyBarBody: {
    flex: 1,
    gap: 2,
    backgroundColor: 'transparent',
  },
  replyBarContent: {
    opacity: 0.6,
  },
  replyBarClose: {
    padding: 4,
  },
  photoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButtonLabel: {
    fontSize: 20,
    lineHeight: 24,
    opacity: 0.6,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButton: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonLabel: {
    color: '#fff',
  },
});
