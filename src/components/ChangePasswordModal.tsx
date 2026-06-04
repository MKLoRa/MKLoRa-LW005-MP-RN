import React, {useEffect, useState} from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {borderedInputStyle} from './cells/TextFieldCell';
import {showToast} from '../utils/toast';

interface Props {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (password: string) => void;
}

const ChangePasswordModal: React.FC<Props> = ({
  visible,
  onCancel,
  onConfirm,
}) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    if (visible) {
      setPassword('');
      setConfirm('');
    }
  }, [visible]);

  const handleOk = () => {
    const err = validateChangePasswordInput(password, confirm);
    if (err) {
      showToast(err);
      return;
    }
    onConfirm(password);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.box}>
          <Text style={styles.title}>Change Password</Text>
          <Text style={styles.msg}>
            Note:The password should be 8 characters.
          </Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={t => setPassword(t.slice(0, 8))}
            placeholder="Enter new password"
            placeholderTextColor="#bbb"
            maxLength={8}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            value={confirm}
            onChangeText={t => setConfirm(t.slice(0, 8))}
            placeholder="Enter new password again"
            placeholderTextColor="#bbb"
            maxLength={8}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.okBtn} onPress={handleOk}>
              <Text style={styles.okText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export function validateChangePasswordInput(
  password: string,
  confirm: string,
): string | null {
  if (
    !password ||
    !confirm ||
    password.length !== 8 ||
    confirm.length !== 8
  ) {
    return 'The password should be 8 characters.Please try again.';
  }
  if (password !== confirm) {
    return 'Password do not match! Please try again.';
  }
  return null;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  box: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  title: {fontSize: 17, fontWeight: '600', color: '#333', textAlign: 'center'},
  msg: {fontSize: 14, color: '#666', marginTop: 10, textAlign: 'center'},
  input: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    ...borderedInputStyle,
  },
  actions: {flexDirection: 'row', marginTop: 20, gap: 12},
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  cancelText: {color: '#333', fontWeight: '600'},
  okBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#2F84D0',
  },
  okText: {color: '#fff', fontWeight: '600'},
});

export default ChangePasswordModal;
