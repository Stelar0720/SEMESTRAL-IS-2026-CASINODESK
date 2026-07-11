namespace CasinoDesk.Api.Domain;

public enum Role
{
    Cajero,
    Oficial,
    Supervisor,
    Administrador
}

public enum TransactionType
{
    BuyIn,
    CashOut
}

public enum PaymentMethod
{
    Efectivo,
    Tarjeta,
    Transferencia,
    Cheque
}

public enum RiskLevel
{
    Verde,
    Amarillo,
    Rojo
}

public enum TransactionStatus
{
    Completada,
    Bloqueada,
    PendienteRte,
    PendienteRevision
}

public enum AlertType
{
    Pep,
    Aml,
    Fraccionamiento,
    Comportamiento,
    Manual,
    Timeout
}
