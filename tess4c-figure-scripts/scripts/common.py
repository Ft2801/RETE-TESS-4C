#!/usr/bin/env python3
# Autore originale: Fabio Tempera
# Licenza: MIT
"""Funzioni condivise: percorsi, stile, lettura JSON."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
DEFAULT_OUT = ROOT / "output"

NAVY = "#16324A"
COLORS_CAT = {
    "urbano grande": "#c0392b",
    "urbano medio": "#e67e22",
    "urbano piccolo": "#f1c40f",
    "costa": "#3498db",
    "collina interna": "#27ae60",
    "montagna": "#8e44ad",
    "area protetta": "#1abc9c",
    "sito scientifico": "#2c3e50",
}


def add_io_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--sites",
        type=Path,
        default=DATA / "sites.json",
        help="JSON dei nodi (sostituire per un'altra regione)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=DEFAULT_OUT,
        help="Cartella di output (PNG 300 dpi e SVG)",
    )


def load_sites(path: Path) -> dict:
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def load_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def ensure_out(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def save_fig(fig, out_dir: Path, stem: str) -> None:
    ensure_out(out_dir)
    png = out_dir / f"{stem}.png"
    svg = out_dir / f"{stem}.svg"
    fig.savefig(png, format="png", dpi=300, bbox_inches="tight", facecolor=fig.get_facecolor())
    fig.savefig(svg, format="svg", bbox_inches="tight", facecolor=fig.get_facecolor())
    print(f"scritto {png}")
    print(f"scritto {svg}")
