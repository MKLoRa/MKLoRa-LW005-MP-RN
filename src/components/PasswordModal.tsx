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

interface Props {
  visible: boolean;
  initialPassword?: string;
  onCancel: () => void;
  onConfirm: (password: string) => void;
}

const PasswordModal: React.FC<Props> = ({
  visible,
  initialPassword = '',
  onCancel,
  onConfirm,
}) => {
  const [password, setPassword] = useState(initialPassword);

  useEffect(() => {
    if (visible) {
      setPassword(initialPassword);
    }
  }, [visible, initialPassword]);

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
          <Text style={styles.title}>Enter password</Text>
          <Text style={styles.msg}>Please enter connection password.</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={t => setPassword(t.slice(0, 8))}
            placeholder="The password is 8 characters."
            placeholderTextColor="#bbb"
            maxLength={8}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={visible}
            secureTextEntry={false}
          />
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.okBtn}
              onPress={() => onConfirm(password)}>
              <Text style={styles.okText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

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
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
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

export default PasswordModal;
