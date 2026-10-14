# Infrastruttura dati per la rete nazionale TESS-4C

Documento tecnico interno per il gruppo di lavoro CieloBuio OdV. Il documento definisce i requisiti hardware e software di un'infrastruttura destinata ad acquisire, verificare, visualizzare e conservare i dati di una rete potenziale composta da 100 o 150 fotometri TESS-4C.

- **Autore**: Fabio Tempera
- **Destinatari**: gruppo di lavoro CieloBuio OdV
- **Licenza**: MIT

---

## Indice

1. [Contesto e obiettivo](#contesto-e-obiettivo)
2. [Contenuto del documento](#contenuto-del-documento)
3. [Ipotesi di dimensionamento](#ipotesi-di-dimensionamento)
4. [Compilazione](#compilazione)
5. [Struttura del progetto](#struttura-del-progetto)
6. [Schema architetturale](#schema-architetturale)
7. [Aggiornamento del documento](#aggiornamento-del-documento)

## Contesto e obiettivo

La proposta mantiene l'invio dei dati alla rete STARS4ALL e introduce una copia nazionale sotto il controllo del gruppo di lavoro. Due macchine virtuali presso un soggetto ospitante da individuare costituiscono la soluzione raccomandata per l'esercizio. Un archivio di preservazione da individuare riceve i prodotti consolidati. Un server fisico dedicato resta un'alternativa.

Il documento distingue i requisiti tecnici già determinabili dalle decisioni che richiedono un accordo con UCM, STARS4ALL o il soggetto ospitante. Tra queste decisioni rientrano l'accesso al broker MQTT, la duplicazione del flusso, le funzioni di sicurezza del firmware, la disponibilità di macchine virtuali e la politica di conservazione.

## Contenuto del documento

Il documento comprende:

- stima del carico per 100 e 150 fotometri;
- livelli iniziali di servizio;
- architettura del flusso nazionale;
- modello dati minimo;
- componenti software;
- configurazione virtuale raccomandata;
- alternativa con server fisico;
- sicurezza, copie e preservazione;
- decisioni ancora necessarie;
- progetto pilota e criteri di accettazione;
- fonti tecniche.

## Ipotesi di dimensionamento

La stima principale assume 1 campione al minuto per ciascun fotometro e considera il funzionamento continuo nelle 24 ore. Il messaggio TESS-4C di riferimento occupa circa 256 byte. Una seconda stima usa 350 byte per includere variazioni del payload e campi aggiunti durante l'acquisizione.

Il dimensionamento costituisce un riferimento preliminare. Il progetto pilota deve misurare il volume reale del database, il comportamento del firmware, la continuità del flusso e il costo delle interrogazioni prima dell'attivazione dell'intera rete.

## Compilazione

```bash
pdflatex infrastruttura.tex
```

Eseguite il comando due volte per aggiornare i riferimenti incrociati. Il PDF compilato è `infrastruttura.pdf`.

In alternativa, con Tectonic:

```bash
tectonic infrastruttura.tex
```

## Struttura del progetto

| Percorso | Contenuto |
| --- | --- |
| `infrastruttura.tex` | testo e schema architetturale del documento |
| `infrastruttura.docx` | Versione Word (modifica diretta) |
| `figures/` | Immagini del documento |
| `packages.sty` | pacchetti e impostazioni LaTeX condivise |
| `infrastruttura.pdf` | documento compilato |
| `README.md` | descrizione, compilazione e struttura del progetto |
| `LICENSE` | licenza MIT |
| `.gitignore` | esclusione dei file ausiliari e degli ambienti locali |

## Schema architetturale

Lo schema dell'infrastruttura è realizzato direttamente in TikZ all'interno di `infrastruttura.tex`. Il parametro globale `scale` del blocco TikZ permette di modificare le dimensioni dello schema senza intervenire sui singoli elementi. Per la versione Word lo stesso schema è esportato come immagine in `figures/architettura.png`: il PDF non usa questo file, e va rigenerato dopo ogni modifica dello schema.

## Aggiornamento del documento

Prima di modificare i requisiti occorre verificare:

1. la cadenza effettiva dei fotometri TESS-4C;
2. il comportamento diurno e notturno del firmware;
3. il formato del messaggio MQTT;
4. le condizioni di accesso al broker STARS4ALL;
5. il volume misurato durante il progetto pilota;
6. le risorse virtuali disponibili presso il soggetto ospitante;
7. le modalità di deposito concordate con l'archivio di preservazione.

I calcoli, le tabelle e le raccomandazioni hardware devono rimanere coerenti tra loro dopo ogni aggiornamento.

## Versione Word

La cartella contiene anche `infrastruttura.docx`, la stessa versione del documento in formato Word, con font Arial e formato A4. Serve a chi preferisce modificare direttamente il testo senza compilare nulla.

Il file Word non si aggiorna da solo quando cambia il sorgente `infrastruttura.tex`. Scegliete una sola fonte di modifica: se cambiate il `.tex`, ricompilate il PDF e riportate le stesse modifiche nel Word, oppure viceversa. Contenuto e struttura sono gli stessi, ma Word e LaTeX spezzano le pagine in modo diverso, quindi l'impaginazione può non coincidere al millimetro.
