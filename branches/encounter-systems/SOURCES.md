# Quellen und fachliche Einordnung

Abruf: 23. Oktober 2026. Es wurden Primärquellen zur Einordnung gelesen; weder deren Programme noch deren Infrastruktur wurden untersucht. Die Implementierung dieses Moduls ist eigener, KI-unterstützt erstellter Code. Sie übernimmt keinen Quellcode aus den folgenden Veröffentlichungen.

| Quelle | Bezug zum Modul | Grenze der Übertragung |
|---|---|---|
| Jeffrey Dean und Sanjay Ghemawat: [MapReduce: Simplified Data Processing on Large Clusters](https://research.google/pubs/mapreduce-simplified-data-processing-on-large-clusters/), OSDI 2004 | Aufteilung von Arbeit, Scheduling und Umgang mit Ausfällen als etablierte Systemthemen | Unser Modell hat eine lokale Warteschlange und keinen verteilten Cluster. |
| NIST: [SP 800-162, Guide to Attribute Based Access Control](https://csrc.nist.gov/pubs/sp/800/162/upd2/final), Januar 2014, aktualisierte Fassung vom 02.08.2019 | Subjekt, Objekt, Operation und Bedingungen einer Zugriffsentscheidung | Eine lokale Checkbox und Akteurskennung sind keine echte Authentisierung und keine vollständige ABAC-Implementierung. |
| Leslie Lamport: [Time, Clocks and the Ordering of Events in a Distributed System](https://www.microsoft.com/en-us/research/publication/time-clocks-ordering-events-distributed-system/), Communications of the ACM 21(7), 1978 | Unterscheidung von Ereignisordnung und physischer Zeit | Unsere Ereignisse laufen in einem einzelnen deterministischen Modell. Wir implementieren keine verteilte Uhrensynchronisierung. |
| GitHub: [Secure use reference](https://docs.github.com/en/enterprise-cloud%40latest/actions/reference/security/secure-use) | Revisionsbindung von Actions und begrenzte Workflowrechte | Workflowhärtung allein beweist keine Anwendungssicherheit. |

Die Quellen sind fachliche Anknüpfungen, keine Anerkennung, Partnerschaft, Neuheitsprüfung oder Zertifizierung des Moduls.
