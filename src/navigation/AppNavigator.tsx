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
import DeviceInfoScreen from '../screens/DeviceInfoScreen';
import UpdateScreen from '../screens/UpdateScreen';
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
          name="Update"
          component={UpdateScreen}
          options={{headerShown: false}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
