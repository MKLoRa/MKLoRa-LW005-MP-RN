import React, {useCallback, useState} from 'react';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {StyleSheet, View} from 'react-native';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import TextSwitchCell from '../components/cells/TextSwitchCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import {
  apiErrorMessage,
  configBxpButtonFilter,
  readBxpButtonFilter,
  waitForBleReady,
} from '../utils/filterDeviceApi';
import type {BxpButtonFilterState} from '../utils/filterRawDataModel';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FilterByBXPButtonScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<BxpButtonFilterState>({
    isOn: false,
    singlePress: false,
    doublePress: false,
    longPress: false,
    abnormal: false,
  });

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    try {
      if (!(await waitForBleReady())) {
        if (!cancelled()) {
          showToast('The current connection device is in disconnect');
        }
        return;
      }
      const data = await readBxpButtonFilter();
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
      await configBxpButtonFilter(state);
      showToast('Success');
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <StackScreenLayout
      title="BXP-Button Filter"
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
        <TextSwitchCell
          label="Single Press"
          value={state.singlePress}
          onValueChange={v => setState(s => ({...s, singlePress: v}))}
        />
        <TextSwitchCell
          label="Double Press"
          value={state.doublePress}
          onValueChange={v => setState(s => ({...s, doublePress: v}))}
        />
        <TextSwitchCell
          label="Long Press"
          value={state.longPress}
          onValueChange={v => setState(s => ({...s, longPress: v}))}
        />
        <TextSwitchCell
          label="Abnormal Inactivity"
          value={state.abnormal}
          onValueChange={v => setState(s => ({...s, abnormal: v}))}
        />
        <View style={styles.bottom} />
      </KeyboardFormScrollView>
    </StackScreenLayout>
  );
};

const styles = StyleSheet.create({scroll: {flex: 1}, bottom: {height: 24}});

export default FilterByBXPButtonScreen;
