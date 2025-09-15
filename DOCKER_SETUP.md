# Docker Setup für TSADA SSR

## Überblick

Die TSADA Anwendung ist vollständig dockerisiert mit sowohl Development- als auch Production-Konfigurationen.

## Schnellstart

### Production (SSR)
```bash
# Build und starten
docker-compose up --build

# Im Hintergrund laufen lassen
docker-compose up -d --build

# Zugriff auf: http://localhost:3000
```

### Development (mit Hot Reload)
```bash
# Development Modus starten
docker-compose --profile dev up --build

# Zugriff auf: http://localhost:5173
```

## Docker Files

### `Dockerfile` (Production)
- **Multi-stage build** für optimierte Größe
- **Node.js 18 Alpine** für kleinste Image-Größe
- **Non-root user** für Sicherheit
- **Production-optimiert** mit nur notwendigen Dependencies

### `Dockerfile.dev` (Development)
- **Hot reload** support
- **Volume mounting** für Live-Updates
- **Development dependencies** enthalten

### `docker-compose.yml`
- **Production service** auf Port 3000
- **Development service** auf Port 5173 (mit Profile)
- **Health checks** für Production
- **Auto-restart** Konfiguration

## Build Prozess

### Production Build
```bash
# 1. Dependencies installieren (nur production)
# 2. Source code kopieren und full dependencies installieren
# 3. SSR build ausführen (npm run build:ssr)
# 4. Optimiertes runtime image erstellen
# 5. Nur production files kopieren
```

### Image Größen
- **Production**: ~200MB (Alpine + built assets)
- **Development**: ~400MB (mit dev dependencies)

## Kommandos

### Basic Commands
```bash
# Production build und start
docker-compose up --build

# Development mit hot reload
docker-compose --profile dev up --build

# Nur builden ohne starten
docker build -t tsada-ssr .

# Container stoppen
docker-compose down

# Logs anzeigen
docker-compose logs -f
```

### Advanced Commands
```bash
# Specific service builden
docker-compose build tsada-ssr

# Container shell öffnen
docker-compose exec tsada-ssr sh

# Image cleanup
docker system prune -f

# Volumes cleanup
docker-compose down -v
```

## Environment Variables

### Production
```bash
NODE_ENV=production
PORT=3000
```

### Development
```bash
NODE_ENV=development
PORT=5173
```

### Custom Environment
```bash
# .env file erstellen
echo "PORT=8080" > .env
```

## Port Konfiguration

- **Production**: 3000 (default)
- **Development**: 5173 (default)
- **Konfigurierbar** über PORT environment variable

## Volumes

### Development
```yaml
volumes:
  - .:/app                # Source code mounting
  - /app/node_modules     # Node modules cache
```

### Production
Keine volumes - alles ist im Image gebuildet.

## Health Checks

Production container hat automatische Health Checks:
```yaml
healthcheck:
  test: ["CMD", "wget", "--tries=1", "--spider", "http://localhost:3000/"]
  interval: 30s
  timeout: 10s
  retries: 3
```

## Performance Optimizations

### Production Image
- **Multi-stage build** reduziert Image-Größe
- **Alpine Linux** für minimale Base
- **Production dependencies** nur
- **Static asset serving** mit compression

### Development
- **Node modules cache** als volume
- **Hot reload** support
- **Source mapping** aktiviert

## Deployment

### Local Development
```bash
# SSR development mit Docker
docker-compose --profile dev up

# Standard Vite development (ohne Docker)
npm run dev
```

### Production Deployment
```bash
# Docker Hub deployment
docker build -t your-registry/tsada-ssr .
docker push your-registry/tsada-ssr

# Oder mit docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### Cloud Deployment (Examples)

#### Railway/Render
```bash
# Automatisches deployment mit Dockerfile
```

#### AWS ECS/Google Cloud Run
```bash
# Container registry push
docker tag tsada-ssr gcr.io/your-project/tsada-ssr
docker push gcr.io/your-project/tsada-ssr
```

## Troubleshooting

### Port bereits in Verwendung
```bash
# Andere Ports verwenden
PORT=8080 docker-compose up
```

### Build Fehler
```bash
# Cache clearen
docker system prune -f
docker-compose build --no-cache
```

### Development Hot Reload funktioniert nicht
```bash
# Volumes prüfen
docker-compose --profile dev down -v
docker-compose --profile dev up --build
```

### Production Server startet nicht
```bash
# Logs prüfen
docker-compose logs tsada-ssr

# Container debugging
docker-compose exec tsada-ssr sh
```

## File Structure

```
.
├── Dockerfile              # Production build
├── Dockerfile.dev          # Development build
├── docker-compose.yml      # Service orchestration
├── .dockerignore           # Docker ignore patterns
├── server.js               # SSR Express server
├── package.json            # Dependencies & scripts
└── src/
    ├── entry-client.js     # Client hydration
    ├── entry-server.js     # SSR rendering
    └── main.ts             # App factory
```

## Benefits

✅ **Konsistente Environment** - Gleiche Node.js Version überall
✅ **Einfaches Deployment** - Ein Docker Image für alle Umgebungen
✅ **Isolation** - Keine Konflikte mit lokalen Dependencies
✅ **Skalierbarkeit** - Einfache horizontale Skalierung
✅ **CI/CD Ready** - Docker-based Pipeline möglich

## Next Steps

1. **CI/CD Pipeline** setup mit GitHub Actions
2. **Production Environment** Variables konfigurieren
3. **Monitoring** und Logging hinzufügen
4. **Load Balancer** für Multiple Instances