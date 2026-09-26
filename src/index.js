require('dotenv').config();
const { BloumeChat } = require('bloumechat');
const fs = require('fs');
const path = require('path');

// Verify token presence
if (!process.env.BOT_TOKEN || process.env.BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
  console.error("❌ ERREUR : Le BOT_TOKEN n'est pas configuré dans le fichier .env !");
  process.exit(1);
}

// Instantiate client
const client = new BloumeChat();
client.commands = new Map();

// Load Commands dynamically
const commandsPath = path.join(__dirname, 'commands');
if (typeof client.loadCommands === 'function') {
  client.loadCommands(commandsPath).then((cmds) => {
    for (const [name] of cmds) {
      console.log(`[Command Loader] Commande chargée : !${name}`);
    }
  }).catch((err) => {
    console.error("[Command Loader] Impossible de charger les commandes :", err);
  });
} else if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    try {
      const command = require(path.join(commandsPath, file));
      if (command.name && typeof command.execute === 'function') {
        client.commands.set(command.name, command);
        console.log(`[Command Loader] Commande chargée : !${command.name}`);
      }
    } catch (error) {
      console.error(`[Command Loader] Impossible de charger la commande ${file}:`, error);
    }
  }
} else {
  console.error(`❌ ERREUR : Le dossier des commandes n'existe pas : ${commandsPath}`);
}

// Bind events
client.on('ready', () => {
  try {
    require('./events/ready')(client);
  } catch (error) {
    console.error("Erreur dans le gestionnaire d'événement 'ready' :", error);
  }
});

client.on('messageCreate', (message) => {
  try {
    require('./events/messageCreate')(client, message);
  } catch (error) {
    console.error("Erreur dans le gestionnaire d'événement 'messageCreate' :", error);
  }
});

client.on('guildMemberAdd', (member) => {
  try {
    require('./events/guildMemberAdd')(client, member);
  } catch (error) {
    console.error("Erreur dans le gestionnaire d'événement 'guildMemberAdd' :", error);
  }
});

client.on('messageReactionAdd', (data) => {
  try {
    require('./events/messageReactionAdd')(client, data);
  } catch (error) {
    console.error("Erreur dans le gestionnaire d'événement 'messageReactionAdd' :", error);
  }
});

client.on('guildCreate', (guild) => {
  try {
    require('./events/guildCreate')(client, guild);
  } catch (error) {
    console.error("Erreur dans le gestionnaire d'événement 'guildCreate' :", error);
  }
});

client.on('guildDelete', (guild) => {
  try {
    require('./events/guildDelete')(client, guild);
  } catch (error) {
    console.error("Erreur dans le gestionnaire d'événement 'guildDelete' :", error);
  }
});

client.on('disconnect', (reason) => {
  console.warn(`⚠️ Déconnecté de BloumeChat (Raison : ${reason || 'Inconnue'}). Tentative de reconnexion automatique...`);
});

client.on('reconnect', () => {
  try {
    console.log("🔄 Reconnecté à BloumeChat !");
    require('./events/reconnect')(client);
  } catch (error) {
    console.error("Erreur dans le gestionnaire d'événement 'reconnect' :", error);
  }
});

// Handle global errors gracefully to prevent crash
client.on('error', (error) => {
  console.error("WebSocket Client Error :", error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception thrown:', error);
});

// Handle graceful shutdown signals to disconnect client cleanly
const handleShutdown = () => {
  console.log("👋 Signal d'arrêt reçu. Fermeture propre du bot...");
  try {
    if (client.activityInterval) {
      clearInterval(client.activityInterval);
    }
    client.destroy();
    console.log("🔌 Déconnexion de BloumeChat réussie. Arrêt du processus.");
  } catch (err) {
    console.error("Erreur lors de la déconnexion :", err);
  }
  process.exit(0);
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

// Login to BloumeChat
console.log("🔄 Connexion à BloumeChat en cours...");
client.login(process.env.BOT_TOKEN).catch(error => {
  console.error("❌ Impossible de se connecter à BloumeChat :", error);
});
