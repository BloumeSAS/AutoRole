FROM node:20-slim

# Configuration de l'environnement de production
ENV NODE_ENV=production

# Dossier de travail dans le conteneur
WORKDIR /app

# Copie du manifeste de dépendances (sans le package-lock.json Windows pour éviter le bug npm #4828)
COPY package.json ./

# Installation des dépendances de production avec les bindings natifs Linux et vérification
RUN npm install --omit=dev --include=optional --no-package-lock --no-audit --no-fund && \
    node -e "try { require('@livekit/rtc-ffi-bindings'); } catch (err) { const ver = require('@livekit/rtc-ffi-bindings/package.json').version; const arch = ({ x64: 'x64', arm64: 'arm64' })[process.arch]; if (!arch) throw err; require('child_process').execSync('npm install --no-save --no-package-lock --no-audit --no-fund @livekit/rtc-ffi-bindings-linux-' + arch + '-gnu@' + ver, { stdio: 'inherit' }); }" && \
    node -e "require('bloumechat')" && \
    npm cache clean --force

# Copie des fichiers sources de l'application
COPY src/ ./src/

# Création du dossier de persistance
RUN mkdir -p /app/data

# Commande de démarrage du bot
CMD ["node", "src/index.js"]
