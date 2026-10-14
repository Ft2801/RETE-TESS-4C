# Proposta per centri culturali

Lettera di primo contatto rivolta ai centri culturali. Presenta la stazione TESS-4C come strumento di divulgazione aperto al pubblico e sonda l'interesse all'acquisto autonomo dello strumento.

Autore: Fabio Tempera, progetto rete TESS-4C in collaborazione con CieloBuio OdV.

Licenza: MIT. Vedi [LICENSE](LICENSE).

## Compilazione

```bash
pdflatex centri-culturali.tex
```

Eseguite il comando due volte per aggiornare i riferimenti incrociati. Il PDF compilato è `centri-culturali.pdf`.

## Struttura del progetto

| Percorso | Contenuto |
| --- | --- |
| `centri-culturali.tex` | Testo del documento |
| `centri-culturali.docx` | Versione Word (modifica diretta) |
| `packages.sty` | Pacchetti LaTeX |
| `figures/` | Immagini del documento |
| `centri-culturali.pdf` | Compilato |
| `LICENSE` | Licenza MIT |
| `.gitignore` | Esclusione dei file ausiliari |

## Versione Word

La cartella contiene anche `centri-culturali.docx`, la stessa versione del documento in formato Word, con font Arial e formato A4. Serve a chi preferisce modificare direttamente il testo senza compilare nulla.

Il file Word non si aggiorna da solo quando cambia il sorgente `centri-culturali.tex`. Scegliete una sola fonte di modifica: se cambiate il `.tex`, ricompilate il PDF e riportate le stesse modifiche nel Word, oppure viceversa. Contenuto e struttura sono gli stessi, ma Word e LaTeX spezzano le pagine in modo diverso, quindi l'impaginazione può non coincidere al millimetro.
