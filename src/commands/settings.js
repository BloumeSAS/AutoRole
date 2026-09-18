const { createEmbed } = require('../utils/embed');
const { getSettings, updateSetting } = require('../utils/settingsManager');

module.exports = {
  name: 'settings',
  aliases: ['config', 'configuration', 'setting'],
  adminOnly: true,
  description: 'Affiche ou modifie la configuration du bot pour ce serveur.',
  async execute(client, message, args) {
    if (!message.serverId) {
      return message.reply("❌ Cette commande ne peut être exécutée que sur un serveur.");
    }

    const currentSettings = getSettings(message.serverId);
    const prefix = currentSettings.prefix || process.env.PREFIX || '!';

    if (!args.length) {
      const settingsEmbed = createEmbed(
        "⚙️ Paramètres du Bot AutoRole",
        `Voici la configuration actuelle pour ce serveur :\n\n` +
        `• **Prefix :** \`${prefix}\`\n` +
        `• **Couleur Thème :** \`${currentSettings.themeColor || '#3b82f6'}\`\n` +
        `• **Pied de page (Footer) :** \`${currentSettings.footer}\`\n` +
        `• **Permission Requise Admin :** \`${currentSettings.adminPermission || 'none'}\`\n\n` +
        `**Pour modifier une valeur :**\n` +
        `• \`${prefix}settings prefix <nouveau_prefix>\`\n` +
        `• \`${prefix}settings color <code_hex>\` (ex: #bd5fff)\n` +
        `• \`${prefix}settings footer <texte>\`\n` +
        `• \`${prefix}settings adminPermission <MANAGE_ROLES|MANAGE_SERVER|ADMINISTRATOR|none>\``,
        message.serverId
      );
      return message.reply({ embeds: [settingsEmbed] });
    }

    const subCommand = args[0].toLowerCase();
    const value = args.slice(1).join(' ');

    if (!value && subCommand !== 'reset') {
      return message.reply(`❌ Veuillez indiquer la nouvelle valeur. Exemple: \`${prefix}settings prefix !\``);
    }

    if (subCommand === 'prefix') {
      if (value.length > 5) {
        return message.reply("❌ Le préfixe ne peut pas dépasser 5 caractères.");
      }
      updateSetting(message.serverId, 'prefix', value);
      const embed = createEmbed("✅ Préfixe Modifié", `Le préfixe pour ce serveur est désormais : \`${value}\``, message.serverId);
      return message.reply({ embeds: [embed] });
    }

    if (subCommand === 'color' || subCommand === 'themecolor') {
      if (!/^#([0-9A-F]{3}){1,2}$/i.test(value)) {
        return message.reply("❌ Code couleur hexadécimal invalide. Format attendu: `#3b82f6` ou `#fff`.");
      }
      updateSetting(message.serverId, 'themeColor', value);
      const embed = createEmbed("✅ Couleur Modifiée", `La couleur des embeds a été mise à jour vers \`${value}\`.`, message.serverId);
      return message.reply({ embeds: [embed] });
    }

    if (subCommand === 'footer') {
      updateSetting(message.serverId, 'footer', value);
      const embed = createEmbed("✅ Pied de Page Modifié", `Le footer des embeds a été mis à jour : "${value}"`, message.serverId);
      return message.reply({ embeds: [embed] });
    }

    if (subCommand === 'adminpermission') {
      const allowed = ['ADMINISTRATOR', 'MANAGE_ROLES', 'MANAGE_SERVER', 'NONE'];
      const uppercaseValue = value.toUpperCase();
      if (!allowed.includes(uppercaseValue)) {
        return message.reply(`❌ Permission invalide. Choisissez parmi : \`${allowed.join(', ')}\``);
      }
      updateSetting(message.serverId, 'adminPermission', uppercaseValue.toLowerCase());
      const embed = createEmbed("✅ Permission Admin Modifiée", `La permission requise pour configurer le bot est maintenant : \`${uppercaseValue}\``, message.serverId);
      return message.reply({ embeds: [embed] });
    }

    return message.reply(`❌ Paramètre inconnu \`${subCommand}\`. Tapez \`${prefix}settings\` pour afficher les options disponibles.`);
  }
};
