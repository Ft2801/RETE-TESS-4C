# Proposta alle ARPA regionali

Lettera alle ARPA regionali per proporre una rete regionale di misura della brillanza del cielo notturno e per sollecitare un finanziamento regionale dedicato all'installazione delle stazioni presso gli enti del territorio.

Autore: Fabio Tempera, progetto rete TESS-4C in collaborazione con CieloBuio OdV.

Licenza: MIT. Vedi [LICENSE](LICENSE).

## Compilazione

```bash
pdflatex arpa.tex
```

Eseguite il comando due volte per aggiornare i riferimenti incrociati. Il PDF compilato è `arpa.pdf`.

## Struttura del progetto

| Percorso | Contenuto |
| --- | --- |
| `arpa.tex` | Testo del documento |
| `arpa.docx` | Versione Word (modifica diretta) |
| `packages.sty` | Pacchetti LaTeX |
| `figures/` | Immagini del documento |
| `arpa.pdf` | Compilato |
| `LICENSE` | Licenza MIT |
| `.gitignore` | Esclusione dei file ausiliari |

## Versione Word

La cartella contiene anche `arpa.docx`, la stessa versione del documento in formato Word, con font Arial e formato A4. Serve a chi preferisce modificare direttamente il testo senza compilare nulla.

Il file Word non si aggiorna da solo quando cambia il sorgente `arpa.tex`. Scegliete una sola fonte di modifica: se cambiate il `.tex`, ricompilate il PDF e riportate le stesse modifiche nel Word, oppure viceversa. Contenuto e struttura sono gli stessi, ma Word e LaTeX spezzano le pagine in modo diverso, quindi l'impaginazione può non coincidere al millimetro.
