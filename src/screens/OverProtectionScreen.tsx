import React, {useCallback, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import TextSwitchCell from '../components/cells/TextSwitchCell';
import TextFieldCell from '../components/cells/TextFieldCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import {ProductModel} from '../sdk/MPSDKDefines';
import {
  readProtectionSettings,
  configProtectionSettings,
} from '../utils/generalApi';
import {
  SAVE_VALIDATION_MSG_GENERAL,
  filterDigits,
  protectionThresholdLabel,
  protectionThresholdMaxLength,
  protectionThresholdUnit,
  protectionTitle,
  type ProtectionSettingsState,
} from '../utils/generalModel';
import {apiErrorMessage} from '../utils/mpApi';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'OverProtection'>;

const OverProtectionScreen: React.FC<Props> = () => {
  const navigation = useNavigation();
  const route = useRoute<Props['route']>();
  const {type} = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [state, setState] = useState<ProtectionSettingsState>({
    isOn: false,
    overThreshold: '',
    timeThreshold: '',
    productModel: ProductModel.EuropeFrance,
  });

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    setDataReady(false);
    try {
      const data = await readProtectionSettings(type);
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
  }, [type]);

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
      await configProtectionSettings(type, state);
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
      title={protectionTitle(type)}
      onBack={() => navigation.goBack()}
      onSave={onSave}
      saveDisabled={!dataReady || loading || saving}
      loading={loading || saving}
      loadingText={saving ? 'Config...' : 'Reading...'}>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <View style={styles.group}>
          <TextSwitchCell
            label={protectionTitle(type)}
            value={state.isOn}
            onValueChange={v => setState(s => ({...s, isOn: v}))}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <TextFieldCell
            label={protectionThresholdLabel(type)}
            value={state.overThreshold}
            unit={protectionThresholdUnit(type)}
            maxLength={protectionThresholdMaxLength(type)}
            keyboardType="number-pad"
            onChangeText={t =>
              setState(s => ({
                ...s,
                overThreshold: filterDigits(
                  t,
                  protectionThresholdMaxLength(type),
                ),
              }))
            }
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <TextFieldCell
            label="Time Threshold"
            value={state.timeThreshold}
            placeholder="1 - 30"
            unit="S"
            maxLength={2}
            keyboardType="number-pad"
            onChangeText={t =>
              setState(s => ({...s, timeThreshold: filterDigits(t, 2)}))
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
});

export default OverProtectionScreen;
