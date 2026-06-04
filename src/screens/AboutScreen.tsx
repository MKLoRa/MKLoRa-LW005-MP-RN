import React, {useCallback, useEffect, useState} from 'react';
import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSelector} from 'react-redux';
import StackScreenLayout from '../components/StackScreenLayout';
import {RootStackParamList} from '../types/navigation';
import {RootState} from '../store';
import MPInterface from '../sdk/MPInterface';
import MPCentralManager from '../sdk/MPCentralManager';
import {CentralConnectStatus} from '../sdk/MPSDKDefines';
import packageJson from '../../package.json';

type Nav = NativeStackNavigationProp<RootStackParamList, 'About'>;

const AboutScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const connected = useSelector((s: RootState) => s.device.connectedDevice);
  const [firmware, setFirmware] = useState('FW Version:V1.0');

  const loadFirmware = useCallback(() => {
    if (
      MPCentralManager.shared().connectStatus !==
      CentralConnectStatus.Connected
    ) {
      return;
    }
    MPInterface.read_firmware(
      data => {
        const fw = (data.result as {firmware?: string} | undefined)?.firmware;
        if (fw) {
          setFirmware(`FW Version:${fw}`);
        }
      },
      () => {},
    );
  }, []);

  useEffect(() => {
    loadFirmware();
  }, [loadFirmware, connected]);

  const openWebsite = () => {
    Linking.openURL('https://www.mokosmart.com');
  };

  return (
    <StackScreenLayout title="ABOUT" onBack={() => navigation.goBack()}>
      <View style={styles.body}>
        <Image
          source={require('../../assets/images/mp_aboutIcon.png')}
          style={styles.logo}
        />
        <Text style={styles.appName}>LW005-MP</Text>
        <Text style={styles.version}>APP Version:{packageJson.version}</Text>
        <Text style={styles.firmware}>{firmware}</Text>

        <View style={styles.spacer} />

        <Text style={styles.company}>MOKO TECHNOLOGY LTD.</Text>
        <Pressable onPress={openWebsite}>
          <Text style={styles.website}>www.mokosmart.com</Text>
          <View style={styles.underline} />
        </Pressable>

        <Image
          source={require('../../assets/images/mp_aboutBottomIcon.png')}
          style={styles.bottomImg}
          resizeMode="cover"
        />
      </View>
    </StackScreenLayout>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 40,
  },
  logo: {width: 110, height: 110},
  appName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 17,
  },
  version: {
    fontSize: 16,
    color: '#BDBDBD',
    marginTop: 17,
  },
  firmware: {
    fontSize: 16,
    color: '#BDBDBD',
    marginTop: 17,
  },
  spacer: {flex: 1, minHeight: 40},
  company: {
    fontSize: 16,
    color: '#333',
    marginBottom: 17,
  },
  website: {
    fontSize: 16,
    color: '#03BFEA',
    textAlign: 'center',
  },
  underline: {
    width: 155,
    height: 0.5,
    backgroundColor: '#03BFEA',
    alignSelf: 'center',
    marginTop: 2,
    marginBottom: 24,
  },
  bottomImg: {
    width: '100%',
    height: 213,
  },
});

export default AboutScreen;
