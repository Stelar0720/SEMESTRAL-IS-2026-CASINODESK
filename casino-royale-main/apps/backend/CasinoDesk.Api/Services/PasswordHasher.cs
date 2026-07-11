using System.Security.Cryptography;

namespace CasinoDesk.Api.Services;

public sealed class PasswordHasher : IPasswordHasher
{
    private const int Iterations = 100_000;
    private const int KeySize = 32;

    public (string Hash, string Salt) Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            Iterations,
            HashAlgorithmName.SHA256,
            KeySize);

        return (Convert.ToBase64String(hash), Convert.ToBase64String(salt));
    }

    public bool Verify(string password, string hash, string salt)
    {
        try
        {
            var expected = Convert.FromBase64String(hash);
            var actual = Rfc2898DeriveBytes.Pbkdf2(
                password,
                Convert.FromBase64String(salt),
                Iterations,
                HashAlgorithmName.SHA256,
                KeySize);

            return CryptographicOperations.FixedTimeEquals(expected, actual);
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
