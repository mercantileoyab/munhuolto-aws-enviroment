#!/bin/bash

# Deployment script for different environments
# Usage: ./deploy.sh [environment] [frontend-url]

ENVIRONMENT=${1:-dev}
FRONTEND_URL=${2:-"http://localhost:3000"}

echo "🚀 Deploying Munhuolto to $ENVIRONMENT environment"
echo "🌐 Frontend URL: $FRONTEND_URL"

# Set environment variables
export ENVIRONMENT=$ENVIRONMENT
export FRONTEND_URL=$FRONTEND_URL

case $ENVIRONMENT in
  "dev")
    export ALLOW_SELF_SIGNUP=true
    echo "📝 Self-signup enabled for development"
    ;;
  "staging")
    export ALLOW_SELF_SIGNUP=false
    echo "🔒 Self-signup disabled for staging"
    ;;
  "prod")
    export ALLOW_SELF_SIGNUP=false
    echo "🔒 Self-signup disabled for production"
    ;;
  *)
    echo "❌ Unknown environment: $ENVIRONMENT"
    echo "Available environments: dev, staging, prod"
    exit 1
    ;;
esac

# Build and deploy
echo "🔨 Building CDK application..."
npm run build

echo "📦 Synthesizing CloudFormation templates..."
npx cdk synth

echo "🚀 Deploying to AWS..."
npx cdk deploy --all --require-approval never

echo "✅ Deployment complete!"
echo ""
echo "📋 Outputs:"
echo "  - Cognito Stack: MunhuoltoCognito-$ENVIRONMENT"
echo "  - Database Stack: MunhuoltoDatabase-$ENVIRONMENT"
echo "  - Main Stack: MunhuoltoMain-$ENVIRONMENT"