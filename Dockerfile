# ============================================================================
# WAJDI & TAYSSIR SERVICES PRO — image de production
#
# Construction :
#   docker build -t wajdi-tayssir .
#
# Exécution (le volume « data » conserve demandes, avis, galerie et photos —
# sans lui, tout serait perdu à chaque redémarrage du conteneur) :
#   docker run -d --name wajdi-tayssir -p 3000:3000 \
#     -v wajdi-data:/app/data \
#     --env-file .env.local \
#     wajdi-tayssir
# ============================================================================

# --------------------------------------------------------------- construction
FROM node:22-alpine AS builder
WORKDIR /app

# Les dépendances sont installées avant le code : tant que package.json ne
# change pas, cette couche est réutilisée et la reconstruction est rapide.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# NEXT_PUBLIC_* est figé à la construction : ces valeurs sont incluses dans le
# code envoyé au navigateur. Redéfinissez-les ici si vous les personnalisez.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_CONTACT_PHONE
ARG NEXT_PUBLIC_CONTACT_EMAIL
RUN npm run build

# ------------------------------------------------------------------ exécution
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data

# `node_modules` est repris tel quel depuis l'étape de construction : c'est le
# seul arbre de dépendances qui a été réellement vérifié au build.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/scripts ./scripts

# Le dossier de données appartient à l'utilisateur non privilégié `node`.
RUN mkdir -p /app/data/uploads && chown -R node:node /app/data
USER node
VOLUME ["/app/data"]
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/fr').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "start"]
