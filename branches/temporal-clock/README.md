# HALVETH Chronosphere

Eine bewegte, lokale Uhr für das bestehende HALVETH Windows Terminal. Das große
Zifferblatt nutzt Braille-Punkte und vier farbige Zeiger. Die Shell bleibt als
zweites Feld darunter. Diese vier **Zeitkanäle** sind eine
Softwarevisualisierung, keine Behauptung über vier physikalische Dimensionen.

| Zeiger | Gebundene Größe |
| --- | --- |
| Gold | lokale Stunde einschließlich Minutenfortschritt |
| Cyan | lokale Minute einschließlich Sekundenfortschritt |
| Pink | Sekunde einschließlich Millisekunden |
| Grün | verstrichene Sitzungszeit, ein Umlauf je 60 Sekunden |

Die Quelle ist die Systemuhr. `T0` ist der Start dieser Uhrinstanz. Die
angezeigte Zeitspur enthält die letzten gezeichneten Sekundenpositionen; sie
ist eine visuelle Projektion und kein persistentes Ereignisjournal. Die Uhr
zeigt zusätzlich die UTC-Zeit, damit Quelle und Darstellung unterscheidbar
bleiben. Der Abstand zwischen alter und neuer Projektion motiviert die
Bewegung; ein einzelnes Bild belegt keine vollständige Historie.

Ein gebundener Beispielstand: `14:47:29.456` bei `T0=14:46:09.456` ergibt
Winkel ab 12 Uhr von **83,745467°** (Stunde), **284,945600°** (Minute),
**176,736000°** (Sekunde) und **120°** (Sitzung, nach 80 s). Die Uhr berechnet
die Zeiger kontinuierlich, nicht nur beim vollen Sekundenschritt. Ein Pane
von 100 × 24 Zeichen nutzt 36 × 18 Braille-Zellen für das Zifferblatt, also
72 × 72 adressierbare Punkte. Bei 32 × 10 Zeichen reduziert es sich auf
14 × 7 Zellen beziehungsweise 28 × 28 Punkte. Das ist die tatsächlich
berechnete Darstellungsauflösung, keine Messung von Raumzeit.

Die Architektur folgt der Frage aus Juris beigefügtem Forschungsdialog:
Welche **Auflösung** braucht eine Beobachtung? `ClockAngles` berechnet den
Zeitstand. `BrailleCanvas` bildet ihn auf Zellen ab. `ClockRenderer` wählt
abhängig von Fensterbreite und -höhe eine kompakte oder große Darstellung.
Das ist eine konkrete Darstellung dieser Idee im Terminal, keine
physikalische Planck-Skala.

## Bauen und prüfen

Voraussetzungen: Windows Terminal und .NET 10 SDK, für die veröffentlichte
Exe eine .NET 10 Runtime. Im Repository-Root, ohne zusätzliche NuGet-Pakete:

```powershell
dotnet run --project branches/temporal-clock/HALVETH.Clock.csproj -- --self-test
dotnet run --project branches/temporal-clock/HALVETH.Clock.csproj -- --snapshot --no-color --width 100 --height 24 --time 2026-10-31T14:47:29.456+01:00 --start 2026-10-31T14:46:09.456+01:00
dotnet publish branches/temporal-clock/HALVETH.Clock.csproj -c Release --ignore-failed-sources -p:NuGetAudit=false -o branches/temporal-clock/publish
powershell.exe -NoProfile -ExecutionPolicy Bypass -File branches/temporal-clock/Install-TemporalClock.ps1 -Launch
```

`--snapshot` liefert einen reproduzierbaren Frame. Im interaktiven Fenster
beendet `Q` oder `Esc` nur den oberen Uhrenprozess. Der Installer sichert
vorherige aktive Dateien unter `%LOCALAPPDATA%\HALVETH\backup` und ersetzt
den Starter sowie die beiden Pane-Programme. Eine bereits offene Shell wird
dadurch nicht rückwirkend umgestaltet; der neue Start zeigt die neue Uhr.
Die historische `Clock.ps1` bleibt auf dem Rechner erhalten.

Autor: Juri im Projekt HALVETH. Quellcode unter der Repository-MIT-Lizenz;
dieses Dokument unter CC BY 4.0 gemäß `LICENSES.md`.
