import React, {useCallback, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import PickerButtonCell from '../components/cells/PickerButtonCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import OptionPickerModal from '../components/OptionPickerModal';
import {configDownlink, readDownlink} from '../utils/auxiliaryApi';
import {apiErrorMessage} from '../utils/mpApi';
import {
  POSITIONING_STRATEGY_OPTIONS,
  positioningStrategyLabel,
} from '../utils/deviceModeModel';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DownlinkScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [configuring, setConfiguring] = useState(false);
  const [strategy, setStrategy] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    try {
      const data = await readDownlink();
      if (!cancelled()) {
        setStrategy(data.strategy);
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

  const onStrategySelect = async (index: number) => {
    setPickerOpen(false);
    setConfiguring(true);
    try {
      await configDownlink(index);
      setStrategy(index);
    } catch (e) {
      showToast(apiErrorMessage(e));
      readData(() => false);
    } finally {
      setConfiguring(false);
    }
  };

  return (
    <StackScreenLayout
      title="Downlink For Position"
      onBack={() => navigation.goBack()}
      loading={loading || configuring}
      saving={configuring}>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <View style={styles.group}>
          <PickerButtonCell
            label="Positioning Strategy"
            value={positioningStrategyLabel(strategy)}
            onPress={() => setPickerOpen(true)}
          />
        </View>
        <View style={styles.bottom} />
      </KeyboardFormScrollView>
      {pickerOpen ? (
        <OptionPickerModal
          visible
          title="Positioning Strategy"
          options={[...POSITIONING_STRATEGY_OPTIONS]}
          selectedIndex={strategy}
          onSelect={onStrategySelect}
          onDismiss={() => setPickerOpen(false)}
        />
      ) : null}
    </StackScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {flex: 1},
  group: {backgroundColor: '#fff'},
  bottom: {height: 24},
});

export default DownlinkScreen;
