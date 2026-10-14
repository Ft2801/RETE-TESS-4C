# Rete TESS-4C

Repository del progetto per la rete di misura della brillanza del cielo notturno basata sui fotometri TESS-4C, sviluppati nell'ambito del progetto STARS4ALL.

Autore: Fabio Tempera, in collaborazione con CieloBuio OdV.

Licenza: MIT, Copyright (c) 2026 Fabio Tempera. Il testo completo è nel file [LICENSE](LICENSE).

## Scopo del progetto

La rete raccoglie misure oggettive della luce artificiale sul cielo notturno, in modo che enti, scuole, gruppi astrofili e amministrazioni possano valutare il fenomeno con dati misurati a terra. Il progetto include la documentazione per il primo contatto con i possibili partner, i documenti istituzionali, un'infrastruttura tecnica di riferimento, una dashboard pubblica e gli script per generare le figure.

Lo strumento misura la brillanza del cielo su quattro bande, trasmette i dati via WiFi e richiede un'alimentazione a 5 V. L'installazione richiede uno zenit libero e l'assenza di luce artificiale diretta sullo strumento.

## Struttura del repository

Ogni cartella è un progetto autonomo, con il proprio README, la propria licenza e, dove serve, i sorgenti LaTeX, la versione Word e il PDF compilato.

| Cartella | Contenuto |
| --- | --- |
| `infrastruttura-tess4c/` | Documento tecnico interno che definisce requisiti hardware e software per acquisire, verificare, visualizzare e conservare i dati di una rete di 100 o 150 fotometri. |
| `tess4c-arpa/` | Lettera alle ARPA regionali per proporre una rete regionale di misura e sollecitare un finanziamento dedicato all'installazione delle stazioni. |
| `tess4c-centri-culturali/` | Lettera di primo contatto per i centri culturali, con la proposta di uno strumento di divulgazione aperto al pubblico. |
| `tess4c-comuni/` | Lettera di primo contatto per le amministrazioni comunali, con la proposta di una misura oggettiva della luce notturna sul territorio. |
| `tess4c-dashboard/` | Dashboard statica per il monitoraggio della brillanza del cielo, pubblicabile su GitHub Pages. Include gli script di acquisizione dei dati dal catalogo STARS4ALL. |
| `tess4c-fiera-cesena/` | Materiali per la Fiera Astroshow di Cesena, 7 e 8 novembre 2026: one-pager da distribuire ai visitatori. |
| `tess4c-figure-scripts/` | Generatori Python delle figure vettoriali (SVG) e raster (PNG 300 dpi) usate nei documenti e nel resoconto dei siti. |
| `tess4c-fondazioni/` | Richiesta di sostegno per fondazioni ed enti finanziatori, con budget per lo scenario di 10 stazioni, modello operativo e risultati attesi. |
| `tess4c-gruppi-astrofili/` | Lettera di primo contatto per i gruppi astrofili, con la proposta di acquisto e installazione autonoma di uno strumento. |
| `tess4c-manuale-tess/` | Traduzione italiana dei manuali della famiglia TESS (TESS-W, TESS-4C, TESS-P, TAS), destinata alla rete CieloBuio. |
| `tess4c-proposta-template/` | Template della proposta di collaborazione TESS-4C Abruzzo, rivolta a istituti scolastici, enti parco e dipartimenti universitari. |
| `tess4c-resoconto-abruzzo/` | Resoconto interno dei siti candidati per la rete TESS-4C Abruzzo (20 siti), con struttura riutilizzabile per altre regioni. |
| `tess4c-scuole/` | Lettera di primo contatto per gli istituti scolastici, con la proposta di un laboratorio permanente per la didattica. |

## Compilazione dei documenti LaTeX

Ogni documento si compila con `pdflatex` dalla propria cartella. Eseguite il comando due volte per aggiornare i riferimenti incrociati. Esempio:

```bash
cd tess4c-scuole
pdflatex scuole.tex
```

I PDF compilati sono già presenti nel repository. Le cartelle dei documenti LaTeX contengono un file `packages.sty` con i pacchetti usati dal documento.

## Generazione delle figure

Gli script di `tess4c-figure-scripts/` richiedono Python 3 e matplotlib 3.8 o successivo, come indicato in `requirements.txt`.

```bash
cd tess4c-figure-scripts
pip install -r requirements.txt
python3 scripts/generate_all.py
```

Le illustrazioni di installazione (fotometro sul tetto) non sono generate dagli script. Restano file grafici fissi nelle cartelle dei documenti.

## Dashboard

La dashboard è una pagina statica senza backend e senza chiavi API. Per aggiornare i dati si esegue lo script di acquisizione, che scarica il catalogo e l'ultima lettura di ogni fotometro dall'API pubblica di STARS4ALL.

```bash
cd tess4c-dashboard
python3 scripts/ingest.py
```

Per la pubblicazione, il contenuto della cartella va servito come sito statico, ad esempio con GitHub Pages.

## Fonti e licenze di terzi

Il progetto distribuisce la traduzione del manuale TESS con licenza MIT. I testi originali restano dei rispettivi autori (Lucía García, Jaime Zamorano, Carlos Tapia e Cristóbal García), e le licenze e gli URL delle fonti sono nel capitolo 8 del PDF compilato `tess4c-manuale-tess/manuale-tess.pdf`. Le immagini e i dati di terzi mantengono le condizioni indicate nei rispettivi documenti.
