import React from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';

interface Props {
  label: string;
  value?: string;
  showArrow?: boolean;
  onPress?: () => void;
}

const NormalTextCell: React.FC<Props> = ({
  label,
  value,
  showArrow,
  onPress,
}) => (
  <Pressable
    style={styles.row}
    onPress={onPress}
    disabled={!onPress && !showArrow}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.right}>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {showArrow ? (
        <Image
          source={require('../../../assets/images/mp_goNextButton.png')}
          style={styles.arrow}
          resizeMode="contain"
        />
      ) : null}
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  row: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  label: {fontSize: 15, color: '#333', flex: 1},
  right: {flexDirection: 'row', alignItems: 'center'},
  value: {fontSize: 14, color: '#666', marginRight: 6},
  arrow: {width: 18, height: 18},
});

export default NormalTextCell;
