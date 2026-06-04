import React, {useCallback, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import NormalTextCell from '../components/cells/NormalTextCell';
import InfoButtonCell from '../components/cells/InfoButtonCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import {readDeviceInfo, type DeviceInfoState} from '../utils/deviceInfoApi';
import {apiErrorMessage} from '../utils/mpApi';
import {showToast} from '../utils/toast';
import MPConnectModel from '../sdk/MPConnectModel';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const EMPTY: DeviceInfoState = {
  software: '',
  firmware: '',
  hardware: '',
  macAddress: '',
  productModel: '',
  manufacturer: '',
};

const DeviceInfoScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<DeviceInfoState>(EMPTY);
  const skipReadRef = useRef(false);

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    try {
      const data = await readDeviceInfo();
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
      if (MPConnectModel.shared().isDfuInProgress()) {
        MPConnectModel.shared().setDfuInProgress(false);
        skipReadRef.current = true;
      }
      if (skipReadRef.current) {
        skipReadRef.current = false;
        return undefined;
      }
      let cancelled = false;
      readData(() => cancelled);
      return () => {
        cancelled = true;
      };
    }, [readData]),
  );

  return (
    <StackScreenLayout
      title="Device Information"
      onBack={() => navigation.goBack()}
      loading={loading}>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <View style={styles.group}>
          <NormalTextCell
            label="Software Version"
            value={state.software || undefined}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <InfoButtonCell
            label="Firmware Version"
            value={state.firmware || undefined}
            buttonTitle="DFU"
            onPress={() => navigation.navigate('Update')}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <NormalTextCell
            label="Hardware Version"
            value={state.hardware || undefined}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <NormalTextCell
            label="MAC Address"
            value={state.macAddress || undefined}
          />
          <View style={styles.line} />
          <NormalTextCell
            label="Product Model"
            value={state.productModel || undefined}
          />
          <View style={styles.line} />
          <NormalTextCell
            label="Manufacturer"
            value={state.manufacturer || undefined}
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
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#eee',
    marginLeft: 15,
  },
  bottom: {height: 24},
});

export default DeviceInfoScreen;
