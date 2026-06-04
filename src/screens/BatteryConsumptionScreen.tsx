import React, {useCallback, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import BatteryCycleInfoPanel from '../components/BatteryCycleInfoPanel';
import ButtonNoteCell from '../components/cells/ButtonNoteCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import {
  readBatteryConsumption,
  resetBatteryConsumption,
  type BatteryConsumptionState,
} from '../utils/batteryConsumptionApi';
import {apiErrorMessage} from '../utils/mpApi';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';
import type {BatteryCycleInfo} from '../utils/selftestApi';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const EMPTY_BATTERY: BatteryCycleInfo = {
  workTimes: '',
  advCount: '',
  axisWakeupTimes: '',
  blePostionTimes: '',
  gpsPostionTimes: '',
  loraSendCount: '',
  loraPowerConsumption: '',
  batteryPower: '',
  staticPositionCount: '',
  movePositionCount: '',
};

const EMPTY: BatteryConsumptionState = {
  currentInfo: EMPTY_BATTERY,
  lastInfo: EMPTY_BATTERY,
  allInfo: EMPTY_BATTERY,
};

const BatteryConsumptionScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [state, setState] = useState<BatteryConsumptionState>(EMPTY);

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    try {
      const data = await readBatteryConsumption();
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

  const onBatteryReset = () => {
    Alert.alert('Warning!', 'Are you sure to reset battery?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'OK',
        onPress: async () => {
          setResetting(true);
          try {
            await resetBatteryConsumption();
            setState(EMPTY);
            await readData(() => false);
          } catch (e) {
            showToast(apiErrorMessage(e));
          } finally {
            setResetting(false);
          }
        },
      },
    ]);
  };

  return (
    <StackScreenLayout
      title="Battery Consumption Information"
      onBack={() => navigation.goBack()}
      loading={loading || resetting}
      saving={resetting}>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <BatteryCycleInfoPanel
          title="Current Cycle Battery Information:"
          info={state.currentInfo}
        />
        <SectionSpacer />
        <ButtonNoteCell
          label="Battery Reset"
          buttonTitle="Reset"
          note='*After replace with the new battery, need to click "Reset", otherwise the low power prompt will be unnormal.'
          onPress={onBatteryReset}
          disabled={loading || resetting}
        />
        <SectionSpacer />
        <BatteryCycleInfoPanel
          title="All Cycles Battery Information:"
          info={state.allInfo}
        />
        <SectionSpacer />
        <BatteryCycleInfoPanel
          title="Last Cycle Battery Information:"
          info={state.lastInfo}
        />
        <View style={styles.bottom} />
      </KeyboardFormScrollView>
    </StackScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {flex: 1},
  bottom: {height: 24},
});

export default BatteryConsumptionScreen;
