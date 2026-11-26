const { updateActivity } = require('../utils/activityManager');
const { bindSocketListeners } = require('../utils/socketListener');

/**
 * @param {import('@bloume/chat').BloumeChat} client 
 */
module.exports = (client) => {
  console.log("🔄 Reconnecté avec succès à BloumeChat !");
  bindSocketListeners(client);
  updateActivity(client);
};
