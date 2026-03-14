using System;
using System.Text;
string[] pins = { "1234", "0000", "9999" };
foreach (var pin in pins) {
    string text = pin + "tsada_dc_salt_2024";
    int hash = 0;
    unchecked { foreach (char c in text) hash = ((hash << 5) - hash) + c; }
    long abs = Math.Abs((long)hash);
    string r = ToBase36(abs) + "_" + pin.Length;
    Console.WriteLine($"pin={pin} hash={r}");
}
static string ToBase36(long n) {
    if (n == 0) return "0";
    const string d = "0123456789abcdefghijklmnopqrstuvwxyz";
    var sb = new System.Text.StringBuilder();
    while (n > 0) { sb.Insert(0, d[(int)(n % 36)]); n /= 36; }
    return sb.ToString();
}
