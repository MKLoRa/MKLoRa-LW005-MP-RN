import React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import TabScreenLayout from '../components/TabScreenLayout';
import NormalTextCell from '../components/cells/NormalTextCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import {useTabBackToScan} from '../hooks/useTabBackToScan';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type GeneralMenuRoute =
  | 'SwitchSettings'
  | 'ElectricitySettings'
  | 'EnergySettings'
  | 'ProtectionSettings'
  | 'LoadStatusNotification'
  | 'CountdownSettings'
  | 'LEDSettings';

const GENERAL_MENU: {label: string; route: GeneralMenuRoute}[] = [
  {label: 'Switch Control', route: 'SwitchSettings'},
  {label: 'Electricity Settings', route: 'ElectricitySettings'},
  {label: 'Energy Settings', route: 'EnergySettings'},
  {label: 'Protection Settings', route: 'ProtectionSettings'},
  {label: 'Load Status Notification', route: 'LoadStatusNotification'},
  {label: 'Countdown Settings', route: 'CountdownSettings'},
  {label: 'LED Settings', route: 'LEDSettings'},
];

const GeneralScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const onBack = useTabBackToScan();

  return (
    <TabScreenLayout title="General Settings" onBack={onBack}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {GENERAL_MENU.map(item => (
          <React.Fragment key={item.route}>
            <SectionSpacer />
            <View style={styles.group}>
              <NormalTextCell
                label={item.label}
                showArrow
                onPress={() => navigation.navigate(item.route)}
              />
            </View>
          </React.Fragment>
        ))}
        <SectionSpacer />
      </ScrollView>
    </TabScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {flex: 1},
  group: {backgroundColor: '#fff'},
});

export default GeneralScreen;
