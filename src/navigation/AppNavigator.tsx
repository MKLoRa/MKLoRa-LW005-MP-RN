import React from 'react';
import {Image} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {RootStackParamList, MainTabParamList} from '../types/navigation';
import {NAVBAR_COLOR, NAVBAR_TINT} from '../theme/colors';
import NavBackButton from '../components/NavBackButton';

import ScanScreen from '../screens/ScanScreen';
import LoRaScreen from '../screens/LoRaScreen';
import GeneralScreen from '../screens/GeneralScreen';
import BleSettingsScreen from '../screens/BleSettingsScreen';
import DeviceSettingScreen from '../screens/DeviceSettingScreen';
import LoRaSettingsScreen from '../screens/LoRaSettingsScreen';
import LoRaAppScreen from '../screens/LoRaAppScreen';
import DownlinkScreen from '../screens/DownlinkScreen';
import OutdoorFixScreen from '../screens/OutdoorFixScreen';
import LCGpsFixScreen from '../screens/LCGpsFixScreen';
import BleFixScreen from '../screens/BleFixScreen';
import OnOffSettingsScreen from '../screens/OnOffSettingsScreen';
import DeviceInfoScreen from '../screens/DeviceInfoScreen';
import BatteryConsumptionScreen from '../screens/BatteryConsumptionScreen';
import UpdateScreen from '../screens/UpdateScreen';
import DebuggerScreen from '../screens/DebuggerScreen';
import FilterByRawDataScreen from '../screens/FilterByRawDataScreen';
import FilterByBeaconScreen from '../screens/FilterByBeaconScreen';
import FilterByUIDScreen from '../screens/FilterByUIDScreen';
import FilterByURLScreen from '../screens/FilterByURLScreen';
import FilterByTLMScreen from '../screens/FilterByTLMScreen';
import FilterByBXPButtonScreen from '../screens/FilterByBXPButtonScreen';
import FilterByBXPTagScreen from '../screens/FilterByBXPTagScreen';
import FilterByPirScreen from '../screens/FilterByPirScreen';
import FilterByTofScreen from '../screens/FilterByTofScreen';
import FilterByOtherScreen from '../screens/FilterByOtherScreen';
import FilterByMacScreen from '../screens/FilterByMacScreen';
import FilterByAdvNameScreen from '../screens/FilterByAdvNameScreen';
import SwitchSettingsScreen from '../screens/SwitchSettingsScreen';
import ElectricitySettingsScreen from '../screens/ElectricitySettingsScreen';
import EnergySettingsScreen from '../screens/EnergySettingsScreen';
import ProtectionSettingsScreen from '../screens/ProtectionSettingsScreen';
import OverProtectionScreen from '../screens/OverProtectionScreen';
import LoadStatusScreen from '../screens/LoadStatusScreen';
import CountdownSettingsScreen from '../screens/CountdownSettingsScreen';
import LEDSettingsScreen from '../screens/LEDSettingsScreen';
import PowerIndicatorColorScreen from '../screens/PowerIndicatorColorScreen';
import AboutScreen from '../screens/AboutScreen';
import DeviceModeScreen from '../screens/DeviceModeScreen';
import StandbyModeScreen from '../screens/StandbyModeScreen';
import PeriodicModeScreen from '../screens/PeriodicModeScreen';
import TimingModeScreen from '../screens/TimingModeScreen';
import MotionModeScreen from '../screens/MotionModeScreen';
import TimeSegmentedModeScreen from '../screens/TimeSegmentedModeScreen';
import VibrationScreen from '../screens/VibrationScreen';
import AuxiliaryScreen from '../screens/AuxiliaryScreen';
import AxisSettingScreen from '../screens/AxisSettingScreen';
import AlertAlarmSettingsScreen from '../screens/AlertAlarmSettingsScreen';
import SosAlarmSettingsScreen from '../screens/SosAlarmSettingsScreen';
import LightMonitorSettingsScreen from '../screens/LightMonitorSettingsScreen';
import TempMonitorSettingsScreen from '../screens/TempMonitorSettingsScreen';
import IndicatorSettingsScreen from '../screens/IndicatorSettingsScreen';
import LocalDataSyncScreen from '../screens/LocalDataSyncScreen';
import ManDownScreen from '../screens/ManDownScreen';
import TamperAlarmScreen from '../screens/TamperAlarmScreen';
import AlarmFunctionScreen from '../screens/AlarmFunctionScreen';
import BatteryScreen from '../screens/BatteryScreen';
import SystemScreen from '../screens/SystemScreen';
import {useTabBarDisconnectAlerts} from '../hooks/useTabBarDisconnectAlerts';
import {navigationRef} from './navigationRef';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const stackScreenOptions = {
  headerStyle: {backgroundColor: NAVBAR_COLOR},
  headerTintColor: NAVBAR_TINT,
  headerTitleStyle: {fontWeight: '600' as const, color: NAVBAR_TINT},
  headerShadowVisible: false,
  headerBackTitleVisible: false,
  headerBackTitle: '',
  headerBackVisible: false,
  headerLeft: ({canGoBack, onPress}: {canGoBack?: boolean; onPress?: () => void}) =>
    canGoBack && onPress ? (
      <NavBackButton onPress={onPress} />
    ) : null,
};

function DisconnectAlertHost() {
  useTabBarDisconnectAlerts();
  return null;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: NAVBAR_COLOR,
        tabBarInactiveTintColor: '#999',
      }}>
      <Tab.Screen
        name="LORA"
        component={LoRaScreen}
        options={{
          tabBarLabel: 'LORA',
          tabBarIcon: ({focused}) => (
            <Image
              source={
                focused
                  ? require('../../assets/images/mp_lora_tabBarSelected.png')
                  : require('../../assets/images/mp_lora_tabBarUnselected.png')
              }
              style={{width: 24, height: 24}}
            />
          ),
        }}
      />
      <Tab.Screen
        name="GENERAL"
        component={GeneralScreen}
        options={{
          tabBarLabel: 'GENERAL',
          tabBarIcon: ({focused}) => (
            <Image
              source={
                focused
                  ? require('../../assets/images/mp_setting_tabBarSelected.png')
                  : require('../../assets/images/mp_setting_tabBarUnselected.png')
              }
              style={{width: 24, height: 24}}
            />
          ),
        }}
      />
      <Tab.Screen
        name="BLUETOOTH"
        component={BleSettingsScreen}
        options={{
          tabBarLabel: 'BLUETOOTH',
          tabBarIcon: ({focused}) => (
            <Image
              source={
                focused
                  ? require('../../assets/images/mp_bleSettings_tabBarSelected.png')
                  : require('../../assets/images/mp_bleSettings_tabBarUnselected.png')
              }
              style={{width: 24, height: 24}}
            />
          ),
        }}
      />
      <Tab.Screen
        name="DEVICE"
        component={DeviceSettingScreen}
        options={{
          tabBarLabel: 'DEVICE',
          tabBarIcon: ({focused}) => (
            <Image
              source={
                focused
                  ? require('../../assets/images/mp_device_tabBarSelected.png')
                  : require('../../assets/images/mp_device_tabBarUnselected.png')
              }
              style={{width: 24, height: 24}}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <DisconnectAlertHost />
      <Stack.Navigator screenOptions={stackScreenOptions}>
        <Stack.Screen
          name="Scan"
          component={ScanScreen}
          options={{headerShown: false, animation: 'none'}}
        />
        <Stack.Screen
          name="SwitchSettings"
          component={SwitchSettingsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ElectricitySettings"
          component={ElectricitySettingsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="EnergySettings"
          component={EnergySettingsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ProtectionSettings"
          component={ProtectionSettingsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="OverProtection"
          component={OverProtectionScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="LoadStatusNotification"
          component={LoadStatusScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="CountdownSettings"
          component={CountdownSettingsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="LEDSettings"
          component={LEDSettingsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="PowerIndicatorColor"
          component={PowerIndicatorColorScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="About"
          component={AboutScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="LoRaSettings"
          component={LoRaSettingsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="LoRaApp"
          component={LoRaAppScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Downlink"
          component={DownlinkScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="OutdoorFix"
          component={OutdoorFixScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="LCGpsFix"
          component={LCGpsFixScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="BleFix"
          component={BleFixScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="OnOffSettings"
          component={OnOffSettingsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="BleSettings"
          component={BleSettingsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="DeviceInfo"
          component={DeviceInfoScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="BatteryConsumption"
          component={BatteryConsumptionScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Update"
          component={UpdateScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Debugger"
          component={DebuggerScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="FilterByRawData"
          component={FilterByRawDataScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="FilterByMac"
          component={FilterByMacScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="FilterByAdvName"
          component={FilterByAdvNameScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="FilterByBeacon"
          component={FilterByBeaconScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="FilterByUID"
          component={FilterByUIDScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="FilterByURL"
          component={FilterByURLScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="FilterByTLM"
          component={FilterByTLMScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="FilterByBXPButton"
          component={FilterByBXPButtonScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="FilterByBXPTag"
          component={FilterByBXPTagScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="FilterByPir"
          component={FilterByPirScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="FilterByTof"
          component={FilterByTofScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="FilterByOther"
          component={FilterByOtherScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="DeviceMode"
          component={DeviceModeScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="StandbyMode"
          component={StandbyModeScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="PeriodicMode"
          component={PeriodicModeScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="TimingMode"
          component={TimingModeScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="MotionMode"
          component={MotionModeScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="TimeSegmentedMode"
          component={TimeSegmentedModeScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Vibration"
          component={VibrationScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Auxiliary"
          component={AuxiliaryScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="AxisSetting"
          component={AxisSettingScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="AlertAlarmSettings"
          component={AlertAlarmSettingsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="SosAlarmSettings"
          component={SosAlarmSettingsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="LightMonitorSettings"
          component={LightMonitorSettingsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="TempMonitorSettings"
          component={TempMonitorSettingsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="IndicatorSettings"
          component={IndicatorSettingsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="LocalDataSync"
          component={LocalDataSyncScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ManDown"
          component={ManDownScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="TamperAlarm"
          component={TamperAlarmScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="AlarmFunction"
          component={AlarmFunctionScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen name="Battery" component={BatteryScreen} />
        <Stack.Screen name="System" component={SystemScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
