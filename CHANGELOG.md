# Changelog

## [Unreleased] - 2025-11-05

### Fixed
- **Production Build Error**: Fixed "Cannot find package 'vite'" error when running production builds
  - Separated development-only code from production code paths
  - Created `server/utils.ts` for shared utilities (log function)
  - Created `server/static.ts` for production static file serving
  - Updated `server/index.ts` to use dynamic imports for vite in development only
  - Production builds now work correctly on all deployment platforms

### Added
- Universal deployment support for multiple platforms:
  - Render (with `render.yaml` configuration)
  - Heroku (with `Procfile`)
  - Railway
  - Fly.io
  - DigitalOcean App Platform
  - AWS EC2 + RDS
  - VPS (Ubuntu)
  - Docker (with `Dockerfile` and `docker-compose.yml`)
- Comprehensive deployment documentation in `DEPLOYMENT.md`
- Environment variables template in `.env.example`
- Docker support with multi-stage builds
- Complete README with setup instructions
- Troubleshooting guide for common deployment issues

### Documentation
- Created `README.md` with project overview and quick start guide
- Created `DEPLOYMENT.md` with platform-specific deployment instructions
- Added `CHANGELOG.md` to track changes
- Updated deployment configurations for production readiness

## Architecture Changes

### Before
```
server/index.ts → imports { setupVite, serveStatic, log } from "./vite"
                  → vite.ts imports vite (dev dependency)
                  → Production build includes vite imports ❌
```

### After
```
server/index.ts → imports { log } from "./utils"
                → imports { serveStatic } from "./static"
                → dynamically imports "./vite" only in development
                → Production build excludes vite completely ✅
```

This separation ensures:
1. Production builds don't bundle development dependencies
2. Faster production builds
3. Smaller bundle sizes
4. Universal deployment compatibility
