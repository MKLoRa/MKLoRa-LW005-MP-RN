import React, {useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

interface Props {
  placeholder?: string;
  searchKey: string;
  searchRssi: number;
  minRssi?: number;
  onPress: () => void;
  onClear: () => void;
}

const SearchButton: React.FC<Props> = ({
  placeholder = 'Edit Filter',
  searchKey,
  searchRssi,
  minRssi = -127,
  onPress,
  onClear,
}) => {
  const filterText = useMemo(() => {
    const parts: string[] = [];
    if (searchKey.trim()) {
      parts.push(searchKey.trim());
    }
    if (searchRssi > minRssi) {
      parts.push(`${searchRssi}dBm`);
    }
    return parts.join(';');
  }, [searchKey, searchRssi, minRssi]);

  const hasFilter = filterText.length > 0;

  return (
    <Pressable style={styles.box} onPress={onPress}>
      {!hasFilter ? (
        <Text style={styles.placeholder}>{placeholder}</Text>
      ) : (
        <>
          <Text style={styles.filterText} numberOfLines={1}>
            {filterText}
          </Text>
          <Pressable
            style={styles.clearBtn}
            onPress={e => {
              e.stopPropagation?.();
              onClear();
            }}
            hitSlop={8}>
            <Text style={styles.clearText}>×</Text>
          </Pressable>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  box: {
    flex: 1,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 4,
  },
  placeholder: {fontSize: 15, color: '#dcdcdc'},
  filterText: {flex: 1, fontSize: 15, color: '#333'},
  clearBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearText: {fontSize: 22, color: '#999', lineHeight: 24},
});

export default SearchButton;
