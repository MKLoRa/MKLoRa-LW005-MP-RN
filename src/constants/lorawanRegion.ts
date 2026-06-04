/** 对齐 MKMPLoRaPageModel RegionDic */
export const LORAWAN_REGION_MAP: Record<string, string> = {
  '0': 'AS923',
  '1': 'AU915',
  '2': 'CN470',
  '3': 'CN779',
  '4': 'EU433',
  '5': 'EU868',
  '6': 'KR920',
  '7': 'IN865',
  '8': 'US915',
  '9': 'RU864',
};

export function regionNameFromKey(key: string | number): string {
  return LORAWAN_REGION_MAP[String(key)] ?? String(key);
}
