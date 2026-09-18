const { handleJoinAutoRole } = require('../utils/autoRoleManager');

/**
 * @param {import('bloumechat').BloumeChat} client 
 * @param {import('bloumechat').Member} member 
 */
module.exports = async (client, member) => {
  try {
    await handleJoinAutoRole(client, member);
  } catch (error) {
    console.error("[GuildMemberAdd] Erreur lors du traitement de l'autorole d'arrivée :", error);
  }
};
