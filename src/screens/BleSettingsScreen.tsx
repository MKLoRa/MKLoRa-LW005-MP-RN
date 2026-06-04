import React, {useCallback, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import TabScreenLayout from '../components/TabScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import TextFieldCell from '../components/cells/TextFieldCell';
import TextSwitchCell from '../components/cells/TextSwitchCell';
import NormalTextCell from '../components/cells/NormalTextCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import BroadcastTxPowerCell from '../components/BroadcastTxPowerCell';
import ChangePasswordModal from '../components/ChangePasswordModal';
import MPConnectModel from '../sdk/MPConnectModel';
import {TxPower} from '../sdk/MPSDKDefines';
import {
  configBlePassword,
  configBleSettings,
  readBleSettings,
} from '../utils/bleSettingsApi';
import {apiErrorMessage} from '../utils/mpApi';
import {
  type BleSettingsState,
  SAVE_VALIDATION_MSG_BLE_SETTINGS,
} from '../utils/bleSettingsModel';
import {showToast} from '../utils/toast';
import {savePassword} from '../utils/scanPasswordStorage';
import {useTabBackToScan} from '../hooks/useTabBackToScan';

const DEFAULT_STATE: BleSettingsState = {
  advName: '',
  interval: '1',
  connectable: false,
  needPassword: false,
  txPower: TxPower.Neg4dBm,
};

const BleSettingsScreen: React.FC = () => {
  const onBack = useTabBackToScan();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<BleSettingsState>(DEFAULT_STATE);
  const [passwordModal, setPasswordModal] = useState(false);
  const [settingPassword, setSettingPassword] = useState(false);

  const canChangePassword =
    MPConnectModel.shared().hasPassword && state.needPassword;

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    try {
      const data = await readBleSettings();
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
      await configBleSettings(state);
      showToast('Success');
    } catch (e) {
      const msg = apiErrorMessage(e);
      if (msg === SAVE_VALIDATION_MSG_BLE_SETTINGS) {
        Alert.alert('Error', msg);
      } else {
        showToast(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const onPasswordConfirm = async (password: string) => {
    setPasswordModal(false);
    setSettingPassword(true);
    try {
      await configBlePassword(password);
      await savePassword(password);
      showToast('Success');
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setSettingPassword(false);
    }
  };

  const overlayBusy = loading || saving || settingPassword;

  return (
    <TabScreenLayout
      title="Bluetooth Settings"
      onBack={onBack}
      onSave={onSave}
      loading={loading && !saving && !settingPassword}
      saving={saving || settingPassword}
      loadingText={
        settingPassword ? 'Setting...' : saving ? 'Config...' : 'Reading...'
      }>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <View style={styles.group}>
          <TextFieldCell
            label="ADV Name"
            value={state.advName}
            placeholder="0 ~ 16Characters"
            maxLength={16}
            keyboardType="ascii-capable"
            inputLayout="text"
            onChangeText={t => setState(s => ({...s, advName: t}))}
          />
          <View style={styles.line} />
          <TextFieldCell
            label="ADV Interval"
            value={state.interval}
            placeholder="1 ~ 100"
            unit="x100ms"
            maxLength={3}
            inputFilter="decimal"
            onChangeText={t => setState(s => ({...s, interval: t}))}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <TextSwitchCell
            label="Connectable"
            value={state.connectable}
            onValueChange={v => setState(s => ({...s, connectable: v}))}
          />
          <View style={styles.line} />
          <TextSwitchCell
            label="Login Password"
            value={state.needPassword}
            onValueChange={v => setState(s => ({...s, needPassword: v}))}
          />
        </View>
        {state.needPassword ? (
          <>
            <SectionSpacer />
            <View style={styles.group}>
              <NormalTextCell
                label="Change Password"
                showArrow={canChangePassword}
                onPress={
                  canChangePassword
                    ? () => setPasswordModal(true)
                    : undefined
                }
              />
            </View>
          </>
        ) : null}
        <SectionSpacer />
        <BroadcastTxPowerCell
          value={state.txPower}
          onChange={txPower => setState(s => ({...s, txPower}))}
        />
        <View style={styles.bottom} />
      </KeyboardFormScrollView>
      <ChangePasswordModal
        visible={passwordModal}
        onCancel={() => setPasswordModal(false)}
        onConfirm={onPasswordConfirm}
      />
    </TabScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {flex: 1},
  group: {backgroundColor: '#fff'},
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#eee',
    marginLeft: 15,
  },
  bottom: {height: 24},
});

export default BleSettingsScreen;
