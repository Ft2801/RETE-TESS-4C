#!/usr/bin/env python3
# Autore originale: Fabio Tempera
# Licenza: MIT
"""
Schema didattico: brillanza come somma di contributo naturale e artificiale
(figure/contributi_brillanza). Non sono misure di un sito: i valori sono
unità arbitrarie, definite qui sotto. Non esiste un JSON dedicato.

Uso:
  python3 scripts/generate_contributi.py
"""

from __future__ import annotations

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))

import argparse

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

from common import add_io_args, save_fig

# Esempio didattico, non dati di un nodo. Modificare qui se serve un altro schema.
ETICHETTE = ["Cielo buio (alta quota)", "Centro urbano"]
NATURALE = [1.0, 1.0]
ARTIFICIALE = [0.15, 7.5]


def main() -> None:
    parser = argparse.ArgumentParser(description="Schema contributi di brillanza")
    add_io_args(parser)
    args = parser.parse_args()

    nat = np.array(NATURALE, dtype=float)
    art = np.array(ARTIFICIALE, dtype=float)

    plt.rcParams.update({"font.family": "DejaVu Sans"})
    fig, ax = plt.subplots(figsize=(7.2, 4.6), dpi=220)
    fig.patch.set_facecolor("white")
    ax.bar(ETICHETTE, nat, color="#4a90a4", label="Contributo naturale")
    ax.bar(ETICHETTE, art, bottom=nat, color="#e07a3d", label="Contributo artificiale")
    ax.set_ylabel("Brillanza superficiale (unità arbitrarie, schema)")
    ax.legend(frameon=False)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    fig.tight_layout()
    save_fig(fig, args.out, "contributi_brillanza")
    plt.close()


if __name__ == "__main__":
    main()
