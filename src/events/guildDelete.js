const { updateActivity } = require('../utils/activityManager');

/**
 * @param {import('@bloume/chat').BloumeChat} client 
 * @param {import('@bloume/chat').Guild} guild 
 */
module.exports = (client, guild) => {
  if (!guild) return;
  console.log(`[GuildDelete] Le bot a été retiré du serveur : ${guild.name || guild.id}`);
  updateActivity(client);
};
