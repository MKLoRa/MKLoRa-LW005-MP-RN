import React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import StackScreenLayout from '../components/StackScreenLayout';
import NormalTextCell from '../components/cells/NormalTextCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import {OverProtectionType} from '../sdk/MPSDKDefines';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PROTECTION_MENU: {label: string; type: OverProtectionType}[] = [
  {label: 'Over-Load Protection', type: OverProtectionType.Load},
  {label: 'Over-Voltage Protection', type: OverProtectionType.Voltage},
  {label: 'Sag-Voltage Protection', type: OverProtectionType.SagVoltage},
  {label: 'Over-Current Protection', type: OverProtectionType.Current},
];

const ProtectionSettingsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();

  return (
    <StackScreenLayout
      title="Protection Settings"
      onBack={() => navigation.goBack()}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {PROTECTION_MENU.map(item => (
          <React.Fragment key={item.type}>
            <SectionSpacer />
            <View style={styles.group}>
              <NormalTextCell
                label={item.label}
                showArrow
                onPress={() =>
                  navigation.navigate('OverProtection', {type: item.type})
                }
              />
            </View>
          </React.Fragment>
        ))}
        <SectionSpacer />
      </ScrollView>
    </StackScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {flex: 1},
  group: {backgroundColor: '#fff'},
});

export default ProtectionSettingsScreen;
