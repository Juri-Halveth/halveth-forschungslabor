/** Curated public labels only. The full local inventory stays outside Git. */
export const RELICS = Object.freeze([
  {id:'disu', stage:0, x:12, y:20, label:'BIG BANG', kind:'Lokales Modell', signal:'Zustand · Gültigkeit · Recovery', detail:'DISU beschreibt getrennte Zustandsachsen und einen lokalen Ein-Prozess-Prototyp. Der historische README nennt P5 Variante A. Dieser Rundgang hat den Prototyp nicht neu ausgeführt.', evidence:'SOURCE_REPORTED', tone:'amber'},
  {id:'atlas', stage:0, x:12, y:48, label:'ATLAS', kind:'Lokaler Quellcode', signal:'Text hat eine Adresse', detail:'Der lokale Status führt Text-Extraktion, Segmentierung und gebundene Offsets als gebaute Teile. Ein publizierter Adapter zum Forschungslabor ist hier noch nicht belegt.', evidence:'SOURCE_REPORTED', tone:'cyan'},
  {id:'seal', stage:0, x:26, y:75, label:'SEAL', kind:'Lokaler Prototyp', signal:'Übergabe · Vertrauen', detail:'Das Protokollmodell ist zellweise aufgebaut. Der eigene Status nennt einen Krypto-Testdouble und grenzt Produktfähigkeit ab.', evidence:'SOURCE_REPORTED', tone:'violet'},
  {id:'defender', stage:0, x:31, y:35, label:'DEFENDER', kind:'Lokales Forschungsprojekt', signal:'Darf eine Änderung wirken?', detail:'Der README trennt getestete Projektions- und Validierungsbausteine von einer noch fehlenden realen Sensor- oder Systemwirkung.', evidence:'SOURCE_REPORTED', tone:'red'},
  {id:'remote', stage:0, x:9, y:83, label:'REMOTE', kind:'Lokaler Prototyp', signal:'Identität · Organisation', detail:'Lokale Identitäts- und Vertragstests sind dokumentiert; eine echte Organisationsautorität und ein Root-Key sind im Status noch offen.', evidence:'SOURCE_REPORTED', tone:'cyan'},
  {id:'anadysis', stage:0, x:43, y:13, label:'ANÁDYSIS', kind:'Lokales Modell', signal:'Emergenz im dynamischen Graph', detail:'Der Entwurf bindet spektrale und Wachstumsdimension an Schätzer, Skalen und Nullmodelle. Historisch gibt es Testfixture-Ticks, aber keine gestartete Hauptwelt; Emergenzschwellen bleiben offen. Die Kartenposition ist nur Layout, keine Koordinate des Modells.', evidence:'SOURCE_REPORTED', tone:'violet'},
  {id:'entity', stage:0, x:51, y:53, label:'ENTITY NETWORK', kind:'Lokaler Konzeptentwurf', signal:'Wirkung über Zeit und Kontext', detail:'Die Akten unterscheiden fortwirkende Effekte nach Autoritätswechsel von Effekten, die in einen anderen Ausführungskontext geraten. Die beiden Begriffe sind noch keine installierte Sicherheitsfunktion.', evidence:'SOURCE_BOUND_CONCEPT', tone:'amber'},
  {id:'vcc2', stage:1, x:37, y:82, label:'VCC 2.0', kind:'Exakte Textfamilie', signal:'Fünf Quellen · identische Bytes', detail:'Ein gemeinsames Master-Dokument liegt byteidentisch in Big Bang, Atlas, SEAL, DEFENDER und REMOTE. Das bindet einen geteilten Textstand, keine Gleichheit ihres Codes oder Laufzeitverhaltens.', evidence:'LOCAL_SHA256_EQUAL', tone:'gold'},
  {id:'meta', stage:1, x:58, y:82, label:'META-LOGIK', kind:'Exakte Textfamilie', signal:'Vier Quellen · identische Bytes', detail:'Eine zweite Konstitutionsfassung liegt byteidentisch in Atlas, SEAL, DEFENDER und REMOTE. Jeder Projektstatus und jede Implementierung bleiben eigenständig.', evidence:'LOCAL_SHA256_EQUAL', tone:'gold'},
  {id:'focus', stage:2, x:78, y:17, label:'FOCUS KERNEL', kind:'Öffentlicher Code', signal:'Ziele und Vorschläge getrennt', detail:'Der öffentliche Kern hält bestätigte Ziele, Vorschläge und Prüfergebnisse auseinander. Die Beziehung zu älteren Zustandsmodellen ist eine Modellanalogie.', evidence:'PUBLIC_SOURCE', tone:'cyan', href:'https://github.com/Juri-Halveth/halveth-forschungslabor/tree/main/branches/focus-kernel'},
  {id:'fegefeuer', stage:2, x:80, y:50, label:'EREIGNISKERN', kind:'Öffentlicher Code', signal:'Herkunft · HOLD · Änderung', detail:'Ein lokaler In-Memory-Kern bindet Ereignisse und hält offene Kandidaten. Das neue Effektlabor ergänzt eine Frage nach Zeit und Scope, ohne den bestehenden Kern zu ändern.', evidence:'PUBLIC_SOURCE', tone:'red', href:'https://github.com/Juri-Halveth/halveth-forschungslabor/tree/main/branches/fegefeuer-provenance-transducer'},
  {id:'sourceframe', stage:2, x:82, y:80, label:'QUELLSPAN', kind:'Öffentlicher Code', signal:'Zeichen an Original binden', detail:'Die öffentliche Span-Logik bindet Texte an präzise Eingabegrenzen. Eine spätere Atlas-Anbindung wäre eine neue, gesondert zu prüfende Typbrücke.', evidence:'PUBLIC_SOURCE', tone:'violet', href:'https://github.com/Juri-Halveth/halveth-forschungslabor/blob/main/scripts/symbol-source-frame.mjs'},
]);

export const RELATIONS = Object.freeze([
  {from:'disu', to:'vcc2', type:'EXACT_SOURCE_TEXT', note:'Gleiche Master-Datei, nicht gleicher Programmcode.'},
  {from:'atlas', to:'vcc2', type:'EXACT_SOURCE_TEXT', note:'Gleiche Master-Datei, nicht gleicher Programmcode.'},
  {from:'seal', to:'vcc2', type:'EXACT_SOURCE_TEXT', note:'Gleiche Master-Datei, nicht gleicher Programmcode.'},
  {from:'defender', to:'vcc2', type:'EXACT_SOURCE_TEXT', note:'Gleiche Master-Datei, nicht gleicher Programmcode.'},
  {from:'remote', to:'vcc2', type:'EXACT_SOURCE_TEXT', note:'Gleiche Master-Datei, nicht gleicher Programmcode.'},
  {from:'atlas', to:'meta', type:'EXACT_SOURCE_TEXT', note:'Gleiche Meta-Logik-Fassung.'},
  {from:'seal', to:'meta', type:'EXACT_SOURCE_TEXT', note:'Gleiche Meta-Logik-Fassung.'},
  {from:'defender', to:'meta', type:'EXACT_SOURCE_TEXT', note:'Gleiche Meta-Logik-Fassung.'},
  {from:'remote', to:'meta', type:'EXACT_SOURCE_TEXT', note:'Gleiche Meta-Logik-Fassung.'},
  {from:'disu', to:'focus', type:'MODEL_ANALOGY', note:'Getrennte Zustandsbegriffe; kein Codeimport.'},
  {from:'entity', to:'fegefeuer', type:'NEW_RESEARCH_BRIDGE', note:'Effekt-Autorität über Zeit und Kontext als neue synthetische Frage.'},
  {from:'atlas', to:'sourceframe', type:'POSSIBLE_TYPE_BRIDGE', note:'Quelladressen könnten gekoppelt werden; Adapter fehlt.'},
  {from:'anadysis', to:'fegefeuer', type:'STRUCTURAL_ANALOGY', note:'Ereignis und Zustandsübergang; unterschiedliche Modelle.'},
]);
