# Vom Signal zum Bild

Projektleitung und Forschungsrichtung: **Juri / HALVETH**. Entwicklung mit KI-Unterstützung. Version 1.0.0, deterministisches Softwaremodell.

**Frage:** Welche Änderung an Kanal oder Decoder verändert die Rekonstruktion derselben Nachricht?

## Modell und Gegenproben

Ein Bild enthält 64 binäre Werte. Pro Wert erzeugt der Sender 32 Samples einer Cosinus-Trägerwelle mit zwei Zyklen pro Symbol. Der Wert bestimmt das Vorzeichen. Dieses vereinfachte Modell folgt dem Prinzip binärer Phasenumtastung. Es implementiert weder WLAN noch einen physischen Funkkanal.

Der Kanal fügt gleichverteilte, mit festem Seed reproduzierbare Störwerte hinzu. Bei Unterbrechung liefert er ausschließlich Nullen. Die Störamplitude ist dimensionslos: keine Feldstärke, Schallintensität oder biologische Dosis.

Der Empfänger erhält ausschließlich Samples und seine Moduseinstellung. Er korreliert jeden Symbolblock mit einer Referenzwelle. Unter der Betragsschwelle 0,25 bleibt die Entscheidung offen. Erst anschließend wird gegen die Quellbits verglichen.

- **Passend:** gleiche Trägerzyklen und Bitzuordnung.
- **Vertauscht:** gleiche Samples und Signalverarbeitung, umgekehrte Vorzeichen-zu-Bit-Zuordnung.
- **Falsch abgestimmt:** drei statt zwei Trägerzyklen pro Symbol. Unter dem festgelegten Samplevertrag sind die Referenzen ohne Störung orthogonal; alle Entscheidungen bleiben offen. Das ist keine universelle Aussage über physische Empfänger.

Das Modell enthält keine Trägersynchronisation, Mehrwegeausbreitung, Paketrahmen, Fehlerkorrektur oder Authentisierung.

[SIGNAL_PLAN.json](SIGNAL_PLAN.json) legt die Vorhersagen vor der Implementierung der Versuche fest. Das ist ein lokaler Vorabplan, keine unabhängig registrierte Präregistrierung. [signal-results.json](signal-results.json) enthält zwölf Vergleiche und den getrennten Unterbrechungsfall. Modell, Plan und Generator sind über SHA-256 normalisierter UTF-8-/LF-Quelltexte gebunden.

Die vertauschte Zuordnung ist die entscheidende Gegenprobe: Ein vollständiges, eindeutig decodiertes Bild kann vollständig falsch sein. Unentschiedene Werte werden dagegen nicht als schwarze Pixel oder richtige Werte ausgegeben. Weitere Tests kontrollieren deterministisches Rauschen, explizite Eingabeablehnung und die Begrenzung einer einzelnen Quellbitänderung auf ihren Symbolblock.

Der Versuch behauptet keine allgemeine monotone Beziehung zwischen Störamplitude und Fehlerrate. Er dokumentiert eine endliche, benannte Stichprobe. Implementierung und Prüfungen gehören zum selben Entwicklungsprozess; sie sind kein unabhängiges Audit.

## Reproduktion

Vom Repository-Stamm mit Node.js 24:

```sh
node --test branches/encounter-systems/signal-model.test.mjs
node branches/encounter-systems/signal-research.mjs --check
node branches/encounter-systems/serve.mjs 8849
```

Dann `http://127.0.0.1:8849/signals.html` öffnen. Nach einer bewussten Modelländerung erzeugt `signal-research.mjs --write` neue Ergebnisse; Gegenproben bleiben gesondert erforderlich.

## Erhaltene biologische Forschungsäste

| Ast | Quellengebundener Stand | Offene Brücke / Wiederaufnahme |
|---|---|---|
| Technischer Funk | Modulation und passende Empfängertechnik vermitteln Daten. [NASA](https://www.nasa.gov/smallsat-institute/sst-soa/soa-communications/) | Eigene autorisierte Messdaten eines realen Kanals. |
| Netzhaut | PRIMA verbindet projiziertes Nahinfrarotlicht, Implantat und visuelle Funktion im beschriebenen klinischen Aufbau. [NEJM](https://www.nejm.org/doi/full/10.1056/NEJMoa2501396) | Keine biologische Messung hier; dafür wären ein eigener Forschungs-/Ethikvertrag und Fachkooperation erforderlich. |
| Visueller Kortex | Einfache Formwahrnehmungen durch zeitliche Muster implantierter Elektroden. [Beauchamp et al., Cell 2020](https://pubmed.ncbi.nlm.nih.gov/32413298/) | Individuelle Schnittstelle und Messung; kein universeller Bildcode daraus abgeleitet. |
| fMRT / Bildmodell | Rekonstruktion betrachteter Motive unter dem Mess- und Modellvertrag der Arbeit. [Takagi und Nishimoto, CVPR 2023](https://openaccess.thecvf.com/content/CVPR2023/html/Takagi_High-Resolution_Image_Reconstruction_With_Latent_Diffusion_Models_From_Human_Brain_CVPR_2023_paper.html) | Andere Personen, Messverfahren und frei vorgestellte Inhalte benötigen eigene Evidenz. |
| Pflanzen | Glutamatvermittelte Calcium-Signale im beschriebenen Abwehrsystem. [Toyota et al., Science 2018](https://pubmed.ncbi.nlm.nih.gov/30213912/) | Ein Abwehrsignal ist kein Bilddecoder; eine Umcodierung wäre eine eigene Hypothese. |
| Ultraschall | Einfache Lichterscheinungen bei einem Teil der Teilnehmenden im beschriebenen Aufbau. [Scientific Reports](https://www.nature.com/articles/srep34026) | Andere Kopplung als Funk; Reproduzierbarkeit und selektive Inhaltsübertragung bleiben eigene Fragen. |
| Optische Anzeige | Einfallendes Licht wird fokussiert und von der Netzhaut in Nervensignale umgewandelt. [National Eye Institute](https://www.nei.nih.gov/eye-health-information/healthy-vision/how-eyes-work) | Eine Displaydarstellung ist keine beobachtete Rückprojektion aus dem Gehirn auf die Augenlinse. |
| Großräumige biologische Kopplung | In dieser Untersuchung nicht beobachtet. | Empfängerstruktur, Umwandlung, Selektivität, Informationsrate, Rückmeldung und unterscheidende Gegenproben bleiben offen. |

Die hier geprüfte Kante ist die Rekonstruktion benannter Bits aus berechneten Samples. Daraus folgt weder die Realisierbarkeit noch die Widerlegung einer gesamten biologischen Kopplungshypothese. Es wird kein Gerät an Menschen, Pflanzen, Funkhardware oder Router angeschlossen.

Das Wissensregister erhält die Decoder- und Unsicherheitsregeln. GitHub prüft Quellen, Ergebnisdateien und Browserbedienung bei Änderungen. Das erzeugt Regressionswissen, kein Training von KI-Modellgewichten.

Code und HTML/CSS: MIT. Plan- und Ergebnisdaten: CC0 1.0. Neue Erläuterungen: CC BY 4.0. Verlinkte Quellen behalten ihre eigenen Rechte.
