#!/usr/bin/env python3

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) < 5:
        print("Usage: run_detached.py <pid_file> <log_file> <workdir> <command...>")
        return 1

    pid_file = Path(sys.argv[1])
    log_file = Path(sys.argv[2])
    workdir = Path(sys.argv[3])
    command = sys.argv[4:]

    pid_file.parent.mkdir(parents=True, exist_ok=True)
    log_file.parent.mkdir(parents=True, exist_ok=True)

    with log_file.open("ab") as log_handle, open(os.devnull, "rb") as null_in:
        process = subprocess.Popen(
            command,
            cwd=workdir,
            stdin=null_in,
            stdout=log_handle,
            stderr=subprocess.STDOUT,
            start_new_session=True,
        )

    pid_file.write_text(str(process.pid), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
