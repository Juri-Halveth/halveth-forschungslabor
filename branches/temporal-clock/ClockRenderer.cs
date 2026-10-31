using System.Globalization;
using System.Text;

namespace Halveth.TemporalClock;

internal static class ClockRenderer
{
    private const int Gold = 0xFFD38A;
    private const int Cyan = 0x71E4E3;
    private const int Pink = 0xF895CC;
    private const int Lime = 0xA8E8A1;
    private const int Muted = 0x8194A7;
    private const int Bright = 0xFFF3D9;

    public static string Render(DateTimeOffset now, DateTimeOffset start, int width, int height, bool ansi)
    {
        width = Math.Clamp(width, 24, 320);
        height = Math.Clamp(height, 8, 90);
        var faceRows = Math.Min(18, height - 3);
        var faceCols = Math.Min(faceRows * 2, width - 2);
        var face = new BrailleCanvas(faceCols, faceRows);
        DrawFace(face, ClockAngles.At(now, start));

        var elapsed = Math.Max(0, (now - start).TotalSeconds);
        var side = BuildSide(now, start, elapsed, faceRows, ansi);
        var showSide = width >= faceCols + 28;
        var sb = new StringBuilder();
        sb.AppendLine(Tint(Fit("  ◈  HALVETH / CHRONOSPHERE", width - 1), Gold, ansi));
        sb.AppendLine(Tint(Fit("  vier Zeiger · eine Quelle · laufende Projektion", width - 1), Muted, ansi));
        for (var row = 0; row < faceRows; row++)
        {
            sb.Append("  ");
            sb.Append(face.RenderRow(row, ansi));
            if (showSide)
            {
                sb.Append("   ");
                sb.Append(Fit(side[row], width - faceCols - 5));
            }
            if (row < faceRows - 1) sb.AppendLine();
        }
        return sb.ToString();
    }

    private static string[] BuildSide(DateTimeOffset now, DateTimeOffset start,
        double elapsed, int rows, bool ansi)
    {
        var lines = Enumerable.Repeat("", rows).ToArray();
        var digits = LargeDigits(now.ToString("HH:mm", CultureInfo.InvariantCulture));
        for (var i = 0; i < Math.Min(5, rows); i++)
        {
            lines[i] = Tint(digits[i], Gold, ansi);
        }
        Put(lines, 5, Tint(now.ToString("HH:mm:ss.fff", CultureInfo.InvariantCulture), Pink, ansi));
        Put(lines, 7, Tint("● STUNDE", Gold, ansi) + "   " + now.ToString("HH", CultureInfo.InvariantCulture));
        Put(lines, 8, Tint("● MINUTE", Cyan, ansi) + "   " + now.ToString("mm", CultureInfo.InvariantCulture));
        Put(lines, 9, Tint("● SEKUNDE", Pink, ansi) + "  " + now.ToString("ss.fff", CultureInfo.InvariantCulture));
        var duration = TimeSpan.FromSeconds(elapsed);
        var durationText = duration.Days > 0
            ? $"{duration.Days}d {duration:hh\\:mm\\:ss}"
            : duration.ToString(@"hh\:mm\:ss", CultureInfo.InvariantCulture);
        Put(lines, 10, Tint("● T+", Lime, ansi) + "       " + durationText);
        Put(lines, 12, Tint("UTC", Muted, ansi) + "  " +
            now.UtcDateTime.ToString("HH:mm:ss", CultureInfo.InvariantCulture));
        Put(lines, 13, Tint("T0", Muted, ansi) + "   " +
            start.ToString("HH:mm:ss", CultureInfo.InvariantCulture));
        Put(lines, 15, Tint("ZEITSPUR", Cyan, ansi));
        var trailPhase = (int)(now.Second / 7.5);
        var trail = string.Join("  ", Enumerable.Range(0, 8)
            .Select(index => index == trailPhase ? "●" : "◦"));
        Put(lines, 16, Tint(trail, Pink, ansi));
        Put(lines, 17, Tint("Q: schließen  ·  Quelle: Systemuhr", Muted, ansi));
        return lines;
    }

    private static void Put(string[] lines, int index, string value)
    {
        if (index < lines.Length) lines[index] = value;
    }

    private static void DrawFace(BrailleCanvas c, ClockAngles a)
    {
        var cx = (c.PixelWidth - 1) / 2.0;
        var cy = (c.PixelHeight - 1) / 2.0;
        var radius = Math.Min(c.PixelWidth, c.PixelHeight) * 0.445;
        c.Circle(cx, cy, radius + 1.1, 0.70, 0x2E536B, 1);
        c.Circle(cx, cy, radius, 0.85, Gold, 2);
        c.Circle(cx, cy, radius - 3.2, 0.55, 0x246B80, 1);
        for (var i = 0; i < 60; i++)
        {
            var angle = i * 6.0;
            var inner = radius - (i % 5 == 0 ? 4.0 : 2.3);
            c.RadialLine(cx, cy, angle, inner, radius - 0.8,
                i % 5 == 0 ? Gold : 0x426A7D, i % 5 == 0 ? 3 : 1, 0.55);
        }

        // Preserved second positions are a visible trail, not extra clock hands.
        for (var lag = 8; lag >= 1; lag--)
        {
            var angle = a.Second - lag * 6;
            var point = BrailleCanvas.PointOnRing(cx, cy, angle, radius + 0.8);
            var shade = 0x613A76 + (8 - lag) * 0x090609;
            c.Brush(point.X, point.Y, 0.85, shade, 2);
        }

        c.Hand(cx, cy, a.Session, radius * 0.90, 0.70, Lime, 3, dashed: true);
        c.Hand(cx, cy, a.Hour, radius * 0.51, 1.65, Gold, 4);
        c.Hand(cx, cy, a.Minute, radius * 0.72, 1.15, Cyan, 5);
        c.Hand(cx, cy, a.Second, radius * 0.84, 0.75, Pink, 6);
        c.Brush(cx, cy, 2.0, Bright, 8);

        // A small original expression gives the instrument a face without
        // copying a character design. It follows the same projection geometry.
        var eyeY = cy - radius * 0.24;
        c.Brush(cx - radius * 0.21, eyeY, 1.25, Bright, 7);
        c.Brush(cx + radius * 0.21, eyeY, 1.25, Bright, 7);
        for (var x = -0.28; x <= 0.28; x += 0.025)
        {
            var px = cx + x * radius;
            var py = cy + radius * (0.30 + 0.17 * (1 - Math.Pow(x / 0.28, 2)));
            c.Brush(px, py, 0.65, Gold, 7);
        }
    }

    private static string[] LargeDigits(string time)
    {
        var font = new Dictionary<char, string[]>
        {
            ['0'] = ["███", "█ █", "█ █", "█ █", "███"],
            ['1'] = [" ██", "  █", "  █", "  █", " ███"],
            ['2'] = ["███", "  █", "███", "█  ", "███"],
            ['3'] = ["███", "  █", " ██", "  █", "███"],
            ['4'] = ["█ █", "█ █", "███", "  █", "  █"],
            ['5'] = ["███", "█  ", "███", "  █", "███"],
            ['6'] = ["███", "█  ", "███", "█ █", "███"],
            ['7'] = ["███", "  █", "  █", "  █", "  █"],
            ['8'] = ["███", "█ █", "███", "█ █", "███"],
            ['9'] = ["███", "█ █", "███", "  █", "███"],
            [':'] = ["   ", " █ ", "   ", " █ ", "   "]
        };
        var rows = new string[5];
        for (var row = 0; row < 5; row++)
        {
            rows[row] = string.Join(" ", time.Select(ch => font[ch][row])).TrimEnd();
        }
        return rows;
    }

    private static string Tint(string text, int rgb, bool ansi)
    {
        if (!ansi) return text;
        return $"\u001b[38;2;{(rgb >> 16) & 255};{(rgb >> 8) & 255};{rgb & 255}m{text}\u001b[0m";
    }

    private static string Fit(string value, int width)
    {
        var sb = new StringBuilder();
        var visible = 0;
        for (var i = 0; i < value.Length && visible < Math.Max(0, width); i++)
        {
            if (value[i] == '\u001b')
            {
                do
                {
                    sb.Append(value[i]);
                    i++;
                }
                while (i < value.Length && value[i - 1] != 'm');
                i--;
                continue;
            }
            sb.Append(value[i]);
            visible++;
        }
        if (value.Contains("\u001b[", StringComparison.Ordinal)) sb.Append("\u001b[0m");
        return sb.ToString();
    }
}

internal sealed class BrailleCanvas
{
    private readonly int[] masks;
    private readonly int[] colors;
    private readonly int[] priorities;
    private readonly int columns;
    private readonly int rows;
    private static readonly int[,] Bits = { { 0x01, 0x02, 0x04, 0x40 }, { 0x08, 0x10, 0x20, 0x80 } };

    public int PixelWidth => columns * 2;
    public int PixelHeight => rows * 4;

    public BrailleCanvas(int columns, int rows)
    {
        this.columns = columns;
        this.rows = rows;
        masks = new int[columns * rows];
        colors = new int[columns * rows];
        priorities = new int[columns * rows];
    }

    public static (double X, double Y) PointOnRing(double cx, double cy, double angle, double radius)
    {
        var radians = angle * Math.PI / 180.0;
        return (cx + Math.Sin(radians) * radius, cy - Math.Cos(radians) * radius);
    }

    public void Circle(double cx, double cy, double radius, double width, int color, int priority)
    {
        for (var y = 0; y < PixelHeight; y++)
        for (var x = 0; x < PixelWidth; x++)
        {
            var d = Math.Sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
            if (Math.Abs(d - radius) <= width / 2) Set(x, y, color, priority);
        }
    }

    public void RadialLine(double cx, double cy, double angle, double from, double to,
        int color, int priority, double thickness)
    {
        var steps = Math.Max(1, (int)((to - from) * 3));
        for (var step = 0; step <= steps; step++)
        {
            var p = PointOnRing(cx, cy, angle, from + (to - from) * step / steps);
            Brush(p.X, p.Y, thickness, color, priority);
        }
    }

    public void Hand(double cx, double cy, double angle, double length, double thickness,
        int color, int priority, bool dashed = false)
    {
        var steps = Math.Max(1, (int)(length * 4));
        for (var step = 0; step <= steps; step++)
        {
            if (dashed && (step / 5) % 2 == 1) continue;
            var p = PointOnRing(cx, cy, angle, length * step / steps);
            Brush(p.X, p.Y, thickness, color, priority);
        }
    }

    public void Brush(double cx, double cy, double radius, int color, int priority)
    {
        var minX = (int)Math.Floor(cx - radius);
        var maxX = (int)Math.Ceiling(cx + radius);
        var minY = (int)Math.Floor(cy - radius);
        var maxY = (int)Math.Ceiling(cy + radius);
        for (var y = minY; y <= maxY; y++)
        for (var x = minX; x <= maxX; x++)
        {
            if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= radius * radius + 0.5)
                Set(x, y, color, priority);
        }
    }

    private void Set(int x, int y, int color, int priority)
    {
        if (x < 0 || y < 0 || x >= PixelWidth || y >= PixelHeight) return;
        var cell = y / 4 * columns + x / 2;
        masks[cell] |= Bits[x % 2, y % 4];
        if (priority >= priorities[cell])
        {
            priorities[cell] = priority;
            colors[cell] = color;
        }
    }

    public string RenderRow(int row, bool ansi)
    {
        var sb = new StringBuilder();
        var current = -1;
        for (var col = 0; col < columns; col++)
        {
            var index = row * columns + col;
            var color = masks[index] == 0 ? 0 : colors[index];
            if (ansi && color != current)
            {
                if (color == 0) sb.Append("\u001b[0m");
                else sb.Append($"\u001b[38;2;{(color >> 16) & 255};{(color >> 8) & 255};{color & 255}m");
                current = color;
            }
            sb.Append(masks[index] == 0 ? ' ' : (char)(0x2800 | masks[index]));
        }
        if (ansi) sb.Append("\u001b[0m");
        return sb.ToString();
    }
}
