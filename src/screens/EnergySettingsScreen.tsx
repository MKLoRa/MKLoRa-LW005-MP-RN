import React, {useCallback, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import NoteTextFieldCell from '../components/cells/NoteTextFieldCell';
import TextFieldCell from '../components/cells/TextFieldCell';
import NormalTextCell from '../components/cells/NormalTextCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import {
  readEnergySettings,
  configEnergySettings,
} from '../utils/generalApi';
import {
  SAVE_VALIDATION_MSG_GENERAL,
  filterDigits,
  type EnergySettingsState,
} from '../utils/generalModel';
import {apiErrorMessage} from '../utils/mpApi';
import {showToast} from '../utils/toast';

const EnergySettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [state, setState] = useState<EnergySettingsState>({
    reportInterval: '',
    saveInterval: '',
    powerChangeValue: '',
    totalEnergy: '0.0',
  });

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    setDataReady(false);
    try {
      const data = await readEnergySettings();
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
    if (!dataReady) {
      return;
    }
    setSaving(true);
    try {
      await configEnergySettings(state);
      showToast('Success');
    } catch (e) {
      const msg = apiErrorMessage(e);
      if (msg === SAVE_VALIDATION_MSG_GENERAL) {
        Alert.alert('Error', msg);
      } else {
        showToast(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <StackScreenLayout
      title="Energy Settings"
      onBack={() => navigation.goBack()}
      onSave={onSave}
      saveDisabled={!dataReady || loading || saving}
      loading={loading || saving}
      loadingText={saving ? 'Config...' : 'Reading...'}>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <View style={styles.group}>
          <NoteTextFieldCell
            label="Repoert Interval"
            value={state.reportInterval}
            placeholder="1 - 60"
            unit="Min"
            maxLength={2}
            keyboardType="number-pad"
            note="*The report interval of energy payloads."
            onChangeText={t =>
              setState(s => ({...s, reportInterval: filterDigits(t, 2)}))
            }
          />
          <View style={styles.line} />
          <TextFieldCell
            label="Energy Save Interval"
            value={state.saveInterval}
            placeholder="1 - 60"
            unit="Min"
            maxLength={2}
            keyboardType="number-pad"
            onChangeText={t =>
              setState(s => ({...s, saveInterval: filterDigits(t, 2)}))
            }
          />
        </View>

        <SectionSpacer />
        <View style={styles.group}>
          <NoteTextFieldCell
            label="Power Change Value"
            value={state.powerChangeValue}
            placeholder="1 - 100"
            unit="%"
            maxLength={3}
            keyboardType="number-pad"
            note="*When the percentage change in power exceeds power change value, device will immediately store the energy data."
            onChangeText={t =>
              setState(s => ({...s, powerChangeValue: filterDigits(t, 3)}))
            }
          />
        </View>

        <SectionSpacer />
        <View style={styles.group}>
          <NormalTextCell
            label="Total Energy"
            value={`${state.totalEnergy}KWH`}
          />
        </View>
        <SectionSpacer />
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

export default EnergySettingsScreen;
