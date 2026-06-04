import React from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {NAVBAR_COLOR} from '../theme/colors';

interface Props {
  visible: boolean;
  title: string;
  options: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onDismiss: () => void;
}

const OptionPickerModal: React.FC<Props> = ({
  visible,
  title,
  options,
  selectedIndex,
  onSelect,
  onDismiss,
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
    <Pressable style={styles.overlay} onPress={onDismiss}>
      <View style={styles.sheet}>
        <Text style={styles.title}>{title}</Text>
        <FlatList
          data={options}
          keyExtractor={(_, i) => String(i)}
          renderItem={({item, index}) => (
            <Pressable
              style={[styles.row, index === selectedIndex && styles.rowSelected]}
              onPress={() => {
                onSelect(index);
                onDismiss();
              }}>
              <Text
                style={[
                  styles.rowText,
                  index === selectedIndex && styles.rowTextSelected,
                ]}>
                {item}
              </Text>
            </Pressable>
          )}
        />
      </View>
    </Pressable>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    maxHeight: '50%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e8e8e8',
  },
  row: {paddingVertical: 14, paddingHorizontal: 20},
  rowSelected: {backgroundColor: '#f0f7ff'},
  rowText: {fontSize: 16, color: '#333'},
  rowTextSelected: {color: NAVBAR_COLOR, fontWeight: '600'},
});

export default OptionPickerModal;
