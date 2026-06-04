import React, {useCallback, useState} from 'react';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {StyleSheet, View} from 'react-native';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import TextFieldCell from '../components/cells/TextFieldCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import {
  readGpsFixSettings,
  configGpsFixSettings,
  apiErrorMessage,
  waitForBleReady,
} from '../utils/mpApi';
import {
  type GpsFixState,
  DEFAULT_GPS_FIX,
} from '../utils/gpsFixModel';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const LCGpsFixScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [state, setState] = useState<GpsFixState>(DEFAULT_GPS_FIX);

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
      const data = await readGpsFixSettings();
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

  const busy = loading || saving;

  const onSave = async () => {
    if (!dataReady || busy) {
      if (loading) {
        showToast('Reading device settings, please wait...');
      }
      return;
    }
    setSaving(true);
    try {
      if (!(await waitForBleReady())) {
        showToast('The current connection device is in disconnect');
        return;
      }
      await configGpsFixSettings(state);
      showToast('Success');
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const filterDigits = (t: string) => t.replace(/\D/g, '');

  return (
    <StackScreenLayout
      title="GPS Fix"
      onBack={() => navigation.goBack()}
      onSave={onSave}
      saveDisabled={!dataReady || busy}
      loading={busy}
      saving={saving}>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <View style={styles.group}>
          <TextFieldCell
            label="Positioning Timeout"
            value={state.timeout}
            placeholder="30 ~ 600"
            unit="s"
            maxLength={3}
            onChangeText={t =>
              setState(s => ({...s, timeout: filterDigits(t)}))
            }
          />
          <View style={styles.line} />
          <TextFieldCell
            label="PDOP"
            value={state.pdop}
            placeholder="25 ~ 100"
            unit="x0.1"
            maxLength={3}
            onChangeText={t => setState(s => ({...s, pdop: filterDigits(t)}))}
          />
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

export default LCGpsFixScreen;
