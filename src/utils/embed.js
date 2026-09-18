const { EmbedBuilder } = require('bloumechat');
const { getSettings } = require('./settingsManager');

/**
 * Creates a modern pre-configured EmbedBuilder with server settings.
 * @param {string} [title] Optional title
 * @param {string} [description] Optional description
 * @param {string} [serverId] Optional server ID for server-specific styling
 * @returns {EmbedBuilder}
 */
function createEmbed(title = null, description = null, serverId = null) {
  const settings = getSettings(serverId);
  const embed = new EmbedBuilder()
    .setColor(settings.themeColor || "#3b82f6")
    .setTimestamp();
  
  if (title) {
    embed.setTitle(title);
  }
  
  if (description) {
    embed.setDescription(description);
  }

  if (settings.footer) {
    embed.setFooter({ text: settings.footer });
  }

  return embed;
}

module.exports = {
  createEmbed
};
