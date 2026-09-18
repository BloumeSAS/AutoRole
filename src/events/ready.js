const { updateActivity } = require('../utils/activityManager');
const { getSettings } = require('../utils/settingsManager');
const { bindSocketListeners } = require('../utils/socketListener');

/**
 * @param {import('bloumechat').BloumeChat} client 
 */
module.exports = (client) => {
  console.log(`========================================`);
  console.log(`🤖 Bot AutoRole BloumeChat en ligne !`);
  console.log(`👤 Nom : ${client.user ? client.user.tagString : 'Inconnu'}`);
  console.log(`🆔 ID  : ${client.user ? client.user.id : 'Inconnu'}`);
  console.log(`========================================`);

  // Attach raw socket listeners for reactions
  bindSocketListeners(client);

  // Update rich presence activity
  updateActivity(client);

  if (client.activityInterval) {
    clearInterval(client.activityInterval);
  }
  client.activityInterval = setInterval(() => updateActivity(client), 10 * 60 * 1000);

  // Initialize configurations for all current servers
  try {
    if (client.guilds && client.guilds.cache) {
      for (const guild of client.guilds.cache.values()) {
        getSettings(guild.id);
      }
    }
  } catch (err) {
    console.error("[Ready Event] Erreur lors de l'initialisation des configurations serveurs :", err.message);
  }
};
