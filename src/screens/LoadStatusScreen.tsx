import React, {useCallback, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import TextSwitchCell from '../components/cells/TextSwitchCell';
import TextFieldCell from '../components/cells/TextFieldCell';
import LoadStatusIconCell from '../components/cells/LoadStatusIconCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import {
  readLoadStatusSettings,
  configLoadStatusSettings,
} from '../utils/generalApi';
import {
  SAVE_VALIDATION_MSG_GENERAL,
  filterDigits,
  type LoadStatusState,
} from '../utils/generalModel';
import {apiErrorMessage} from '../utils/mpApi';
import {showToast} from '../utils/toast';

const LoadStatusScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [state, setState] = useState<LoadStatusState>({
    loadStatus: false,
    loadStart: false,
    loadStop: false,
    threshold: '',
  });

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    setDataReady(false);
    try {
      const data = await readLoadStatusSettings();
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
      await configLoadStatusSettings(state);
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
      title="Load Status Notification"
      onBack={() => navigation.goBack()}
      onSave={onSave}
      saveDisabled={!dataReady || loading || saving}
      loading={loading || saving}
      loadingText={saving ? 'Config...' : 'Reading...'}>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <View style={styles.group}>
          <LoadStatusIconCell
            label="Load Status"
            loaded={state.loadStatus}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <TextSwitchCell
            label="Load Start Notification"
            value={state.loadStart}
            onValueChange={v => setState(s => ({...s, loadStart: v}))}
          />
          <View style={styles.line} />
          <TextSwitchCell
            label="Load Stop Notification"
            value={state.loadStop}
            onValueChange={v => setState(s => ({...s, loadStop: v}))}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <TextFieldCell
            label="Load Status Threshold"
            value={state.threshold}
            placeholder="1 - 10"
            unit="×0.1 W"
            maxLength={2}
            keyboardType="number-pad"
            onChangeText={t =>
              setState(s => ({...s, threshold: filterDigits(t, 2)}))
            }
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

export default LoadStatusScreen;
