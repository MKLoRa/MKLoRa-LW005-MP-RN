import React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import StackScreenLayout from '../components/StackScreenLayout';
import NormalTextCell from '../components/cells/NormalTextCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type AuxiliaryRoute =
  | 'Downlink'
  | 'Vibration'
  | 'ManDown'
  | 'TamperAlarm';

/** 对齐 iOS MKMPAuxiliaryController loadSectionDatas */
const MENU_ITEMS: {label: string; route: AuxiliaryRoute}[] = [
  {label: 'Downlink For Position', route: 'Downlink'},
  {label: 'Shock Detection', route: 'Vibration'},
  {label: 'ManDown Detection', route: 'ManDown'},
  {label: 'Tamper Alarm Function', route: 'TamperAlarm'},
];

const AuxiliaryScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();

  return (
    <StackScreenLayout
      title="Auxiliary Operation"
      onBack={() => navigation.goBack()}>
      <ScrollView style={styles.scroll}>
        <SectionSpacer />
        <View style={styles.group}>
          {MENU_ITEMS.map(item => (
            <NormalTextCell
              key={item.route}
              label={item.label}
              showArrow
              onPress={() => navigation.navigate(item.route)}
            />
          ))}
        </View>
        <View style={styles.bottom} />
      </ScrollView>
    </StackScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {flex: 1},
  group: {backgroundColor: '#fff'},
  bottom: {height: 24},
});

export default AuxiliaryScreen;
