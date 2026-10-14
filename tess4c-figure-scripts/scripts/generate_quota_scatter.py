#!/usr/bin/env python3
# Autore originale: Fabio Tempera
# Licenza: MIT
from __future__ import annotations

from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))

"""
Dispersione quota del pixel contro radianza VIIRS (figure/quota_vs_radianza).

Adattamento: campi quota e viirs in data/sites.json. I colori seguono category.
Se si introducono categorie nuove, aggiungere la chiave in common.COLORS_CAT.

Uso:
  python3 scripts/generate_quota_scatter.py
"""



import argparse

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

from common import COLORS_CAT, NAVY, add_io_args, load_sites, save_fig


def main() -> None:
    parser = argparse.ArgumentParser(description="Quota contro radianza")
    add_io_args(parser)
    args = parser.parse_args()
    sites = load_sites(args.sites)["sites"]

    plt.rcParams.update({"font.family": "DejaVu Sans"})
    fig, ax = plt.subplots(figsize=(8.4, 5.4), dpi=220)
    fig.patch.set_facecolor("white")
    ax.set_facecolor("white")
    used = []
    for site in sites:
        cat = site["category"]
        color = COLORS_CAT.get(cat, NAVY)
        ax.scatter(site["quota"], site["viirs"], s=70, c=color, zorder=3, edgecolors="white", linewidths=0.6)
        ax.annotate(str(site["id"]), (site["quota"], site["viirs"]), textcoords="offset points", xytext=(5, 4), fontsize=7, color=NAVY)
        if cat not in used:
            used.append(cat)
    ax.set_xlabel("Quota del pixel (m s.l.m.)")
    ax.set_ylabel(r"Radianza VIIRS (nW cm$^{-2}$ sr$^{-1}$)")
    handles = [
        plt.Line2D([0], [0], marker="o", color="w", markerfacecolor=COLORS_CAT.get(k, NAVY), markersize=8, label=k)
        for k in used
    ]
    ax.legend(handles=handles, frameon=False, fontsize=7, loc="upper right")
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    fig.tight_layout()
    save_fig(fig, args.out, "quota_vs_radianza")
    plt.close()


if __name__ == "__main__":
    main()
