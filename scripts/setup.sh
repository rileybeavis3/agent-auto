#!/bin/bash
set -e

echo "🚀 Setting up Verodex development environment..."

# Check for required tools
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker"
    exit 1
fi

echo "📦 Installing dependencies..."
pnpm install

echo "🔧 Building shared packages..."
pnpm --filter @verodex/types build
pnpm --filter @verodex/crypto build

echo "🐳 Starting infrastructure services (Postgres, Redis)..."
docker-compose -f docker/docker-compose.yml up -d postgres redis

echo "⏳ Waiting for services to be healthy..."
sleep 5

echo "🗄️  Running database migrations..."
# TODO: Add migration command when implemented
# pnpm --filter @verodex/identity migrate

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Copy .env.example to .env and configure"
echo "  2. Run 'pnpm dev' to start all services"
echo "  3. Visit http://localhost:4102/health (Identity service)"
