const { handleReactionRole } = require('../utils/autoRoleManager');

/**
 * @param {import('bloumechat').BloumeChat} client 
 * @param {object} data - Reaction event payload or reaction info
 * @param {import('bloumechat').User} [user] - User who reacted (bloumechat v4.2+)
 * @param {string} [messageId] - Message Public ID (bloumechat v4.2+)
 * @param {'add'|'remove'} [action] - Reaction action type
 */
module.exports = async (client, data, user, messageId, action = 'add') => {
  try {
    await handleReactionRole(client, data, user, messageId, action);
  } catch (error) {
    console.error("[MessageReaction] Erreur lors du traitement du Reaction Role :", error);
  }
};
