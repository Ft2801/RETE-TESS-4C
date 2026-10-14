#!/usr/bin/env python3
# Autore originale: Fabio Tempera
# Licenza: MIT
from __future__ import annotations

from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))

"""
Barre verticali: numero di nodi per provincia (figure/nodi_province).

Adattamento: campo prov in data/sites.json (sigla a due lettere).

Uso:
  python3 scripts/generate_province.py
"""



import argparse
from collections import Counter

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

from common import NAVY, add_io_args, load_sites, save_fig


def main() -> None:
    parser = argparse.ArgumentParser(description="Nodi per provincia")
    add_io_args(parser)
    args = parser.parse_args()
    sites = load_sites(args.sites)["sites"]
    counts = Counter(s["prov"] for s in sites)
    labels = list(counts.keys())
    vals = [counts[k] for k in labels]

    plt.rcParams.update({"font.family": "DejaVu Sans"})
    fig, ax = plt.subplots(figsize=(6.5, 4.2), dpi=220)
    fig.patch.set_facecolor("white")
    ax.bar(labels, vals, color=NAVY)
    ax.set_ylabel("Numero di nodi")
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    fig.tight_layout()
    save_fig(fig, args.out, "nodi_province")
    plt.close()


if __name__ == "__main__":
    main()
