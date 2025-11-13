# =====================================
# ChurchFinance - Next.js + Prisma Dockerfile (final version)
# Works on macOS + Linux (Dokploy safe)
# =====================================

# ---------- Build Stage ----------
  FROM node:20-bullseye AS builder
  WORKDIR /app
  
  # Copy dependency files
  COPY package*.json .npmrc ./
  
  # Install dependencies (including devDeps for Tailwind + Prisma)
  RUN npm ci --ignore-scripts || npm install --ignore-scripts
  
  # Copy app source
  COPY . .
  
  # Generate Prisma client
  RUN npx prisma generate
  
  # Build production output
  RUN DISABLE_TS_CHECK=1 SKIP_ENV_VALIDATION=1 npm run build
  
  # ---------- Runtime Stage ----------
  FROM node:20-slim AS runner
  WORKDIR /app
  ENV NODE_ENV=production
  
  # Copy necessary runtime files
  COPY --from=builder /app/.next ./.next
  COPY --from=builder /app/public ./public
  COPY --from=builder /app/package*.json ./
  COPY --from=builder /app/next.config.js ./
  COPY --from=builder /app/prisma ./prisma
  COPY --from=builder /app/dist ./dist
  COPY --from=builder /app/scripts ./scripts
  COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
 
  # 🩹 Fix: force Linux-compatible Next.js SWC binaries
  RUN npm install --omit=dev --ignore-scripts --platform=linux --arch=x64 --force
 
  # Expose app port
  EXPOSE 3000
  
  # Optional: regenerate Prisma client at runtime (safe redundancy)
  RUN npx prisma generate
  
  # Run the Next.js app
  CMD ["npm", "run", "start"]
