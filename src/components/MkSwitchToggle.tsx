import React from 'react';
import {Image, Pressable, StyleSheet} from 'react-native';

/** 对齐 iOS MKTextSwitchCell：40×30，使用原图不拉伸 */
const SWITCH_WIDTH = 40;
const SWITCH_HEIGHT = 30;

interface Props {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}

const MkSwitchToggle: React.FC<Props> = ({value, onValueChange, disabled}) => (
  <Pressable
    onPress={() => {
      if (!disabled) {
        onValueChange(!value);
      }
    }}
    disabled={disabled}
    style={[styles.wrap, disabled && styles.disabled]}
    hitSlop={8}
    accessibilityRole="switch"
    accessibilityState={{checked: value, disabled: !!disabled}}>
    <Image
      source={
        value
          ? require('../../assets/images/mp_switchSelectedIcon.png')
          : require('../../assets/images/mp_switchUnselectedIcon.png')
      }
      style={styles.icon}
      resizeMode="contain"
    />
  </Pressable>
);

const styles = StyleSheet.create({
  wrap: {
    width: SWITCH_WIDTH,
    height: SWITCH_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: SWITCH_WIDTH,
    height: SWITCH_HEIGHT,
  },
  disabled: {opacity: 0.45},
});

export default MkSwitchToggle;
