import {useCallback} from 'react';
import {resetToScan} from '../navigation/navigationRef';

/** 对齐 iOS：popToRoot + disconnect，扫描页才能重新扫到设备 */
export function useTabBackToScan() {
  return useCallback(() => resetToScan(), []);
}
