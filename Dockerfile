# =====================================
# ChurchFinance - Next.js + Prisma Dockerfile
# Works for local and Dokploy deployments
# =====================================

# ---------- Build Stage ----------
  FROM node:20-bullseye AS builder
  WORKDIR /app
  
  # Copy dependency files
  COPY package*.json .npmrc ./
  
  # Install dependencies (including dev for Tailwind & Prisma)
  RUN npm ci --ignore-scripts || npm install --ignore-scripts
  
  # Copy all source files
  COPY . .
  
  # ✅ Generate Prisma client before building
  RUN npx prisma generate
  
  # ✅ Build Next.js app
  RUN npm run build
  
  # ---------- Runtime Stage ----------
  FROM node:20-slim AS runner
  WORKDIR /app
  ENV NODE_ENV=production
  
  # Copy only what we need at runtime
  COPY --from=builder /app/.next ./.next
  COPY --from=builder /app/public ./public
  COPY --from=builder /app/package*.json ./
  COPY --from=builder /app/next.config.js ./
  COPY --from=builder /app/prisma ./prisma
  COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
  
  # Install only production dependencies
  RUN npm install --omit=dev --ignore-scripts
  
  # Expose the web port
  EXPOSE 3000
  
  # ✅ Run Prisma generate again (optional safety)
  RUN npx prisma generate
  
  CMD ["npm", "run", "start"]
  