import React from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

interface Props {
  label: string;
  icon: ImageSourcePropType;
  onPress: () => void;
  disabled?: boolean;
}

/** 对齐 MKMPDebuggerButton：图标在上、文字在下 */
const DebuggerActionButton: React.FC<Props> = ({
  label,
  icon,
  onPress,
  disabled,
}) => (
  <Pressable
    style={styles.wrap}
    onPress={onPress}
    disabled={disabled}
    hitSlop={4}>
    <Image source={icon} style={styles.icon} resizeMode="contain" />
    <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  wrap: {
    width: 70,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {width: 28, height: 28},
  label: {fontSize: 12, color: '#333', marginTop: 2},
  labelDisabled: {opacity: 0.5},
});

export default DebuggerActionButton;
