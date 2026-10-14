# Contribuire

Grazie per l'interesse. Questo documento raccoglie le linee guida per chi vuole proporre modifiche o segnalare problemi.

## Contesto del progetto

Prima di contribuire, leggere il [README](README.md). In particolare:

- i 20 siti Abruzzo in `data/abruzzo-sites.json` sono bloccati, salvo il campo `tessName`
- la tabella apre i dettagli sulla riga, con Grafana in testa
- i valori numerici assenti sono `-`

## Come segnalare un problema

1. Verificare che il problema non sia già aperto tra le issue del repository.
2. Aprire una issue con:
   - titolo descrittivo
   - passi per riprodurre
   - comportamento atteso
   - comportamento osservato
   - browser e sistema operativo

## Come proporre una funzionalità

Aprire una issue descrivendo il problema, la soluzione proposta e le alternative considerate.

## Come inviare una pull request

1. Fork della repository del progetto.
2. Branch tematico, una modifica per pull request.
3. Non inserire chiavi API, dump privati o file di lavoro.

## Vincoli

- Aggiornare solo `tessName` quando un fotometro è installato.
- Lo snapshot `data/latest.json` è scritto dal workflow. Non modificarlo a mano, salvo fallback di emergenza.
- Conservare la tendina sulla riga e Grafana in testa all'espansione.

