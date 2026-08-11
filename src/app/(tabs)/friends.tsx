import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TopTabInset } from '@/constants/theme';
import { useSession } from '@/features/auth/use-session';
import { searchProfiles } from '@/features/friends/api';
import { ProfileRow, RowButton, RowStatus } from '@/features/friends/profile-row';
import { useFriends } from '@/features/friends/use-friends';
import type { Profile, Relation } from '@/features/friends/types';

export default function FriendsScreen() {
  const { session } = useSession();
  const myUserId = session?.user.id;
  const { friends, receivedRequests, sentRequests, relationTo, sendRequest, accept, remove } =
    useFriends(myUserId);

  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const canSearch = keyword.trim().length > 0;

  const handleSearch = async () => {
    if (!canSearch || !myUserId) return;
    setResults(await searchProfiles(keyword.trim(), myUserId));
    setHasSearched(true);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">친구</ThemedText>
        </ThemedView>

        <ThemedView style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={keyword}
            onChangeText={setKeyword}
            placeholder="닉네임으로 검색"
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <Pressable
            style={[styles.searchButton, !canSearch && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={!canSearch}
          >
            <ThemedText style={styles.searchButtonLabel}>검색</ThemedText>
          </Pressable>
        </ThemedView>

        <ScrollView contentContainerStyle={styles.content}>
          {hasSearched && (
            <Section title="검색 결과">
              {results.length === 0 && <EmptyText>검색 결과가 없어요</EmptyText>}
              {results.map((profile) => (
                <ProfileRow key={profile.id} profile={profile}>
                  <SearchResultAction
                    relation={relationTo(profile.id)}
                    onRequest={() => sendRequest(profile.id)}
                    onAccept={() => accept(profile.id)}
                  />
                </ProfileRow>
              ))}
            </Section>
          )}

          {receivedRequests.length > 0 && (
            <Section title={`받은 신청 ${receivedRequests.length}`}>
              {receivedRequests.map((profile) => (
                <ProfileRow key={profile.id} profile={profile}>
                  <RowButton label="수락" onPress={() => accept(profile.id)} />
                  <RowButton label="거절" variant="secondary" onPress={() => remove(profile.id)} />
                </ProfileRow>
              ))}
            </Section>
          )}

          {sentRequests.length > 0 && (
            <Section title="보낸 신청">
              {sentRequests.map((profile) => (
                <ProfileRow key={profile.id} profile={profile}>
                  <RowButton label="취소" variant="secondary" onPress={() => remove(profile.id)} />
                </ProfileRow>
              ))}
            </Section>
          )}

          <Section title={`친구 ${friends.length}`}>
            {friends.length === 0 && (
              <EmptyText>아직 친구가 없어요. 닉네임으로 검색해보세요!</EmptyText>
            )}
            {friends.map((profile) => (
              <ProfileRow key={profile.id} profile={profile} />
            ))}
          </Section>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function SearchResultAction({
  relation,
  onRequest,
  onAccept,
}: {
  relation: Relation;
  onRequest: () => void;
  onAccept: () => void;
}) {
  if (relation === 'friend') return <RowStatus label="친구" />;
  if (relation === 'sent') return <RowStatus label="신청됨" />;
  if (relation === 'received') return <RowButton label="수락" onPress={onAccept} />;
  return <RowButton label="친구 신청" onPress={onRequest} />;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <ThemedView style={styles.section}>
      <ThemedText type="smallBold" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      {children}
    </ThemedView>
  );
}

function EmptyText({ children }: { children: string }) {
  return <ThemedText style={styles.emptyText}>{children}</ThemedText>;
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchButtonDisabled: {
    opacity: 0.4,
  },
  searchButtonLabel: {
    color: '#fff',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 20,
  },
  section: {
    gap: 4,
  },
  sectionTitle: {
    opacity: 0.6,
  },
  emptyText: {
    opacity: 0.6,
    paddingVertical: 8,
  },
});
