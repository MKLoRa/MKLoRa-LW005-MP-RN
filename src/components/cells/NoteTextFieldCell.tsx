import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import TextFieldCell from './TextFieldCell';

type TextFieldCellProps = React.ComponentProps<typeof TextFieldCell>;

interface Props extends TextFieldCellProps {
  /** 对齐 MKTextFieldCell noteMsg，显示在输入行下方 */
  note?: string;
}

const NoteTextFieldCell: React.FC<Props> = ({note, ...fieldProps}) => (
  <View>
    <TextFieldCell {...fieldProps} />
    {note ? <Text style={styles.note}>{note}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  note: {
    fontSize: 12,
    color: '#666',
    paddingHorizontal: 15,
    paddingBottom: 10,
    lineHeight: 16,
  },
});

export default NoteTextFieldCell;
