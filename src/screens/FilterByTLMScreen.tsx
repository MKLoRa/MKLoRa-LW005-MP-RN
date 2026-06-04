import React, {useCallback, useState} from 'react';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {StyleSheet, View} from 'react-native';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import TextSwitchCell from '../components/cells/TextSwitchCell';
import PickerButtonCell from '../components/cells/PickerButtonCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import OptionPickerModal from '../components/OptionPickerModal';
import {
  apiErrorMessage,
  configTlmFilter,
  readTlmFilter,
  waitForBleReady,
} from '../utils/filterDeviceApi';
import {TLM_VERSION_OPTIONS} from '../utils/filterPlaceholders';
import type {TlmFilterState} from '../utils/filterRawDataModel';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FilterByTLMScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<TlmFilterState>({isOn: false, version: 0});
  const [versionPicker, setVersionPicker] = useState(false);

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    try {
      if (!(await waitForBleReady())) {
        if (!cancelled()) {
          showToast('The current connection device is in disconnect');
        }
        return;
      }
      const data = await readTlmFilter();
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
      await configTlmFilter(state);
      showToast('Success');
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const versionIndex = Math.min(
    Math.max(0, state.version),
    TLM_VERSION_OPTIONS.length - 1,
  );

  return (
    <StackScreenLayout
      title="Eddystone-TLM Filter"
      onBack={() => navigation.goBack()}
      onSave={onSave}
      loading={loading || saving}
      saving={saving}>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <TextSwitchCell
          label="Eddystone-TLM"
          value={state.isOn}
          onValueChange={v => setState(s => ({...s, isOn: v}))}
        />
        <PickerButtonCell
          label="TLM Version"
          value={TLM_VERSION_OPTIONS[versionIndex]}
          onPress={() => setVersionPicker(true)}
        />
        <View style={styles.bottom} />
      </KeyboardFormScrollView>
      {versionPicker ? (
        <OptionPickerModal
          visible
          title="TLM Version"
          options={[...TLM_VERSION_OPTIONS]}
          selectedIndex={versionIndex}
          onSelect={i => {
            setState(s => ({...s, version: i}));
            setVersionPicker(false);
          }}
          onDismiss={() => setVersionPicker(false)}
        />
      ) : null}
    </StackScreenLayout>
  );
};

const styles = StyleSheet.create({scroll: {flex: 1}, bottom: {height: 24}});

export default FilterByTLMScreen;
