import React from 'react';
import {Image, Pressable, StyleSheet, Text} from 'react-native';

interface Props {
  timeMsg: string;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

/** 对齐 MKMPDebuggerCell：mp_debuggerSelected / mp_debuggerUnselected */
const DebuggerLogRow: React.FC<Props> = ({
  timeMsg,
  selected,
  onToggle,
  disabled,
}) => (
  <Pressable
    style={styles.row}
    onPress={onToggle}
    disabled={disabled}>
    <Image
      source={
        selected
          ? require('../../assets/images/mp_debuggerSelected.png')
          : require('../../assets/images/mp_debuggerUnselected.png')
      }
      style={styles.checkIcon}
      resizeMode="contain"
    />
    <Text style={styles.time} numberOfLines={1}>
      {timeMsg}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  row: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  checkIcon: {width: 25, height: 25, marginRight: 5},
  time: {fontSize: 15, color: '#333', flex: 1},
});

export default DebuggerLogRow;
