const { getSettings } = require('../utils/settingsManager');
const { updateActivity } = require('../utils/activityManager');

/**
 * @param {import('bloumechat').BloumeChat} client 
 * @param {import('bloumechat').Guild} guild 
 */
module.exports = (client, guild) => {
  if (!guild) return;
  console.log(`[GuildCreate] Le bot a rejoint le serveur : ${guild.name} (${guild.id})`);
  getSettings(guild.id);
  updateActivity(client);
};
