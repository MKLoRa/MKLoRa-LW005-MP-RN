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
  readFilterByAdvNameSettings,
  configFilterByAdvNameSettings,
  apiErrorMessage,
  waitForBleReady,
  type FilterByListState,
} from '../utils/mpApi';
import {FILTER_PLACEHOLDERS} from '../utils/filterPlaceholders';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FilterByAdvNameScreen: React.FC = () => {
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
      const data = await readFilterByAdvNameSettings();
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
      await configFilterByAdvNameSettings(state);
      showToast('Success');
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const addName = () => {
    if (state.items.length >= 10) {
      showToast('You can set up to 10 filters!');
      return;
    }
    setState(s => ({...s, items: [...s.items, '']}));
  };

  const removeName = () => {
    if (state.items.length === 0) {
      return;
    }
    setState(s => ({...s, items: s.items.slice(0, -1)}));
  };

  return (
    <StackScreenLayout
      title="Filter by ADV Name"
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
          title="Edit ADV Name"
          onAdd={addName}
          onRemove={removeName}
        />
        <View style={styles.group}>
          {state.items.map((name, index) => (
            <View key={`adv-${index}`}>
              {index > 0 ? <View style={styles.line} /> : null}
              <TextFieldCell
                label={`ADV Name ${index + 1}`}
                value={name}
                placeholder={FILTER_PLACEHOLDERS.advName}
                maxLength={20}
                keyboardType="default"
                onChangeText={t => {
                  setState(s => {
                    const items = [...s.items];
                    items[index] = t;
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

export default FilterByAdvNameScreen;
