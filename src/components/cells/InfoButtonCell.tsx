import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

interface Props {
  label: string;
  value?: string;
  buttonTitle: string;
  onPress: () => void;
}

/** 对齐 MKMPTextButtonCell：左侧标签 + 右侧值 + 操作按钮 */
const InfoButtonCell: React.FC<Props> = ({
  label,
  value,
  buttonTitle,
  onPress,
}) => (
  <View style={styles.row}>
    <Text style={styles.label} numberOfLines={1}>
      {label}
    </Text>
    {value ? (
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
    ) : null}
    <Pressable style={styles.btn} onPress={onPress}>
      <Text style={styles.btnText}>{buttonTitle}</Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  row: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  label: {fontSize: 15, color: '#333', flex: 1, paddingRight: 8},
  value: {
    fontSize: 14,
    color: '#666',
    maxWidth: '28%',
    marginRight: 8,
    textAlign: 'right',
  },
  btn: {
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  btnText: {fontSize: 13, color: '#333'},
});

export default InfoButtonCell;
