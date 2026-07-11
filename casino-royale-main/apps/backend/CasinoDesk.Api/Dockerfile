FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["NuGet.Config", "./"]
COPY ["apps/backend/CasinoDesk.Api/CasinoDesk.Api.csproj", "apps/backend/CasinoDesk.Api/"]
COPY ["apps/backend/CasinoDesk.Api.Tests/CasinoDesk.Api.Tests.csproj", "apps/backend/CasinoDesk.Api.Tests/"]
RUN dotnet restore "apps/backend/CasinoDesk.Api/CasinoDesk.Api.csproj" --configfile ./NuGet.Config
RUN dotnet restore "apps/backend/CasinoDesk.Api.Tests/CasinoDesk.Api.Tests.csproj" --configfile ./NuGet.Config

COPY . .
RUN dotnet test "apps/backend/CasinoDesk.Api.Tests/CasinoDesk.Api.Tests.csproj" -c Release --no-restore
RUN dotnet publish "apps/backend/CasinoDesk.Api/CasinoDesk.Api.csproj" -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
ENV ASPNETCORE_URLS=http://0.0.0.0:5067
EXPOSE 5067

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "CasinoDesk.Api.dll"]
