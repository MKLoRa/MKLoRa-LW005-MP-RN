import React, {useCallback, useState} from 'react';
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {StyleSheet, View} from 'react-native';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import TextSwitchCell from '../components/cells/TextSwitchCell';
import TextFieldCell from '../components/cells/TextFieldCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import {
  apiErrorMessage,
  configBxpIBeaconFilter,
  configIBeaconFilter,
  readBxpIBeaconFilter,
  readIBeaconFilter,
  waitForBleReady,
} from '../utils/filterDeviceApi';
import type {BeaconFilterState} from '../utils/filterRawDataModel';
import {FILTER_PLACEHOLDERS} from '../utils/filterPlaceholders';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'FilterByBeacon'>;

const EMPTY: BeaconFilterState = {
  isOn: false,
  minMajor: '',
  maxMajor: '',
  minMinor: '',
  maxMinor: '',
  uuid: '',
};

const FilterByBeaconScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const isBxp = route.params.variant === 'bxp';
  const title = isBxp ? 'BXP-iBeacon Filter' : 'iBeacon Filter';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<BeaconFilterState>(EMPTY);

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    try {
      if (!(await waitForBleReady())) {
        if (!cancelled()) {
          showToast('The current connection device is in disconnect');
        }
        return;
      }
      const data = isBxp ? await readBxpIBeaconFilter() : await readIBeaconFilter();
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
  }, [isBxp]);

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
      if (isBxp) {
        await configBxpIBeaconFilter(state);
      } else {
        await configIBeaconFilter(state);
      }
      showToast('Success');
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <StackScreenLayout
      title={title}
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
        <TextFieldCell
          label={isBxp ? 'BXP-iBeacon UUID' : 'iBeacon UUID'}
          value={state.uuid}
          placeholder={FILTER_PLACEHOLDERS.beaconUuid}
          maxLength={32}
          keyboardType="ascii-capable"
          inputFilter="hex"
          onChangeText={t => setState(s => ({...s, uuid: t}))}
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
    </StackScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {flex: 1},
  bottom: {height: 24},
});

export default FilterByBeaconScreen;
