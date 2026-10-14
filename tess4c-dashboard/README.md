# Dashboard di misurazione della brillanza del cielo notturno

Dashboard statica per il monitoraggio della *night sky brightness* (NSB) misurata dai fotometri TESS-W e TESS-4C della rete [STARS4ALL](https://www.stars4all.eu/). Raccoglie i siti candidati delle reti regionali **TESS-4C Abruzzo** e **TESS-4C Umbria** e li affianca ai fotometri pubblici già in funzione in Italia e nel resto del mondo.

Il progetto è una pagina statica: nessun backend, nessuna base dati, nessuna chiave API. È pensato per la pubblicazione su GitHub Pages.

- **Autore**: Fabio Tempera
- **Anno**: 2026
- **Licenza**: MIT
- **Sito**: <https://ft2801.github.io/tess4c-dashboard/>

---

## Indice

1. [Panoramica](#panoramica)
2. [Come funziona](#come-funziona)
3. [Siti candidati](#siti-candidati)
4. [Sviluppo locale](#sviluppo-locale)
5. [Pubblicazione](#pubblicazione)
6. [Struttura del progetto](#struttura-del-progetto)
7. [Contribuire](#contribuire)
9. [Fonti](#fonti)

## Panoramica

La dashboard mostra in tempo reale le letture dei fotometri su una mappa e in una tabella, con quattro viste:

| Vista | Contenuto |
| --- | --- |
| **Abruzzo** | 20 siti candidati della rete TESS-4C Abruzzo |
| **Umbria** | 22 siti candidati della rete TESS-4C Umbria |
| **Italia** | fotometri STARS4ALL con sede in Italia |
| **Rete STARS4ALL** | intero catalogo pubblico della rete |

Per ogni nodo la tabella riporta lo stato, la NSB misurata, i quattro canali fotometrici (F1-F4), le temperature ambiente e del cielo, la frequenza di modulazione, lo zero point, il numero di sequenza, la potenza radio e l'istante del campione. Espandendo la riga si apre il pannello Grafana del sensore con la serie storica a sette giorni, seguito dal dettaglio completo dei metadati.

In testa alla pagina due indicatori riassumono la situazione della vista corrente: la NSB media dei nodi notturni e l'istante del campione più recente.

## Come funziona

### Fonti dei dati

- Catalogo dei fotometri: <https://api.stars4all.eu/photometers>
- Nodi in trasmissione: <https://api.stars4all.eu/photometers_emitting>
- Ultime osservazioni: `https://api.stars4all.eu/photometer/<nome>/observations/latest_values`
- Serie storiche: <https://tess.dashboards.stars4all.eu>
- Siti candidati regionali: `data/abruzzo-sites.json` e `data/umbria-sites.json`, versionati insieme al codice

All'apertura la pagina carica gli snapshot locali (`data/latest.json`, `data/readings.json`) e poi li aggiorna con l'API in diretta. Se l'API non è raggiungibile la dashboard continua a funzionare sui dati dello snapshot.

### Acquisizione periodica

`scripts/ingest.py` scarica il catalogo e le ultime letture, aggiorna gli snapshot e registra un riepilogo giornaliero in `data/archive/` (JSONL). Lo script usa esclusivamente la libreria standard di Python 3. Il workflow `.github/workflows/ingest.yml` lo esegue ogni 15 minuti con il `GITHUB_TOKEN` della repository: non serve alcun token personale.

### Stati dei nodi

Stato in tabella, colore dei marker sulla mappa e legenda derivano da un'unica funzione (`photoState()` in `assets/app.js`), quindi non possono contraddirsi. Gli stati sono cinque:

| Stato | Significato | Colore |
| --- | --- | --- |
| `candidato` | sito regionale senza fotometro STARS4ALL assegnato | azzurro |
| `notte` | NSB misurata oltre 10 mag/arcsec², plausibile per l'istante del campione | verde |
| `giorno` | cielo luminoso misurato dal sensore, con il Sole ancora plausibile | oro |
| `silente` | nessun campione recente: non trasmette oppure campione troppo vecchio | grigio |
| `guasto` | trasmette ma le misure sono inattendibili (valori nulli/azzerati o contraddetti dal Sole) | rosso |

I nodi `silente` e `guasto` sono gli **inattivi**: di default sono nascosti, sia sulla mappa sia in tabella, per lasciare la scena ai sensori che stanno davvero misurando. Lo switch **Mostra inattivi** in alto a destra nella mappa li rende visibili; il filtro ricalcola gli stati in continuo, quindi un nodo che riprende a trasmettere torna visibile da solo e uno che si spegne scompare quando lo switch è spento. I siti `candidato` e i nodi attivi sono sempre visibili.

Ogni campione passa tre controlli prima di produrre uno stato:

1. **Validità del campione.** I nodi fermi o guasti possono continuare a trasmettere zeri (`mag` e `freq` nulli o azzerati): non misurano il cielo e il nodo risulta `guasto`, invece di sembrare "giorno" in piena notte.
2. **Freschezza.** Un campione più vecchio di 60 minuti descrive il passato, non il cielo attuale: il nodo risulta `silente` e il tooltip riporta l'età del campione.
3. **Plausibilità astronomica.** La misura viene confrontata con l'altezza del Sole **all'istante del campione** (non all'ora attuale), calcolata sulle coordinate del nodo. Con il Sole a una data altezza il cielo naturale non può essere più scuro di un tetto prefissato: una NSB oltre il tetto è fisicamente impossibile e indica sensore coperto, cupola chiusa o guasto. Il nodo risulta `guasto`, con l'indicazione (guasto) e la spiegazione nel tooltip. In modo simmetrico, una misura di cielo luminoso con il Sole già ben sotto l'orizzonte (oltre i −6°) non può essere il cielo: lampada sul sensore o sensore guasto, e anche in questo caso lo stato è `guasto`. Nessuna notte legittima viene persa: il crepuscolo, con il cielo che si oscura naturalmente oltre i 10 mag/arcsec² con il Sole ancora pochi gradi sotto l'orizzonte, è riconosciuto come notte.

Il calcolo della posizione solare usa un algoritmo astronomico semplificato basato sulle coordinate del nodo.

## Siti candidati

Le due reti regionali hanno ciascuna il proprio elenco di siti candidati:

- `data/abruzzo-sites.json`: 20 siti dell'Abruzzo
- `data/umbria-sites.json`: 22 siti dell'Umbria

Ogni record descrive un sito con lo stesso schema: identificativo, nome, categoria (classe del sito: urbano grande/medio/piccolo, collina interna, montagna, area protetta, sito scientifico), comune e provincia, coordinate WGS84, quota in metri e l'eventuale fotometro assegnato.

Per collegare un sito a un fotometro reale basta compilare il campo `tessName` nel relativo record:

```json
"tessName": "stars1234"
```

Finché `tessName` resta `null` il nodo compare come *candidato*, senza misure. Gli altri campi del record sono dati di progetto e non vengono modificati manualmente.

## Sviluppo locale

Servire la cartella con un server statico. Per aggiornare manualmente gli snapshot basta eseguire lo script di ingest (serve Python 3, senza dipendenze):

```bash
python3 -m http.server 8080
python3 scripts/ingest.py
```

## Pubblicazione

1. Creare la repository pubblica del progetto e copiare il contenuto di questa cartella, `.nojekyll` compreso.
2. Impostazioni, Pages, source: branch `main`, cartella `/`.
3. Verificare che il workflow `.github/workflows/ingest.yml` sia attivo: provvede ad aggiornare i dati ogni 15 minuti.

## Struttura del progetto

| Percorso | Contenuto |
| --- | --- |
| `index.html` | Pagina della dashboard |
| `assets/` | Stile, logica applicativa, favicon |
| `data/abruzzo-sites.json` | Siti candidati TESS-4C Abruzzo |
| `data/umbria-sites.json` | Siti candidati TESS-4C Umbria |
| `data/latest.json` | Snapshot del catalogo STARS4ALL |
| `data/readings.json` | Ultima lettura dei nodi in trasmissione |
| `data/archive/` | Registro storico giornaliero (JSONL) |
| `scripts/ingest.py` | Scarico di catalogo e letture |
| `.github/workflows/ingest.yml` | Aggiornamento automatico ogni 15 minuti |

## Contribuire

Le contribuzioni sono benvenute. Vedi [CONTRIBUTING.md](CONTRIBUTING.md) per le linee guida.

## Fonti

- Catalogo e letture STARS4ALL: <https://api.stars4all.eu>
- Pannelli Grafana: <https://tess.dashboards.stars4all.eu>
- Siti candidati Abruzzo e Umbria: selezione TESS-4C 2026, coordinate WGS84
