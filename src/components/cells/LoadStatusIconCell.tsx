import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';

interface Props {
  label: string;
  loaded: boolean;
}

const LoadStatusIconCell: React.FC<Props> = ({label, loaded}) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Image
      source={
        loaded
          ? require('../../../assets/images/mp_loadStatusPage_loaded.png')
          : require('../../../assets/images/mp_loadStatusPage_unLoad.png')
      }
      style={styles.icon}
      resizeMode="contain"
    />
  </View>
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
  label: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  icon: {
    width: 20,
    height: 20,
  },
});

export default LoadStatusIconCell;
