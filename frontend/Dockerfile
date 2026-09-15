# ---- deps ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_OUTPUT_STANDALONE=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- run ----
# Node 22 LTS (Node 20 n'est plus maintenu), paquets Alpine mis à jour, exécution sous l'utilisateur `node`.
# Le serveur « standalone » de Next n'embarque que les dépendances de production tracées ;
# npm et corepack (et leurs dépendances vulnérables : tar, pacote, sigstore…) sont retirés de l'image.
# Reconstruire avec `docker compose build --pull` pour récupérer la dernière base.
FROM node:22-alpine AS runner
RUN apk upgrade --no-cache \
 && rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /opt/yarn*
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
RUN mkdir -p .next/cache && chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "server.js"]
