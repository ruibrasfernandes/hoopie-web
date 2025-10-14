#!/bin/bash

# Hoopie Web - Firebase Hosting Deployment Script
# Usage: ./deploy.sh [dev|stag|prod]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if environment argument is provided
if [ -z "$1" ]; then
    print_error "Environment argument is required!"
    echo ""
    echo "Usage: ./deploy.sh [dev|stag|prod]"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh dev   - Deploy to development environment"
    echo "  ./deploy.sh stag  - Deploy to staging environment"
    echo "  ./deploy.sh prod  - Deploy to production environment"
    exit 1
fi

ENVIRONMENT=$1

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|stag|prod)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    echo "Valid options are: dev, stag, prod"
    exit 1
fi

# Set Firebase project based on environment
case $ENVIRONMENT in
    dev)
        FIREBASE_PROJECT="hoopie-dev"
        ENV_FILE=".env.dev"
        ;;
    stag)
        FIREBASE_PROJECT="hoopie-stag"
        ENV_FILE=".env.stag"
        ;;
    prod)
        FIREBASE_PROJECT="hoopie-prod"
        ENV_FILE=".env.prod"
        ;;
esac

print_info "Starting deployment to ${ENVIRONMENT} environment..."
echo ""

# Check current git branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

if [ $? -ne 0 ]; then
    print_warning "Not in a git repository or git not available"
else
    print_info "Current branch: $CURRENT_BRANCH"

    # Validate branch matches environment
    if [ "$CURRENT_BRANCH" != "$ENVIRONMENT" ]; then
        print_error "Branch mismatch!"
        echo ""
        echo "You are trying to deploy to ${ENVIRONMENT} environment"
        echo "But you are currently on branch: ${CURRENT_BRANCH}"
        echo ""
        echo "Please switch to the correct branch:"
        echo "  git checkout ${ENVIRONMENT}"
        echo ""
        exit 1
    fi

    print_success "Branch matches environment: $CURRENT_BRANCH"
fi

echo ""

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    print_error "Environment file $ENV_FILE not found!"
    exit 1
fi

print_success "Found environment file: $ENV_FILE"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI is not installed!"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

print_success "Firebase CLI found"

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    print_error "Not logged in to Firebase!"
    echo "Run: firebase login"
    exit 1
fi

print_success "Firebase authentication verified"

# Copy environment file to .env for build
print_info "Setting up environment variables from $ENV_FILE..."
cp "$ENV_FILE" .env
print_success "Environment variables configured"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
else
    print_info "Dependencies already installed"
fi

# Build the React app
print_info "Building React application for ${ENVIRONMENT}..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Build failed!"
    exit 1
fi

print_success "Build completed successfully"

# Check if build directory exists
if [ ! -d "build" ]; then
    print_error "Build directory not found!"
    exit 1
fi

# Deploy to Firebase Hosting
print_info "Deploying to Firebase Hosting (${FIREBASE_PROJECT})..."
firebase use "$FIREBASE_PROJECT"
firebase deploy --only hosting

if [ $? -ne 0 ]; then
    print_error "Deployment failed!"
    exit 1
fi

print_success "Deployment completed successfully!"
echo ""
print_info "Application deployed to ${ENVIRONMENT} environment"
print_info "Firebase project: ${FIREBASE_PROJECT}"
print_info "URL: https://${FIREBASE_PROJECT}.web.app"
echo ""

# Clean up .env file
rm -f .env
print_info "Cleaned up temporary environment file"

echo ""
print_success "🎉 Deployment process completed!"
