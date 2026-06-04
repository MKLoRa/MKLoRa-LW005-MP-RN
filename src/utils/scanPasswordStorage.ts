import AsyncStorage from '@react-native-async-storage/async-storage';

/** 对齐 iOS MKMPScanController localPasswordKey */
const PASSWORD_KEY = 'mk_mp_passwordKey';

export async function loadSavedPassword(): Promise<string> {
  const value = await AsyncStorage.getItem(PASSWORD_KEY);
  return value ?? '';
}

export async function savePassword(password: string): Promise<void> {
  await AsyncStorage.setItem(PASSWORD_KEY, password);
}
