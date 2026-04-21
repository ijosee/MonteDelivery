#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# Pueblo Delivery — Local Development Setup
# ═══════════════════════════════════════════════════════════════════════════════
# Initializes the local Supabase environment (PostgreSQL via Docker),
# applies migrations, and seeds the database.
#
# Prerequisites:
#   - Supabase CLI installed (https://supabase.com/docs/guides/cli)
#   - Docker running
#   - Node.js + pnpm installed
#
# Usage:
#   chmod +x scripts/setup.sh
#   ./scripts/setup.sh
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ─── Colores ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}ℹ${NC} $1"; }
log_ok()    { echo -e "${GREEN}✔${NC} $1"; }
log_error() { echo -e "${RED}✖${NC} $1"; }

echo ""
echo "══════════════════════════════════════════════════════════"
echo "  Pueblo Delivery — Inicialización del entorno local"
echo "══════════════════════════════════════════════════════════"
echo ""

# 1. Start Supabase local services (PostgreSQL, Auth, Studio, Storage, Inbucket)
log_info "Iniciando servicios de Supabase..."
supabase start
log_ok "Servicios de Supabase iniciados"
echo ""

# 2. Apply Supabase migrations to the local PostgreSQL
log_info "Aplicando migraciones de Supabase..."
supabase db push --local
log_ok "Migraciones aplicadas"
echo ""

# 3. Seed the database with initial data
log_info "Sembrando datos iniciales..."
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/seed.sql
log_ok "Datos iniciales insertados"
echo ""

# 4. Display connection info
echo "══════════════════════════════════════════════════════════"
echo -e "  ${GREEN}✔ Entorno local listo${NC}"
echo "══════════════════════════════════════════════════════════"
echo ""
echo "Servicios disponibles:"
echo "  • Studio:   http://127.0.0.1:54323"
echo "  • API:      http://127.0.0.1:54321"
echo "  • DB:       postgresql://postgres:postgres@127.0.0.1:54322/postgres"
echo "  • Inbucket: http://127.0.0.1:54324"
echo "  • Web:      http://localhost:3000"
echo ""
echo "Credenciales de acceso:"
echo "  Admin:      admin@pueblodelivery.es / Password123!"
echo "  Owner:      maria@saplaça.es / Password123!"
echo "  Customer:   ana@ejemplo.es / Password123!"
echo ""
echo "Para iniciar la app:"
echo "  pnpm dev"
echo ""
