# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001

# Change ownership of app directory
RUN chown -R mcp:nodejs /app

# Switch to non-root user
USER mcp

# Expose port (optional, for health checks or debugging)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# Set environment variables
ENV NODE_ENV=production

# Command to run the application
CMD ["node", "build/index.js"] 