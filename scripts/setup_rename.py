#!/usr/bin/env python3
"""Deprecated: use setup_rename_mp.py (CT/AE -> MP)."""
import subprocess
import sys
from pathlib import Path

if __name__ == '__main__':
    script = Path(__file__).resolve().parent / 'setup_rename_mp.py'
    raise SystemExit(subprocess.call([sys.executable, str(script)]))
