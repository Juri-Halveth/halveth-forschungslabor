using System.Diagnostics;
using System.Globalization;
using System.Text;

namespace Halveth.TemporalClock;

internal static class Program
{
    private static int Main(string[] args)
    {
        Console.OutputEncoding = Encoding.UTF8;
        if (args.Contains("--self-test", StringComparer.Ordinal))
        {
            return ClockSelfTest.Run();
        }

        if (args.Contains("--snapshot", StringComparer.Ordinal))
        {
            var now = ParseTime(args, "--time") ?? DateTimeOffset.Now;
            var start = ParseTime(args, "--start") ?? now.AddSeconds(-42);
            var width = ParseInt(args, "--width") ?? 110;
            var height = ParseInt(args, "--height") ?? 24;
            var ansi = !args.Contains("--no-color", StringComparer.Ordinal);
            Console.Write(ClockRenderer.Render(now, start, width, height, ansi));
            return 0;
        }

        if (Console.IsOutputRedirected)
        {
            Console.Error.WriteLine("Interactive clock needs a terminal. Use --snapshot for redirected output.");
            return 2;
        }

        var t0 = DateTimeOffset.Now;
        Console.CursorVisible = false;
        try
        {
            Console.Write("\u001b[2J\u001b[?25l");
            while (true)
            {
                var tick = Stopwatch.StartNew();
                var width = Math.Max(24, Console.WindowWidth);
                var height = Math.Max(8, Console.WindowHeight);
                var frame = ClockRenderer.Render(DateTimeOffset.Now, t0, width, height, true);
                Console.Write("\u001b[H");
                Console.Write(frame);
                Console.Write("\u001b[J");

                if (!Console.IsInputRedirected && Console.KeyAvailable)
                {
                    var key = Console.ReadKey(intercept: true);
                    if (key.Key is ConsoleKey.Q or ConsoleKey.Escape)
                    {
                        break;
                    }
                }

                tick.Stop();
                Thread.Sleep(Math.Max(10, 100 - (int)tick.ElapsedMilliseconds));
            }
        }
        finally
        {
            Console.Write("\u001b[0m\u001b[?25h");
            Console.CursorVisible = true;
        }
        return 0;
    }

    private static DateTimeOffset? ParseTime(string[] args, string name)
    {
        var value = Option(args, name);
        if (value is null) return null;
        if (!DateTimeOffset.TryParse(value, CultureInfo.InvariantCulture,
                DateTimeStyles.RoundtripKind, out var parsed))
        {
            throw new ArgumentException("Invalid " + name + ": " + value);
        }
        return parsed;
    }

    private static int? ParseInt(string[] args, string name)
    {
        var value = Option(args, name);
        if (value is null) return null;
        if (!int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed))
        {
            throw new ArgumentException("Invalid " + name + ": " + value);
        }
        return parsed;
    }

    private static string? Option(string[] args, string name)
    {
        var index = Array.IndexOf(args, name);
        if (index < 0) return null;
        if (index + 1 >= args.Length) throw new ArgumentException("Missing value for " + name);
        return args[index + 1];
    }
}
