import React from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';

interface Props {
  onAdd: () => void;
}

const SWIPE_NOTE =
  '*Swipe your finger from right to left on the screen to delete the time period.';

const TimeSegmentedAddSection: React.FC<Props> = ({onAdd}) => (
  <View style={styles.wrap}>
    <View style={styles.topRow}>
      <Text style={styles.title}>Time Period Setting</Text>
      <Pressable style={styles.addBtn} onPress={onAdd} hitSlop={8}>
        <Image
          source={require('../../assets/images/mp_addIcon.png')}
          style={styles.addIcon}
          resizeMode="contain"
        />
      </Pressable>
    </View>
    <Text style={styles.note}>{SWIPE_NOTE}</Text>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    minHeight: 80,
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {fontSize: 15, color: '#333', flex: 1, marginRight: 12},
  addBtn: {
    width: 50,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {width: 24, height: 24},
  note: {
    fontSize: 12,
    color: '#333',
    marginTop: 5,
    lineHeight: 17,
  },
});

export default TimeSegmentedAddSection;
