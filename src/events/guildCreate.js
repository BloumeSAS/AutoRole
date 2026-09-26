const { getSettings } = require('../utils/settingsManager');
const { updateActivity } = require('../utils/activityManager');

/**
 * @param {import('bloumechat').BloumeChat} client 
 * @param {import('bloumechat').Guild} guild 
 */
module.exports = async (client, guild) => {
  if (!guild) return;
  const serverId = guild.id || guild.publicId || guild.serverPublicId || (guild.rawData && (guild.rawData.serverPublicId || guild.rawData.publicId || guild.rawData.id));
  console.log(`[GuildCreate] Le bot a rejoint le serveur : ${guild.name || serverId} (${serverId})`);
  
  if (serverId) {
    getSettings(serverId);
    try {
      await client.guilds.fetchAll();
    } catch (err) {
      console.warn(`[GuildCreate] Erreur lors du fetchAll des serveurs :`, err.message);
    }

    // Refresh socket connection so the backend Socket.io server registers the bot's socket in the new server room
    const socket = client.getSocket ? client.getSocket() : client.socket;
    if (socket) {
      try {
        socket.emit('server:join', { serverPublicId: serverId });
        socket.emit('server:subscribe', { serverPublicId: serverId });
      } catch (e) {}

      setTimeout(() => {
        try {
          const currentSocket = client.getSocket ? client.getSocket() : client.socket;
          if (currentSocket && currentSocket.connected) {
            console.log(`[GuildCreate] Reconnexion automatique du socket pour écouter le nouveau serveur ${serverId}...`);
            currentSocket.disconnect();
            currentSocket.connect();
          }
        } catch (reconnectErr) {
          console.error(`[GuildCreate] Erreur lors de la reconnexion du socket :`, reconnectErr.message);
        }
      }, 500);
    }
  }
  updateActivity(client);
};
