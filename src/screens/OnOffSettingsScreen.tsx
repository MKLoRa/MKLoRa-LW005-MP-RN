import React, {useCallback, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import TextSwitchCell from '../components/cells/TextSwitchCell';
import {
  configOffByMagnetic,
  configShutDownPayload,
  powerOffDevice,
  readOnOffSettings,
  type OnOffSettingsState,
} from '../utils/onOffSettingsApi';
import {apiErrorMessage} from '../utils/mpApi';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DEFAULT: OnOffSettingsState = {
  shutDownPayload: false,
  offByMagnetic: false,
};

const OnOffSettingsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [configuring, setConfiguring] = useState(false);
  const [state, setState] = useState<OnOffSettingsState>(DEFAULT);

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    try {
      const data = await readOnOffSettings();
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

  const runConfig = async (
    fn: () => Promise<void>,
    apply: (v: boolean) => Partial<OnOffSettingsState>,
    value: boolean,
    revert?: () => void,
  ) => {
    setConfiguring(true);
    try {
      await fn();
      setState(s => ({...s, ...apply(value)}));
    } catch (e) {
      showToast(apiErrorMessage(e));
      revert?.();
    } finally {
      setConfiguring(false);
    }
  };

  const onShutDownPayload = (v: boolean) =>
    runConfig(
      () => configShutDownPayload(v),
      val => ({shutDownPayload: val}),
      v,
      () => setState(s => ({...s, shutDownPayload: !v})),
    );

  const onOffByMagnetic = (v: boolean) =>
    runConfig(
      () => configOffByMagnetic(v),
      val => ({offByMagnetic: val}),
      v,
      () => setState(s => ({...s, offByMagnetic: !v})),
    );

  const onPowerOff = () => {
    Alert.alert(
      'Warning!',
      'Are you sure to turn off the device? Please make sure the device has a button to turn on!',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'OK',
          onPress: () => {
            setConfiguring(true);
            powerOffDevice()
              .catch(e => showToast(apiErrorMessage(e)))
              .finally(() => setConfiguring(false));
          },
        },
      ],
    );
  };

  return (
    <StackScreenLayout
      title="ON/OFF Settings"
      onBack={() => navigation.goBack()}
      loading={loading || configuring}
      saving={configuring}>
      <KeyboardFormScrollView style={styles.scroll}>
        <View style={styles.group}>
          <TextSwitchCell
            label="Shut-Down Payload"
            value={state.shutDownPayload}
            onValueChange={onShutDownPayload}
            disabled={configuring}
          />
          <View style={styles.line} />
          <TextSwitchCell
            label="OFF by Magnetic"
            value={state.offByMagnetic}
            onValueChange={onOffByMagnetic}
            disabled={configuring}
          />
          <View style={styles.line} />
          <TextSwitchCell
            label="Power Off"
            value={false}
            onValueChange={v => {
              if (v) {
                onPowerOff();
              }
            }}
            disabled={configuring}
          />
        </View>
        <View style={styles.bottom} />
      </KeyboardFormScrollView>
    </StackScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {flex: 1},
  group: {backgroundColor: '#fff', marginTop: 10},
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#eee',
    marginLeft: 15,
  },
  bottom: {height: 24},
});

export default OnOffSettingsScreen;
