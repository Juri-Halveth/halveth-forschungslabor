// SPDX-License-Identifier: MIT
export const CATALOG_VERSION = '2026-10-24.1';
export const SOURCES = Object.freeze([
  {id:'node-october',publisher:'Node.js',published:'2026-10-21',url:'https://nodejs.org/en/blog/vulnerability/october-2026-security-releases'},
  {id:'node-24',publisher:'Node.js',published:'2026-10-21',url:'https://nodejs.org/en/blog/release/v24.22.1'},
  {id:'brotli',publisher:'Google Brotli',published:'2026-10-21',url:'https://github.com/google/brotli/releases/tag/v1.2.1'},
  {id:'bun',publisher:'Bun',published:'2026-10-23',url:'https://github.com/oven-sh/bun/security/advisories/GHSA-663w-cv8g-jj2p'},
  {id:'burp',publisher:'PortSwigger',url:'https://portswigger.net/burp/documentation/desktop/getting-started/setting-target-scope'},
  {id:'wstg',publisher:'OWASP',url:'https://owasp.org/www-project-web-security-testing-guide/stable/'},
]);
export const NODE_FLOORS = Object.freeze({22:'22.23.4',24:'24.22.1',26:'26.12.1'});
export const ADVISORIES = Object.freeze([
  {id:'CVE-2026-105482',area:'DNS',severity:'High',lines:[22,24,26],title:'NUL beendet einen Hostnamen zu früh.',lesson:'Validierten Namen und später verwendeten Namen getrennt vergleichen.'},
  {id:'CVE-2026-105483',area:'TLS',severity:'High',lines:[24,26],title:'Unicode-Ziffern verändern die IP-Klassifikation.',lesson:'Darstellung, kanonische IP und Zertifikatsidentität zusammen prüfen.'},
  {id:'CVE-2026-106069',area:'TLS',severity:'High',lines:[22,24,26],title:'URL-Parser und Resolver lesen eine IPv4-Adresse verschieden.',lesson:'Parser-Ergebnisse sind eigene Beobachtungen; der verbundene Endpunkt braucht einen eigenen Beleg.'},
  {id:'CVE-2026-111497',area:'Brotli',severity:'High',lines:[22,24,26],title:'Formatfehler wird als fehlende Eingabe behandelt.',lesson:'Ein permanenter Fehler beendet die Verarbeitung. Speicherbeschädigung bleibt außerhalb dieses Lehrmodells.'},
  {id:'CVE-2026-105481',area:'HTTP',severity:'Medium',lines:[22,24,26],title:'Eine frühe Antwort landet beim späteren Request.',lesson:'Antwort und zugehörigen Request an derselben Verbindung binden.'},
  {id:'CVE-2026-106072',area:'TLS',severity:'Medium',lines:[22,24,26],title:'DNS-Zertifikatsnamen authentisieren uneindeutige IP-Schreibweisen.',lesson:'DNS-Namen und IP-SANs sind verschiedene Identitätstypen.'},
  {id:'CVE-2026-106074',area:'Snapshots',severity:'Medium',lines:[22,24,26],title:'Vorbereitete Zufalls-Caches werden in neue Prozesse übernommen.',lesson:'Neu gestartete Prozesse und ihre Entropiequellen separat beobachten.'},
  {id:'CVE-2026-106070',area:'ZIP',severity:'Low',lines:[26],title:'Ein abgewiesener Header bleibt im Cache verwendbar.',lesson:'Nach einer Ablehnung müssen spätere Verbraucher den ungültigen Zustand erkennen.'},
  {id:'CVE-2026-106071',area:'Berechtigungen',severity:'Low',lines:[26],title:'Ein Wildcard-Präfix erlaubt zu kurze Pfade.',lesson:'Positive und negative Pfadbeispiele gegen dieselbe Regel prüfen.'},
  {id:'CVE-2026-106073',area:'Berechtigungen',severity:'Low',lines:[22,24,26],title:'Eine Dateisystemfunktion überspringt eine Berechtigungsprüfung.',lesson:'Jeder gleichwirkende API-Pfad braucht eine eigene Zugriffskontrolle.'},
].map(a=>Object.freeze({...a,source:'node-october'})));

export const PRACTICE = Object.freeze([
  {id:'runtime',title:'Laufzeiten prüfen',kind:'VERSIONSEINGABE',purpose:'Den gemeldeten Stand mit dem datierten Patchkatalog vergleichen.'},
  {id:'identity',title:'Parser vergleichen',kind:'BROWSER-API',purpose:'Originaltext und tatsächlich berechnete URL-Identität nebeneinander ansehen.'},
  {id:'decoder',title:'Fehlerzustände trennen',kind:'LOKALES MODELL',purpose:'Unvollständige Eingabe, Erfolg und Formatfehler getrennt behandeln.'},
  {id:'session',title:'Berechtigungen gegenprüfen',kind:'SYNTHETISCHE KONTEN',purpose:'Angemeldetes Subjekt und geladenes Objekt vor einer Freigabe abgleichen.'},
  {id:'budget',title:'Anfragebudget testen',kind:'ZEITMODELL',purpose:'Kapazität, Nachfüllrate und Ablehnungen ohne Netzlast berechnen.'},
  {id:'triage',title:'Text statisch sichten',kind:'DATENANALYSE',purpose:'Auffällige Codeverweise finden und mit einem harmlosen Gegenbeispiel einordnen.'},
]);
