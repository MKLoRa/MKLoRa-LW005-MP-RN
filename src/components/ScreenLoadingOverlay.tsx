import React from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {NAVBAR_COLOR} from '../theme/colors';

type Props = {
  visible: boolean;
  text?: string;
};

/** 页面内遮罩：随页面卸载消失，避免全局 Modal 挡住扫描页触摸 */
const ScreenLoadingOverlay: React.FC<Props> = ({visible, text}) => {
  if (!visible) {
    return null;
  }
  return (
    <View style={styles.overlay} pointerEvents="auto">
      <ActivityIndicator
        size={Platform.OS === 'android' ? 36 : 'large'}
        color={NAVBAR_COLOR}
      />
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  );
};

export default ScreenLoadingOverlay;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
