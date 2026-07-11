using System.Security.Cryptography;
using System.Text;

namespace CasinoDesk.Api.Services;

public sealed class CustomerIdentityHasher : ICustomerIdentityHasher
{
    public string Hash(string documentNumber)
    {
        var normalized = documentNumber.Trim().ToUpperInvariant();
        var salt = "casino-desk-static-demo-salt";
        using var deriveBytes = new Rfc2898DeriveBytes(normalized, Encoding.UTF8.GetBytes(salt), 100_000, HashAlgorithmName.SHA256);
        var bytes = deriveBytes.GetBytes(16);
        return Convert.ToHexString(bytes);
    }
}
