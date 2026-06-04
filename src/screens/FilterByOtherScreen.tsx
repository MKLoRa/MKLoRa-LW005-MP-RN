import React, {useCallback, useState} from 'react';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {StyleSheet, View} from 'react-native';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import TextSwitchCell from '../components/cells/TextSwitchCell';
import PickerButtonCell from '../components/cells/PickerButtonCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import FilterEditSectionHeader from '../components/FilterEditSectionHeader';
import FilterRawDataConditionCell from '../components/FilterRawDataConditionCell';
import OptionPickerModal from '../components/OptionPickerModal';
import {
  apiErrorMessage,
  configOtherFilter,
  readOtherFilter,
  waitForBleReady,
} from '../utils/filterDeviceApi';
import {
  otherRelationshipOptions,
  pickerIndexFromRelationship,
  type OtherFilterCondition,
  type OtherFilterState,
} from '../utils/filterRawDataModel';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const LABELS = ['Condition A', 'Condition B', 'Condition C'];

const FilterByOtherScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<OtherFilterState>({
    isOn: false,
    relationship: 0,
    conditions: [],
  });
  const [relIndex, setRelIndex] = useState(0);
  const [relPicker, setRelPicker] = useState(false);

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    try {
      if (!(await waitForBleReady())) {
        if (!cancelled()) {
          showToast('The current connection device is in disconnect');
        }
        return;
      }
      const data = await readOtherFilter();
      if (!cancelled()) {
        setState(data);
        setRelIndex(
          pickerIndexFromRelationship(
            Math.max(1, data.conditions.length),
            data.relationship,
          ),
        );
        if (!data.conditions.length) {
          setState(s => ({...s, conditions: []}));
        }
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
      await configOtherFilter(state, relIndex);
      showToast('Setup succeed!');
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const addCondition = () => {
    if (state.conditions.length >= 3) {
      showToast('You can set up to 3 filters!');
      return;
    }
    const next: OtherFilterCondition = {
      dataType: '',
      minIndex: '0',
      maxIndex: '0',
      rawData: '',
    };
    const conditions = [...state.conditions, next];
    setState(s => ({...s, conditions}));
    setRelIndex(conditions.length - 1);
  };

  const removeCondition = () => {
    if (!state.conditions.length) {
      return;
    }
    const conditions = state.conditions.slice(0, -1);
    setState(s => ({...s, conditions}));
    const opts = otherRelationshipOptions(Math.max(1, conditions.length));
    setRelIndex(Math.min(relIndex, opts.length - 1));
  };

  const relOptions = otherRelationshipOptions(
    Math.max(1, state.conditions.length),
  );

  return (
    <StackScreenLayout
      title="Other Type Filter"
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
          title="Edit Filter Condition"
          onAdd={addCondition}
          onRemove={removeCondition}
        />
        {state.conditions.map((c, i) => (
          <FilterRawDataConditionCell
            key={`cond-${i}`}
            label={LABELS[i] ?? `Condition ${i + 1}`}
            value={c}
            onChange={patch => {
              const conditions = [...state.conditions];
              conditions[i] = {...conditions[i], ...patch};
              setState(s => ({...s, conditions}));
            }}
          />
        ))}
        {state.conditions.length > 0 ? (
          <PickerButtonCell
            label="Filter Relationship"
            value={relOptions[relIndex] ?? relOptions[0]}
            onPress={() => setRelPicker(true)}
          />
        ) : null}
        <View style={styles.bottom} />
      </KeyboardFormScrollView>
      {relPicker ? (
        <OptionPickerModal
          visible
          title="Filter Relationship"
          options={[...relOptions]}
          selectedIndex={relIndex}
          onSelect={i => {
            setRelIndex(i);
            setRelPicker(false);
          }}
          onDismiss={() => setRelPicker(false)}
        />
      ) : null}
    </StackScreenLayout>
  );
};

const styles = StyleSheet.create({scroll: {flex: 1}, bottom: {height: 24}});

export default FilterByOtherScreen;
