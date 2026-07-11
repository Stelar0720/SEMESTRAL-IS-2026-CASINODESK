using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace CasinoDesk.Api.Tests;

public sealed class CriticalFlowsTests : IClassFixture<CasinoDeskFactory>
{
    private readonly CasinoDeskFactory _factory;

    public CriticalFlowsTests(CasinoDeskFactory factory) => _factory = factory;

    [Fact]
    public async Task Authentication_RotatesRefresh_LogsOut_AndEnforcesRbac()
    {
        using var client = _factory.CreateClient();
        var cashier = await Login(client, "cajero");
        Assert.False(string.IsNullOrWhiteSpace(cashier.AccessToken));
        Assert.False(string.IsNullOrWhiteSpace(cashier.RefreshToken));

        var refreshResponse = await client.PostAsJsonAsync("/auth/refresh", new { refreshToken = cashier.RefreshToken });
        refreshResponse.EnsureSuccessStatusCode();
        var rotated = await ReadAuth(refreshResponse);
        Assert.NotEqual(cashier.RefreshToken, rotated.RefreshToken);

        var reused = await client.PostAsJsonAsync("/auth/refresh", new { refreshToken = cashier.RefreshToken });
        Assert.Equal(HttpStatusCode.Unauthorized, reused.StatusCode);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", cashier.AccessToken);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/reports/summary")).StatusCode);

        client.DefaultRequestHeaders.Authorization = null;
        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsJsonAsync("/auth/logout", new { refreshToken = rotated.RefreshToken })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await client.PostAsJsonAsync("/auth/refresh", new { refreshToken = rotated.RefreshToken })).StatusCode);
    }

    [Fact]
    public async Task ProspectKyc_PersistsProfileAndRelatedEvidence()
    {
        using var supervisorClient = await AuthenticatedClient("supervisor");
        var document = $"8-700-{Random.Shared.Next(1000, 9999)}";
        var prospectResponse = await supervisorClient.PostAsJsonAsync("/prospects", new
        {
            documentNumber = document, documentType = "CEDULA", issuingCountry = "PANAMA",
            documentIssuedAt = "2024-01-10", documentExpiresAt = "2034-01-10",
            firstNames = "Prueba Integracion", lastNames = "Kyc CasinoDesk", birthDate = "1990-05-20",
            birthPlace = "Panama", sex = "F", nationality = "Panamena", residenceCountry = "Panama",
            address = "Ciudad de Panama", phone = "6000-1000", email = "integration@example.test",
            occupation = "Ingeniera", employer = "Empresa de prueba", economicActivity = "Tecnologia",
            monthlyIncomeRange = "5000-10000", expectedGamingAmount = 3500,
            expectedGamingFrequency = "Mensual", sourceOfFunds = "Salario",
            relationshipPurpose = "Entretenimiento", isPep = false, pepRelationship = "",
            riskLevel = "Verde", riskScore = 15, status = "APROBADO"
        });
        prospectResponse.EnsureSuccessStatusCode();
        var prospect = JsonDocument.Parse(await prospectResponse.Content.ReadAsStringAsync()).RootElement;
        var prospectId = prospect.GetProperty("id").GetString()!;
        Assert.Equal("***" + document[^4..], prospect.GetProperty("documentNumberMasked").GetString());

        var evidenceResponse = await supervisorClient.PostAsJsonAsync($"/prospects/{prospectId}/evidence", new
        {
            evidenceType = "DOCUMENTO_IDENTIDAD", source = "LECTOR_PDF417_DEMO",
            reference = "TEST-EVIDENCE", result = "Documento vigente", isSimulated = true
        });
        evidenceResponse.EnsureSuccessStatusCode();

        using var officerClient = await AuthenticatedClient("oficial");
        var caseResponse = await officerClient.GetAsync($"/prospects/{prospectId}");
        caseResponse.EnsureSuccessStatusCode();
        var caseDocument = JsonDocument.Parse(await caseResponse.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal("Ingeniera", caseDocument.GetProperty("prospect").GetProperty("occupation").GetString());
        Assert.Single(caseDocument.GetProperty("evidence").EnumerateArray());
    }

    [Fact]
    public async Task RteAndRos_CompleteRegulatoryLifecycle_WithSimulatedAcknowledgements()
    {
        using var supervisorClient = await AuthenticatedClient("supervisor");
        var document = $"8-701-{Random.Shared.Next(1000, 9999)}";
        var transactionResponse = await supervisorClient.PostAsJsonAsync("/transactions/buy-in", new
        {
            clientName = "Caso Regulatorio Automatizado", documentNumber = document, amount = 12500,
            paymentMethod = "Efectivo", originOfFunds = "Ahorros documentados",
            justification = "Perfil proporcional", chipsPlayedRatio = (decimal?)null, signedByClient = true
        });
        transactionResponse.EnsureSuccessStatusCode();
        var transaction = JsonDocument.Parse(await transactionResponse.Content.ReadAsStringAsync()).RootElement;
        var transactionId = transaction.GetProperty("transactionId").GetString()!;
        var clientHash = transaction.GetProperty("clientHash").GetString()!;
        Assert.Equal("PendienteRte", transaction.GetProperty("status").GetString());

        var alertResponse = await supervisorClient.PostAsJsonAsync("/alerts/manual", new
        {
            title = "Alerta automatizada de integracion",
            description = "Patron que requiere analisis y narrativa documentada para la prueba automatizada.",
            clientHash, amount = 12500
        });
        alertResponse.EnsureSuccessStatusCode();
        var alertId = JsonDocument.Parse(await alertResponse.Content.ReadAsStringAsync()).RootElement.GetProperty("id").GetString()!;

        using var officerClient = await AuthenticatedClient("oficial");
        var rtes = JsonDocument.Parse(await officerClient.GetStringAsync("/rte")).RootElement;
        var rte = rtes.EnumerateArray().First(item => item.GetProperty("transactionIds").EnumerateArray()
            .Any(id => id.GetString() == transactionId));
        var rteId = rte.GetProperty("id").GetString()!;
        Assert.Equal("PENDIENTE_APROBACION", rte.GetProperty("status").GetString());
        Assert.Equal(HttpStatusCode.NoContent, (await officerClient.PatchAsync($"/rte/{rteId}/approve", null)).StatusCode);
        var sentRte = await officerClient.PostAsync($"/rte/{rteId}/submit", null);
        sentRte.EnsureSuccessStatusCode();
        Assert.Contains("UAF-DEMO-RTE", await sentRte.Content.ReadAsStringAsync());

        var rosResponse = await officerClient.PostAsJsonAsync("/ros", new
        {
            alertId, narrative = "El comportamiento observado presenta elementos inusuales y requiere comunicacion confidencial a la UAF simulada."
        });
        rosResponse.EnsureSuccessStatusCode();
        var rosDocument = JsonDocument.Parse(await rosResponse.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal("BORRADOR", rosDocument.GetProperty("status").GetString());
        var rosId = rosDocument.GetProperty("id").GetString()!;
        var sentRos = await officerClient.PostAsync($"/ros/{rosId}/submit", null);
        sentRos.EnsureSuccessStatusCode();
        Assert.Contains("UAF-DEMO-ROS", await sentRos.Content.ReadAsStringAsync());

        var transactions = JsonDocument.Parse(await officerClient.GetStringAsync("/transactions")).RootElement;
        Assert.Equal("Completada", transactions.EnumerateArray().First(item => item.GetProperty("id").GetString() == transactionId)
            .GetProperty("status").GetString());
        var alerts = JsonDocument.Parse(await officerClient.GetStringAsync("/alerts")).RootElement;
        Assert.Equal("CERRADA", alerts.EnumerateArray().First(item => item.GetProperty("id").GetString() == alertId)
            .GetProperty("status").GetString());
    }

    private async Task<HttpClient> AuthenticatedClient(string username)
    {
        var client = _factory.CreateClient();
        var auth = await Login(client, username);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.AccessToken);
        return client;
    }

    private static async Task<AuthTokens> Login(HttpClient client, string username)
    {
        var response = await client.PostAsJsonAsync("/auth/login", new { username, password = "demo" });
        response.EnsureSuccessStatusCode();
        return await ReadAuth(response);
    }

    private static async Task<AuthTokens> ReadAuth(HttpResponseMessage response)
    {
        var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        return new AuthTokens(document.GetProperty("accessToken").GetString()!, document.GetProperty("refreshToken").GetString()!);
    }

    private sealed record AuthTokens(string AccessToken, string RefreshToken);
}
