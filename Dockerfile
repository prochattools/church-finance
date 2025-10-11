# =====================================
# ChurchFinance - Universal Next.js Dockerfile
# Works on macOS (local) + Linux (production)
# =====================================

# ---------- Build Stage ----------
  FROM node:20-bullseye AS builder
  WORKDIR /app
  
  # Copy dependency files
  COPY package*.json .npmrc ./
  
  # Install dependencies safely
  RUN npm ci --omit=dev --ignore-scripts || npm install --omit=dev --ignore-scripts
  
  # Copy app source
  COPY . .
  
  # Build production output
  RUN npm run build
  
  # ---------- Runtime Stage ----------
  FROM node:20-slim AS runner
  WORKDIR /app
  ENV NODE_ENV=production
  
  # Copy built app
  COPY --from=builder /app/.next ./.next
  COPY --from=builder /app/public ./public
  COPY --from=builder /app/package*.json ./
  COPY --from=builder /app/next.config.js ./
  
  # Install only runtime deps
  RUN npm install --omit=dev --ignore-scripts
  
  EXPOSE 3000
  CMD ["npm", "run", "start"]