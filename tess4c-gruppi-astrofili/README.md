# Proposta per gruppi astrofili

Lettera di primo contatto rivolta ai gruppi astrofili. Sonda l'interesse all'acquisto e all'installazione autonoma di un fotometro TESS-4C che entrerebbe a far parte della rete.

Autore: Fabio Tempera, progetto rete TESS-4C in collaborazione con CieloBuio OdV.

Licenza: MIT. Vedi [LICENSE](LICENSE).

## Compilazione

```bash
pdflatex gruppi-astrofili.tex
```

Eseguite il comando due volte per aggiornare i riferimenti incrociati. Il PDF compilato è `gruppi-astrofili.pdf`.

## Struttura del progetto

| Percorso | Contenuto |
| --- | --- |
| `gruppi-astrofili.tex` | Testo del documento |
| `gruppi-astrofili.docx` | Versione Word (modifica diretta) |
| `packages.sty` | Pacchetti LaTeX |
| `figures/` | Immagini del documento |
| `gruppi-astrofili.pdf` | Compilato |
| `LICENSE` | Licenza MIT |
| `.gitignore` | Esclusione dei file ausiliari |

## Versione Word

La cartella contiene anche `gruppi-astrofili.docx`, la stessa versione del documento in formato Word, con font Arial e formato A4. Serve a chi preferisce modificare direttamente il testo senza compilare nulla.

Il file Word non si aggiorna da solo quando cambia il sorgente `gruppi-astrofili.tex`. Scegliete una sola fonte di modifica: se cambiate il `.tex`, ricompilate il PDF e riportate le stesse modifiche nel Word, oppure viceversa. Contenuto e struttura sono gli stessi, ma Word e LaTeX spezzano le pagine in modo diverso, quindi l'impaginazione può non coincidere al millimetro.
