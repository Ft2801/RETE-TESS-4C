/* Copyright (c) 2026 Fabio Tempera. SPDX-License-Identifier: MIT. */
const API = "https://api.stars4all.eu";
const GRAFANA = "https://tess.dashboards.stars4all.eu";

const VIEWS = {
  abruzzo: { title: "Siti Abruzzo", maxZoom: 9 },
  umbria: { title: "Siti Umbria", maxZoom: 9 },
  italia: { title: "Fotometri in Italia", maxZoom: 7 },
  rete: { title: "Rete STARS4ALL", maxZoom: 4 }
};

const state = {
  view: "abruzzo",
  abruzzo: [],
  umbria: [],
  photometers: [],
  readings: {},
  fetchedAt: null,
  live: false,
  selected: null,
  query: "",
  showInactive: false,
  rr: 0
};

const map = L.map("map", { zoomControl: true, attributionControl: false });
L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
  { attribution: "", maxZoom: 16 }
).addTo(map);
map.setView([42.28, 13.85], 8);
const layer = L.layerGroup().addTo(map);

function sizeMap() {
  map.invalidateSize();
}
window.addEventListener("resize", sizeMap);
requestAnimationFrame(sizeMap);
setTimeout(sizeMap, 200);

function isItaly(p) {
  return (p.country || "").toLowerCase().includes("ital");
}

function hasCoords(p) {
  return p && p.lat != null && p.lon != null;
}

function dash(v) {
  return v == null || v === "" ? "-" : v;
}

function fmtTime(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" });
}

function magOf(rd) {
  if (!rd) return null;
  if (rd.F1 && rd.F1.mag != null) return rd.F1.mag;
  if (rd.mag != null) return rd.mag;
  return null;
}

function freqOf(rd) {
  if (!rd) return null;
  return rd.freq != null ? rd.freq : rd.F1 && rd.F1.freq != null ? rd.F1.freq : null;
}

// ----------------------------------------------- analisi del campione
// Un campione e' utilizzabile solo se contiene una misura reale: i nodi fermi o
// guasti spesso continuano a trasmettere zeri (mag 0 / freq 0), che non descrivono
// il cielo e non devono essere scambiati per "giorno".
const DAY_FREQ_HZ = 10000; // convenzione di "sensore in luce" (TSL237 satura)
const NIGHT_MAG_MIN = 10; // NSB oltre 10 mag/arcsec² = cielo notturno
const MAX_SAMPLE_AGE_MIN = 60; // oltre, il campione descrive il passato, non il cielo
const DAY_MIN_SUN_ELEV = -6; // sotto -6° il cielo naturale e' gia' notturno: una misura
// "diurna" non puo' essere il cielo, solo una lampada sul sensore o un guasto

function sampleInfo(rd) {
  const mag = magOf(rd);
  const freq = freqOf(rd);
  const valid = !!rd && ((mag != null && mag !== 0) || (freq != null && freq !== 0));
  return { mag, freq, valid };
}

// Plausibilita' astronomica: con il Sole a una data altezza il cielo naturale non puo'
// essere piu' scuro (mag piu' alto) di questo tetto. Una misura oltre il tetto e'
// fisicamente impossibile e significa sensore coperto, cupola chiusa o guasto.
// La curva ha margini ampi: serve solo a scartare l'impossibile, non a modellare il
// crepuscolo. Verificata sui casi reali (es. NSB ~17,5 alle Canarie con Sole a +35°).
const PLAUSIBLE_MAX_MAG = [
  [-24, 24],
  [-12, 22],
  [-6, 17],
  [0, 12],
  [10, 9],
  [90, 9]
];

function plausibleMaxMag(sunElev) {
  if (sunElev == null || !Number.isFinite(sunElev)) return Infinity;
  const pts = PLAUSIBLE_MAX_MAG;
  if (sunElev <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (sunElev <= pts[i][0]) {
      const x0 = pts[i - 1][0];
      const y0 = pts[i - 1][1];
      const x1 = pts[i][0];
      const y1 = pts[i][1];
      return y0 + ((sunElev - x0) * (y1 - y0)) / (x1 - x0);
    }
  }
  return pts[pts.length - 1][1];
}

// --------------------------------------------------------------- posizione del Sole
// Algoritmo NOAA semplificato (accuratezza ~0,1°), sufficiente per stabilire se in un
// dato luogo e istante il Sole e' sopra l'orizzonte.
const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

function norm360(x) {
  return ((x % 360) + 360) % 360;
}

function norm180(x) {
  return norm360(x + 180) - 180;
}

// Elementi orbitali approssimati per un istante: declinazione, ascensione retta, ecc.
function sunEquatorial(date) {
  const n = date.getTime() / 86400000 + 2440587.5 - 2451545.0; // giorni da J2000
  const L = norm360(280.46 + 0.9856474 * n); // longitudine media
  const g = norm360(357.528 + 0.9856003 * n) * RAD; // anomalia media
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD; // long. eclittica
  const eps = (23.439 - 0.0000004 * n) * RAD; // obliquita'
  return {
    n,
    dec: Math.asin(Math.sin(eps) * Math.sin(lambda)), // declinazione
    ra: Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda)), // asc. retta
    gmstHours: norm360(18.697374558 + 24.06570982441908 * n),
    eqTimeDeg: norm180(L - Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda)) * DEG),
    lambda
  };
}

// Altezza del Sole sull'orizzonte, in gradi (positiva = sopra l'orizzonte).
function sunElevationDeg(lat, lon, date) {
  const s = sunEquatorial(date);
  const hourAngle = (s.gmstHours * 15 + lon) * RAD - s.ra; // angolo orario locale
  const phi = lat * RAD;
  const sinAlt =
    Math.sin(phi) * Math.sin(s.dec) + Math.cos(phi) * Math.cos(s.dec) * Math.cos(hourAngle);
  return Math.asin(Math.max(-1, Math.min(1, sinAlt))) * DEG;
}

// Alba e tramonto del giorno (geometrici, -0.833°), in ore UTC decimali.
function sunTimes(lat, lon, date) {
  const s = sunEquatorial(date);
  const cosH =
    (Math.sin(-0.833 * RAD) - Math.sin(lat * RAD) * Math.sin(s.dec)) /
    (Math.cos(lat * RAD) * Math.cos(s.dec));
  const noonUTC = (12 - (lon + s.eqTimeDeg) / 15 + 24) % 24;
  if (cosH > 1) return { polar: "notte", noonUTC };
  if (cosH < -1) return { polar: "giorno", noonUTC };
  const hours = Math.acos(cosH) * DEG / 15;
  return { riseUTC: noonUTC - hours, setUTC: noonUTC + hours, noonUTC };
}

function hhmmFromUTCHours(hours, date, tz) {
  const dayStart = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const d = new Date(dayStart + hours * 3600000);
  try {
    return d.toLocaleTimeString("it-IT", {
      timeZone: tz || undefined,
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (_) {
    return (
      String(d.getUTCHours()).padStart(2, "0") + ":" + String(d.getUTCMinutes()).padStart(2, "0")
    );
  }
}

function sunTimesText(lat, lon, date, tz) {
  const t = sunTimes(lat, lon, date);
  if (t.polar === "notte") return "Sole sempre sotto l'orizzonte";
  if (t.polar === "giorno") return "Sole sempre sopra l'orizzonte";
  return (
    hhmmFromUTCHours(t.riseUTC, date, tz) +
    " / " +
    hhmmFromUTCHours(t.setUTC, date, tz) +
    (tz ? " (" + tz + ")" : "")
  );
}

function fmtNum(v, d) {
  if (v == null || v === "") return "-";
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return n.toLocaleString("it-IT", { minimumFractionDigits: d, maximumFractionDigits: d });
}

// NSB in tabella: il valore misurato quando c'e', "giorno" solo a saturazione del
// sensore (mag 0) e solo se lo stato lo conferma, "-" quando la misura manca o non e'
// attendibile. In particolare una NSB crepuscolare (mag 6-10) resta visibile come
// numero invece di sparire nel label "giorno".
function fmtMag(rd, ps) {
  const info = sampleInfo(rd);
  if (!info.valid) return "-";
  if (info.mag == null || info.mag === 0) {
    return ps && ps.key === "giorno" ? "giorno" : "-";
  }
  return fmtNum(info.mag, 2);
}

function chMag(rd, key) {
  if (!rd || !rd[key] || rd[key].mag == null) return "-";
  return fmtNum(rd[key].mag, 2);
}

function zpOf(rd, meta) {
  if (rd && rd.F1 && rd.F1.zp != null) return rd.F1.zp;
  if (meta && meta.zeroPoint != null) return meta.zeroPoint;
  return null;
}

async function loadJSON(url) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(url + " " + r.status);
  return r.json();
}

function compactFromApi(list, emittingSet) {
  return list.map((p) => {
    const loc = p.info_location || {};
    const tess = p.info_tess || {};
    // Le coordinate stanno in due posti: i campi di primo livello sono spesso vuoti,
    // mentre info_location le contiene per tutti i fotometri della rete.
    const lat = coordOf(p.latitude, loc.latitude);
    const lon = coordOf(p.longitude, loc.longitude);
    return {
      name: p.name,
      lat: lat,
      lon: lon,
      city: p.city || loc.town || p.place || "",
      country: loc.country || p.country || "",
      region: loc.region || loc.sub_region || "",
      place: loc.place || "",
      tz: tess.local_timezone || "",
      filters: p.filters || tess.filters || "",
      period: tess.period,
      zeroPoint: tess.zero_point != null ? tess.zero_point : p.zero_point,
      emitting: emittingSet.has(p.name)
    };
  });
}

function coordOf(top, nested) {
  const first = Number(top);
  if (top != null && top !== "" && Number.isFinite(first)) return first;
  const second = Number(nested);
  if (nested != null && nested !== "" && Number.isFinite(second)) return second;
  return null;
}

function cleanObs(obs) {
  const rec = {
    name: obs.name,
    tstamp: obs.tstamp,
    seq: obs.seq,
    rev: obs.rev,
    wdBm: obs.wdBm,
    tamb: obs.tamb,
    tsky: obs.tsky,
    hash: obs.hash,
    ain: obs.ain
  };
  if (obs.F1) {
    rec.model = "TESS-4C";
    rec.F1 = obs.F1;
    rec.F2 = obs.F2;
    rec.F3 = obs.F3;
    rec.F4 = obs.F4;
    rec.mag = obs.F1.mag;
    rec.freq = obs.F1.freq;
  } else {
    rec.model = "TESS-W";
    rec.mag = obs.mag;
    rec.freq = obs.freq;
  }
  return rec;
}

function beginParam(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, "Z");
}

async function fetchLatest(name) {
  const url =
    API +
    "/photometer/" +
    encodeURIComponent(name) +
    "/observations/latest_values?begin=" +
    beginParam(90) +
    // Finestra di 90 minuti e 200 righe: l'API tronca in ordine crescente, quindi
    // un count troppo basso restituirebbe il campione piu' VECCHIO della finestra.
    "&count=200";
  const rows = await loadJSON(url);
  if (!Array.isArray(rows) || !rows.length) return null;
  return cleanObs(rows[rows.length - 1]);
}

function applyEmitting(names) {
  const set = new Set(names);
  state.photometers.forEach((p) => {
    p.emitting = set.has(p.name);
  });
}

function updateKpis(now) {
  const when = now || new Date();
  const rows = byView();
  const total = rows.length;
  // "Lettura diretta" = campione con una misura reale: gli zeri dei nodi fermi non
  // contano come copertura.
  const measured = rows.filter((r) => r.reading && sampleInfo(r.reading).valid);
  // La media usa esattamente le righe etichettate "notte" in tabella: cosi' il KPI e
  // la lista non possono divergere, e le letture anomale (cupola chiusa di giorno)
  // restano fuori dalla media.
  const states = rows.map((r) => ({ r, ps: photoState(r, when) }));
  const nights = states.filter((s) => s.ps.key === "notte").map((s) => s.r);
  // Nodi con misure inattendibili (zeri o contraddette dal Sole): guasti, fuori media.
  const dropped = states.filter((s) => s.ps.key === "guasto").length;
  const nightNoMap = nights.filter((r) => !r.geolocated).length;

  const magHint = document.getElementById("kpi-mag-hint");
  if (nights.length) {
    const mean = nights.reduce((s, r) => s + magOf(r.reading), 0) / nights.length;
    document.getElementById("kpi-mag").textContent = fmtNum(mean, 2);
    magHint.textContent =
      "media mag/arcsec² su " +
      plural(nights.length, "nodo notturno", "nodi notturni") +
      (nightNoMap ? " · " + nightNoMap + " fuori mappa" : "") +
      (dropped ? " · " + plural(dropped, "nodo guasto", "nodi guasti") : "");
  } else {
    document.getElementById("kpi-mag").textContent = "n.d.";
    magHint.textContent = measured.length
      ? "nessuna NSB notturna fra i " + plural(measured.length, "nodo con lettura", "nodi con lettura")
      : "nessuna lettura disponibile";
  }

  const cov = document.getElementById("kpi-coverage");
  if (cov) {
    cov.textContent =
      measured.length < total
        ? measured.length + "/" + total + " nodi della vista con lettura diretta"
        : "";
    cov.hidden = measured.length >= total;
  }

  let latest = null;
  measured.forEach((r) => {
    const t = r.reading.tstamp;
    if (t && (!latest || t > latest)) latest = t;
  });
  document.getElementById("kpi-ago").textContent = latest ? fmtTime(latest) : "-";
  document.getElementById("kpi-src").textContent = state.live
    ? "ora del campione più recente"
    : "snapshot in repository";
}

// Righe delle viste regionali (Abruzzo, Umbria): stessi siti candidati, stesso schema.
function siteRows(sites, kind) {
  return sites.map((s) => {
    const tess = s.tessName
      ? state.photometers.find((p) => p.name === s.tessName)
      : null;
    const name = s.tessName;
    return {
      key: (kind === "umbria" ? "um-" : "ab-") + s.id,
      kind: kind,
      title: s.id + "  " + s.name,
      place: s.comune + " (" + s.prov + ")",
      subtitle: s.category,
      lat: s.lat,
      lon: s.lon,
      geolocated: s.lat != null && s.lon != null,
      quota: s.quota,
      emitting: !!(tess && tess.emitting),
      tessName: name,
      filters: tess ? tess.filters : null,
      period: tess ? tess.period : null,
      zeroPoint: tess ? tess.zeroPoint : null,
      tz: tess ? tess.tz : "",
      reading: name ? state.readings[name] : null
    };
  });
}

function byView() {
  if (state.view === "abruzzo" || state.view === "umbria") {
    return siteRows(
      state.view === "abruzzo" ? state.abruzzo : state.umbria,
      state.view
    );
  }
  // In "Italia" ci sono tutti i fotometri del Paese; in "Rete STARS4ALL" quelli
  // geolocalizzati piu' quelli in trasmissione privi di coordinate (che restano
  // visibili in tabella ma non possono essere disegnati sulla mappa).
  const pool =
    state.view === "italia"
      ? state.photometers.filter(isItaly)
      : state.photometers.filter((p) => hasCoords(p) || p.emitting);
  return pool.map((p) => ({
    key: p.name,
    kind: "tess",
    title: p.name,
    place: [p.city, p.region].filter(Boolean).join(", ") || "-",
    subtitle: p.country || "",
    lat: p.lat,
    lon: p.lon,
    geolocated: hasCoords(p),
    emitting: p.emitting,
    tessName: p.name,
    filters: p.filters,
    period: p.period,
    zeroPoint: p.zeroPoint,
    tz: p.tz,
    reading: state.readings[p.name]
  }));
}

function queryRows() {
  const q = state.query.trim().toLowerCase();
  const rows = byView();
  if (!q) return rows;
  return rows.filter((r) =>
    (r.title + " " + r.place + " " + r.subtitle + " " + (r.tessName || "")).toLowerCase().includes(q)
  );
}

// Righe visibili: di default solo nodi attivi (notte/giorno) e candidati. I sensori
// "inattivi" (silente e guasto) escono da mappa e tabella a meno dello switch
// "Mostra inattivi". Il filtro ricalcola lo stato ad ogni render: un nodo che riprende
// torna visibile da solo, uno che si spegne scompare.
function filtered() {
  const rows = queryRows();
  if (state.showInactive) return rows;
  const now = new Date();
  return rows.filter((r) => {
    const k = photoState(r, now).key;
    return k !== "silente" && k !== "guasto";
  });
}

// Stato del nodo: un solo posto decide, e tabella, mappa e legenda leggono da qui.
// Cinque stati:
//   candidato -> sito regionale (Abruzzo o Umbria) senza fotometro STARS4ALL assegnato
//   notte     -> NSB misurata > 10 mag/arcsec², plausibile all'istante del campione
//   giorno    -> cielo luminoso misurato dal sensore, con il Sole ancora plausibile
//   silente   -> nessun campione recente: non trasmette oppure campione troppo vecchio
//   guasto    -> trasmette ma le misure sono inattendibili (zeri/valori nulli, oppure
//                contraddette dalla posizione del Sole al momento del campione)
// "Inattivi" = silente + guasto: nascosti di default, visibili con lo switch
// "Mostra inattivi". I nodi attivi (notte/giorno) e i candidati sono sempre visibili.
const STATUS = {
  candidato: {
    label: "candidato",
    cls: "",
    color: "#6a9bb8",
    title: "Sito candidato: nessun fotometro STARS4ALL ancora assegnato"
  },
  notte: {
    label: "notte",
    cls: "on",
    color: "#3dd68c",
    title: "Notte: NSB misurata oltre 10 mag/arcsec², plausibile per l'istante del campione"
  },
  giorno: {
    label: "giorno",
    cls: "day",
    color: "#c4a574",
    title: "Giorno: cielo luminoso misurato dal sensore"
  },
  silente: {
    label: "silente",
    cls: "off",
    color: "#8c8c8c",
    title: "Silente: nessun campione recente del sensore"
  },
  guasto: {
    label: "guasto",
    cls: "bad",
    color: "#e2574c",
    title: "Guasto: il sensore trasmette ma le misure sono inattendibili"
  }
};

// Stato del nodo: un solo posto decide, e tabella, mappa e legenda leggono da qui.
// Il campione viene confrontato con il Sole AL MOMENTO DEL CAMPIONE (tstamp), non con
// il Sole adesso: e' l'unica domanda fisicamente sensata ("era notte quando la misura
// e' stata presa?"). Il Sole di adesso serve solo a capire se il campione e' ancora
// rappresentativo: un campione vecchio o senza misure non descrive il cielo attuale
// e non puo' etichettare nulla.
function photoState(r, now) {
  if (r.kind !== "tess" && !r.tessName) {
    return { key: "candidato" };
  }
  const when = now || new Date();
  const rd = r.reading;
  const elev = r.geolocated ? sunElevationDeg(r.lat, r.lon, when) : null;
  const base = { elev: elev, transmitting: !!r.emitting };

  if (!rd) {
    return Object.assign({}, base, { key: "silente", reason: "no-sample" });
  }

  const info = sampleInfo(rd);
  const t = Date.parse(rd.tstamp);
  const ageMin = Number.isFinite(t) ? (when.getTime() - t) / 60000 : null;
  const elevSample =
    r.geolocated && Number.isFinite(t)
      ? sunElevationDeg(r.lat, r.lon, new Date(t))
      : null;

  if (!info.valid) {
    // Zeri o campi vuoti: il nodo trasmette ma non misura il cielo. GUASTO.
    return Object.assign({}, base, { key: "guasto", reason: "invalid", ageMin });
  }
  if (ageMin != null && ageMin > MAX_SAMPLE_AGE_MIN) {
    return Object.assign({}, base, {
      key: "silente",
      reason: "stale",
      ageMin,
      elevSample
    });
  }

  const nightLike = info.mag != null && info.mag > NIGHT_MAG_MIN;
  if (nightLike) {
    if (elevSample != null && info.mag > plausibleMaxMag(elevSample)) {
      // NSB notturna impossibile con il Sole a quell'altezza: sensore coperto,
      // cupola chiusa o guasto. Misura inattendibile. GUASTO.
      return Object.assign({}, base, {
        key: "guasto",
        elevSample,
        ageMin,
        reason: "covered"
      });
    }
    return Object.assign({}, base, { key: "notte", elevSample, ageMin });
  }

  // Misura di cielo luminoso (NSB <= 10 o sensore satura): credibile solo con il Sole
  // ancora vicino all'orizzonte. Con il Sole oltre DAY_MIN_SUN_ELEV il cielo naturale
  // e' gia' piu' scuro di cosi': la misura descrive una lampada sul sensore o un
  // sensore guasto. GUASTO.
  if (elevSample != null && elevSample < DAY_MIN_SUN_ELEV) {
    return Object.assign({}, base, {
      key: "guasto",
      elevSample,
      ageMin,
      reason: "day-at-night"
    });
  }
  return Object.assign({}, base, { key: "giorno", elevSample, ageMin });
}

function plural(n, one, many) {
  return n + " " + (n === 1 ? one : many);
}

function fmtAge(minutes) {
  if (minutes == null || !Number.isFinite(minutes) || minutes < 0) return "";
  if (minutes < 1) return "adesso";
  if (minutes < 90) return Math.round(minutes) + " min fa";
  if (minutes < 60 * 48) return fmtNum(minutes / 60, 1) + " ore fa";
  return fmtNum(minutes / 1440, 1) + " giorni fa";
}

// Testo del tooltip dello stato: identico in tabella e sulla mappa, cosi' la stessa
// informazione non puo' essere raccontata in due modi diversi.
function stateTip(ps, r, now) {
  const st = STATUS[ps.key];
  const age = ps.ageMin != null ? fmtAge(ps.ageMin) : "";
  const ageSuffix = age ? " (campione di " + age + ")" : "";
  if (ps.reason === "covered") {
    return (
      "NSB notturna fisicamente impossibile: al momento del campione il Sole era a " +
      Math.round(ps.elevSample) +
      "° e il cielo naturale non può superare " +
      fmtNum(plausibleMaxMag(ps.elevSample), 1) +
      " mag/arcsec² (misurati " +
      fmtNum(magOf(r.reading), 2) +
      "). Sensore coperto, cupola chiusa o guasto: misura inattendibile." +
      ageSuffix
    );
  }
  if (ps.reason === "day-at-night") {
    return (
      "Misura diurna con il Sole già ben sotto l'orizzonte (" +
      Math.round(ps.elevSample) +
      "° al campione): illuminazione artificiale sul sensore o sensore guasto. Misura inattendibile." +
      ageSuffix
    );
  }
  if (ps.reason === "invalid") {
    return (
      "Il sensore trasmette solo valori nulli o azzerati: nessuna misura del cielo, sensore guasto." +
      ageSuffix
    );
  }
  if (ps.reason === "stale") {
    return (
      "Ultimo campione di " +
      age +
      ": troppo vecchio per descrivere le condizioni attuali del cielo."
    );
  }
  if (r.reading && r.reading.tstamp) {
    return st.title + ageSuffix;
  }
  if (ps.transmitting) {
    return st.title + ": in trasmissione ma senza lettura recente";
  }
  if (!r.emitting) {
    return st.title + ": assente dalla lista dei fotometri in trasmissione";
  }
  return st.title;
}

function fact(k, v) {
  return `<span class="k">${k}</span><span class="v">${dash(v)}</span>`;
}

function grafanaSrc(name) {
  return (
    GRAFANA +
    "/render/d-solo/datasheet_" +
    encodeURIComponent(name) +
    "/" +
    encodeURIComponent(name) +
    "?orgId=1&panelId=4&from=now-7d&to=now&width=1200&height=380&theme=dark&tz=Europe%2FRome"
  );
}

function expandHtml(r, now) {
  const rd = r.reading || {};
  const zp = zpOf(rd, r);
  const when = now || new Date();
  const ps = photoState(r, when);
  const st = STATUS[ps.key];
  // Informazioni di contorno (compaiono solo espandendo la riga): possono anche
  // spiegare perche' una lettura notturna e' sospetta a quell'ora.
  const sunNow = r.geolocated ? sunElevationDeg(r.lat, r.lon, when) : null;
  const sunRow = r.geolocated
    ? fact("Sole in questo momento", fmtNum(sunNow, 1) + "°") +
      fact(
        "Sole all'istante del campione",
        ps.elevSample != null ? fmtNum(ps.elevSample, 1) + "°" : "-"
      ) +
      fact("Alba / tramonto locali", sunTimesText(r.lat, r.lon, when, r.tz))
    : "";
  const noteRow = ps.reason === "covered"
    ? fact(
        "Nota",
        "NSB notturna fisicamente impossibile (Sole a " +
          Math.round(ps.elevSample) +
          "° al campione, tetto " +
          fmtNum(plausibleMaxMag(ps.elevSample), 1) +
          " mag/arcsec²): sensore coperto, cupola chiusa o guasto?"
      )
    : ps.reason === "day-at-night"
    ? fact(
        "Nota",
        "Misura diurna con il Sole già sotto l'orizzonte (" +
          Math.round(ps.elevSample) +
          "° al campione): illuminazione artificiale sul sensore o guasto?"
      )
    : ps.reason === "invalid"
    ? fact("Nota", "Il sensore trasmette solo valori nulli o azzerati: nessuna misura del cielo")
    : ps.reason === "stale"
    ? fact(
        "Nota",
        "Ultimo campione troppo vecchio (" +
          fmtAge(ps.ageMin) +
          "): non descrive le condizioni attuali"
      )
    : "";
  const grafana = r.tessName
    ? `<div class="grafana-wrap" data-name="${r.tessName}">
        <div class="grafana-wait"><span class="spinner"></span><span class="wait-label">Caricamento del pannello Grafana</span></div>
        <img class="grafana" alt="Grafana ${r.tessName}" src="${grafanaSrc(r.tessName)}">
      </div>`
    : "";
  const f = (key) => {
    const ch = rd[key];
    if (!ch) return fact(key + " mag / freq / zp", "-");
    return fact(
      key + " mag / freq / zp",
      [fmtNum(ch.mag, 2), ch.freq != null ? fmtNum(ch.freq, 3) + " Hz" : "-", dash(ch.zp)].join(" | ")
    );
  };
  return `<tr class="expand" data-exp="${r.key}"><td colspan="15">
    <div class="expand-body">
      ${grafana}
      <div class="facts">
        ${fact("Stato", st.label)}
        ${sunRow}
        ${noteRow}
        ${fact("Modello", rd.model || "-")}
        ${fact("Fotometro", r.tessName || "-")}
        ${fact("Filtro", r.filters || "-")}
        ${fact("Periodo", r.period != null ? r.period + " s" : "-")}
        ${fact("Latitudine", r.lat != null ? r.lat.toFixed(5) : "-")}
        ${fact("Longitudine", r.lon != null ? r.lon.toFixed(5) : "-")}
        ${fact("Quota", r.quota != null ? r.quota + " m" : "-")}
        ${fact("Zero point", zp != null ? zp : "-")}
        ${fact("NSB", fmtMag(rd, ps))}
        ${fact("Frequenza", rd.freq != null ? fmtNum(rd.freq, 2) + " Hz" : "-")}
        ${fact("T ambiente", rd.tamb != null ? fmtNum(rd.tamb, 2) + " °C" : "-")}
        ${fact("T cielo IR", rd.tsky != null ? fmtNum(rd.tsky, 2) + " °C" : "-")}
        ${fact("Radio", rd.wdBm != null ? rd.wdBm + " dBm" : "-")}
        ${fact("seq", rd.seq != null ? rd.seq : "-")}
        ${fact("rev", rd.rev != null ? rd.rev : "-")}
        ${fact("ain", rd.ain != null ? rd.ain : "-")}
        ${fact("hash", rd.hash != null ? rd.hash : "-")}
        ${fact("Campione UTC", rd.tstamp || "-")}
        ${fact("Età campione", fmtAge(ps.ageMin))}
        ${f("F1")}${f("F2")}${f("F3")}${f("F4")}
      </div>
    </div>
  </td></tr>`;
}

function bindGrafana(root) {
  (root || document).querySelectorAll(".grafana-wrap img.grafana").forEach((img) => {
    const box = img.parentElement;
    const done = () => box.classList.add("ready");
    const fail = () => {
      box.classList.add("fail");
      img.remove();
    };
    if (img.complete && img.naturalWidth) done();
    else if (img.complete) fail();
    else {
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", fail, { once: true });
    }
  });
}

function onRowToggle(key, fromMap) {
  const wrap = document.getElementById("table-wrap");
  const body = document.getElementById("tbody");
  const target = body.querySelector('tr[data-key="' + key + '"]');
  if (!target) return;
  const row = filtered().find((r) => r.key === key);
  if (row && row.lat != null && row.lon != null) map.panTo([row.lat, row.lon]);

  if (state.selected === key && !fromMap) {
    const exp = body.querySelector("tr.expand");
    if (exp) exp.remove();
    target.classList.remove("active");
    state.selected = null;
    return;
  }

  const prevExpand = body.querySelector("tr.expand");
  if (prevExpand) {
    const above = !!(prevExpand.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING);
    const h = prevExpand.getBoundingClientRect().height;
    const prevRow = body.querySelector("tr.active");
    prevExpand.remove();
    if (prevRow) prevRow.classList.remove("active");
    if (above && wrap) wrap.scrollTop = Math.max(0, wrap.scrollTop - h);
  }

  state.selected = key;
  target.classList.add("active");
  target.insertAdjacentHTML("afterend", expandHtml(row));
  const exp = target.nextElementSibling;
  if (exp) {
    exp.addEventListener("click", (ev) => ev.stopPropagation());
    bindGrafana(exp);
  }

  if (fromMap && wrap) {
    const rel = target.getBoundingClientRect().top - wrap.getBoundingClientRect().top;
    wrap.scrollTop += rel - 8;
  }
}

// Le due colonne di testo si stringono sul contenuto piu' lungo DELLA VISTA corrente
// (citta' e nomi dei nodi cambiano molto fra Abruzzo e rete STARS4ALL): cosi' i dati
// numerici restano attaccati al luogo senza spazio sprecato. Il tetto evita che un
// nome lunghissimo (es. "Puerto Williams, Region de Magallanes...") allarghi la tabella:
// oltre il tetto il testo va a capo.
// Tetto oltre il quale il testo va a capo invece di allargare la tabella.
const TEXT_COL_MAX = { nodo: 240, luogo: 240 };
// Minimo tecnico assoluto: sotto questo la colonna non scende mai.
const TEXT_COL_MIN = { nodo: 62, luogo: 96 };

function fitTextColumns(rows) {
  const cols = document.querySelectorAll(".grid colgroup col");
  if (cols.length < 2) return;
  const table = document.querySelector(".grid");
  const wrap = document.getElementById("table-wrap");
  // Misura con canvas; se non disponibile si stima sul numero di caratteri: alla peggio
  // le colonne sono leggermente piu' larghe, mai tagliate.
  const ctx =
    fitTextColumns.ctx !== undefined
      ? fitTextColumns.ctx
      : (fitTextColumns.ctx = (() => {
          try {
            return document.createElement("canvas").getContext("2d");
          } catch (_) {
            return null;
          }
        })());
  const width = (text, font) => {
    if (!ctx) return String(text).length * 7;
    ctx.font = font;
    return ctx.measureText(text).width;
  };
  const font = "500 13px Inter, sans-serif";
  const PAD = 26; // padding della cella sui due lati + bordo

  const misura = (items) => {
    let maxTesto = 0;
    let maxParola = 0;
    items.forEach((t) => {
      const testo = t || "";
      maxTesto = Math.max(maxTesto, width(testo, font));
      // I browser possono andare a capo dopo i trattini normali (-): il pavimento e'
      // quindi il segmento piu' lungo, non la parola intera. Nomi come
      // "l'Ile-Bonaventure-et-du-Rocher-Perce" non allargano piu' la colonna.
      testo.split(/\s+/).forEach((parola) => {
        if (!parola) return;
        // Il pavimento e' il segmento piu' lungo separabile: i browser vanno a capo dopo
        // i trattini, quindi "Saint-Bruno-de-Montarville" non deve allargare la colonna.
        const pezzi = parola.split("-").filter(Boolean);
        (pezzi.length > 1 ? pezzi : [parola]).forEach((pezzo) => {
          maxParola = Math.max(maxParola, width(pezzo, font));
        });
      });
    });
    return { testo: Math.ceil(maxTesto) + PAD, parola: Math.ceil(maxParola) + PAD };
  };

  const nodo = misura(rows.map((r) => r.title));
  const luogo = misura(rows.map((r) => (r.place || "-") + (r.geolocated ? "" : "  fuori mappa")));
  // "hug" = larghezza che mostra il testo piu' lungo su una riga sola, zero spazio vuoto.
  const hug = [
    Math.min(TEXT_COL_MAX.nodo, nodo.testo),
    Math.min(TEXT_COL_MAX.luogo, luogo.testo)
  ];
  // "floor" = minimo che non spezza mai una parola a meta'.
  const floor = [
    Math.max(TEXT_COL_MIN.nodo, nodo.parola),
    Math.max(TEXT_COL_MIN.luogo, luogo.parola)
  ];

  // Prima si mettono le due colonne al minimo, poi si misura la larghezza NATURALE
  // della tabella (che dipende da tutte le righe: "37.618,0 Hz", "02/10/26, 14:43"...).
  // Lo spazio che avanza viene dato alle due colonne di testo, fino a mostrare il loro
  // contenuto su una riga sola. Cosi' niente spazio vuoto e nessuna colonna numerica
  // spinta fuori dal pannello.
  cols[0].style.width = floor[0] + "px";
  cols[1].style.width = floor[1] + "px";
  // per misurare la larghezza NATURALE la tabella non deve essere stirata al 100%
  const larghezzaTabella = table ? table.style.width : "";
  if (table) table.style.width = "auto";
  const naturale = wrap ? wrap.scrollWidth : 0;
  if (table) table.style.width = larghezzaTabella;
  const avanzo = wrap ? Math.max(0, wrap.clientWidth - naturale - 4) : 0;
  const cap = [Math.max(0, hug[0] - floor[0]), Math.max(0, hug[1] - floor[1])];
  const totale = cap[0] + cap[1];
  let rem = avanzo;
  let e0 = totale ? Math.min(cap[0], Math.round((rem * cap[0]) / totale)) : 0;
  let e1 = Math.min(cap[1], rem - e0);
  rem -= e0 + e1;
  if (rem > 0) { const extra = Math.min(cap[0] - e0, rem); e0 += extra; rem -= extra; }
  if (rem > 0) { const extra = Math.min(cap[1] - e1, rem); e1 += extra; }
  const w0 = floor[0] + e0;
  const w1 = floor[1] + e1;
  cols[0].style.width = w0 + "px";
  cols[1].style.width = w1 + "px";
  if (table) {
    table.style.setProperty("--w-nodo", w0 + "px");
    table.style.setProperty("--w-luogo", w1 + "px");
  }
}

function render() {
  const wrap = document.getElementById("table-wrap");
  const scroll = wrap ? wrap.scrollTop : 0;
  const now = new Date();
  const rows = filtered();
  fitTextColumns(rows);
  const noMap = rows.filter((r) => !r.geolocated).length;
  const hiddenCount = queryRows().length - rows.length;
  document.getElementById("list-title").textContent =
    VIEWS[state.view].title +
    " | " +
    plural(rows.length, "nodo", "nodi") +
    (noMap ? " · " + noMap + " fuori mappa" : "") +
    (hiddenCount ? " · " + hiddenCount + " inattivi nascosti" : "");
  const body = document.getElementById("tbody");
  body.innerHTML = rows
    .map((r) => {
      const rd = r.reading;
      const ps = photoState(r, now);
      const st = STATUS[ps.key];
      const cls = "status " + st.cls;
      const stTitle = stateTip(ps, r, now);
      const zp = zpOf(rd, r);
      const open = state.selected === r.key;
      return `<tr class="${open ? "active" : ""}" data-key="${r.key}">
        <td><div class="clip clip--nodo"><strong>${r.title}</strong></div><div class="muted clip-sub">${rd && rd.model ? rd.model : "-"}</div></td>
        <td><div class="clip">${r.place || "-"}${r.geolocated ? "" : ' <span class="tag">fuori mappa</span>'}</div><div class="muted clip-sub">${r.subtitle || "-"}</div></td>
        <td class="${cls}" title="${stTitle}">${st.label}</td>
        <td class="num${ps.key === "guasto" ? " anomaly" : ""}" title="${
          ps.key === "guasto" ? stTitle : ""
        }">${fmtMag(rd, ps)}${ps.key === "guasto" ? " (guasto)" : ""}</td>
        <td class="num">${chMag(rd, "F1")}</td>
        <td class="num">${chMag(rd, "F2")}</td>
        <td class="num">${chMag(rd, "F3")}</td>
        <td class="num">${chMag(rd, "F4")}</td>
        <td class="num">${rd && rd.tamb != null ? fmtNum(rd.tamb, 1) + " °C" : "-"}</td>
        <td class="num">${rd && rd.tsky != null ? fmtNum(rd.tsky, 1) + " °C" : "-"}</td>
        <td class="num">${rd && rd.freq != null ? fmtNum(rd.freq, 1) + " Hz" : "-"}</td>
        <td class="num">${zp != null ? zp : "-"}</td>
        <td class="num">${rd && rd.seq != null ? rd.seq : "-"}</td>
        <td class="num">${rd && rd.wdBm != null ? rd.wdBm + " dBm" : "-"}</td>
        <td class="muted">${rd ? fmtTime(rd.tstamp) : "-"}</td>
      </tr>${open ? expandHtml(r) : ""}`;
    })
    .join("");
  bindGrafana(body);
  if (wrap) wrap.scrollTop = scroll;

  layer.clearLayers();
  const bounds = [];
  rows.forEach((r) => {
    if (r.lat == null || r.lon == null) return;
    const ps = photoState(r, now);
    const st = STATUS[ps.key];
    const m = L.circleMarker([r.lat, r.lon], {
      radius: r.kind === "tess" ? 6 : 8,
      color: "#071422",
      weight: 2,
      fillColor: st.color,
      fillOpacity: 0.95
    });
    m.on("click", () => onRowToggle(r.key, true));
    const tip =
      r.title +
      " | " +
      st.label +
      (r.reading ? " | " + fmtNum(magOf(r.reading), 2) + " mag/arcsec²" : "");
    m.bindTooltip(tip, { direction: "top" });
    m.addTo(layer);
    bounds.push([r.lat, r.lon]);
  });
  sizeMap();
  if (bounds.length && !state.selected) {
    if (state.view === "rete") map.setView([30, 10], 3);
    else map.fitBounds(bounds, { padding: [28, 28], maxZoom: VIEWS[state.view].maxZoom });
  }
}

function namesToRefresh() {
  const names = new Set();
  if (state.view === "abruzzo" || state.view === "umbria") {
    const sites = state.view === "abruzzo" ? state.abruzzo : state.umbria;
    sites.forEach((s) => {
      if (s.tessName) names.add(s.tessName);
    });
    return [...names];
  }
  if (state.view === "italia") {
    state.photometers.filter(isItaly).forEach((p) => names.add(p.name));
    return [...names];
  }
  // Vista rete: centinaia di nodi, quindi le richieste per ciclo sono limitate e si
  // ruota fra tutti i nodi in trasmissione (round-robin), invece di interrogare
  // sempre gli stessi.
  const emitting = state.photometers.filter((p) => p.emitting);
  const budget = 60;
  if (!emitting.length) return [];
  const start = state.rr % emitting.length; // primo ciclo: si parte dal primo nodo
  for (let i = 0; i < Math.min(budget, emitting.length); i++) {
    names.add(emitting[(start + i) % emitting.length].name);
  }
  state.rr = (start + budget) % emitting.length;
  return [...names];
}

async function refreshReadings() {
  const names = namesToRefresh();
  if (!names.length) {
    updateKpis();
    render();
    return;
  }
  const chunk = 12;
  let anyLive = false;
  for (let i = 0; i < names.length; i += chunk) {
    const slice = names.slice(i, i + chunk);
    const results = await Promise.allSettled(slice.map((n) => fetchLatest(n)));
    results.forEach((res, j) => {
      if (res.status === "fulfilled" && res.value) {
        state.readings[slice[j]] = res.value;
        anyLive = true;
      }
    });
    state.fetchedAt = new Date().toISOString();
    // "live" solo se almeno una lettura e' arrivata davvero: se la rete e' assente
    // i dati mostrati restano quelli dello snapshot e il KPI deve dirlo.
    if (anyLive) state.live = true;
    updateKpis();
    render();
  }
}

async function loadCatalog() {
  const [abruzzo, umbria] = await Promise.all([
    loadJSON("data/abruzzo-sites.json"),
    loadJSON("data/umbria-sites.json")
  ]);
  state.abruzzo = abruzzo.sites || [];
  state.umbria = umbria.sites || [];
  try {
    const snap = await loadJSON("data/latest.json");
    state.photometers = snap.photometers || [];
    state.fetchedAt = snap.fetchedAt;
  } catch (_) {}
  try {
    const rd = await loadJSON("data/readings.json");
    state.readings = rd.readings || {};
    if (rd.fetchedAt) state.fetchedAt = rd.fetchedAt;
  } catch (_) {}
  try {
    const [photometers, emitting] = await Promise.all([
      loadJSON(API + "/photometers"),
      loadJSON(API + "/photometers_emitting")
    ]);
    state.photometers = compactFromApi(photometers, new Set(emitting));
    state.fetchedAt = new Date().toISOString();
    state.live = true;
  } catch (err) {
    console.warn("API catalogo non raggiungibile.", err);
  }
  updateKpis();
  render();
  await refreshReadings();
}

async function refreshEmitting() {
  try {
    const emitting = await loadJSON(API + "/photometers_emitting");
    applyEmitting(emitting);
    state.live = true;
  } catch (_) {}
  await refreshReadings();
}

document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.view = btn.dataset.view;
    state.selected = null;
    render();
    refreshReadings();
  });
});

document.getElementById("tbody").addEventListener("click", (e) => {
  if (e.target.closest("tr.expand")) return;
  const tr = e.target.closest("tr[data-key]");
  if (!tr) return;
  onRowToggle(tr.dataset.key, false);
});

document.getElementById("q").addEventListener("input", (e) => {
  state.query = e.target.value;
  render();
});

document.getElementById("toggle-inactive").addEventListener("change", (e) => {
  state.showInactive = e.target.checked;
  render();
});

loadCatalog();
setInterval(refreshEmitting, 60 * 1000);
setInterval(loadCatalog, 15 * 60 * 1000);
