import React, {useCallback, useState} from 'react';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {StyleSheet, View} from 'react-native';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import PickerButtonCell from '../components/cells/PickerButtonCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import OptionPickerModal from '../components/OptionPickerModal';
import {
  apiErrorMessage,
  configStandbyStrategy,
  readStandbyStrategy,
  waitForBleReady,
} from '../utils/filterDeviceApi';
import {
  POSITIONING_STRATEGY_OPTIONS,
  positioningStrategyLabel,
} from '../utils/deviceModeModel';
import {PositioningStrategy} from '../sdk/MPSDKDefines';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const StandbyModeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [strategy, setStrategy] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    try {
      if (!(await waitForBleReady())) {
        if (!cancelled()) {
          showToast('The current connection device is in disconnect');
        }
        return;
      }
      const s = await readStandbyStrategy();
      if (!cancelled()) {
        setStrategy(s);
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
      if (!(await waitForBleReady())) {
        showToast('The current connection device is in disconnect');
        return;
      }
      await configStandbyStrategy(strategy as PositioningStrategy);
      showToast('Success');
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <StackScreenLayout
      title="Standby Mode"
      onBack={() => navigation.goBack()}
      onSave={onSave}
      loading={loading || saving}
      saving={saving}>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <PickerButtonCell
          label="Positioning Strategy"
          value={positioningStrategyLabel(strategy)}
          onPress={() => setPickerOpen(true)}
        />
        <View style={styles.bottom} />
      </KeyboardFormScrollView>
      {pickerOpen ? (
        <OptionPickerModal
          visible
          title="Positioning Strategy"
          options={[...POSITIONING_STRATEGY_OPTIONS]}
          selectedIndex={strategy}
          onSelect={i => {
            setStrategy(i);
            setPickerOpen(false);
          }}
          onDismiss={() => setPickerOpen(false)}
        />
      ) : null}
    </StackScreenLayout>
  );
};

const styles = StyleSheet.create({scroll: {flex: 1}, bottom: {height: 24}});

export default StandbyModeScreen;
