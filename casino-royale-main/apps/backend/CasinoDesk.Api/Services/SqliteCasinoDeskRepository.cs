using System.Text.Json;
using System.Text.Json.Serialization;
using CasinoDesk.Api.Domain;
using Microsoft.Data.Sqlite;

namespace CasinoDesk.Api.Services;

public sealed class SqliteCasinoDeskRepository : ICasinoDeskRepository, IProspectRepository
{
    private readonly object _gate = new();
    private readonly string _connectionString;
    private readonly JsonSerializerOptions _jsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    public SqliteCasinoDeskRepository(IConfiguration configuration, IPasswordHasher passwordHasher)
    {
        var filePath = configuration["DatabaseFile"]
            ?? Path.Combine(AppContext.BaseDirectory, "data", "casinodesk.db");
        var absolutePath = Path.GetFullPath(filePath);
        Directory.CreateDirectory(Path.GetDirectoryName(absolutePath)!);
        _connectionString = new SqliteConnectionStringBuilder
        {
            DataSource = absolutePath,
            Mode = SqliteOpenMode.ReadWriteCreate,
            ForeignKeys = true
        }.ToString();

        InitializeSchema();
        Seed(passwordHasher);
    }

    public IReadOnlyCollection<TransactionRecord> Transactions => ReadPayloads<TransactionRecord>("Transactions");
    public IReadOnlyCollection<AlertRecord> Alerts => ReadPayloads<AlertRecord>("Alerts");
    public IReadOnlyCollection<RteRecord> Rtes => ReadPayloads<RteRecord>("Rtes");
    public IReadOnlyCollection<RosRecord> Ros => ReadPayloads<RosRecord>("Ros");
    public IReadOnlyCollection<AuditEntry> AuditTrail => ReadPayloads<AuditEntry>("AuditTrail");

    public IReadOnlyCollection<User> Users
    {
        get
        {
            lock (_gate)
            {
                using var connection = OpenConnection();
                using var command = connection.CreateCommand();
                command.CommandText = "SELECT Id, Username, FullName, Role, Station, PasswordHash, PasswordSalt FROM Users ORDER BY Username";
                using var reader = command.ExecuteReader();
                var users = new List<User>();
                while (reader.Read())
                {
                    users.Add(new User(
                        Guid.Parse(reader.GetString(0)), reader.GetString(1), reader.GetString(2),
                        Enum.Parse<Role>(reader.GetString(3)), reader.GetString(4), reader.GetString(5), reader.GetString(6)));
                }
                return users;
            }
        }
    }

    public void AddTransaction(TransactionRecord record) => InsertPayload("Transactions", record.Id, record, record.CreatedAt);
    public void UpdateTransaction(TransactionRecord record) => UpdatePayload("Transactions", record.Id, record);
    public void AddAlert(AlertRecord alert) => InsertPayload("Alerts", alert.Id, alert, alert.CreatedAt);
    public void AddAudit(AuditEntry auditEntry) => InsertPayload("AuditTrail", auditEntry.Id, auditEntry, auditEntry.CreatedAt);
    public void AddRte(RteRecord rte) => InsertPayload("Rtes", rte.Id, rte, DateTimeOffset.UtcNow);
    public void AddRos(RosRecord ros)
    {
        if (Ros.Any(item => item.AlertId == ros.AlertId))
            throw new InvalidOperationException("Ya existe un ROS para esta alerta.");
        InsertPayload("Ros", ros.Id, ros, ros.CreatedAt);
    }

    public void UpdateAlert(Guid id, string status, string? resolutionNote = null, string? reviewedBy = null)
    {
        var alert = Alerts.FirstOrDefault(item => item.Id == id)
            ?? throw new KeyNotFoundException("Alerta no encontrada.");
        if (alert.Status == "CERRADA")
            throw new InvalidOperationException("La alerta ya esta cerrada.");
        alert.Status = status;
        if (!string.IsNullOrWhiteSpace(resolutionNote)) alert.ResolutionNote = resolutionNote.Trim();
        if (!string.IsNullOrWhiteSpace(reviewedBy)) alert.ReviewedBy = reviewedBy.Trim();
        if (status == "CERRADA") alert.ClosedAt = DateTimeOffset.UtcNow;
        UpdatePayload("Alerts", id, alert);
    }

    public void ApproveRte(Guid id)
    {
        var rte = Rtes.FirstOrDefault(item => item.Id == id)
            ?? throw new KeyNotFoundException("RTE no encontrado.");
        if (rte.ApprovedByOfficer)
            throw new InvalidOperationException("El RTE ya fue aprobado.");
        rte.ApprovedByOfficer = true;
        UpdatePayload("Rtes", id, rte);
    }

    public void UpdateRte(RteRecord rte) => UpdatePayload("Rtes", rte.Id, rte);
    public void UpdateRos(RosRecord ros) => UpdatePayload("Ros", ros.Id, ros);

    public bool IsDemoWatchlisted(string documentHash)
    {
        lock (_gate)
        {
            using var connection = OpenConnection();
            using var command = connection.CreateCommand();
            command.CommandText = "SELECT COUNT(1) FROM DemoWatchlist WHERE DocumentHash = $hash";
            command.Parameters.AddWithValue("$hash", documentHash);
            return Convert.ToInt32(command.ExecuteScalar()) > 0;
        }
    }

    public void AddDemoWatchlist(string documentHash)
    {
        lock (_gate)
        {
            using var connection = OpenConnection();
            using var command = connection.CreateCommand();
            command.CommandText = "INSERT OR IGNORE INTO DemoWatchlist(DocumentHash) VALUES ($hash)";
            command.Parameters.AddWithValue("$hash", documentHash);
            command.ExecuteNonQuery();
        }
    }

    public IReadOnlyCollection<ProspectRecord> GetProspects() => ReadPayloads<ProspectRecord>("Prospects");

    public ProspectRecord? GetProspect(Guid id) => GetProspects().FirstOrDefault(item => item.Id == id);

    public ProspectRecord? FindProspectByDocumentHash(string documentHash)
        => GetProspects().FirstOrDefault(item => string.Equals(item.DocumentHash, documentHash, StringComparison.OrdinalIgnoreCase));

    public ProspectRecord UpsertProspect(ProspectRecord prospect)
    {
        lock (_gate)
        {
            var current = FindProspectByDocumentHash(prospect.DocumentHash);
            var record = current is null ? prospect : CopyProspect(prospect, current.Id, current.CreatedAt);
            using var connection = OpenConnection();
            using var command = connection.CreateCommand();
            command.CommandText = """
                INSERT INTO Prospects(Id, DocumentHash, FullName, RiskLevel, Status, Payload, CreatedAt)
                VALUES ($id, $hash, $name, $risk, $status, $payload, $created)
                ON CONFLICT(DocumentHash) DO UPDATE SET
                    FullName = excluded.FullName, RiskLevel = excluded.RiskLevel,
                    Status = excluded.Status, Payload = excluded.Payload
                """;
            command.Parameters.AddWithValue("$id", record.Id.ToString());
            command.Parameters.AddWithValue("$hash", record.DocumentHash);
            command.Parameters.AddWithValue("$name", $"{record.FirstNames} {record.LastNames}".Trim());
            command.Parameters.AddWithValue("$risk", record.RiskLevel.ToString());
            command.Parameters.AddWithValue("$status", record.Status);
            command.Parameters.AddWithValue("$payload", JsonSerializer.Serialize(record, _jsonOptions));
            command.Parameters.AddWithValue("$created", record.CreatedAt.ToString("O"));
            command.ExecuteNonQuery();
            return record;
        }
    }

    public IReadOnlyCollection<KycEvidenceRecord> GetEvidence(Guid prospectId)
    {
        lock (_gate)
        {
            using var connection = OpenConnection();
            using var command = connection.CreateCommand();
            command.CommandText = "SELECT Payload FROM KycEvidence WHERE ProspectId = $prospectId ORDER BY CreatedAt DESC";
            command.Parameters.AddWithValue("$prospectId", prospectId.ToString());
            using var reader = command.ExecuteReader();
            var evidence = new List<KycEvidenceRecord>();
            while (reader.Read())
            {
                var item = JsonSerializer.Deserialize<KycEvidenceRecord>(reader.GetString(0), _jsonOptions);
                if (item is not null) evidence.Add(item);
            }
            return evidence;
        }
    }

    public KycEvidenceRecord AddEvidence(KycEvidenceRecord evidence)
    {
        if (GetProspect(evidence.ProspectId) is null)
            throw new KeyNotFoundException("Prospecto no encontrado.");
        lock (_gate)
        {
            using var connection = OpenConnection();
            using var command = connection.CreateCommand();
            command.CommandText = "INSERT INTO KycEvidence(Id, ProspectId, Payload, CreatedAt) VALUES ($id, $prospectId, $payload, $created)";
            command.Parameters.AddWithValue("$id", evidence.Id.ToString());
            command.Parameters.AddWithValue("$prospectId", evidence.ProspectId.ToString());
            command.Parameters.AddWithValue("$payload", JsonSerializer.Serialize(evidence, _jsonOptions));
            command.Parameters.AddWithValue("$created", evidence.CreatedAt.ToString("O"));
            command.ExecuteNonQuery();
            return evidence;
        }
    }

    private SqliteConnection OpenConnection()
    {
        var connection = new SqliteConnection(_connectionString);
        connection.Open();
        return connection;
    }

    private void InitializeSchema()
    {
        lock (_gate)
        {
            using var connection = OpenConnection();
            using var command = connection.CreateCommand();
            command.CommandText = """
                PRAGMA journal_mode = WAL;
                PRAGMA foreign_keys = ON;
                CREATE TABLE IF NOT EXISTS Users (
                    Id TEXT PRIMARY KEY, Username TEXT NOT NULL UNIQUE, FullName TEXT NOT NULL,
                    Role TEXT NOT NULL, Station TEXT NOT NULL, PasswordHash TEXT NOT NULL, PasswordSalt TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS Transactions (Id TEXT PRIMARY KEY, Payload TEXT NOT NULL, CreatedAt TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS Alerts (Id TEXT PRIMARY KEY, Payload TEXT NOT NULL, CreatedAt TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS Rtes (Id TEXT PRIMARY KEY, Payload TEXT NOT NULL, CreatedAt TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS Ros (Id TEXT PRIMARY KEY, Payload TEXT NOT NULL, CreatedAt TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS AuditTrail (Id TEXT PRIMARY KEY, Payload TEXT NOT NULL, CreatedAt TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS DemoWatchlist (DocumentHash TEXT PRIMARY KEY);
                CREATE TABLE IF NOT EXISTS Prospects (
                    Id TEXT PRIMARY KEY, DocumentHash TEXT NOT NULL UNIQUE, FullName TEXT NOT NULL,
                    RiskLevel TEXT NOT NULL, Status TEXT NOT NULL, Payload TEXT NOT NULL, CreatedAt TEXT NOT NULL);
                CREATE INDEX IF NOT EXISTS IX_Prospects_RiskLevel ON Prospects(RiskLevel);
                CREATE INDEX IF NOT EXISTS IX_Prospects_Status ON Prospects(Status);
                CREATE TABLE IF NOT EXISTS KycEvidence (
                    Id TEXT PRIMARY KEY, ProspectId TEXT NOT NULL, Payload TEXT NOT NULL, CreatedAt TEXT NOT NULL,
                    FOREIGN KEY(ProspectId) REFERENCES Prospects(Id) ON DELETE CASCADE);
                CREATE INDEX IF NOT EXISTS IX_KycEvidence_ProspectId ON KycEvidence(ProspectId);
                """;
            command.ExecuteNonQuery();
        }
    }

    private void Seed(IPasswordHasher passwordHasher)
    {
        if (Users.Count == 0)
        {
            var credentials = passwordHasher.Hash("demo");
            AddUser("cajero", "Jose Ramos", Role.Cajero, "CAJA-01", credentials);
            AddUser("oficial", "Norberto Solis", Role.Oficial, "COMPLIANCE", credentials);
            AddUser("supervisor", "Adrian Gomez", Role.Supervisor, "MESA-02", credentials);
            AddUser("admin", "Admin CasinoDesk", Role.Administrador, "HQ", credentials);
        }
        AddDemoWatchlist(new CustomerIdentityHasher().Hash("8-958-2038"));
    }

    private void AddUser(string username, string fullName, Role role, string station, (string Hash, string Salt) credentials)
    {
        using var connection = OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "INSERT INTO Users VALUES ($id, $username, $name, $role, $station, $hash, $salt)";
        command.Parameters.AddWithValue("$id", Guid.NewGuid().ToString());
        command.Parameters.AddWithValue("$username", username);
        command.Parameters.AddWithValue("$name", fullName);
        command.Parameters.AddWithValue("$role", role.ToString());
        command.Parameters.AddWithValue("$station", station);
        command.Parameters.AddWithValue("$hash", credentials.Hash);
        command.Parameters.AddWithValue("$salt", credentials.Salt);
        command.ExecuteNonQuery();
    }

    private IReadOnlyCollection<T> ReadPayloads<T>(string table)
    {
        lock (_gate)
        {
            using var connection = OpenConnection();
            using var command = connection.CreateCommand();
            command.CommandText = $"SELECT Payload FROM {table} ORDER BY CreatedAt DESC";
            using var reader = command.ExecuteReader();
            var records = new List<T>();
            while (reader.Read())
            {
                var item = JsonSerializer.Deserialize<T>(reader.GetString(0), _jsonOptions);
                if (item is not null) records.Add(item);
            }
            return records;
        }
    }

    private void InsertPayload<T>(string table, Guid id, T value, DateTimeOffset createdAt)
    {
        lock (_gate)
        {
            using var connection = OpenConnection();
            using var command = connection.CreateCommand();
            command.CommandText = $"INSERT INTO {table}(Id, Payload, CreatedAt) VALUES ($id, $payload, $created)";
            command.Parameters.AddWithValue("$id", id.ToString());
            command.Parameters.AddWithValue("$payload", JsonSerializer.Serialize(value, _jsonOptions));
            command.Parameters.AddWithValue("$created", createdAt.ToString("O"));
            command.ExecuteNonQuery();
        }
    }

    private void UpdatePayload<T>(string table, Guid id, T value)
    {
        lock (_gate)
        {
            using var connection = OpenConnection();
            using var command = connection.CreateCommand();
            command.CommandText = $"UPDATE {table} SET Payload = $payload WHERE Id = $id";
            command.Parameters.AddWithValue("$id", id.ToString());
            command.Parameters.AddWithValue("$payload", JsonSerializer.Serialize(value, _jsonOptions));
            if (command.ExecuteNonQuery() == 0) throw new KeyNotFoundException("Registro no encontrado.");
        }
    }

    private static ProspectRecord CopyProspect(ProspectRecord source, Guid id, DateTimeOffset createdAt) => new()
    {
        Id = id, DocumentHash = source.DocumentHash, DocumentType = source.DocumentType,
        DocumentNumberMasked = source.DocumentNumberMasked, IssuingCountry = source.IssuingCountry,
        DocumentIssuedAt = source.DocumentIssuedAt, DocumentExpiresAt = source.DocumentExpiresAt,
        FirstNames = source.FirstNames, LastNames = source.LastNames, BirthDate = source.BirthDate,
        BirthPlace = source.BirthPlace, Sex = source.Sex, Nationality = source.Nationality,
        ResidenceCountry = source.ResidenceCountry, Address = source.Address, Phone = source.Phone,
        Email = source.Email, Occupation = source.Occupation, Employer = source.Employer,
        EconomicActivity = source.EconomicActivity, MonthlyIncomeRange = source.MonthlyIncomeRange,
        ExpectedGamingAmount = source.ExpectedGamingAmount, ExpectedGamingFrequency = source.ExpectedGamingFrequency,
        SourceOfFunds = source.SourceOfFunds, SourceOfWealth = source.SourceOfWealth,
        RelationshipPurpose = source.RelationshipPurpose,
        ActsOnOwnBehalf = source.ActsOnOwnBehalf, ThirdPartyDetails = source.ThirdPartyDetails,
        IsPep = source.IsPep, PepRelationship = source.PepRelationship, RiskLevel = source.RiskLevel,
        RiskScore = source.RiskScore, Status = source.Status, CreatedAt = createdAt, UpdatedAt = DateTimeOffset.UtcNow
    };
}
