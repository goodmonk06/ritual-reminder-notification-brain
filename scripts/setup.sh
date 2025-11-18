#!/bin/bash

# Setup script for ritual-reminder-notification-brain

set -e

echo "🚀 Setting up Ritual Reminder Notification Brain..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please update it with your configuration."
else
    echo "ℹ️  .env file already exists."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npm run prisma:generate

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update your .env file with the correct DATABASE_URL"
echo "2. Start PostgreSQL: docker-compose -f docker-compose.dev.yml up -d"
echo "3. Run migrations: npm run prisma:migrate"
echo "4. Seed the database: npm run seed"
echo "5. Start development server: npm run dev"
echo ""
