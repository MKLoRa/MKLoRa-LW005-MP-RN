import React, {useCallback, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import TabScreenLayout from '../components/TabScreenLayout';
import NormalTextCell from '../components/cells/NormalTextCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import {useTabBackToScan} from '../hooks/useTabBackToScan';
import {regionNameFromKey} from '../constants/lorawanRegion';
import {
  apiErrorMessage,
  classTypeLabel,
  modemLabel,
  mpRead,
  networkStatusLabel,
  waitForBleReady,
} from '../utils/mpApi';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const LoRaScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const onBack = useTabBackToScan();
  const [loading, setLoading] = useState(true);
  const [networkStatus, setNetworkStatus] = useState('');
  const [modem, setModem] = useState('');
  const [region, setRegion] = useState('');
  const [classType, setClassType] = useState('');

  const readData = useCallback(async () => {
    setLoading(true);
    try {
      if (!(await waitForBleReady())) {
        showToast('The current connection device is in disconnect');
        return;
      }
      const modemRes = await mpRead.lorawanModem();
      const regionRes = await mpRead.lorawanRegion();
      const classRes = await mpRead.lorawanClassType();
      const statusRes = await mpRead.lorawanNetworkStatus();

      setModem(modemLabel(modemRes.modem));
      setRegion(regionNameFromKey(String(regionRes.region ?? '')));
      setClassType(classTypeLabel(classRes.classType));
      setNetworkStatus(networkStatusLabel(statusRes.status));
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      readData();
    }, [readData]),
  );

  const connectionSummary =
    modem && region && classType ? `${modem}/${region}/${classType}` : '';

  return (
    <TabScreenLayout title="LoRa" onBack={onBack} loading={loading}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <SectionSpacer />
        <View style={styles.group}>
          <NormalTextCell label="LoRaWAN Status" value={networkStatus} />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <NormalTextCell
            label="Connection Settings"
            value={connectionSummary}
            showArrow
            onPress={() => navigation.navigate('LoRaSettings')}
          />
          <View style={styles.line} />
          <NormalTextCell
            label="Application Settings"
            showArrow
            onPress={() => navigation.navigate('LoRaApp')}
          />
        </View>
      </ScrollView>
    </TabScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {flex: 1},
  group: {
    marginHorizontal: 0,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e8e8e8',
    marginLeft: 15,
  },
});

export default LoRaScreen;
