/**
 * Updates the bot's rich presence activity based on server count.
 * @param {import('bloumechat').BloumeChat} client 
 */
async function updateActivity(client) {
  if (!client || !client.user) return;

  let guildCount = 0;
  if (client.guilds && client.guilds.cache) {
    guildCount = client.guilds.cache.size;
  }

  const prefix = process.env.PREFIX || '!';
  const statusText = `Gère les rôles sur ${guildCount} serveur${guildCount > 1 ? 's' : ''} | ${prefix}help`;

  try {
    await client.setActivity({
      type: "playing",
      name: statusText,
      details: "AutoRole & Reaction Roles Bot"
    });
  } catch (error) {
    console.error("[ActivityManager] Erreur mise à jour de l'activité :", error.message);
  }
}

module.exports = {
  updateActivity
};
