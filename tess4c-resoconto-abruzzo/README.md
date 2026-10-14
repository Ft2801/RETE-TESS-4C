# Resoconto interno dei siti TESS-4C Abruzzo

Template interno CieloBuio per la selezione dei nodi di una rete regionale. Questo esemplare è compilato sull'Abruzzo (20 siti). Non è destinato a scuole, parchi o atenei.

- **Autore**: Fabio Tempera
- **Anno**: 2026
- **Licenza**: MIT

---

## Indice

1. [Contesto e obiettivo](#contesto-e-obiettivo)
2. [Compilazione](#compilazione)
3. [Adattamento a un'altra regione](#adattamento-a-unaltra-regione)
4. [Struttura del progetto](#struttura-del-progetto)
5. [Figure](#figure)

## Contesto e obiettivo

Il resoconto fissa i siti candidati, i criteri VIIRS e i vincoli di installazione, con un preambolo leggibile anche da soci non astronomici. La lettera verso gli enti è il template nazionale separato.

## Compilazione

```bash
pdflatex resoconto-abruzzo.tex
```

Eseguite il comando due volte per aggiornare i riferimenti incrociati. Il PDF compilato è `resoconto-abruzzo.pdf`.

## Struttura del progetto

| Percorso | Contenuto |
| --- | --- |
| `resoconto-abruzzo.tex` | Testo del resoconto |
| `resoconto-abruzzo.docx` | Versione Word (modifica diretta) |
| `packages.sty` | Pacchetti LaTeX |
| `figures/` | Mappa, barre VIIRS, dispersione, categorie, province |
| `resoconto-abruzzo.pdf` | Compilato |
| `LICENSE` | Licenza MIT |
| `.gitignore` | Esclusione dei file ausiliari |

## Adattamento a un'altra regione

1. Aggiornare `tess4c-figure-scripts/data/sites.json` (nodi e chiave `map`).
2. Rigenerare le figure con `python3 scripts/generate_all.py --out figures`.
3. Allineare tabelle e toponimi in `resoconto-abruzzo.tex`.

Lasciare invariati preambolo sull'inquinamento luminoso, sezione sull'osservabile e criteri di installazione.

## Figure

| File | Script in tess4c-figure-scripts |
| --- | --- |
| `mappa_siti_TESS4C_Abruzzo.png` | `scripts/generate_map.py` |
| `radianza_viirs_2025.png` | `scripts/generate_radianza.py` |
| `quota_vs_radianza.png` | `scripts/generate_quota_scatter.py` |
| `categorie_nodi.png` | `scripts/generate_categorie.py` |
| `nodi_province.png` | `scripts/generate_province.py` |
| `contributi_brillanza.png` | `scripts/generate_contributi.py` |

Foto TESS e illustrazioni di posa: file fissi, senza script.

## Versione Word

La cartella contiene anche `resoconto-abruzzo.docx`, la stessa versione del documento in formato Word, con font Arial e formato A4. Serve a chi preferisce modificare direttamente il testo senza compilare nulla.

Il file Word non si aggiorna da solo quando cambia il sorgente `resoconto-abruzzo.tex`. Scegliete una sola fonte di modifica: se cambiate il `.tex`, ricompilate il PDF e riportate le stesse modifiche nel Word, oppure viceversa. Contenuto e struttura sono gli stessi, ma Word e LaTeX spezzano le pagine in modo diverso, quindi l'impaginazione può non coincidere al millimetro.
