const { handleReactionRole } = require('../utils/autoRoleManager');

/**
 * @param {import('bloumechat').BloumeChat} client 
 * @param {object} data - Reaction event payload
 */
module.exports = async (client, data) => {
  try {
    await handleReactionRole(client, data);
  } catch (error) {
    console.error("[MessageReactionAdd] Erreur lors du traitement du Reaction Role :", error);
  }
};
