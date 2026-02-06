import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing } from '../constants';
import { haptics } from '../utils';

export default function EditDisplayNameModal({ 
  visible, 
  onClose, 
  onSave, 
  currentName,
}) {
  const { theme } = useTheme();
  const [name, setName] = useState(currentName || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(currentName || '');
    }
  }, [visible, currentName]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName === currentName) {
      onClose();
      return;
    }

    setSaving(true);
    haptics.selection();
    await onSave(trimmedName);
    setSaving(false);
    haptics.success();
    onClose();
  };

  const styles = createStyles(theme);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text.primary }]}>
              Edit Display Name
            </Text>
            <TouchableOpacity 
              onPress={handleSave} 
              style={styles.saveButton}
              disabled={saving}
            >
              <Check size={24} color={theme.accent.primary} />
            </TouchableOpacity>
          </View>

          {/* Input */}
          <View style={styles.content}>
            <Text style={[styles.label, { color: theme.text.secondary }]}>
              Display Name
            </Text>
            <TextInput
              style={[styles.input, { 
                color: theme.text.primary,
                backgroundColor: theme.background.secondary,
                borderColor: theme.border.medium,
              }]}
              value={name}
              onChangeText={setName}
              placeholder="Enter your display name"
              placeholderTextColor={theme.text.tertiary}
              autoFocus
              maxLength={50}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
            <Text style={[styles.hint, { color: theme.text.tertiary }]}>
              This is the name other users will see.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.border.light,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.headingSmall,
  },
  content: {
    padding: spacing.lg,
  },
  label: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
  },
  hint: {
    ...typography.caption,
    marginTop: spacing.sm,
  },
});
