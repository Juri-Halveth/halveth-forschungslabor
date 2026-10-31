namespace Halveth.TemporalClock;

internal readonly record struct ClockAngles(double Hour, double Minute, double Second, double Session)
{
    public static ClockAngles At(DateTimeOffset now, DateTimeOffset start)
    {
        var second = now.Second + now.Millisecond / 1000.0;
        var minute = now.Minute + second / 60.0;
        var hour = now.Hour % 12 + minute / 60.0;
        var session = Math.Max(0, (now - start).TotalSeconds);
        return new ClockAngles(hour * 30, minute * 6, second * 6, (session % 60) * 6);
    }
}
