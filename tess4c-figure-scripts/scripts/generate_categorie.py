#!/usr/bin/env python3
# Autore originale: Fabio Tempera
# Licenza: MIT
from __future__ import annotations

from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))

"""
Barre orizzontali: numero di nodi per categoria (figure/categorie_nodi).

Adattamento: campo category in data/sites.json.

Uso:
  python3 scripts/generate_categorie.py
"""



import argparse
from collections import Counter

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

from common import COLORS_CAT, NAVY, add_io_args, load_sites, save_fig


def main() -> None:
    parser = argparse.ArgumentParser(description="Nodi per categoria")
    add_io_args(parser)
    args = parser.parse_args()
    sites = load_sites(args.sites)["sites"]
    counts = Counter(s["category"] for s in sites)
    keys = [k for k in COLORS_CAT if k in counts] + [k for k in counts if k not in COLORS_CAT]
    vals = [counts[k] for k in keys]
    colors = [COLORS_CAT.get(k, NAVY) for k in keys]

    plt.rcParams.update({"font.family": "DejaVu Sans"})
    fig, ax = plt.subplots(figsize=(8.2, 4.4), dpi=220)
    fig.patch.set_facecolor("white")
    ax.barh(keys, vals, color=colors)
    ax.set_xlabel("Numero di nodi")
    ax.set_xlim(0, max(vals) + 1)
    for i, v in enumerate(vals):
        ax.text(v + 0.08, i, str(v), va="center", fontsize=9)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    fig.tight_layout()
    save_fig(fig, args.out, "categorie_nodi")
    plt.close()


if __name__ == "__main__":
    main()
