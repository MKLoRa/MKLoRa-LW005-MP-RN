import React, {useCallback, useState} from 'react';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {StyleSheet, View} from 'react-native';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import TextSwitchCell from '../components/cells/TextSwitchCell';
import TextFieldCell from '../components/cells/TextFieldCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import FilterEditSectionHeader from '../components/FilterEditSectionHeader';
import {
  apiErrorMessage,
  configTofFilter,
  readTofFilter,
  waitForBleReady,
} from '../utils/filterDeviceApi';
import type {TofFilterState} from '../utils/filterRawDataModel';
import {FILTER_PLACEHOLDERS} from '../utils/filterPlaceholders';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FilterByTofScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<TofFilterState>({isOn: false, items: []});

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    try {
      if (!(await waitForBleReady())) {
        if (!cancelled()) {
          showToast('The current connection device is in disconnect');
        }
        return;
      }
      const data = await readTofFilter();
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
      await configTofFilter(state);
      showToast('Success');
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    if (state.items.length >= 10) {
      showToast('You can set up to 10 codes!');
      return;
    }
    setState(s => ({...s, items: [...s.items, '']}));
  };

  const removeItem = () => {
    if (!state.items.length) {
      return;
    }
    setState(s => ({...s, items: s.items.slice(0, -1)}));
  };

  return (
    <StackScreenLayout
      title="MK-TOF Filter"
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
        <FilterEditSectionHeader
          title="Mfg Code List"
          onAdd={addItem}
          onRemove={removeItem}
        />
        {state.items.map((item, i) => (
          <TextFieldCell
            key={`tof-${i}`}
            label={`Code ${i + 1}`}
            value={item}
            placeholder={FILTER_PLACEHOLDERS.tofCode}
            maxLength={4}
            keyboardType="ascii-capable"
            inputFilter="hex"
            onChangeText={t => {
              const items = [...state.items];
              items[i] = t;
              setState(s => ({...s, items}));
            }}
          />
        ))}
        <View style={styles.bottom} />
      </KeyboardFormScrollView>
    </StackScreenLayout>
  );
};

const styles = StyleSheet.create({scroll: {flex: 1}, bottom: {height: 24}});

export default FilterByTofScreen;
