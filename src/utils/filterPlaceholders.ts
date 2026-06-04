/** 与 MKFilterPagesModule / MKFilterBeaconCell 等 iOS 占位文案一致 */
export const FILTER_PLACEHOLDERS = {
  beaconUuid: '0~16 Bytes',
  beaconRange: '0~65535',
  uidNamespace: '0~10 Bytes',
  uidInstance: '0~6 Bytes',
  urlContent: '0-100 Characters',
  tagId: '1-6 Bytes',
  tofCode: '1-2 Bytes',
  mac: '1-6 Bytes',
  advName: '1-20 Characters',
  otherDataType: 'Data Type',
  otherMinIndex: '00-29',
  otherMaxIndex: '00-29',
  otherRawData: 'Raw Data Field',
} as const;

export const TLM_VERSION_OPTIONS = ['Null', 'version 0', 'version 1'] as const;
