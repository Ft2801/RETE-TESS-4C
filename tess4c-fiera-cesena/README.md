# Materiali per la Fiera Astroshow di Cesena

Materiali di CieloBuio OdV per lo stand alla Fiera Astroshow di Cesena, 7 e 8 novembre 2026. La cartella contiene il one-pager da distribuire ai visitatori.

Autore: Fabio Tempera, progetto rete TESS-4C in collaborazione con CieloBuio OdV.

Licenza: MIT. Vedi [LICENSE](LICENSE).

## Contenuto della cartella

| Percorso | Contenuto |
| --- | --- |
| `fiera-cesena.tex` | Sorgente LaTeX del one-pager |
| `fiera-cesena.pdf` | One-pager compilato, da stampare o inviare |
| `fiera-cesena.docx` | Versione Word del one-pager, per modifiche dirette |
| `figures/` | Codice QR di esempio usato nel one-pager |
| `packages.sty` | Pacchetti LaTeX del one-pager |
| `LICENSE` | Licenza MIT |
| `.gitignore` | Esclusione dei file ausiliari di compilazione |

## One-pager

Compilazione:

```bash
pdflatex fiera-cesena.tex
```

Eseguite il comando due volte per aggiornare i riferimenti incrociati. Il PDF compilato è `fiera-cesena.pdf`.

La cartella contiene anche `fiera-cesena.docx`, la stessa versione in formato Word. Il file Word non si aggiorna da solo quando cambia il sorgente `.tex`. Scegliete una sola fonte di modifica: se cambiate il `.tex`, ricompilate il PDF e riportate le stesse modifiche nel Word, oppure viceversa.

## Codice QR

Il codice QR in `figures/qr-esempio.png` è un esempio che rimanda a `https://example.com/cielobuio-astroshow`. Va sostituito con il codice generato per il testo di presentazione pubblicato sul sito di CieloBuio OdV. Per sostituirlo basta mantenere il nome del file, oppure aggiornare il percorso in `fiera-cesena.tex`.
