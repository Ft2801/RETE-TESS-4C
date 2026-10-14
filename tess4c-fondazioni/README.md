# Richiesta di sostegno per la rete TESS-4C

Richiesta di sostegno per fondazioni ed enti finanziatori. Il budget copre il solo costo degli strumenti nello scenario di 10 stazioni, e include modello operativo, piano di intervento e risultati attesi.

Autore: Fabio Tempera, progetto rete TESS-4C in collaborazione con CieloBuio OdV.

Licenza: MIT. Vedi [LICENSE](LICENSE).

## Compilazione

```bash
pdflatex fondazioni.tex
```

Eseguite il comando due volte per aggiornare i riferimenti incrociati. Il PDF compilato è `fondazioni.pdf`.

## Struttura del progetto

| Percorso | Contenuto |
| --- | --- |
| `fondazioni.tex` | Testo del documento |
| `fondazioni.docx` | Versione Word (modifica diretta) |
| `packages.sty` | Pacchetti LaTeX |
| `figures/` | Immagini del documento |
| `fondazioni.pdf` | Compilato |
| `LICENSE` | Licenza MIT |
| `.gitignore` | Esclusione dei file ausiliari |

## Versione Word

La cartella contiene anche `fondazioni.docx`, la stessa versione del documento in formato Word, con font Arial e formato A4. Serve a chi preferisce modificare direttamente il testo senza compilare nulla.

Il file Word non si aggiorna da solo quando cambia il sorgente `fondazioni.tex`. Scegliete una sola fonte di modifica: se cambiate il `.tex`, ricompilate il PDF e riportate le stesse modifiche nel Word, oppure viceversa. Contenuto e struttura sono gli stessi, ma Word e LaTeX spezzano le pagine in modo diverso, quindi l'impaginazione può non coincidere al millimetro.
