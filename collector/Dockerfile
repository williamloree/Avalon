# Stage 1: Builder - Compile TypeScript et générer Prisma Client
FROM node:18-alpine AS builder

WORKDIR /app

# Installer les dépendances système nécessaires pour la compilation
RUN apk add --no-cache python3 make g++ openssl

# Copier les fichiers de dépendances
COPY package.json package-lock.json ./

# Installer toutes les dépendances (dev + prod)
RUN npm ci

# Copier les fichiers de configuration et source
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Définir une DATABASE_URL factice pour le build
# Elle sera remplacée par la vraie au runtime via docker-compose
ENV DATABASE_URL="postgresql://user:password@localhost:5432/db"

# Générer le client Prisma
RUN npx prisma generate

# Compiler TypeScript (app)
RUN npm run build

# Compiler le seed séparément
RUN npx tsc prisma/seed.ts --outDir dist/prisma --module commonjs --esModuleInterop --resolveJsonModule --skipLibCheck

# Stage 2: Production - Image légère finale
FROM node:18-alpine

WORKDIR /app

# Installer uniquement OpenSSL pour Prisma
RUN apk add --no-cache openssl

# Copier les fichiers de dépendances
COPY package.json package-lock.json ./

# Installer uniquement les dépendances de production
RUN npm ci --only=production && npm cache clean --force

# Copier le schéma Prisma
COPY prisma ./prisma

# Générer le client Prisma en production
RUN npx prisma generate

# Copier le code compilé depuis le builder
COPY --from=builder /app/dist ./dist

# Exposer le port de l'application
EXPOSE 4000

# Variables d'environnement par défaut (peuvent être surchargées)
ENV NODE_ENV=production
ENV PORT=4000

# Commande de démarrage
# 1. Appliquer les migrations Prisma
# 2. Exécuter le seed (compilé en JS)
# 3. Lancer l'application
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && (node dist/prisma/seed.js || true) && node dist/index.js"]
