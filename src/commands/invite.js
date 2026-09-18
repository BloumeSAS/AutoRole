const { createEmbed } = require('../utils/embed');

module.exports = {
  name: 'invite',
  aliases: ['botinfo', 'info'],
  description: 'Affiche les informations du bot et son lien d\'invitation.',
  async execute(client, message, args) {
    const embed = createEmbed(
      "🤖 Invitation & Information Bot",
      `**BloumeChat AutoRole Bot** vous permet de gérer facilement l'attribution automatique de rôles et les Reaction Roles sur votre serveur BloumeChat.\n\n` +
      `📌 **Fonctionnalités :**\n` +
      `• Reaction Roles interactifs (création & liaison sur message existant)\n` +
      `• Autorole automatique à l'arrivée (Membres & Bots)\n` +
      `• Attribution de rôles en masse (Tous les membres, Humains ou Bots)\n` +
      `• Configuration multi-serveur (Préfixe, couleurs, permissions)\n\n` +
      `🌐 **Plateforme :** BloumeChat\n` +
      `🔗 **Lien :** Invitez ce bot depuis les paramètres d'application de votre serveur BloumeChat.`,
      message.serverId
    );

    return message.reply({ embeds: [embed] });
  }
};
