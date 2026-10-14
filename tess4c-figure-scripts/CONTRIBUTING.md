# Contribuire

Grazie per l'interesse. Questo documento raccoglie le linee guida per chi vuole proporre modifiche o segnalare problemi.

## Contesto del progetto

Prima di contribuire, leggere il [README](README.md). In particolare:

- i dati di una regione stanno in `data/sites.json`, non negli script
- l'inquadratura della mappa sta nella chiave `map` di `data/sites.json`
- le illustrazioni di installazione non si generano da qui

## Come segnalare un problema

1. Verificare che il problema non sia già aperto.
2. Aprire una issue con titolo descrittivo, comando eseguito, messaggio di errore e sistema operativo.

## Come inviare una pull request

1. Fork della repository.
2. Branch tematico, una modifica per pull request.
3. Non inserire dump GeoJSON di grandi dimensioni se non necessario: restano in cache locale.

