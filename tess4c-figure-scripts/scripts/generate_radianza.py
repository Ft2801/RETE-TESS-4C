#!/usr/bin/env python3
# Autore originale: Fabio Tempera
# Licenza: MIT
from __future__ import annotations

from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))

"""
Grafico a barre orizzontali della radianza VIIRS (figure/radianza_viirs_2025).

Adattamento: aggiornare il campo viirs in data/sites.json. L'ordinamento è
decrescente sul valore. I decimali usano la virgola.

Uso:
  python3 scripts/generate_radianza.py
"""



import argparse

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

from common import NAVY, add_io_args, load_sites, save_fig


def main() -> None:
    parser = argparse.ArgumentParser(description="Barre VIIRS")
    add_io_args(parser)
    args = parser.parse_args()
    payload = load_sites(args.sites)
    rows = sorted(payload["sites"], key=lambda s: s["viirs"], reverse=True)
    labels = [f"{s['id']} {s['short']}" for s in rows]
    vals = [float(s["viirs"]) for s in rows]

    plt.rcParams.update({"font.family": "DejaVu Sans"})
    fig, ax = plt.subplots(figsize=(11.0, 10.6), dpi=220)
    fig.patch.set_facecolor("white")
    ax.set_facecolor("white")
    y = np.arange(len(rows))
    ax.barh(y, vals, color=NAVY, height=0.62, zorder=3)
    ax.invert_yaxis()
    ax.set_yticks(y)
    ax.set_yticklabels(labels, fontsize=10)
    xmax = max(vals) * 1.12 if vals else 1
    ax.set_xlim(0, max(105, xmax))
    ax.set_xlabel(r"nW cm$^{-2}$ sr$^{-1}$", fontsize=11)
    ax.xaxis.grid(True, color="#E6E6E6", lw=0.8, zorder=0)
    ax.set_axisbelow(True)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_visible(False)
    ax.tick_params(axis="y", length=0)
    for yi, v in zip(y, vals):
        ax.text(v + xmax * 0.012, yi, f"{v:.3f}".replace(".", ","), va="center", ha="left", fontsize=9.2, color=NAVY)
    fig.tight_layout()
    year = payload.get("viirs_year", "")
    save_fig(fig, args.out, f"radianza_viirs_{year}" if year else "radianza_viirs")
    plt.close()


if __name__ == "__main__":
    main()
