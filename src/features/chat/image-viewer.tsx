import { Image } from 'expo-image';
import { Modal, Pressable, StyleSheet } from 'react-native';

// 사진을 전체 화면으로 보여주는 뷰어. 아무 곳이나 누르면 닫힙니다.
export function ImageViewer({ url, onClose }: { url: string | null; onClose: () => void }) {
  return (
    <Modal visible={url !== null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {url && (
          <Image
            style={styles.image}
            source={{ uri: url }}
            contentFit="contain"
            pointerEvents="none"
          />
        )}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '80%',
  },
});
