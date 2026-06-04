import React, {useCallback, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {ScrollView, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import StackScreenLayout from '../components/StackScreenLayout';
import PickerButtonCell from '../components/cells/PickerButtonCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import OptionPickerModal from '../components/OptionPickerModal';
import {
  readMessageTypeSettings,
  configMessageTypeSettings,
  apiErrorMessage,
  waitForBleReady,
  waitForBleIdle,
  type MessageTypePayloadState,
} from '../utils/mpApi';
import {showToast} from '../utils/toast';

const PAYLOAD_TYPE_OPTIONS = ['Unconfirmed', 'Confirmed'];
const MAX_TIMES_OPTIONS = ['0', '1', '2', '3'];

type PayloadState = {type: number; maxTimes: number};

const INITIAL: PayloadState = {type: 0, maxTimes: 0};

const DEFAULT_STATE: MessageTypePayloadState = {
  heartbeat: INITIAL,
  lowPower: INITIAL,
  position: INITIAL,
  shock: INITIAL,
  manDown: INITIAL,
  event: INITIAL,
  tamperAlarm: INITIAL,
  gpsLimit: INITIAL,
};

type PickerState = {
  title: string;
  options: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

const MessageTypeScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<MessageTypePayloadState>(DEFAULT_STATE);
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
      const data = await readMessageTypeSettings();
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

  const saveData = async () => {
    setSaving(true);
    try {
      if (!(await waitForBleReady())) {
        showToast('The current connection device is in disconnect');
        return;
      }
      await waitForBleIdle();
      await configMessageTypeSettings(state);
      showToast('Success');
      setPicker(null);
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const openPicker = (
    title: string,
    options: string[],
    selectedIndex: number,
    onSelect: (index: number) => void,
  ) => {
    setPicker({title, options, selectedIndex, onSelect});
  };

  const setPayload = (
    key: keyof MessageTypePayloadState,
    patch: Partial<PayloadState>,
  ) => {
    setState(prev => ({...prev, [key]: {...prev[key], ...patch}}));
  };

  const renderPayloadSection = (
    typeLabel: string,
    payload: PayloadState,
    key: keyof MessageTypePayloadState,
  ) => (
    <View style={styles.group}>
      <PickerButtonCell
        label={typeLabel}
        value={PAYLOAD_TYPE_OPTIONS[payload.type] ?? PAYLOAD_TYPE_OPTIONS[0]}
        onPress={() =>
          openPicker(typeLabel, PAYLOAD_TYPE_OPTIONS, payload.type, idx =>
            setPayload(key, {type: idx}),
          )
        }
      />
      {payload.type === 1 ? (
        <PickerButtonCell
          label="Max Retransmission Times"
          value={MAX_TIMES_OPTIONS[payload.maxTimes] ?? '0'}
          onPress={() =>
            openPicker(
              'Max Retransmission Times',
              MAX_TIMES_OPTIONS,
              payload.maxTimes,
              idx => setPayload(key, {maxTimes: idx}),
            )
          }
        />
      ) : null}
    </View>
  );

  const busy = loading || saving;

  return (
    <StackScreenLayout
      title="Message Type Settings"
      onBack={() => navigation.goBack()}
      onSave={saveData}
      loading={busy}
      loadingText={saving ? 'Config...' : 'Reading...'}>
      <ScrollView style={styles.scroll}>
        <SectionSpacer />
        {renderPayloadSection(
          'Heartbeat Payload Type',
          state.heartbeat,
          'heartbeat',
        )}
        <SectionSpacer />
        {renderPayloadSection(
          'Low Power Payload Type',
          state.lowPower,
          'lowPower',
        )}
        <SectionSpacer />
        {renderPayloadSection('Event Payload Type', state.event, 'event')}
        <SectionSpacer />
        {renderPayloadSection(
          'Positioning Payload Type',
          state.position,
          'position',
        )}
        <SectionSpacer />
        {renderPayloadSection('Shock Payload Type', state.shock, 'shock')}
        <SectionSpacer />
        {renderPayloadSection(
          'Man Down Detection Payload Type',
          state.manDown,
          'manDown',
        )}
        <SectionSpacer />
        {renderPayloadSection(
          'Tamper Alarm Payload Type',
          state.tamperAlarm,
          'tamperAlarm',
        )}
        <SectionSpacer />
        {renderPayloadSection(
          'GPS Limit Payload Type',
          state.gpsLimit,
          'gpsLimit',
        )}
      </ScrollView>

      {picker ? (
        <OptionPickerModal
          visible
          title={picker.title}
          options={picker.options}
          selectedIndex={picker.selectedIndex}
          onSelect={picker.onSelect}
          onDismiss={() => setPicker(null)}
        />
      ) : null}
    </StackScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {flex: 1},
  group: {backgroundColor: '#fff'},
});

export default MessageTypeScreen;
