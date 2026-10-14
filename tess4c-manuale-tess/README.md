# Manuale utente TESS (traduzione italiana)

Traduzione italiana dei manuali della famiglia TESS (TESS-W, TESS-4C, TESS-P, TAS), destinata alla rete CieloBuio.

- Autore della traduzione: Fabio Tempera
- Licenza della traduzione: MIT (file `LICENSE`)
- I testi originali restano di Lucía García, Jaime Zamorano, Carlos Tapia (UCM/LICA) e Cristóbal García (STARS4ALL / observatorioremoto). Licenze e URL delle fonti sono nel capitolo 8 del PDF compilato (`manuale-tess.pdf`).

## Compilazione

```bash
pdflatex manuale-tess.tex
```

Eseguite il comando due volte per aggiornare i riferimenti incrociati. Il PDF compilato è `manuale-tess.pdf`.

## Struttura del progetto

| Percorso | Contenuto |
| --- | --- |
| `manuale-tess.tex` | Testo del documento |
| `manuale-tess.docx` | Versione Word (modifica diretta) |
| `packages.sty` | Pacchetti LaTeX |
| `figures/` | Immagini del documento |
| `manuale-tess.pdf` | Compilato |
| `LICENSE` | Licenza MIT |
| `.gitignore` | Esclusione dei file ausiliari |

## Versione Word

La cartella contiene anche `manuale-tess.docx`, la stessa versione del documento in formato Word, con font Arial e formato A4. Serve a chi preferisce modificare direttamente il testo senza compilare nulla.

Il file Word non si aggiorna da solo quando cambia il sorgente `manuale-tess.tex`. Scegliete una sola fonte di modifica: se cambiate il `.tex`, ricompilate il PDF e riportate le stesse modifiche nel Word, oppure viceversa. Contenuto e struttura sono gli stessi, ma Word e LaTeX spezzano le pagine in modo diverso, quindi l'impaginazione può non coincidere al millimetro.
