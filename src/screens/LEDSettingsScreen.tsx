import React, {useCallback, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import TextSwitchCell from '../components/cells/TextSwitchCell';
import NormalTextCell from '../components/cells/NormalTextCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import {readLedSettings, configLedSettings} from '../utils/generalApi';
import {type LedSettingsState} from '../utils/generalModel';
import {apiErrorMessage} from '../utils/mpApi';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const LEDSettingsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [state, setState] = useState<LedSettingsState>({
    networkStatus: false,
    powerStatus: false,
  });

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    setDataReady(false);
    try {
      const data = await readLedSettings();
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
      await configLedSettings(state);
      showToast('Success');
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <StackScreenLayout
      title="LED Settings"
      onBack={() => navigation.goBack()}
      onSave={onSave}
      saveDisabled={!dataReady || loading || saving}
      loading={loading || saving}
      loadingText={saving ? 'Config...' : 'Reading...'}>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <View style={styles.group}>
          <NormalTextCell
            label="Power Indicator Color"
            showArrow
            onPress={() => navigation.navigate('PowerIndicatorColor')}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <TextSwitchCell
            label="Network Indicator Status"
            value={state.networkStatus}
            onValueChange={v => setState(s => ({...s, networkStatus: v}))}
          />
          <View style={styles.line} />
          <TextSwitchCell
            label="Power Indicator Status"
            value={state.powerStatus}
            onValueChange={v => setState(s => ({...s, powerStatus: v}))}
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

export default LEDSettingsScreen;
