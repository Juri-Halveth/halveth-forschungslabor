using System.Globalization;
using System.Text.RegularExpressions;

namespace Halveth.TemporalClock;

internal static class ClockSelfTest
{
    public static int Run()
    {
        var start = DateTimeOffset.Parse("2026-10-31T03:00:00+01:00", CultureInfo.InvariantCulture);
        var now = start.AddMinutes(30);
        var angles = ClockAngles.At(now, start);
        Check(Math.Abs(angles.Hour - 105) < 0.001, "hour hand includes minute progress");
        Check(Math.Abs(angles.Minute - 180) < 0.001, "minute hand points to 30");
        Check(Math.Abs(angles.Second) < 0.001, "second hand points to 0");
        Check(Math.Abs(angles.Session) < 0.001, "session hand wraps at 60 seconds");

        var frame = ClockRenderer.Render(now, start, 110, 24, false);
        var lines = frame.Split('\n');
        Check(lines.Length <= 24, "frame remains inside declared height");
        Check(lines.All(line => line.TrimEnd('\r').Length <= 109), "frame remains inside declared width");
        Check(frame.Count(ch => ch >= 0x2801 && ch <= 0x28FF) > 150, "analog face has visible geometry");
        Check(frame.Contains("03:30", StringComparison.Ordinal), "digital readout matches clock");
        Check(frame.Contains("STUNDE", StringComparison.Ordinal) &&
              frame.Contains("MINUTE", StringComparison.Ordinal) &&
              frame.Contains("SEKUNDE", StringComparison.Ordinal) &&
              frame.Contains("T+", StringComparison.Ordinal), "four lanes remain labeled");

        var moved = ClockRenderer.Render(now.AddSeconds(1), start, 110, 24, false);
        Check(!string.Equals(frame, moved, StringComparison.Ordinal), "new time moves the projection");
        var compact = ClockRenderer.Render(now, start, 32, 10, false);
        Check(compact.Split('\n').Length <= 10, "small pane keeps its height");
        Check(compact.Split('\n').All(line => line.TrimEnd('\r').Length <= 31), "small pane keeps its width");
        var colored = ClockRenderer.Render(now, start, 68, 18, true);
        var visible = Regex.Replace(colored, "\u001b\\[[0-9;]*m", "");
        Check(visible.Split('\n').All(line => line.TrimEnd('\r').Length <= 67),
            "colored frame does not wrap a medium pane");
        var longSession = ClockRenderer.Render(start.AddHours(25), start, 110, 24, false);
        Check(longSession.Contains("1d 01:00:00", StringComparison.Ordinal),
            "session duration retains the day count");
        Console.WriteLine("HALVETH CLOCK SELF-TEST: PASS");
        return 0;
    }

    private static void Check(bool condition, string name)
    {
        if (!condition) throw new InvalidOperationException("Clock self-test failed: " + name);
    }
}
