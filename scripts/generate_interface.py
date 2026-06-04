#!/usr/bin/env python3
"""Generate MPInterface.ts from MKMPInterface.m"""
import re
from pathlib import Path

M_PATH = Path(
    '/Users/aa/Desktop/MKLoRaApp/Modules/MKLoRaWAN-MP/MKLoRaWAN-MP/Classes/SDK/MKMPInterface.m'
)
OUT = Path(__file__).resolve().parent.parent / 'src/sdk/MPInterface.ts'

src = M_PATH.read_text()

GATT_MAP = {
    'readDeviceModel': ('2A24', 'mk_mp_taskReadDeviceModelOperation'),
    'readFirmware': ('2A26', 'mk_mp_taskReadFirmwareOperation'),
    'readHardware': ('2A27', 'mk_mp_taskReadHardwareOperation'),
    'readSoftware': ('2A28', 'mk_mp_taskReadSoftwareOperation'),
    'readManufacturer': ('2A29', 'mk_mp_taskReadManufacturerOperation'),
}


def snake(name: str) -> str:
    s = re.sub(r'([a-z0-9])([A-Z])', r'\1_\2', name)
    s = re.sub(r'([A-Z]+)([A-Z][a-z])', r'\1_\2', s)
    return s.lower()


entries: list[tuple[str, str, str, str]] = []

for m in re.finditer(r'\+ \(void\)mp_(\w+?)WithSucBlock:', src):
    method = m.group(1)
    chunk = src[m.end() : m.end() + 600]
    ctrl = re.search(
        r'\[self readDeviceControlDataWithTaskID:(\w+)\s+cmdFlag:@"([^"]+)"',
        chunk,
        re.DOTALL,
    )
    if ctrl:
        entries.append((method, 'readControlDataWithTaskID', ctrl.group(1), ctrl.group(2)))
        continue
    data = re.search(
        r'\[self readDataWithTaskID:(\w+)\s+cmdFlag:@"([^"]+)"',
        chunk,
        re.DOTALL,
    )
    if data:
        entries.append((method, 'readDataWithTaskID', data.group(1), data.group(2)))
        continue
    gatt = re.search(
        r'\[centralManager addReadTaskWithTaskID:(\w+)\s+characteristic:peripheral\.mp_(\w+)',
        chunk,
        re.DOTALL,
    )
    if gatt:
        uuid = GATT_MAP.get(method, (None, None))[0]
        if uuid:
            entries.append((method, 'readGattWithTaskID', gatt.group(1), uuid))

for name, (uuid, task) in GATT_MAP.items():
    if not any(e[0] == name for e in entries):
        entries.append((name, 'readGattWithTaskID', task, uuid))

seen: set[str] = set()
ordered: list[tuple[str, str, str, str]] = []
for e in entries:
    if e[0] not in seen:
        seen.add(e[0])
        ordered.append(e)

lines = [
    '/** Auto-generated from MKMPInterface.m */',
    'import MPCentralManager from "./MPCentralManager";',
    'import {TaskOperationID} from "./TaskOperationID";',
    'import {buildReadCommand} from "./protocol/CommandBuilder";',
    '',
    'type SucBlock = (data: {msg: string; code: string; result: unknown}) => void;',
    'type FailedBlock = (error: Error) => void;',
    '',
    'const central = () => MPCentralManager.shared();',
    '',
    'function readParams(',
    '  taskID: TaskOperationID,',
    '  cmdFlag: string,',
    '  suc?: SucBlock,',
    '  failed?: FailedBlock,',
    ') {',
    '  central().addTaskWithTaskID(',
    '    taskID,',
    '    buildReadCommand(cmdFlag),',
    '    suc,',
    '    failed,',
    '    "params",',
    '  );',
    '}',
    '',
    'function readControl(',
    '  taskID: TaskOperationID,',
    '  cmdFlag: string,',
    '  suc?: SucBlock,',
    '  failed?: FailedBlock,',
    ') {',
    '  central().addTaskWithTaskID(',
    '    taskID,',
    '    buildReadCommand(cmdFlag),',
    '    suc,',
    '    failed,',
    '    "control",',
    '  );',
    '}',
    '',
    'function readGatt(',
    '  taskID: TaskOperationID,',
    '  uuid: string,',
    '  suc?: SucBlock,',
    '  failed?: FailedBlock,',
    ') {',
    '  central().addReadTaskWithTaskID(taskID, uuid, suc, failed);',
    '}',
    '',
    'export const MPInterface = {',
]

for method, kind, task, flag in sorted(ordered, key=lambda x: x[0].lower()):
    fn = snake(method)
    if kind == 'readGattWithTaskID':
        lines += [
            f'  {fn}(suc?: SucBlock, failed?: FailedBlock) {{',
            f'    readGatt(TaskOperationID.{task}, "{flag}", suc, failed);',
            '  },',
        ]
    elif kind == 'readControlDataWithTaskID':
        lines += [
            f'  {fn}(suc?: SucBlock, failed?: FailedBlock) {{',
            f'    readControl(TaskOperationID.{task}, "{flag}", suc, failed);',
            '  },',
        ]
    else:
        lines += [
            f'  {fn}(suc?: SucBlock, failed?: FailedBlock) {{',
            f'    readParams(TaskOperationID.{task}, "{flag}", suc, failed);',
            '  },',
        ]

lines += ['};', '', 'export default MPInterface;', '']
OUT.write_text('\n'.join(lines))
print(f'Wrote {OUT} ({len(ordered)} methods)')
