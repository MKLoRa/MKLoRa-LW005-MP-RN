#!/usr/bin/env python3
"""Generate MPTaskAdopter.ts from MKMPTaskAdopter.m (LW005-MP, 1-byte CMD)"""
import re
from pathlib import Path

M_PATH = Path(
    '/Users/aa/Desktop/MKLoRaApp/Modules/MKLoRaWAN-MP/MKLoRaWAN-MP/Classes/SDK/MKMPTaskAdopter.m'
)
OUT_PATH = Path(__file__).resolve().parent.parent / 'src/sdk/MPTaskAdopter.ts'

src = M_PATH.read_text()


def extract_method_body(signature_fragment: str) -> str:
    idx = src.find(signature_fragment)
    if idx < 0:
        raise ValueError(f'Method not found: {signature_fragment}')
    brace = src.find('{', idx)
    depth = 1
    i = brace + 1
    while i < len(src) and depth > 0:
        if src[i] == '{':
            depth += 1
        elif src[i] == '}':
            depth -= 1
        i += 1
    return src[brace + 1 : i - 1]


def convert_objc_body(body: str) -> str:
    b = body
    b = re.sub(r'mk_mp_taskOperationID operationID = mk_mp_defaultTaskOperationID;', '', b)
    b = re.sub(r'NSDictionary \*resultDic = @\{\};', 'let result: Record<string, unknown> = {};', b)
    b = re.sub(r'BOOL success = \[content isEqualToString:@"01"\];', "const success = content === '01';", b)
    b = re.sub(r'operationID = (mk_mp_\w+);', r'operationID = TaskOperationID.\1;', b)
    b = re.sub(r'resultDic = ', 'result = ', b)

    b = re.sub(
        r'NSString \*txPower = \[MKMPSDKDataAdopter fetchTxPowerValueString:content\];',
        'const txPower = fetchTxPowerValueString(content);',
        b,
    )

    b = re.sub(
        r'\[MKBLEBaseSDKAdopter getDecimalStringWithHex:content range:NSMakeRange\((\d+), content\.length\)\]',
        r'getDecimalStringWithHex(content, \1, content.length)',
        b,
    )
    b = re.sub(
        r'\[MKBLEBaseSDKAdopter getDecimalStringWithHex:content range:NSMakeRange\((\d+), (\d+)\)\]',
        r'getDecimalStringWithHex(content, \1, \2)',
        b,
    )
    b = re.sub(r'\[MKBLEBaseSDKAdopter signedHexTurnString:content\]', 'signedHexTurnString(content)', b)
    b = re.sub(
        r'\[MKBLEBaseSDKAdopter getDecimalWithHex:content range:NSMakeRange\((\d+), (\d+)\)\]',
        r'getDecimalWithHex(content, \1, \2)',
        b,
    )
    b = re.sub(
        r'\[content substringWithRange:NSMakeRange\((\d+), (\d+)\)\]',
        r'hexSubstring(content, \1, \2)',
        b,
    )

    b = re.sub(r'BOOL (\w+) = \[content isEqualToString:@"01"\];', r"const \1 = content === '01';", b)
    b = re.sub(r'BOOL (\w+) = \(\[content isEqualToString:@"01"\]\);', r"const \1 = content === '01';", b)
    b = re.sub(
        r'BOOL (\w+) = \(\[\[content substringWithRange:NSMakeRange\((\d+), (\d+)\)\] isEqualToString:@"01"\]\);',
        r"const \1 = hexSubstring(content, \2, \3) === '01';",
        b,
    )

    b = re.sub(
        r'NSString \*voltage = \[NSString stringWithFormat:@"%.1f",\(\[MKBLEBaseSDKAdopter getDecimalWithHex:content range:NSMakeRange\(0, 4\)\] \* 0\.1\)\];',
        'const voltage = `${(getDecimalWithHex(content, 0, 4) * 0.1).toFixed(1)}`;',
        b,
    )
    b = re.sub(
        r'NSString \*current = \[NSString stringWithFormat:@"%.3f",\(\[MKBLEBaseSDKAdopter getDecimalWithHex:content range:NSMakeRange\(4, 4\)\] \* 0\.001\)\];',
        'const current = `${(getDecimalWithHex(content, 4, 4) * 0.001).toFixed(3)}`;',
        b,
    )
    b = re.sub(
        r'NSString \*power = \[NSString stringWithFormat:@"%.1f",\(\[MKBLEBaseSDKAdopter getDecimalWithHex:content range:NSMakeRange\(8, 8\)\] \* 0\.1\)\];',
        'const power = `${(getDecimalWithHex(content, 8, 8) * 0.1).toFixed(1)}`;',
        b,
    )
    b = re.sub(
        r'NSString \*frequencyOfCurrent = \[NSString stringWithFormat:@"%.3f",\(\[MKBLEBaseSDKAdopter getDecimalWithHex:content range:NSMakeRange\(16, 4\)\] \* 0\.001\)\];',
        'const frequencyOfCurrent = `${(getDecimalWithHex(content, 16, 4) * 0.001).toFixed(3)}`;',
        b,
    )

    b = re.sub(
        r'NSData \*passwordData = \[data subdataWithRange:NSMakeRange\(4, data\.length - 4\)\];\s*NSString \*password = \[\[NSString alloc\] initWithData:passwordData encoding:NSUTF8StringEncoding\];',
        'const password = utf8StringFromData(data, 4);',
        b,
    )
    b = re.sub(
        r'NSData \*nameData = \[data subdataWithRange:NSMakeRange\(4, data\.length - 4\)\];\s*NSString \*deviceName = \[\[NSString alloc\] initWithData:nameData encoding:NSUTF8StringEncoding\];',
        'const deviceName = utf8StringFromData(data, 4);',
        b,
    )

    if 'NSString *macAddress' in b:
        b = b.replace(
            'NSString *macAddress = [NSString stringWithFormat:@"%@:%@:%@:%@:%@:%@",[content substringWithRange:NSMakeRange(0, 2)],[content substringWithRange:NSMakeRange(2, 2)],[content substringWithRange:NSMakeRange(4, 2)],[content substringWithRange:NSMakeRange(6, 2)],[content substringWithRange:NSMakeRange(8, 2)],[content substringWithRange:NSMakeRange(10, 2)]];',
            'const macAddress = `${hexSubstring(content, 0, 2)}:${hexSubstring(content, 2, 2)}:${hexSubstring(content, 4, 2)}:${hexSubstring(content, 6, 2)}:${hexSubstring(content, 8, 2)}:${hexSubstring(content, 10, 2)}`;',
        )
    b = re.sub(r'\[macAddress uppercaseString\]', 'macAddress.toUpperCase()', b)

    b = re.sub(r'NSString \*(\w+) = ', r'const \1 = ', b)
    b = re.sub(r'@\{', '{', b)
    b = re.sub(r'@\((\w+)\)', r'\1', b)
    b = re.sub(r'@""', "''", b)
    b = re.sub(r'@\[\]', '[]', b)
    b = re.sub(r'\(MKValidStr\((\w+)\) \? \1 : ""\)', r"(isValidStr(\1) ? \1 : '')", b)

    b = re.sub(r'if \(\[cmd isEqualToString:@"([^"]+)"\]\)', r"if (cmd === '\1')", b)
    b = re.sub(r'\}else if \(\[cmd isEqualToString:@"([^"]+)"\]\)', r"} else if (cmd === '\1')", b)
    b = re.sub(r'@"(\w+)":', r'\1:', b)

    return b


read_body = extract_method_body('parseCustomReadData:(NSString *)content cmd:(NSString *)cmd data:(NSData *)data')
config_body = extract_method_body('parseCustomConfigData:(NSString *)content cmd:(NSString *)cmd')

read_ts = convert_objc_body(read_body)
config_ts = convert_objc_body(config_body)

header = '''/**
 * MPTaskAdopter — TypeScript port of MKMPTaskAdopter.m (LW005-MP, 1-byte CMD)
 */

import {
  hexStringFromData,
  getDecimalWithHex,
  getDecimalStringWithHex,
  signedHexTurnString,
} from '../utils/BleHexUtils';
import {TaskOperationID} from './TaskOperationID';
import {fetchTxPowerValueString} from './MPSDKDataAdopter';
import {utf8Decode} from '../utils/base64';

export type TaskParseResult =
  | {operationID: TaskOperationID; result: Record<string, unknown>}
  | {};

function normalizeUuid(uuid: string): string {
  return uuid.replace(/-/g, '').toUpperCase();
}

function hexSubstring(hex: string, start: number, length: number): string {
  return hex.substring(start, start + length);
}

function utf8StringFromData(data: Uint8Array, start: number): string {
  try {
    return utf8Decode(data, start);
  } catch {
    return '';
  }
}

function isValidStr(value: string | null | undefined): boolean {
  return typeof value === 'string' && value !== '';
}

function dataParserGetDataSuccess(
  returnData: Record<string, unknown> | null | undefined,
  operationID: TaskOperationID,
): TaskParseResult {
  if (!returnData) {
    return {};
  }
  return {operationID, result: returnData};
}

/** MP 帧：ED + FLAG(1) + CMD(1) + LEN(1) + DATA */
function parseCustomData(readData: Uint8Array): TaskParseResult {
  const readString = hexStringFromData(readData);
  if (!readString.startsWith('ed')) {
    return {};
  }
  const dataLen = getDecimalWithHex(readString, 6, 2);
  if (readData.length !== dataLen + 4) {
    return {};
  }
  const flag = readString.substring(2, 4);
  const cmd = readString.substring(4, 6);
  const content = readString.substring(8, 8 + dataLen * 2);
  if (flag === '00') {
    return parseCustomReadData(content, cmd, readData);
  }
  if (flag === '01') {
    return parseCustomConfigData(content, cmd);
  }
  return {};
}

function parseCustomReadData(
  content: string,
  cmd: string,
  data: Uint8Array,
): TaskParseResult {
  let operationID = TaskOperationID.mk_mp_defaultTaskOperationID;
  let result: Record<string, unknown> = {};
'''

read_footer = '''
  return dataParserGetDataSuccess(result, operationID);
}

function parseCustomConfigData(content: string, cmd: string): TaskParseResult {
  let operationID = TaskOperationID.mk_mp_defaultTaskOperationID;
  const success = content === '01';
'''

config_footer = '''
  return dataParserGetDataSuccess({success}, operationID);
}

export function parseReadDataWithCharacteristic(
  uuid: string,
  data: Uint8Array,
): TaskParseResult {
  const normalized = normalizeUuid(uuid);
  if (normalized === '2A24') {
    const modeID = utf8StringFromData(data, 0);
    return dataParserGetDataSuccess(
      {modeID},
      TaskOperationID.mk_mp_taskReadDeviceModelOperation,
    );
  }
  if (normalized === '2A26') {
    const firmware = utf8StringFromData(data, 0);
    return dataParserGetDataSuccess(
      {firmware},
      TaskOperationID.mk_mp_taskReadFirmwareOperation,
    );
  }
  if (normalized === '2A27') {
    const hardware = utf8StringFromData(data, 0);
    return dataParserGetDataSuccess(
      {hardware},
      TaskOperationID.mk_mp_taskReadHardwareOperation,
    );
  }
  if (normalized === '2A28') {
    const software = utf8StringFromData(data, 0);
    return dataParserGetDataSuccess(
      {software},
      TaskOperationID.mk_mp_taskReadSoftwareOperation,
    );
  }
  if (normalized === '2A29') {
    const manufacturer = utf8StringFromData(data, 0);
    return dataParserGetDataSuccess(
      {manufacturer},
      TaskOperationID.mk_mp_taskReadManufacturerOperation,
    );
  }
  if (normalized === 'AA00') {
    const hexContent = hexStringFromData(data);
    let state = '';
    if (hexContent.length === 10) {
      state = hexContent.substring(8, 2 + 8);
    }
    return dataParserGetDataSuccess(
      {state},
      TaskOperationID.mk_mp_connectPasswordOperation,
    );
  }
  if (normalized === 'AA02' || normalized === 'AA03') {
    return parseCustomData(data);
  }
  return {};
}

export function parseWriteDataWithCharacteristic(
  _uuid: string,
  _data: Uint8Array,
): TaskParseResult {
  return {};
}
'''


def indent_block(block: str, spaces: int = 2) -> str:
    lines = []
    for line in block.splitlines():
        if line.strip():
            lines.append(' ' * spaces + line)
        else:
            lines.append('')
    return '\n'.join(lines)


output = (
    header
    + indent_block(read_ts)
    + read_footer
    + indent_block(config_ts)
    + config_footer
)

OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
OUT_PATH.write_text(output)
print(f'Wrote {OUT_PATH} ({len(output)} bytes, {output.count(chr(10))} lines)')
