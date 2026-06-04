import React, {useCallback, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import TextFieldCell from '../components/cells/TextFieldCell';
import TextSwitchCell from '../components/cells/TextSwitchCell';
import InfoButtonCell from '../components/cells/InfoButtonCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import {
  configManDown,
  readManDown,
  resetManDownIdleStatus,
} from '../utils/auxiliaryApi';
import {apiErrorMessage} from '../utils/mpApi';
import {
  type ManDownState,
  SAVE_VALIDATION_MSG_AUXILIARY,
} from '../utils/auxiliaryModel';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DEFAULT_STATE: ManDownState = {
  isOn: false,
  timeout: '168',
};

const ManDownScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [state, setState] = useState<ManDownState>(DEFAULT_STATE);

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    try {
      const data = await readManDown();
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
      await configManDown(state);
      showToast('Success');
    } catch (e) {
      const msg = apiErrorMessage(e);
      if (msg === SAVE_VALIDATION_MSG_AUXILIARY) {
        Alert.alert('Error', msg);
      } else {
        showToast(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const onResetIdleStatus = () => {
    Alert.alert('Reset Idle Status', 'Whether to confirm the reset', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'OK',
        onPress: async () => {
          setResetting(true);
          try {
            await resetManDownIdleStatus();
            showToast('Success');
          } catch (e) {
            showToast(apiErrorMessage(e));
          } finally {
            setResetting(false);
          }
        },
      },
    ]);
  };

  const busy = loading || saving || resetting;

  return (
    <StackScreenLayout
      title="ManDown Detection"
      onBack={() => navigation.goBack()}
      onSave={onSave}
      loading={busy}
      saving={saving}>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <View style={styles.group}>
          <TextSwitchCell
            label="Man Down Detection"
            value={state.isOn}
            onValueChange={v => setState(s => ({...s, isOn: v}))}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <TextFieldCell
            label="Idle Detection Timeout"
            value={state.timeout}
            placeholder="1~8760"
            unit="H"
            maxLength={4}
            inputFilter="decimal"
            onChangeText={t => setState(s => ({...s, timeout: t}))}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <InfoButtonCell
            label="Idle Status"
            buttonTitle="Reset"
            onPress={onResetIdleStatus}
          />
        </View>
        <View style={styles.bottom} />
      </KeyboardFormScrollView>
    </StackScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {flex: 1},
  group: {backgroundColor: '#fff'},
  bottom: {height: 24},
});

export default ManDownScreen;
