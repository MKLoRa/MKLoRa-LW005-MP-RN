#!/usr/bin/env python3
"""Generate OperationID.ts from MKMPOperationID.h"""
import re
from pathlib import Path

H_PATH = Path(
    '/Users/aa/Desktop/MKLoRaApp/Modules/MKLoRaWAN-MP/MKLoRaWAN-MP/Classes/SDK/MKMPOperationID.h'
)
OUT = Path(__file__).resolve().parent.parent / 'src/sdk/OperationID.ts'

text = H_PATH.read_text()
ids = re.findall(r'(mk_mp_\w+)', text)
seen: set[str] = set()
ordered: list[str] = []
for i in ids:
    if i not in seen:
        seen.add(i)
        ordered.append(i)

lines = [
    '/** Auto-generated from MKMPOperationID.h */',
    'export enum TaskOperationID {',
]
for name in ordered:
    lines.append(f'  {name} = "{name}",')
lines.append('}')
lines.append('')
OUT.write_text('\n'.join(lines))
print(f'Wrote {OUT} ({len(ordered)} ids)')
