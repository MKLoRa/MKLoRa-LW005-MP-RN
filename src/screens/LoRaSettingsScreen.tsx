import React, {useCallback, useRef, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {StyleSheet, Text, View} from 'react-native';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import {useNavigation} from '@react-navigation/native';
import StackScreenLayout from '../components/StackScreenLayout';
import PickerButtonCell from '../components/cells/PickerButtonCell';
import TextFieldCell from '../components/cells/TextFieldCell';
import TextSwitchCell from '../components/cells/TextSwitchCell';
import NoteTextSwitchCell from '../components/cells/NoteTextSwitchCell';
import DualRangePickerCell from '../components/cells/DualRangePickerCell';
import AdvancedSettingCell from '../components/cells/AdvancedSettingCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import OptionPickerModal from '../components/OptionPickerModal';
import {
  readConnectionSettings,
  configConnectionSettings,
  apiErrorMessage,
  waitForBleReady,
  waitForBleIdle,
  type ConnectionSettingsState,
} from '../utils/mpApi';
import {
  MODEM_OPTIONS,
  REGION_OPTIONS,
  CLASS_TYPE_OPTIONS,
  MESSAGE_TYPE_OPTIONS,
  MAX_RETRANSMISSION_OPTIONS,
  DEFAULT_CONNECTION_SETTINGS,
  advanceDefaultsForRegion,
  chlValueList,
  chhValueList,
  drValueList,
  drlValueList,
  drhValueList,
  indexInList,
  showCHSection,
  showDutySection,
  showJoinSection,
} from '../utils/connectionSettingsModel';
import {showToast} from '../utils/toast';

type PickerState = {
  title: string;
  options: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

const DUTY_NOTE =
  '*It is only used for EU868 and RU864. Off: The uplink report interval will not be limit by region freqency. On:The uplink report interval will be limit by region freqency.';
const CH_NOTE = '*It is only used for US915,AU915';
const JOIN_NOTE = '*It is only used for EU868,KR920, IN865, RU864.';

const LoRaSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<ConnectionSettingsState>(
    DEFAULT_CONNECTION_SETTINGS,
  );
  const [picker, setPicker] = useState<PickerState | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const setPartial = useCallback(
    (patch: Partial<ConnectionSettingsState>) => {
      setState(prev => ({...prev, ...patch}));
    },
    [],
  );

  const applyRegionDefaults = useCallback((region: number) => {
    setState(prev => ({
      ...prev,
      region,
      ...advanceDefaultsForRegion(region, prev),
    }));
  }, []);

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
      const data = await readConnectionSettings();
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

  const saveData = async () => {
    if (loading || !dataReady) {
      showToast('Reading device settings, please wait...');
      return;
    }
    setSaving(true);
    try {
      if (!(await waitForBleReady())) {
        showToast('The current connection device is in disconnect');
        return;
      }
      await waitForBleIdle();
      await configConnectionSettings(stateRef.current);
      showToast('Success!');
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

  const isAbp = state.modem === 1;
  const advOpen = state.needAdvanceSetting && state.advancedStatus;
  const busy = loading || saving;

  const chLowList = chlValueList(state.region);
  const chHighList = chhValueList(state.region, state.CHL);
  const joinList = drValueList(state.region);
  const drLowList = drlValueList(state.region);
  const drHighList = drhValueList(state.region, state.DRL);

  const onChLowSelect = (index: number) => {
    const CHL = Number(chLowList[index]);
    const highList = chhValueList(state.region, CHL);
    let CHH = state.CHH;
    if (!highList.includes(String(CHH))) {
      CHH = Number(highList[highList.length - 1] ?? CHL);
    }
    setPartial({CHL, CHH});
  };

  const onChHighSelect = (index: number) => {
    const highList = chhValueList(state.region, state.CHL);
    setPartial({CHH: Number(highList[index])});
  };

  const onDrLowSelect = (index: number) => {
    const DRL = Number(drLowList[index]);
    const highList = drhValueList(state.region, DRL);
    let DRH = state.DRH;
    if (DRH < DRL || !highList.includes(String(DRH))) {
      DRH = DRL;
    }
    setPartial({DRL, DRH});
  };

  const onDrHighSelect = (index: number) => {
    const highList = drhValueList(state.region, state.DRL);
    setPartial({DRH: Number(highList[index])});
  };

  return (
    <StackScreenLayout
      title="Connection Settings"
      onBack={() => navigation.goBack()}
      onSave={saveData}
      saveDisabled={!dataReady || busy}
      loading={busy}
      loadingText={saving ? 'Config...' : 'Reading...'}>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <View style={styles.group}>
          <PickerButtonCell
            label="LoRaWAN Mode"
            value={MODEM_OPTIONS[state.modem - 1] ?? MODEM_OPTIONS[0]}
            onPress={() =>
              openPicker(
                'LoRaWAN Mode',
                [...MODEM_OPTIONS],
                Math.max(0, state.modem - 1),
                idx => setPartial({modem: idx + 1}),
              )
            }
          />
        </View>

        <SectionSpacer />
        <View style={styles.group}>
          <TextFieldCell
            label="DevEUI"
            value={state.devEUI}
            maxLength={16}
            keyboardType="ascii-capable"
            autoCapitalize="none"
            inputFilter="hex"
            onChangeText={t => setPartial({devEUI: t})}
          />
          <View style={styles.line} />
          <TextFieldCell
            label="AppEUI"
            value={state.appEUI}
            maxLength={16}
            keyboardType="ascii-capable"
            autoCapitalize="none"
            inputFilter="hex"
            onChangeText={t => setPartial({appEUI: t})}
          />
          {isAbp ? (
            <>
              <View style={styles.line} />
              <TextFieldCell
                label="DevAddr"
                value={state.devAddr}
                maxLength={8}
                keyboardType="ascii-capable"
                autoCapitalize="none"
                inputFilter="hex"
                onChangeText={t => setPartial({devAddr: t})}
              />
              <View style={styles.line} />
              <TextFieldCell
                label="AppSkey"
                value={state.appSKey}
                maxLength={32}
                keyboardType="ascii-capable"
                autoCapitalize="none"
                inputFilter="hex"
                onChangeText={t => setPartial({appSKey: t})}
              />
              <View style={styles.line} />
              <TextFieldCell
                label="NwkSkey"
                value={state.nwkSKey}
                maxLength={32}
                keyboardType="ascii-capable"
                autoCapitalize="none"
                inputFilter="hex"
                onChangeText={t => setPartial({nwkSKey: t})}
              />
            </>
          ) : (
            <>
              <View style={styles.line} />
              <TextFieldCell
                label="AppKey"
                value={state.appKey}
                maxLength={32}
                keyboardType="ascii-capable"
                autoCapitalize="none"
                inputFilter="hex"
                onChangeText={t => setPartial({appKey: t})}
              />
            </>
          )}
        </View>

        <SectionSpacer />
        <View style={styles.group}>
          <PickerButtonCell
            label="Region/Subnet"
            value={REGION_OPTIONS[state.region] ?? REGION_OPTIONS[0]}
            onPress={() =>
              openPicker(
                'Region/Subnet',
                [...REGION_OPTIONS],
                state.region,
                idx => applyRegionDefaults(idx),
              )
            }
          />
        </View>

        <SectionSpacer />
        <View style={styles.group}>
          <PickerButtonCell
            label="Device Type"
            value={
              CLASS_TYPE_OPTIONS[state.classType] ?? CLASS_TYPE_OPTIONS[0]
            }
            onPress={() =>
              openPicker(
                'Device Type',
                [...CLASS_TYPE_OPTIONS],
                state.classType,
                idx => setPartial({classType: idx}),
              )
            }
          />
          <View style={styles.line} />
          <PickerButtonCell
            label="Message Type"
            value={
              MESSAGE_TYPE_OPTIONS[state.messageType] ??
              MESSAGE_TYPE_OPTIONS[0]
            }
            onPress={() =>
              openPicker(
                'Message Type',
                [...MESSAGE_TYPE_OPTIONS],
                state.messageType,
                idx => setPartial({messageType: idx}),
              )
            }
          />
        </View>

        {state.needAdvanceSetting ? (
          <>
            <SectionSpacer />
            <AdvancedSettingCell
              value={state.advancedStatus}
              onValueChange={v => setPartial({advancedStatus: v})}
            />
          </>
        ) : null}

        {advOpen ? (
          <>
            {showCHSection(state.region) ? (
              <>
                <SectionSpacer />
                <DualRangePickerCell
                  label="CH"
                  lowValue={String(state.CHL)}
                  highValue={String(state.CHH)}
                  note={CH_NOTE}
                  onPressLow={() =>
                    openPicker(
                      'CH (Low)',
                      chLowList,
                      indexInList(chLowList, state.CHL),
                      onChLowSelect,
                    )
                  }
                  onPressHigh={() =>
                    openPicker(
                      'CH (High)',
                      chHighList,
                      indexInList(chHighList, state.CHH),
                      onChHighSelect,
                    )
                  }
                />
              </>
            ) : null}

            {showDutySection(state.region) ? (
              <>
                <SectionSpacer />
                <NoteTextSwitchCell
                  label="Duty-cycle"
                  value={state.dutyIsOn}
                  note={DUTY_NOTE}
                  onValueChange={v => setPartial({dutyIsOn: v})}
                />
              </>
            ) : null}

            {showJoinSection(state.region) ? (
              <>
                <SectionSpacer />
                <View style={styles.group}>
                  <PickerButtonCell
                    label="DR For Join"
                    value={String(state.join)}
                    onPress={() =>
                      openPicker(
                        'DR For Join',
                        joinList,
                        indexInList(joinList, state.join),
                        idx => setPartial({join: Number(joinList[idx])}),
                      )
                    }
                  />
                  <Text style={styles.inlineNote}>{JOIN_NOTE}</Text>
                </View>
              </>
            ) : null}

            <SectionSpacer />
            <View style={styles.group}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Uplink Strategy</Text>
              </View>
            </View>

            <SectionSpacer />
            <View style={styles.group}>
              <TextSwitchCell
                label="ADR"
                value={state.adrIsOn}
                onValueChange={v => setPartial({adrIsOn: v})}
              />
            </View>

            {!state.adrIsOn ? (
              <>
                <SectionSpacer />
                <DualRangePickerCell
                  label="DR For Payload"
                  lowValue={String(state.DRL)}
                  highValue={String(state.DRH)}
                  onPressLow={() =>
                    openPicker(
                      'DR For Payload (Low)',
                      drLowList,
                      indexInList(drLowList, state.DRL),
                      onDrLowSelect,
                    )
                  }
                  onPressHigh={() =>
                    openPicker(
                      'DR For Payload (High)',
                      drHighList,
                      indexInList(drHighList, state.DRH),
                      onDrHighSelect,
                    )
                  }
                />
              </>
            ) : null}

            {state.messageType === 1 ? (
              <>
                <SectionSpacer />
                <View style={styles.group}>
                  <PickerButtonCell
                    label="Max retransmission times"
                    value={
                      MAX_RETRANSMISSION_OPTIONS[state.maxRetransmission] ??
                      MAX_RETRANSMISSION_OPTIONS[0]
                    }
                    onPress={() =>
                      openPicker(
                        'Max retransmission times',
                        [...MAX_RETRANSMISSION_OPTIONS],
                        state.maxRetransmission,
                        idx => setPartial({maxRetransmission: idx}),
                      )
                    }
                  />
                </View>
              </>
            ) : null}
          </>
        ) : null}
      </KeyboardFormScrollView>

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
  line: {height: StyleSheet.hairlineWidth, backgroundColor: '#e8e8e8', marginLeft: 15},
  inlineNote: {
    fontSize: 12,
    color: '#666',
    paddingHorizontal: 15,
    paddingBottom: 10,
    lineHeight: 17,
  },
  sectionTitleRow: {
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  sectionTitle: {fontSize: 15, color: '#333', fontWeight: '500'},
});

export default LoRaSettingsScreen;
