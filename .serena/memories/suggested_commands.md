# Development Commands

## Essential Commands
```bash
# Install dependencies
yarn install

# Run development server (port 3000)
yarn dev

# Build production bundle
yarn build

# Start production server
yarn start

# Run linting
yarn lint
```

## Git Commands (Darwin/macOS)
```bash
# Check repository status
git status

# Create feature branch
git checkout -b feature/branch-name

# Stage changes
git add .

# Commit with message
git commit -m "feat: description"

# Push to remote
git push origin feature/branch-name

# View commit history
git log --oneline -10
```

## System Commands (Darwin/macOS specific)
```bash
# List files with details
ls -la

# Find files by name
find . -name "*.tsx" -type f

# Search in files (using ripgrep)
rg "pattern" --type ts

# Check port usage
lsof -i :3000

# Kill process on port
kill -9 $(lsof -t -i:3000)
```

## Docker Commands
```bash
# Build Docker image
docker build -t troddit .

# Run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```