using System.Globalization;
using System.IO;
using System.Windows;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using Halveth.TemporalClock;

namespace Halveth.Chronosphere;

internal static class Program
{
    [STAThread]
    private static int Main(string[] args)
    {
        if (args.Contains("--self-test", StringComparer.Ordinal))
        {
            var t0 = DateTimeOffset.Parse("2026-10-31T14:46:09.456+01:00", CultureInfo.InvariantCulture);
            var angles = ClockAngles.At(t0.AddSeconds(80), t0);
            if (Math.Abs(angles.Hour - 83.7454666667) > 0.00001 ||
                Math.Abs(angles.Minute - 284.9456) > 0.00001 ||
                Math.Abs(angles.Second - 176.736) > 0.00001 ||
                Math.Abs(angles.Session - 120) > 0.00001)
                return 1;
            Console.WriteLine("HALVETH VECTOR CLOCK SELF-TEST: PASS");
            return 0;
        }

        var start = DateTimeOffset.Now;
        if (args.Length >= 2 && args[0] == "--snapshot")
        {
            try
            {
                var now = DateTimeOffset.Parse("2026-10-31T15:11:53.444+01:00", CultureInfo.InvariantCulture);
                start = now.AddMinutes(-1).AddSeconds(-7);
                var face = new ClockSurface(start) { Width = 380, Height = 220, FixedTime = now };
                face.Measure(new Size(380, 220));
                face.Arrange(new Rect(0, 0, 380, 220));
                face.UpdateLayout();
                var bitmap = new RenderTargetBitmap(760, 440, 192, 192, PixelFormats.Pbgra32);
                bitmap.Render(face);
                var encoder = new PngBitmapEncoder();
                encoder.Frames.Add(BitmapFrame.Create(bitmap));
                using var output = File.Create(args[1]);
                encoder.Save(output);
                return 0;
            }
            catch (Exception error)
            {
                File.WriteAllText(args[1] + ".error.txt", error.ToString());
                return 2;
            }
        }

        var application = new Application { ShutdownMode = ShutdownMode.OnMainWindowClose };
        application.Run(new ClockWindow(start));
        return 0;
    }
}
