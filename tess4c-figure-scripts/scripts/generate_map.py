#!/usr/bin/env python3
# Autore originale: Fabio Tempera
# Licenza: MIT
from __future__ import annotations

from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))

"""
Mappa dei nodi candidati (figure/mappa_siti_TESS4C_Abruzzo).

Adattamento a un'altra regione:
  1. Sostituire i nodi in data/sites.json (coordinate WGS84).
  2. Impostare il riquadro geografico nella chiave map dello stesso file
     (lon0, lon1, lat0, lat1 ed etichette di città).
  3. I GeoJSON ISTAT/Openpolis coprono l'Italia. Fuori dall'Italia, aggiornare
     geojson_regioni_url e geojson_province_url nella chiave map.

Uso:
  python3 scripts/generate_map.py
  python3 scripts/generate_map.py --out /percorso/figures
"""



import argparse
import json
import math
import urllib.request
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.collections import PatchCollection
from matplotlib.patches import Circle, Polygon

from common import DATA, NAVY, add_io_args, ensure_out, load_sites

LAND = "#F3F3F3"
SEA = "#D8DCE2"
BORDER = "#C8CCD2"
CACHE = DATA / "cache"


def iter_rings(geom: dict):
    kind = geom["type"]
    coords = geom["coordinates"]
    if kind == "Polygon":
        yield coords[0]
    elif kind == "MultiPolygon":
        for poly in coords:
            yield poly[0]


def fetch_geojson(url: str, dest: Path) -> dict:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists():
        print(f"scarico {url}")
        with urllib.request.urlopen(url, timeout=60) as resp:
            dest.write_bytes(resp.read())
    with dest.open(encoding="utf-8") as fh:
        return json.load(fh)


def main() -> None:
    parser = argparse.ArgumentParser(description="Mappa dei nodi TESS-4C")
    add_io_args(parser)
    args = parser.parse_args()

    payload = load_sites(args.sites)
    cfg = payload["map"]
    sites = payload["sites"]
    lon0, lon1 = cfg["lon0"], cfg["lon1"]
    lat0, lat1 = cfg["lat0"], cfg["lat1"]

    regioni = fetch_geojson(cfg["geojson_regioni_url"], CACHE / "regioni.geojson")
    province = fetch_geojson(cfg["geojson_province_url"], CACHE / "province.geojson")

    dlon, dlat = lon1 - lon0, lat1 - lat0
    fig_w = 12.0
    fig_h = fig_w * dlat / dlon
    fig, ax = plt.subplots(figsize=(fig_w, fig_h), dpi=220)
    fig.patch.set_facecolor(SEA)
    ax.set_facecolor(SEA)

    patches = []
    for feat in regioni["features"]:
        for ring in iter_rings(feat["geometry"]):
            xs = [p[0] for p in ring]
            ys = [p[1] for p in ring]
            if max(xs) < lon0 or min(xs) > lon1 or max(ys) < lat0 or min(ys) > lat1:
                continue
            patches.append(Polygon(list(zip(xs, ys)), closed=True))
    ax.add_collection(
        PatchCollection(patches, facecolor=LAND, edgecolor=BORDER, linewidth=1.0, zorder=1)
    )

    for feat in province["features"]:
        for ring in iter_rings(feat["geometry"]):
            xs = [p[0] for p in ring]
            ys = [p[1] for p in ring]
            if max(xs) < lon0 or min(xs) > lon1 or max(ys) < lat0 or min(ys) > lat1:
                continue
            ax.plot(xs, ys, color="#D2D5DA", lw=0.6, zorder=2)

    for lab in cfg.get("city_labels", []):
        ax.text(
            lab["lon"],
            lab["lat"],
            lab["text"],
            fontsize=7.6,
            color="#AEB4BC",
            ha="left",
            va="center",
            zorder=3,
        )

    radius = 0.030
    for site in sites:
        lon, lat = site["lon"], site["lat"]
        ax.add_patch(
            Circle((lon, lat), radius, facecolor=NAVY, edgecolor="white", linewidth=1.25, zorder=5)
        )
        ax.text(
            lon,
            lat,
            str(site["id"]),
            color="white",
            fontsize=7.6,
            ha="center",
            va="center",
            fontweight="bold",
            zorder=6,
            fontfamily="DejaVu Sans",
        )

    lat_s = cfg["scale_lat"]
    lon_s = cfg["scale_lon"]
    bar = cfg["scale_km"] / (111.32 * math.cos(math.radians(lat_s)))
    ax.plot([lon_s, lon_s + bar], [lat_s, lat_s], color=NAVY, lw=2.3, solid_capstyle="butt", zorder=7)
    ax.plot([lon_s, lon_s], [lat_s - 0.011, lat_s + 0.011], color=NAVY, lw=2.3, zorder=7)
    ax.plot([lon_s + bar, lon_s + bar], [lat_s - 0.011, lat_s + 0.011], color=NAVY, lw=2.3, zorder=7)
    ax.text(lon_s, lat_s - 0.042, f"{cfg['scale_km']} km", color=NAVY, fontsize=9.0, ha="left", va="top")

    ax.set_xlim(lon0, lon1)
    ax.set_ylim(lat0, lat1)
    ax.set_aspect("equal")
    ax.axis("off")
    fig.subplots_adjust(0, 0, 1, 1)

    out = ensure_out(args.out)
    region = payload.get("region", "regione").replace(" ", "_")
    stem = f"mappa_siti_TESS4C_{region}"
    fig.savefig(out / f"{stem}.png", format="png", dpi=300, facecolor=SEA, pad_inches=0)
    fig.savefig(out / f"{stem}.svg", format="svg", facecolor=SEA, pad_inches=0)
    plt.close()
    print(f"scritto {out / (stem + '.png')}")
    print(f"scritto {out / (stem + '.svg')}")


if __name__ == "__main__":
    main()
