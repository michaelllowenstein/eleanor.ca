
# =============================================================================

# STARTUP COMMANDS

# =============================================================================

#

# 1. Start PostgreSQL + Redis

#

# docker compose up -d

#

#

# 2. Confirm containers

#

# docker compose ps

#

#

# 3. Test PostgreSQL

#

# docker exec -it eleanor-postgres \

# psql -U eleanor -d eleanor -c "SELECT 1;"

#

#

# Expected

#

# ?column?

# ----------

# 1

#

#

# 4. Test Redis

#

# docker exec -it eleanor-redis redis-cli ping

#

#

# Expected

#

# PONG

#

#

# 5. Generate encryption key

#

# openssl rand -base64 32

#

#

# Copy that output into

#

# CREDENTIAL_ENCRYPTION_KEY=

#

#

# 6. Run migrations

#

# npm run migrate -w @eleanor/api

#

#

# Or, depending on your repo layout

#

# cd server

# npm run migrate

#

#

# 7. Start the API

#

# npm run dev -w @eleanor/api

#

#

# 8. Verify health

#

# curl <http://localhost:3000/api/health>

#

#

# Expected

#

# {

# "status": "ok"

# "database": "ok"

# "redis": "ok"

# }

#

#

# 9. Start your client

#

# npm run local

#

#

# Client

#

# <http://localhost:4141>

# =============================================================================
