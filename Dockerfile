# ============================================
# Strapi 5 - 69-s1-app2
# Docker image: thanakrit/strapi5:latest
# ============================================

# ---------- Stage 1: Build (compile TS + admin panel) ----------
FROM node:20-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Stage 2: Production ----------
FROM node:20-bookworm-slim AS production

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=1337

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/config ./config
COPY --from=build /app/public ./public
COPY --from=build /app/database ./database
COPY --from=build /app/types ./types

RUN mkdir -p .tmp public/uploads

EXPOSE 1337

CMD ["npm", "run", "start"]
