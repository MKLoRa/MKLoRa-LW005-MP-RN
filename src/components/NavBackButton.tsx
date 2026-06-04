import React from 'react';
import {Image, Pressable, StyleSheet} from 'react-native';

interface Props {
  onPress: () => void;
  disabled?: boolean;
}

/** 仅图标返回，无「Back」等文字（对齐 iOS navigation_back_button_white） */
const NavBackButton: React.FC<Props> = ({onPress, disabled}) => (
  <Pressable
    style={[styles.hit, disabled && styles.disabled]}
    onPress={disabled ? undefined : onPress}
    disabled={disabled}
    hitSlop={12}>
    <Image
      source={require('../../assets/images/mp_goNextButton.png')}
      style={styles.icon}
      resizeMode="contain"
    />
  </Pressable>
);

const styles = StyleSheet.create({
  hit: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {opacity: 0.35},
  icon: {
    width: 22,
    height: 22,
    transform: [{scaleX: -1}],
    tintColor: '#fff',
  },
});

export default NavBackButton;
