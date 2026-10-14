#!/usr/bin/env python3
# Copyright (c) 2026 Fabio Tempera. SPDX-License-Identifier: MIT.
"""Scarica catalogo STARS4ALL e l'ultima lettura di ogni fotometro in tx."""
from __future__ import annotations

import json
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API = "https://api.stars4all.eu"
UA = "TESS4C-Abruzzo-dashboard/1.0"


def get(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as r:
        return json.loads(r.read().decode())


def coord(*values):
    """Primo valore numerico utile: i campi di primo livello dell'API sono spesso
    vuoti, mentre info_location contiene le coordinate di tutti i fotometri."""
    for v in values:
        if v in (None, "", "None"):
            continue
        try:
            return float(v)
        except (TypeError, ValueError):
            continue
    return None


def compact_catalog(photometers, emitting):
    out = []
    em = set(emitting)
    for p in photometers:
        loc = p.get("info_location") or {}
        tess = p.get("info_tess") or {}
        lat = coord(p.get("latitude"), loc.get("latitude"))
        lon = coord(p.get("longitude"), loc.get("longitude"))
        name = p.get("name")
        filters = p.get("filters") or tess.get("filters") or ""
        out.append(
            {
                "name": name,
                "lat": lat,
                "lon": lon,
                "city": p.get("city") or loc.get("town") or p.get("place") or "",
                "country": loc.get("country") or p.get("country") or "",
                "region": loc.get("region") or loc.get("sub_region") or "",
                "place": loc.get("place") or "",
                "tz": tess.get("local_timezone") or "",
                "filters": filters,
                "period": tess.get("period"),
                "emitting": name in em,
            }
        )
    return out


def clean_obs(obs: dict) -> dict:
    rec = {
        "name": obs.get("name"),
        "tstamp": obs.get("tstamp"),
        "seq": obs.get("seq"),
        "rev": obs.get("rev"),
        "wdBm": obs.get("wdBm"),
    }
    if "mag" in obs:
        rec["mag"] = obs.get("mag")
        rec["freq"] = obs.get("freq")
        rec["tamb"] = obs.get("tamb")
        rec["tsky"] = obs.get("tsky")
        rec["model"] = "TESS-W"
    if "F1" in obs:
        rec["model"] = "TESS-4C"
        rec["tamb"] = obs.get("tamb")
        rec["tsky"] = obs.get("tsky")
        rec["ain"] = obs.get("ain")
        for k in ("F1", "F2", "F3", "F4"):
            if k in obs:
                rec[k] = obs[k]
        f1 = obs.get("F1") or {}
        rec["mag"] = f1.get("mag")
        rec["freq"] = f1.get("freq")
    return rec


def last_reading(name: str, begin: str, count: int):
    url = (
        f"{API}/photometer/{name}/observations/latest_values"
        f"?begin={begin}&count={count}"
    )
    try:
        rows = get(url)
    except Exception:
        return None
    if not rows:
        return None
    return clean_obs(rows[-1])


def main() -> None:
    photometers = get(API + "/photometers")
    emitting = get(API + "/photometers_emitting")
    rows = compact_catalog(photometers, emitting)
    # L'API restituisce le osservazioni in ordine CRESCENTE e le tronca al count:
    # i parametri di ordinamento sono ignorati. Perche' rows[-1] sia davvero l'ultima
    # lettura, la finestra deve stare tutta dentro il count (qui 90 minuti su 200 righe:
    # copre nodi fino a un campione ogni ~27 secondi).
    begin = (datetime.now(timezone.utc) - timedelta(minutes=90)).strftime(
        "%Y-%m-%dT%H:%M:%SZ"
    )
    names = [r["name"] for r in rows if r["emitting"]]
    readings = {}
    with ThreadPoolExecutor(max_workers=10) as pool:
        futs = {pool.submit(last_reading, n, begin, 200): n for n in names}
        for fut in as_completed(futs):
            rec = fut.result()
            if rec and rec.get("name"):
                readings[rec["name"]] = rec

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    dest = ROOT / "data" / "latest.json"
    dest.write_text(
        json.dumps(
            {
                "fetchedAt": now,
                "source": API,
                "nPhotometers": len(rows),
                "nEmitting": len(emitting) if isinstance(emitting, list) else None,
                "photometers": rows,
            },
            ensure_ascii=False,
            separators=(",", ":"),
        )
    )
    rdest = ROOT / "data" / "readings.json"
    rdest.write_text(
        json.dumps(
            {"fetchedAt": now, "n": len(readings), "readings": readings},
            ensure_ascii=False,
            separators=(",", ":"),
        )
    )

    archive = ROOT / "data" / "archive"
    archive.mkdir(parents=True, exist_ok=True)
    day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    italy = []
    for r in rows:
        if "ital" in (r.get("country") or "").lower():
            rd = readings.get(r["name"])
            italy.append(
                {
                    "name": r["name"],
                    "emitting": r["emitting"],
                    "city": r["city"],
                    "reading": rd,
                }
            )
    line = {
        "t": now,
        "nPhotometers": len(rows),
        "nEmitting": len(emitting) if isinstance(emitting, list) else None,
        "nReadings": len(readings),
        "italy": italy,
    }
    with (archive / f"{day}.jsonl").open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(line, ensure_ascii=False) + "\n")
    print("catalog", len(rows), "emitting", len(names), "readings", len(readings))


if __name__ == "__main__":
    main()
