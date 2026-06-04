import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

interface Props {
  title: string;
  onAdd: () => void;
  onRemove: () => void;
}

const FilterEditSectionHeader: React.FC<Props> = ({title, onAdd, onRemove}) => (
  <View style={styles.row}>
    <Text style={styles.title}>{title}</Text>
    <View style={styles.actions}>
      <Pressable style={styles.btn} onPress={onRemove} hitSlop={8}>
        <Text style={styles.btnText}>−</Text>
      </Pressable>
      <Pressable style={styles.btn} onPress={onAdd} hitSlop={8}>
        <Text style={styles.btnText}>+</Text>
      </Pressable>
    </View>
  </View>
);

const styles = StyleSheet.create({
  row: {
    height: 35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e8e8e8',
  },
  title: {fontSize: 14, color: '#666', fontWeight: '500'},
  actions: {flexDirection: 'row', gap: 8},
  btn: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {fontSize: 20, color: '#333', lineHeight: 22},
});

export default FilterEditSectionHeader;
