# Get base 
FROM mcr.microsoft.com/dotnet/core/sdk:3.1 AS build-env
WORKDIR /app

# Copy csproj and restore as distinct layers
COPY *.csproj ./
RUN dotnet restore

# Copy everything else and build
COPY . ./
RUN dotnet publish -c Release -o out

# Build runtime image
FROM mcr.microsoft.com/dotnet/core/aspnet:3.1
WORKDIR /app
COPY --from=build-env /app/out .

# This entrypoint won't work on Heroku
# ENTRYPOINT ["dotnet", "DatingApp.API.dll"]

# Instead use this for heroku, This allows the our container to use the Heroku-provided port on startup.
CMD ASPNETCORE_URLS=http://*:$PORT dotnet DatingApp.API.dll
