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
  readFilterByMacSettings,
  configFilterByMacSettings,
  apiErrorMessage,
  waitForBleReady,
  type FilterByListState,
} from '../utils/mpApi';
import {filterHexMacInput} from '../utils/filterByListModel';
import {FILTER_PLACEHOLDERS} from '../utils/filterPlaceholders';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FilterByMacScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [state, setState] = useState<FilterByListState>({
    match: false,
    filter: false,
    items: [],
  });

  const busy = loading || saving;

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
      const data = await readFilterByMacSettings();
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

  const onSave = async () => {
    if (!dataReady || busy) {
      return;
    }
    setSaving(true);
    try {
      if (!(await waitForBleReady())) {
        showToast('The current connection device is in disconnect');
        return;
      }
      await configFilterByMacSettings(state);
      showToast('Success');
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const addMac = () => {
    if (state.items.length >= 10) {
      showToast('You can set up to 10 filters!');
      return;
    }
    setState(s => ({...s, items: [...s.items, '']}));
  };

  const removeMac = () => {
    if (state.items.length === 0) {
      return;
    }
    setState(s => ({...s, items: s.items.slice(0, -1)}));
  };

  return (
    <StackScreenLayout
      title="Filter by MAC"
      onBack={() => navigation.goBack()}
      onSave={onSave}
      saveDisabled={!dataReady || busy}
      loading={busy}
      saving={saving}>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <View style={styles.group}>
          <TextSwitchCell
            label="Precise Match"
            value={state.match}
            disabled={busy}
            onValueChange={match => setState(s => ({...s, match}))}
          />
          <View style={styles.line} />
          <TextSwitchCell
            label="Reverse Filter"
            value={state.filter}
            disabled={busy}
            onValueChange={filter => setState(s => ({...s, filter}))}
          />
        </View>
        <SectionSpacer />
        <FilterEditSectionHeader
          title="Edit MAC Address"
          onAdd={addMac}
          onRemove={removeMac}
        />
        <View style={styles.group}>
          {state.items.map((mac, index) => (
            <View key={`mac-${index}`}>
              {index > 0 ? <View style={styles.line} /> : null}
              <TextFieldCell
                label={`MAC ${index + 1}`}
                value={mac}
                placeholder={FILTER_PLACEHOLDERS.mac}
                maxLength={12}
                keyboardType="ascii-capable"
                onChangeText={t => {
                  const v = filterHexMacInput(t);
                  setState(s => {
                    const items = [...s.items];
                    items[index] = v;
                    return {...s, items};
                  });
                }}
              />
            </View>
          ))}
        </View>
      </KeyboardFormScrollView>
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

export default FilterByMacScreen;
