# 🤖 BloumeChat AutoRole Bot

Un bot d'**AutoRole** et de **Reaction Roles** puissant, moderne et multi-serveurs conçu pour la plateforme **BloumeChat**.

---

## ✨ Fonctionnalités

- **🎭 Reaction Roles (`!rr`)** :
  - Création de messages d'attribution de rôle interactifs avec embeds personnalisés.
  - Ajout de réaction rôles sur des messages existants.
  - Bascule automatique (toggle) : réagir ajoute le rôle, réagir à nouveau le retire.
  - Confirmation automatique envoyée en message privé (DM).
  
- **⚙️ Autorole à l'arrivée (`!autorole`)** :
  - Attribution automatique d'un rôle configuré lors de l'arrivée d'un membre humain.
  - Attribution d'un rôle spécifique pour les comptes bots.
  - Activation / désactivation à tout moment.

- **🛠️ Gestion globale des rôles (`!role`)** :
  - Attribution et retrait de rôles individuels (`!role add`, `!role remove`).
  - Attribution de rôle en masse (`!role all`, `!role humans`, `!role bots`).

- **🌐 Multi-Serveurs & Personnalisation (`!settings`)** :
  - Préfixe personnalisable par serveur.
  - Thème de couleur des embeds personnalisable (Hex).
  - Pied de page (Footer) personnalisable.
  - Restriction des commandes d'administration par permission (`ADMINISTRATOR`, `MANAGE_ROLES`, `MANAGE_SERVER`).

---

## 📜 Liste des Commandes

| Commande | Aliases | Description | Restreint Admin |
| :--- | :--- | :--- | :---: |
| `!rr create #salon "Titre" "Desc" <emoji> <@role>` | `!reactionrole` | Crée un embed interactif de Reaction Role. | 🔒 |
| `!rr add <messageId> <emoji> <@role>` | | Ajoute un Reaction Role sur un message existant. | 🔒 |
| `!rr remove <messageId> <emoji>` | | Retire un Reaction Role d'un message. | 🔒 |
| `!rr list` | | Liste les Reaction Roles actifs du serveur. | 🔒 |
| `!rr clear <messageId>` | | Efface tous les Reaction Roles d'un message. | 🔒 |
| `!autorole user <@role\|off>` | `!joinrole` | Configure le rôle automatique pour les humains. | 🔒 |
| `!autorole bot <@role\|off>` | | Configure le rôle automatique pour les bots. | 🔒 |
| `!autorole toggle <on\|off>` | | Active ou désactive le système d'autorole. | 🔒 |
| `!autorole status` | | Affiche la configuration autorole actuelle. | 🔒 |
| `!role add <@user> <@role>` | `!roles` | Attribue un rôle à un utilisateur. | 🔒 |
| `!role remove <@user> <@role>` | | Retire un rôle à un utilisateur. | 🔒 |
| `!role all <@role>` | | Attribue un rôle à tous les membres. | 🔒 |
| `!role humans <@role>` | | Attribue un rôle à tous les utilisateurs humains. | 🔒 |
| `!role bots <@role>` | | Attribue un rôle à tous les bots. | 🔒 |
| `!settings` | `!config` | Affiche ou modifie la configuration du bot. | 🔒 |
| `!help [commande]` | `!aide` | Affiche le menu d'aide ou l'aide d'une commande. | 🔓 |
| `!invite` | `!info` | Affiche les informations et liens du bot. | 🔓 |

---

## 🚀 Installation & Démarrage

### Prérequis

- [Node.js](https://nodejs.org/) v18 ou plus récent.
- Un jeton de bot (**BOT_TOKEN**) BloumeChat.

### 1. Installation des dépendances

```bash
npm install
```

### 2. Configuration d'environnement

Copiez le fichier `.env.sample` vers `.env` et renseignez votre jeton de bot :

```env
BOT_TOKEN=votre_token_bot_bloumechat
PREFIX=!
```

### 3. Dancement du bot

```bash
npm start
```

---

## 🐳 Déploiement avec Docker

Le projet inclut une configuration Docker prête à l'emploi.

### Avec Docker Compose :

```bash
docker-compose up -d
```

---

## 🛠️ Structure du Projet

```
BloumeChat AutoRole Bot/
├── data/                      # Stockage des configurations et données JSON
├── src/
│   ├── commands/              # Commandes du bot (!rr, !autorole, !role, !settings, !help, !invite)
│   ├── events/                # Événements (ready, messageCreate, guildMemberAdd, messageReactionAdd, etc.)
│   ├── utils/                 # Utilitaires (embed, permissionCheck, settingsManager, autoRoleDb, autoRoleManager)
│   └── index.js               # Entrypoint principal du bot
├── .env.sample                # Modèle de variables d'environnement
├── docker-compose.yml         # Fichier Docker Compose
├── Dockerfile                 # Configuration Docker
├── package.json               # Dépendances du projet
└── README.md                  # Documentation du projet
```

---

## 📄 Licence

Projet publié sous licence MIT. Fait avec ❤️ pour l'écosystème BloumeChat.
