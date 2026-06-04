import React, {useCallback, useState} from 'react';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {StyleSheet, View} from 'react-native';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import TextSwitchCell from '../components/cells/TextSwitchCell';
import TextFieldCell from '../components/cells/TextFieldCell';
import PickerButtonCell from '../components/cells/PickerButtonCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import OptionPickerModal from '../components/OptionPickerModal';
import {
  apiErrorMessage,
  configPirFilter,
  readPirFilter,
  waitForBleReady,
} from '../utils/filterDeviceApi';
import {
  PIR_DELAY_OPTIONS,
  PIR_DETECTION_OPTIONS,
  PIR_DOOR_OPTIONS,
  PIR_SENSITIVITY_OPTIONS,
  type PirFilterState,
} from '../utils/filterRawDataModel';
import {FILTER_PLACEHOLDERS} from '../utils/filterPlaceholders';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type PickerState = {
  title: string;
  options: readonly string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

const FilterByPirScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<PirFilterState>({
    isOn: false,
    delayStatus: 0,
    doorStatus: 0,
    sensitivity: 0,
    detection: 0,
    minMajor: '',
    maxMajor: '',
    minMinor: '',
    maxMinor: '',
  });
  const [picker, setPicker] = useState<PickerState | null>(null);

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    try {
      if (!(await waitForBleReady())) {
        if (!cancelled()) {
          showToast('The current connection device is in disconnect');
        }
        return;
      }
      const data = await readPirFilter();
      if (!cancelled()) {
        setState(data);
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

  const onSave = async () => {
    setSaving(true);
    try {
      if (!(await waitForBleReady())) {
        showToast('The current connection device is in disconnect');
        return;
      }
      await configPirFilter(state);
      showToast('Success');
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <StackScreenLayout
      title="MK-PIR Filter"
      onBack={() => navigation.goBack()}
      onSave={onSave}
      loading={loading || saving}
      saving={saving}>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <TextSwitchCell
          label="Filter Switch"
          value={state.isOn}
          onValueChange={v => setState(s => ({...s, isOn: v}))}
        />
        <PickerButtonCell
          label="Delay Response Status"
          value={PIR_DELAY_OPTIONS[state.delayStatus]}
          onPress={() =>
            setPicker({
              title: 'Delay Response Status',
              options: PIR_DELAY_OPTIONS,
              selectedIndex: state.delayStatus,
              onSelect: i => setState(s => ({...s, delayStatus: i})),
            })
          }
        />
        <PickerButtonCell
          label="Door Open/Close Status"
          value={PIR_DOOR_OPTIONS[state.doorStatus]}
          onPress={() =>
            setPicker({
              title: 'Door Open/Close Status',
              options: PIR_DOOR_OPTIONS,
              selectedIndex: state.doorStatus,
              onSelect: i => setState(s => ({...s, doorStatus: i})),
            })
          }
        />
        <PickerButtonCell
          label="Sensor Sensitivity"
          value={PIR_SENSITIVITY_OPTIONS[state.sensitivity]}
          onPress={() =>
            setPicker({
              title: 'Sensor Sensitivity',
              options: PIR_SENSITIVITY_OPTIONS,
              selectedIndex: state.sensitivity,
              onSelect: i => setState(s => ({...s, sensitivity: i})),
            })
          }
        />
        <PickerButtonCell
          label="Detection Status"
          value={PIR_DETECTION_OPTIONS[state.detection]}
          onPress={() =>
            setPicker({
              title: 'Detection Status',
              options: PIR_DETECTION_OPTIONS,
              selectedIndex: state.detection,
              onSelect: i => setState(s => ({...s, detection: i})),
            })
          }
        />
        <TextFieldCell
          label="Min Major"
          value={state.minMajor}
          placeholder={FILTER_PLACEHOLDERS.beaconRange}
          keyboardType="number-pad"
          maxLength={5}
          inputFilter="decimal"
          onChangeText={t => setState(s => ({...s, minMajor: t}))}
        />
        <TextFieldCell
          label="Max Major"
          value={state.maxMajor}
          placeholder={FILTER_PLACEHOLDERS.beaconRange}
          keyboardType="number-pad"
          maxLength={5}
          inputFilter="decimal"
          onChangeText={t => setState(s => ({...s, maxMajor: t}))}
        />
        <TextFieldCell
          label="Min Minor"
          value={state.minMinor}
          placeholder={FILTER_PLACEHOLDERS.beaconRange}
          keyboardType="number-pad"
          maxLength={5}
          inputFilter="decimal"
          onChangeText={t => setState(s => ({...s, minMinor: t}))}
        />
        <TextFieldCell
          label="Max Minor"
          value={state.maxMinor}
          placeholder={FILTER_PLACEHOLDERS.beaconRange}
          keyboardType="number-pad"
          maxLength={5}
          inputFilter="decimal"
          onChangeText={t => setState(s => ({...s, maxMinor: t}))}
        />
        <View style={styles.bottom} />
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

const styles = StyleSheet.create({scroll: {flex: 1}, bottom: {height: 24}});

export default FilterByPirScreen;
