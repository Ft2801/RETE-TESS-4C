# Script per le figure della rete TESS-4C

Generatori Python delle figure vettoriali (SVG) e raster (PNG 300 dpi) usate nel resoconto interno dei siti e, per lo schema della brillanza, nel template di proposta.

Le illustrazioni di installazione (fotometro sul tetto) non sono generate da questi script: restano file grafici fissi.

- **Autore**: Fabio Tempera
- **Anno**: 2026
- **Licenza**: MIT

---

## Indice

1. [Contesto e obiettivo](#contesto-e-obiettivo)
2. [Adattare a un'altra regione](#adattare-a-unaltra-regione)
3. [Esecuzione](#esecuzione)
4. [Struttura del progetto](#struttura-del-progetto)
5. [Corrispondenza con i documenti LaTeX](#corrispondenza-con-i-documenti-latex)
6. [Contribuire](#contribuire)

## Contesto e obiettivo

I grafici del resoconto (mappa dei nodi, barre VIIRS, dispersione quota-radianza, categorie, province) si rigenerano da un solo file di dati: `data/sites.json`. Lo stesso file è il modello da copiare per l'Umbria o per un'altra regione.

Lo schema naturale/artificiale non è una misura: i valori di esempio stanno nello script `generate_contributi.py`, non in un JSON.

## Adattare a un'altra regione

1. In `data/sites.json` sostituire i record in `sites`: `id`, `name`, `short`, `category`, `comune`, `prov`, `lat`, `lon`, `quota`, `popolazione`, `viirs`.
2. Nello stesso file, nella chiave `map`, impostare il riquadro geografico (`lon0`, `lon1`, `lat0`, `lat1`), la barra di scala e le etichette di città.
3. I GeoJSON di default coprono l'Italia (Openpolis / ISTAT). Fuori dall'Italia, aggiornare gli URL nella chiave `map`.
4. Eseguire `python3 scripts/generate_all.py` e copiare i file da `output/` nella cartella `figures/` del resoconto.

Non modificare gli script se i campi JSON restano gli stessi.

## Esecuzione

Python 3.10 o successivo. Dipendenze: Matplotlib.

```bash
python3 -m pip install -r requirements.txt
python3 scripts/generate_all.py
python3 scripts/generate_map.py --out ../tess4c-resoconto-abruzzo/figures
```

Alla prima esecuzione della mappa vengono scaricati i confini in `data/cache/`.

## Struttura del progetto

| Percorso | Contenuto |
| --- | --- |
| `data/sites.json` | Nodi (coordinate, VIIRS, quota) e inquadratura della mappa |
| `scripts/generate_map.py` | Mappa dei punti |
| `scripts/generate_radianza.py` | Barre orizzontali VIIRS |
| `scripts/generate_quota_scatter.py` | Dispersione quota-radianza |
| `scripts/generate_categorie.py` | Nodi per categoria |
| `scripts/generate_province.py` | Nodi per provincia |
| `scripts/generate_contributi.py` | Schema didattico naturale/artificiale |
| `scripts/generate_all.py` | Esecuzione in sequenza |
| `output/` | PNG e SVG prodotti |

## Corrispondenza con i documenti LaTeX

| Figura nel resoconto | Script |
| --- | --- |
| `mappa_siti_TESS4C_Abruzzo` | `scripts/generate_map.py` |
| `radianza_viirs_2025` | `scripts/generate_radianza.py` |
| `quota_vs_radianza` | `scripts/generate_quota_scatter.py` |
| `categorie_nodi` | `scripts/generate_categorie.py` |
| `nodi_province` | `scripts/generate_province.py` |
| `contributi_brillanza` | `scripts/generate_contributi.py` |

Le coppie sinistra/destra di installazione (`installazione_non_idonea.png`, `installazione_idonea.png`) non hanno script.

## Contribuire

Le contribuzioni sono benvenute. Vedi [CONTRIBUTING.md](CONTRIBUTING.md).
