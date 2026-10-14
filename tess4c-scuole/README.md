# Proposta per istituti scolastici

Lettera di primo contatto rivolta agli istituti scolastici. Presenta la stazione TESS-4C come laboratorio permanente per la didattica e sonda l'interesse all'acquisto autonomo dello strumento.

Autore: Fabio Tempera, progetto rete TESS-4C in collaborazione con CieloBuio OdV.

Licenza: MIT. Vedi [LICENSE](LICENSE).

## Compilazione

```bash
pdflatex scuole.tex
```

Eseguite il comando due volte per aggiornare i riferimenti incrociati. Il PDF compilato è `scuole.pdf`.

## Struttura del progetto

| Percorso | Contenuto |
| --- | --- |
| `scuole.tex` | Testo del documento |
| `scuole.docx` | Versione Word (modifica diretta) |
| `packages.sty` | Pacchetti LaTeX |
| `figures/` | Immagini del documento |
| `scuole.pdf` | Compilato |
| `LICENSE` | Licenza MIT |
| `.gitignore` | Esclusione dei file ausiliari |

## Versione Word

La cartella contiene anche `scuole.docx`, la stessa versione del documento in formato Word, con font Arial e formato A4. Serve a chi preferisce modificare direttamente il testo senza compilare nulla.

Il file Word non si aggiorna da solo quando cambia il sorgente `scuole.tex`. Scegliete una sola fonte di modifica: se cambiate il `.tex`, ricompilate il PDF e riportate le stesse modifiche nel Word, oppure viceversa. Contenuto e struttura sono gli stessi, ma Word e LaTeX spezzano le pagine in modo diverso, quindi l'impaginazione può non coincidere al millimetro.
