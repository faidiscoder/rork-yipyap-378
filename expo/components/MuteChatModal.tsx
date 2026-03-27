import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { trpc } from '@/lib/trpc';
import { BellOff, Bell } from 'lucide-react-native';

interface MuteChatModalProps {
  visible: boolean;
  onClose: () => void;
  chatId: string;
  chatName: string;
  isMuted: boolean;
  onMuteChange: (isMuted: boolean) => void;
}

const MUTE_OPTIONS = [
  { label: '1 hour', value: '1hour' },
  { label: '8 hours', value: '8hours' },
  { label: '1 day', value: '1day' },
  { label: '1 week', value: '1week' },
  { label: 'Forever', value: 'forever' },
];

export function MuteChatModal({
  visible,
  onClose,
  chatId,
  chatName,
  isMuted,
  onMuteChange,
}: MuteChatModalProps) {
  const { colors, isDark } = useThemeColors();
  const muteChatMutation = trpc.chats.muteChat.useMutation();
  const unmuteChatMutation = trpc.chats.unmuteChat.useMutation();

  const handleMute = async (duration: string) => {
    try {
      await muteChatMutation.mutateAsync({
        chatId,
        duration: duration as any,
      });
      onMuteChange(true);
      onClose();
    } catch (error) {
      console.error('Failed to mute chat:', error);
      Alert.alert('Error', 'Failed to mute chat. Please try again.');
    }
  };

  const handleUnmute = async () => {
    try {
      await unmuteChatMutation.mutateAsync({ chatId });
      onMuteChange(false);
      onClose();
    } catch (error) {
      console.error('Failed to unmute chat:', error);
      Alert.alert('Error', 'Failed to unmute chat. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {isMuted ? 'Unmute Chat' : 'Mute Chat'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {chatName}
            </Text>
          </View>

          {isMuted ? (
            <View style={styles.content}>
              <TouchableOpacity
                style={[styles.option, { borderBottomColor: colors.border }]}
                onPress={handleUnmute}
                disabled={unmuteChatMutation.isLoading}
              >
                <Bell size={20} color={colors.primary} />
                <Text style={[styles.optionText, { color: colors.text }]}>
                  Unmute Chat
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.content}>
              {MUTE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.option, { borderBottomColor: colors.border }]}
                  onPress={() => handleMute(option.value)}
                  disabled={muteChatMutation.isLoading}
                >
                  <BellOff size={20} color={colors.textSecondary} />
                  <Text style={[styles.optionText, { color: colors.text }]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.cancelButton, { borderTopColor: colors.border }]}
            onPress={onClose}
          >
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  content: {
    paddingHorizontal: 0,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: {
    fontSize: 16,
    marginLeft: 12,
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
});