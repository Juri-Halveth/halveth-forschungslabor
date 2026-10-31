using System.Diagnostics;
using System.Globalization;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media;
using Halveth.TemporalClock;

namespace Halveth.Chronosphere;

internal sealed class ClockWindow : Window
{
    private readonly ClockSurface face;
    private readonly Stopwatch redraw = Stopwatch.StartNew();

    public ClockWindow(DateTimeOffset start)
    {
        Title = "HALVETH Chronosphere";
        Width = 380;
        Height = 220;
        MinWidth = MaxWidth = Width;
        MinHeight = MaxHeight = Height;
        ResizeMode = ResizeMode.NoResize;
        WindowStyle = WindowStyle.None;
        AllowsTransparency = true;
        Background = Brushes.Transparent;
        Topmost = true;
        ShowInTaskbar = true;
        Left = Math.Max(SystemParameters.WorkArea.Left, SystemParameters.WorkArea.Right - Width - 22);
        Top = SystemParameters.WorkArea.Top + 32;
        face = new ClockSurface(start);
        Content = face;
        face.MouseLeftButtonDown += HandleMouse;
        KeyDown += (_, e) => { if (e.Key == Key.Escape) Close(); };
        CompositionTarget.Rendering += OnFrame;
        Closed += (_, _) => CompositionTarget.Rendering -= OnFrame;
    }

    private void OnFrame(object? sender, EventArgs e)
    {
        if (redraw.ElapsedMilliseconds < 33) return;
        redraw.Restart();
        face.InvalidateVisual();
    }

    private void HandleMouse(object sender, MouseButtonEventArgs e)
    {
        var p = e.GetPosition(face);
        if (p.Y <= 39 && p.X >= ActualWidth - 42)
        {
            Close();
            return;
        }
        if (p.Y <= 44)
        {
            try { DragMove(); }
            catch (InvalidOperationException) { /* Drag ended before capture. */ }
        }
    }
}

internal sealed class ClockSurface : FrameworkElement
{
    private static readonly Brush BackgroundBrush = Brush("#0C1521");
    private static readonly Brush PanelBrush = Brush("#102332");
    private static readonly Brush BorderBrush = Brush("#315366");
    private static readonly Brush White = Brush("#EAF7F4");
    private static readonly Brush Muted = Brush("#92A9B6");
    private static readonly Brush Gold = Brush("#F1C887");
    private static readonly Brush Aqua = Brush("#82DDD4");
    private static readonly Brush Rose = Brush("#EC9EC5");
    private static readonly Brush Green = Brush("#A8DD9C");
    private readonly DateTimeOffset start;

    public DateTimeOffset? FixedTime { get; init; }

    public ClockSurface(DateTimeOffset start) => this.start = start;

    protected override void OnRender(DrawingContext dc)
    {
        var now = FixedTime ?? DateTimeOffset.Now;
        var w = ActualWidth;
        var h = ActualHeight;
        dc.DrawRoundedRectangle(BackgroundBrush, new Pen(BorderBrush, 1),
            new Rect(1, 1, w - 2, h - 2), 18, 18);
        dc.DrawRoundedRectangle(PanelBrush, null, new Rect(12, 48, 148, 156), 15, 15);

        Text(dc, "HALVETH  /  CHRONOSPHERE", 20, 15, 11.5, Aqua, FontWeights.SemiBold);
        Text(dc, "×", w - 29, 11, 18, Muted);
        dc.DrawLine(new Pen(BorderBrush, 0.7), new Point(18, 41), new Point(w - 18, 41));

        var center = new Point(86, 126);
        const double radius = 62;
        var glow = new RadialGradientBrush(
            new GradientStopCollection {
                new GradientStop(Color.FromArgb(48, 36, 157, 153), 0),
                new GradientStop(Color.FromArgb(0, 36, 157, 153), 1)
            });
        dc.DrawEllipse(glow, null, center, 72, 72);
        dc.DrawEllipse(null, new Pen(Brush("#355C67"), 1.2), center, radius + 3, radius + 3);
        dc.DrawEllipse(null, new Pen(Aqua, 1.1), center, radius - 2, radius - 2);

        for (var i = 0; i < 60; i++)
        {
            var major = i % 5 == 0;
            var inner = OnCircle(center, i * 6, radius - (major ? 10 : 5));
            var outer = OnCircle(center, i * 6, radius - 1);
            dc.DrawLine(new Pen(major ? Gold : BorderBrush, major ? 1.6 : 0.65), inner, outer);
        }

        var angles = ClockAngles.At(now, start);
        var sessionArc = new StreamGeometry();
        using (var g = sessionArc.Open())
        {
            var end = OnCircle(center, angles.Session, radius + 6);
            g.BeginFigure(OnCircle(center, 0, radius + 6), false, false);
            g.ArcTo(end, new Size(radius + 6, radius + 6), 0,
                angles.Session > 180, SweepDirection.Clockwise, true, false);
        }
        sessionArc.Freeze();
        dc.DrawGeometry(null, new Pen(Green, 2.5), sessionArc);
        dc.DrawEllipse(Green, null, OnCircle(center, angles.Session, radius + 6), 3, 3);

        Hand(dc, center, angles.Hour, 35, Gold, 3.6);
        Hand(dc, center, angles.Minute, 49, Aqua, 2.7);
        Hand(dc, center, angles.Second, 55, Rose, 1.5);
        dc.DrawEllipse(White, null, center, 3.6, 3.6);

        // A restrained original expression; vector curves remain smooth at any DPI.
        dc.DrawEllipse(White, null, new Point(center.X - 15, center.Y - 17), 1.5, 1.5);
        dc.DrawEllipse(White, null, new Point(center.X + 15, center.Y - 17), 1.5, 1.5);
        var smile = new StreamGeometry();
        using (var g = smile.Open())
        {
            g.BeginFigure(new Point(center.X - 16, center.Y + 18), false, false);
            g.BezierTo(new Point(center.X - 6, center.Y + 27),
                new Point(center.X + 6, center.Y + 27),
                new Point(center.X + 16, center.Y + 18), true, false);
        }
        smile.Freeze();
        dc.DrawGeometry(null, new Pen(Gold, 1.3), smile);

        var x = 176.0;
        Text(dc, now.ToString("HH:mm:ss", CultureInfo.InvariantCulture), x, 61, 25, White, FontWeights.SemiBold);
        Text(dc, now.ToString("ddd, dd. MMM", CultureInfo.GetCultureInfo("de-DE")), x + 1, 97, 11.5, Muted);
        dc.DrawLine(new Pen(BorderBrush, 0.8), new Point(x, 121), new Point(w - 23, 121));
        Legend(dc, "H", Gold, x, 135);
        Legend(dc, "M", Aqua, x + 43, 135);
        Legend(dc, "S", Rose, x + 86, 135);
        Legend(dc, "T+", Green, x + 129, 135);
        Text(dc, "T+  " + Elapsed(now - start), x, 159, 12, Green);
        Text(dc, "UTC " + now.UtcDateTime.ToString("HH:mm:ss", CultureInfo.InvariantCulture),
            x, 181, 10.5, Muted);
    }

    private static string Elapsed(TimeSpan value)
    {
        if (value < TimeSpan.Zero) value = TimeSpan.Zero;
        return value.Days > 0 ? $"{value.Days}d {value:hh\\:mm\\:ss}" : value.ToString(@"hh\:mm\:ss", CultureInfo.InvariantCulture);
    }

    private static void Legend(DrawingContext dc, string label, Brush brush, double x, double y)
    {
        dc.DrawEllipse(brush, null, new Point(x + 4, y + 6), 3, 3);
        Text(dc, label, x + 12, y, 10, Muted);
    }

    private static void Hand(DrawingContext dc, Point center, double angle, double length, Brush color, double width)
    {
        var pen = new Pen(color, width) { StartLineCap = PenLineCap.Round, EndLineCap = PenLineCap.Round };
        dc.DrawLine(pen, center, OnCircle(center, angle, length));
    }

    private static Point OnCircle(Point center, double degrees, double radius)
    {
        var radians = degrees * Math.PI / 180;
        return new Point(center.X + Math.Sin(radians) * radius, center.Y - Math.Cos(radians) * radius);
    }

    private static void Text(DrawingContext dc, string text, double x, double y, double size,
        Brush brush, FontWeight? weight = null)
    {
        var typeface = new Typeface(new FontFamily("Segoe UI"), FontStyles.Normal,
            weight ?? FontWeights.Normal, FontStretches.Normal);
        var formatted = new FormattedText(text, CultureInfo.GetCultureInfo("de-DE"),
            FlowDirection.LeftToRight, typeface, size, brush, 1.0);
        dc.DrawText(formatted, new Point(x, y));
    }

    private static Brush Brush(string hex)
    {
        var brush = new SolidColorBrush((Color)ColorConverter.ConvertFromString(hex));
        brush.Freeze();
        return brush;
    }
}
