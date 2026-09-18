const { updateActivity } = require('../utils/activityManager');

/**
 * @param {import('bloumechat').BloumeChat} client 
 * @param {import('bloumechat').Guild} guild 
 */
module.exports = (client, guild) => {
  if (!guild) return;
  console.log(`[GuildDelete] Le bot a été retiré du serveur : ${guild.name || guild.id}`);
  updateActivity(client);
};
