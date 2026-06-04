import React, {useCallback, useState} from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import TextSwitchCell from '../components/cells/TextSwitchCell';
import TextFieldCell from '../components/cells/TextFieldCell';
import PickerButtonCell from '../components/cells/PickerButtonCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import OptionPickerModal from '../components/OptionPickerModal';
import {RepoweredDefaultMode} from '../sdk/MPSDKDefines';
import {
  readSwitchSettings,
  configSwitchSettings,
} from '../utils/generalApi';
import {
  REPOWERED_MODE_OPTIONS,
  SAVE_VALIDATION_MSG_GENERAL,
  filterDigits,
  type SwitchSettingsState,
} from '../utils/generalModel';
import {apiErrorMessage} from '../utils/mpApi';
import {showToast} from '../utils/toast';

const SwitchSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [state, setState] = useState<SwitchSettingsState>({
    isOn: false,
    interval: '',
    repoweredMode: RepoweredDefaultMode.Off,
  });
  const [pickerOpen, setPickerOpen] = useState(false);

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    setDataReady(false);
    try {
      const data = await readSwitchSettings();
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
      await configSwitchSettings(state);
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
      title="Switch Control"
      onBack={() => navigation.goBack()}
      onSave={onSave}
      saveDisabled={!dataReady || loading || saving}
      loading={loading || saving}
      loadingText={saving ? 'Config...' : 'Reading...'}>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <View style={styles.group}>
          <TextSwitchCell
            label="ON/OFF"
            value={state.isOn}
            onValueChange={v => setState(s => ({...s, isOn: v}))}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <TextFieldCell
            label="Repoert Interval"
            value={state.interval}
            placeholder="10 - 600"
            unit="S"
            maxLength={3}
            keyboardType="number-pad"
            onChangeText={t =>
              setState(s => ({...s, interval: filterDigits(t, 3)}))
            }
          />
          <Text style={styles.note}>
            *The report interval of switch payloads.
          </Text>
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <PickerButtonCell
            label="Power On Default Mode"
            value={REPOWERED_MODE_OPTIONS[state.repoweredMode] ?? 'Off'}
            onPress={() => setPickerOpen(true)}
          />
        </View>
      </KeyboardFormScrollView>
      {pickerOpen ? (
        <OptionPickerModal
          visible
          title="Power On Default Mode"
          options={[...REPOWERED_MODE_OPTIONS]}
          selectedIndex={state.repoweredMode}
          onSelect={idx => {
            setState(s => ({...s, repoweredMode: idx as RepoweredDefaultMode}));
            setPickerOpen(false);
          }}
          onDismiss={() => setPickerOpen(false)}
        />
      ) : null}
    </StackScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {flex: 1},
  group: {backgroundColor: '#fff'},
  note: {
    fontSize: 12,
    color: '#666',
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
});

export default SwitchSettingsScreen;
