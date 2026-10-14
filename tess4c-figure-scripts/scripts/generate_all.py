#!/usr/bin/env python3
# Autore originale: Fabio Tempera
# Licenza: MIT
"""Esegue tutti gli script di figura, tranne le illustrazioni di installazione."""

from __future__ import annotations

import argparse
import runpy
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import add_io_args

HERE = Path(__file__).resolve().parent
JOBS = [
    "generate_map.py",
    "generate_radianza.py",
    "generate_quota_scatter.py",
    "generate_categorie.py",
    "generate_province.py",
    "generate_contributi.py",
]


def main() -> None:
    parser = argparse.ArgumentParser(description="Genera tutte le figure da dati")
    add_io_args(parser)
    args = parser.parse_args()
    extra = ["--sites", str(args.sites), "--out", str(args.out)]
    for name in JOBS:
        print(f"--- {name}")
        sys.argv = [str(HERE / name), *extra]
        runpy.run_path(str(HERE / name), run_name="__main__")


if __name__ == "__main__":
    main()
