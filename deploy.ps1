# PowerShell deployment script for different environments
# Usage: .\deploy.ps1 [environment] [frontend-url]

param(
    [string]$Environment = "dev",
    [string]$FrontendUrl = "http://localhost:3000"
)

Write-Host "🚀 Deploying Munhuolto to $Environment environment" -ForegroundColor Green
Write-Host "🌐 Frontend URL: $FrontendUrl" -ForegroundColor Cyan

# Set environment variables
$env:ENVIRONMENT = $Environment
$env:FRONTEND_URL = $FrontendUrl

switch ($Environment) {
    "dev" {
        $env:ALLOW_SELF_SIGNUP = "true"
        Write-Host "📝 Self-signup enabled for development" -ForegroundColor Yellow
    }
    "staging" {
        $env:ALLOW_SELF_SIGNUP = "false"
        Write-Host "🔒 Self-signup disabled for staging" -ForegroundColor Red
    }
    "prod" {
        $env:ALLOW_SELF_SIGNUP = "false"
        Write-Host "🔒 Self-signup disabled for production" -ForegroundColor Red
    }
    default {
        Write-Host "❌ Unknown environment: $Environment" -ForegroundColor Red
        Write-Host "Available environments: dev, staging, prod" -ForegroundColor Yellow
        exit 1
    }
}

# Build and deploy
Write-Host "🔨 Building CDK application..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Synthesizing CloudFormation templates..." -ForegroundColor Blue
npx cdk synth

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Synthesis failed!" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Deploying to AWS..." -ForegroundColor Blue
npx cdk deploy --all --require-approval never

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Outputs:" -ForegroundColor Cyan
    Write-Host "  - Cognito Stack: MunhuoltoCognito-$Environment" -ForegroundColor White
    Write-Host "  - Database Stack: MunhuoltoDatabase-$Environment" -ForegroundColor White
    Write-Host "  - Main Stack: MunhuoltoMain-$Environment" -ForegroundColor White
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}