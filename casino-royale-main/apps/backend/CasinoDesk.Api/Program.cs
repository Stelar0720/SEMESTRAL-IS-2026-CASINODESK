using CasinoDesk.Api.Configuration;
using CasinoDesk.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
if (jwtOptions.SigningKey.Length < 32)
    throw new InvalidOperationException("Jwt:SigningKey debe configurarse fuera del codigo y tener al menos 32 caracteres.");
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = signingKey
        };
    });

builder.Services.AddAuthorizationBuilder()
    .AddPolicy(Policies.AdminAccess, policy => policy.RequireRole("Administrador"))
    .AddPolicy(Policies.OperatorAccess, policy => policy.RequireRole("Cajero", "Supervisor"))
    .AddPolicy(Policies.OfficerAccess, policy => policy.RequireRole("Oficial", "Administrador"))
    .AddPolicy(Policies.OfficerAction, policy => policy.RequireRole("Oficial"))
    .AddPolicy(Policies.RosAccess, policy => policy.RequireRole("Oficial", "Supervisor", "Administrador"))
    .AddPolicy(Policies.RosCreate, policy => policy.RequireRole("Oficial"));

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(
        partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        factory: _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            AutoReplenishment = true
        }));
});

builder.Services.AddSingleton(signingKey);
builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
builder.Services.AddSingleton<SqliteCasinoDeskRepository>();
builder.Services.AddSingleton<ICasinoDeskRepository>(provider => provider.GetRequiredService<SqliteCasinoDeskRepository>());
builder.Services.AddSingleton<IProspectRepository>(provider => provider.GetRequiredService<SqliteCasinoDeskRepository>());
builder.Services.AddSingleton<IAuditLogger, InMemoryAuditLogger>();
builder.Services.AddSingleton<ICustomerIdentityHasher, CustomerIdentityHasher>();
builder.Services.AddSingleton<IRiskConsolidator, RiskConsolidator>();
builder.Services.AddSingleton<IScreeningProvider, MockAmlScreeningProvider>();
builder.Services.AddSingleton<IPepProvider, MockPepProvider>();
builder.Services.AddSingleton<IStructuringDetector, StructuringDetector>();
builder.Services.AddSingleton<ITransactionService, TransactionService>();
builder.Services.AddSingleton<IRteService, RteService>();
builder.Services.AddSingleton<IRosService, RosService>();
builder.Services.AddSingleton<IAuthService, AuthService>();

builder.Services.AddCors(options =>
{
    var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? [];
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseExceptionHandler(exceptionHandlerApp =>
{
    exceptionHandlerApp.Run(async context =>
    {
        var exception = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>()?.Error;
        var (status, title) = exception switch
        {
            UnauthorizedAccessException => (StatusCodes.Status401Unauthorized, "Credenciales inválidas"),
            KeyNotFoundException => (StatusCodes.Status404NotFound, "Recurso no encontrado"),
            ArgumentException => (StatusCodes.Status400BadRequest, "Solicitud inválida"),
            InvalidOperationException => (StatusCodes.Status409Conflict, "Operación no permitida"),
            _ => (StatusCodes.Status500InternalServerError, "Error interno")
        };

        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(new
        {
            status,
            title,
            detail = status == 500 ? "Ocurrió un error inesperado." : exception?.Message
        });
    });
});

if (app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("EnableSwagger"))
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "no-referrer";
    if (context.Request.Path.StartsWithSegments("/reports"))
        context.Response.Headers["Content-Security-Policy"] = "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; frame-ancestors 'none'";
    else if (!context.Request.Path.StartsWithSegments("/swagger"))
        context.Response.Headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'";
    await next();
});

app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

await app.RunAsync();

public partial class Program;
