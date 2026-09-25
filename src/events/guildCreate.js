const { getSettings } = require('../utils/settingsManager');
const { updateActivity } = require('../utils/activityManager');

/**
 * @param {import('bloumechat').BloumeChat} client 
 * @param {import('bloumechat').Guild} guild 
 */
module.exports = async (client, guild) => {
  if (!guild) return;
  const serverId = guild.id || guild.publicId || guild.serverPublicId;
  console.log(`[GuildCreate] Le bot a rejoint le serveur : ${guild.name || serverId} (${serverId})`);
  
  if (serverId) {
    getSettings(serverId);
    try {
      await client.guilds.fetch(serverId);
    } catch (err) {
      console.warn(`[GuildCreate] Erreur lors du fetch du serveur ${serverId} :`, err.message);
    }
  }
  updateActivity(client);
};
