import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ModalSurface } from './ModalSurface';

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function StackModal({ visible, title, onClose, children }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <Pressable onPress={onClose} className="flex-1" />
        <View style={{ paddingBottom: insets.bottom + 12 }} className="px-4">
          <ModalSurface title={title} onClose={onClose}>
            {children}
          </ModalSurface>
        </View>
      </View>
    </Modal>
  );
}
