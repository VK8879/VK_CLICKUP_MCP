# Use Node.js 20 with npm 
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files first (for better caching)
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Build the TypeScript application
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm ci --only=production && npm cache clean --force

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001 -G nodejs

# Change ownership of the app directory
RUN chown -R mcp:nodejs /app
USER mcp

# Expose the port
EXPOSE 8000

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "const http = require('http'); \
  const options = { hostname: 'localhost', port: process.env.PORT || 8000, path: '/health', timeout: 5000 }; \
  const req = http.request(options, (res) => { \
    console.log('Health check status:', res.statusCode); \
    process.exit(res.statusCode === 200 ? 0 : 1); \
  }); \
  req.on('error', (err) => { \
    console.error('Health check failed:', err.message); \
    process.exit(1); \
  }); \
  req.end();" || exit 1

# Start the application
CMD ["node", "build/index.js"]
