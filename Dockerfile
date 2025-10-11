# =====================================
# ChurchFinance - Next.js universal Dockerfile
# Works on macOS + Linux (Dokploy)
# =====================================

# ---------- Build Stage ----------
  FROM node:20-bullseye AS builder
  WORKDIR /app
  
  # Copy dependency files
  COPY package*.json .npmrc ./
  
  # Install all dependencies (including devDeps for Tailwind + DaisyUI)
  RUN npm ci --ignore-scripts || npm install --ignore-scripts
  
  # Copy app source
  COPY . .
  
  # Build production output
  RUN npm run build
  
  # ---------- Runtime Stage ----------
  FROM node:20-slim AS runner
  WORKDIR /app
  ENV NODE_ENV=production
  
  # Copy only necessary runtime files
  COPY --from=builder /app/.next ./.next
  COPY --from=builder /app/public ./public
  COPY --from=builder /app/package*.json ./
  COPY --from=builder /app/next.config.js ./
  
  # Install only production dependencies
  RUN npm install --omit=dev --ignore-scripts
  
  EXPOSE 3000
  CMD ["npm", "run", "start"]