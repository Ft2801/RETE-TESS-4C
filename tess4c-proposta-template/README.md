# Proposta di collaborazione TESS-4C Abruzzo

Lettera ufficiale da inviare a istituti scolastici, enti parco e dipartimenti universitari.

Autore: Fabio Tempera, referente Abruzzo, in collaborazione con CieloBuio OdV.

Licenza: MIT. Vedi [LICENSE](LICENSE).

## Compilazione

```bash
pdflatex proposta-template.tex
```

Eseguite il comando due volte per aggiornare i riferimenti incrociati. Il PDF compilato è `proposta-template.pdf`.

## Struttura del progetto

| Percorso | Contenuto |
| --- | --- |
| `proposta-template.tex` | Testo del documento |
| `proposta-template.docx` | Versione Word (modifica diretta) |
| `packages.sty` | Pacchetti LaTeX |
| `figures/` | Immagini del documento |
| `proposta-template.pdf` | Compilato |
| `LICENSE` | Licenza MIT |
| `.gitignore` | Esclusione dei file ausiliari |

## Versione Word

La cartella contiene anche `proposta-template.docx`, la stessa versione del documento in formato Word, con font Arial e formato A4. Serve a chi preferisce modificare direttamente il testo senza compilare nulla.

Il file Word non si aggiorna da solo quando cambia il sorgente `proposta-template.tex`. Scegliete una sola fonte di modifica: se cambiate il `.tex`, ricompilate il PDF e riportate le stesse modifiche nel Word, oppure viceversa. Contenuto e struttura sono gli stessi, ma Word e LaTeX spezzano le pagine in modo diverso, quindi l'impaginazione può non coincidere al millimetro.
