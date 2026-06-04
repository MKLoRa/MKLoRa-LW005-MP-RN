import React, {useCallback, useState} from 'react';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {StyleSheet, View} from 'react-native';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import TextFieldCell from '../components/cells/TextFieldCell';
import PickerButtonCell from '../components/cells/PickerButtonCell';
import NormalTextCell from '../components/cells/NormalTextCell';
import RssiSliderCell from '../components/cells/RssiSliderCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import OptionPickerModal from '../components/OptionPickerModal';
import {
  readBleFixSettings,
  configBleFixSettings,
  apiErrorMessage,
  waitForBleReady,
} from '../utils/mpApi';
import {
  type BleFixState,
  DEFAULT_BLE_FIX,
  BLE_FIX_MECHANISM_OPTIONS,
  FILTER_RELATIONSHIP_OPTIONS,
  mechanismLabel,
  filterRelationshipLabel,
} from '../utils/bleFixModel';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type PickerState = {
  title: string;
  options: readonly string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

const BleFixScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [state, setState] = useState<BleFixState>(DEFAULT_BLE_FIX);
  const [picker, setPicker] = useState<PickerState | null>(null);

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    setDataReady(false);
    try {
      if (!(await waitForBleReady())) {
        if (!cancelled()) {
          showToast('The current connection device is in disconnect');
        }
        return;
      }
      const data = await readBleFixSettings();
      if (!cancelled()) {
        setState(data);
        setDataReady(true);
      }
    } catch (e) {
      if (!cancelled()) {
        showToast(apiErrorMessage(e));
      }
    } finally {
      if (!cancelled()) {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      readData(() => cancelled);
      return () => {
        cancelled = true;
      };
    }, [readData]),
  );

  const busy = loading || saving;

  const onSave = async () => {
    if (!dataReady || busy) {
      if (loading) {
        showToast('Reading device settings, please wait...');
      }
      return;
    }
    setSaving(true);
    try {
      if (!(await waitForBleReady())) {
        showToast('The current connection device is in disconnect');
        return;
      }
      await configBleFixSettings(state);
      showToast('Success');
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const filterDigits = (t: string) => t.replace(/\D/g, '');

  return (
    <StackScreenLayout
      title="Bluetooth Fix"
      onBack={() => navigation.goBack()}
      onSave={onSave}
      saveDisabled={!dataReady || busy}
      loading={busy}
      saving={saving}>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <View style={styles.group}>
          <TextFieldCell
            label="Positioning Timeout"
            value={state.timeout}
            placeholder="1~10"
            unit="S"
            maxLength={2}
            onChangeText={t =>
              setState(s => ({...s, timeout: filterDigits(t)}))
            }
          />
          <View style={styles.line} />
          <TextFieldCell
            label="Number Of MAC"
            value={state.number}
            placeholder="1~15"
            maxLength={2}
            onChangeText={t => setState(s => ({...s, number: filterDigits(t)}))}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <PickerButtonCell
            label="Bluetooth Fix Mechanism"
            value={mechanismLabel(state.priority)}
            onPress={() =>
              setPicker({
                title: 'Bluetooth Fix Mechanism',
                options: BLE_FIX_MECHANISM_OPTIONS,
                selectedIndex: state.priority,
                onSelect: idx => setState(s => ({...s, priority: idx})),
              })
            }
          />
        </View>
        <SectionSpacer />
        <RssiSliderCell
          value={state.rssi}
          disabled={!dataReady || busy}
          onChange={rssi => setState(s => ({...s, rssi}))}
        />
        <SectionSpacer />
        <View style={styles.group}>
          <PickerButtonCell
            label="Filter Relationship"
            value={filterRelationshipLabel(state.relationship)}
            onPress={() =>
              setPicker({
                title: 'Filter Relationship',
                options: FILTER_RELATIONSHIP_OPTIONS,
                selectedIndex: state.relationship,
                onSelect: idx => setState(s => ({...s, relationship: idx})),
              })
            }
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <NormalTextCell
            label="Filter by MAC"
            showArrow
            onPress={() => navigation.navigate('FilterByMac')}
          />
          <View style={styles.line} />
          <NormalTextCell
            label="Filter by ADV Name"
            showArrow
            onPress={() => navigation.navigate('FilterByAdvName')}
          />
          <View style={styles.line} />
          <NormalTextCell
            label="Filter by Raw Data"
            showArrow
            onPress={() => navigation.navigate('FilterByRawData')}
          />
        </View>
      </KeyboardFormScrollView>

      {picker ? (
        <OptionPickerModal
          visible
          title={picker.title}
          options={[...picker.options]}
          selectedIndex={picker.selectedIndex}
          onSelect={index => {
            picker.onSelect(index);
            setPicker(null);
          }}
          onDismiss={() => setPicker(null)}
        />
      ) : null}
    </StackScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {flex: 1},
  group: {backgroundColor: '#fff'},
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e8e8e8',
    marginLeft: 15,
  },
});

export default BleFixScreen;
