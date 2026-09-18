FROM node:20-slim

# Configuration de l'environnement de production
ENV NODE_ENV=production

# Dossier de travail dans le conteneur
WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances de production uniquement
RUN npm install --omit=dev

# Copie des fichiers sources de l'application
COPY src/ ./src/

# Création du dossier de persistance
RUN mkdir -p /app/data

# Commande de démarrage du bot
CMD ["node", "src/index.js"]
