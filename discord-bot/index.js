// index.js - Main Entry Point (UPDATED with Shop UI & Enhanced Leaderboard)
const { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  ActivityType, 
  ComponentType, 
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits
} = require('discord.js');
const config = require('./config.json');
const { pool, initDatabase } = require('./database.js');
const { 
  registerEvents,
  initializeInviteCache
} = require('./events.js');
const { 
  successEmbed, 
  errorEmbed, 
  infoEmbed, 
  warningEmbed,
  economyEmbed, 
  leaderboardEmbed, 
  helpEmbed,
  serverInfoEmbed,
  userInfoEmbed,
  avatarEmbed,
  bannerEmbed,
  botInfoEmbed,
  pingEmbed,
  inviteStatsEmbed,
  inviteLeaderboardEmbed,
  messageStatsEmbed,
  messageLeaderboardEmbed,
  logChannelEmbed,
  ticketCreateEmbed,
  ticketClaimEmbed,
  ticketCloseEmbed,
  ticketReopenEmbed,
  ticketDeleteEmbed,
  ticketRenameEmbed,
  ticketTranscriptEmbed,
  ticketPermissionErrorEmbed,
  banEmbed,
  kickEmbed,
  timeoutEmbed,
  untimeoutEmbed,
  purgeEmbed,
  moderationWarningEmbed,
  warningsListEmbed,
  clearWarningsEmbed,
  shopAddItemEmbed,
  shopEditItemEmbed,
  shopRemoveItemEmbed,
  shopRestockEmbed,
  shopListEmbed,
  sellPanelCreateEmbed,
  sellPanelEditEmbed,
  sellPanelDeleteEmbed,
  backupCreatedEmbed,
  backupRestoredEmbed,
  backupListEmbed,
  backupErrorEmbed,
  backupConfirmRestoreEmbed,
  customEmbed,
  // NEW SHOP UI EMBEDS
  shopMenuEmbed,
  shopCategoryEmbed,
  purchaseConfirmEmbed,
  sellMenuEmbed,
  sellListingEmbed,
  // ENHANCED LEADERBOARD EMBED
  fullLeaderboardEmbed
} = require('./embeds.js');
const { 
  getBalance, 
  getStats, 
  getRank, 
  getCrystalLeaderboardWithUsers,
  getTransactionHistory,
  getUserMessageStats,
  getMessageLeaderboardWithUsers,
  getUserInviteStats,
  getInviteLeaderboardWithUsers,
  createShopCategory,
  getShopCategories,
  createShopItemCommand,
  editShopItemCommand,
  deleteShopItemCommand,
  restockShopItem,
  purchaseShopItem,
  getFullShopList,
  getUserPurchaseHistory,
  createSellPanelCommand,
  editSellPanelCommand,
  deleteSellPanelCommand,
  getSellPanelsByGuild,
  createSellListing,
  getSellListingsByGuild,
  getUserSellListings,
  approveSellListing,
  rejectSellListing,
  completeSellTransactionCommand,
  getUserSellHistory,
  formatSellListingsForDisplay,
  createCustomInviteLink,
  processCustomInviteJoin,
  processCustomInviteLeave,
  getCustomInviteStatsForUser,
  getCustomInviteLeaderboardWithUsers,
  adminAddCrystals,
  adminRemoveCrystals,
  adminSetCrystals
} = require('./economy.js');
const {
  getTicketById,
  getTicketsByGuild,
  getUserTickets,
  getClaimedTickets,
  getOpenTickets,
  getClosedTickets,
  claimTicketById,
  closeTicketById,
  reopenTicketById,
  deleteTicketById,
  renameTicketChannel,
  addUserToTicket,
  removeUserFromTicket,
  generateTranscript,
  getTicketTranscript,
  assignManagerToTicket,
  unassignManagerFromTicket,
  getTicketStatistics,
  getUserTicketStatistics,
  hasTicketManagerRole,
  getGuildTicketConfig,
  updateGuildTicketConfig,
  canCreateTicket
} = require('./tickets.js');
const {
  banUser,
  kickUser,
  timeoutUser,
  untimeoutUser,
  purgeMessages,
  warnUser,
  getUserWarnings,
  clearAllWarnings,
  getUserModerationHistory,
  getGuildModerationStats,
  processAutoMod,
  getAutoModConfig,
  enableAutoMod,
  disableAutoMod,
  updateAutoModConfig,
  addBadWordToGuild,
  removeBadWordFromGuild
} = require('./moderation.js');
const {
  createFullBackup,
  restoreFromBackup,
  listBackups,
  isValidBackupCode,
  getBackupDetails
} = require('./backup.js');
const {
  getBotInfo,
  getServerInfo,
  getUserInfo,
  getUserBanner,
  setLogChannel,
  getLogSettings,
  getRecentLogs,
  getFullCrystalLeaderboard,
  getFullMessageLeaderboard,
  getFullInviteLeaderboard,
  getUserRankInLeaderboard,
  getUserLeaderboardStats,
  getSellPanel
} = require('./utility.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessageTyping
  ],
});

// Raise the listener limit to avoid MaxListenersExceededWarning (we have 15 handlers)
client.setMaxListeners(20);

// ================ SLASH COMMAND DEFINITIONS ================

const commands = [
  // ===== ECONOMY COMMANDS =====
  {
    name: 'balance',
    description: 'Check your crystal balance and stats',
    options: [
      { name: 'user', description: 'Check another user\'s balance', type: 6, required: false }
    ]
  },
  {
    name: 'leaderboard',
    description: 'View the top members in different categories',
    options: [
      {
        name: 'type',
        description: 'Category to rank by',
        type: 3,
        required: false,
        choices: [
          { name: '💎 Crystals', value: 'crystals' },
          { name: '💬 Messages', value: 'messages' },
          { name: '🎯 Invites', value: 'invites' }
        ]
      },
      {
        name: 'page',
        description: 'Page number to view',
        type: 4,
        required: false,
        min_value: 1
      },
      {
        name: 'search',
        description: 'Jump to a specific rank',
        type: 4,
        required: false,
        min_value: 1
      }
    ]
  },
  
  // ===== INVITE COMMANDS =====
  {
    name: 'invites',
    description: 'View your or another user\'s invite stats',
    options: [
      { name: 'user', description: 'User to view invite stats for', type: 6, required: false }
    ]
  },
  {
    name: 'inviteleaderboard',
    description: 'View the top inviters in the server',
    options: [
      { name: 'limit', description: 'Number of users to show (1-10)', type: 4, required: false, min_value: 1, max_value: 10 }
    ]
  },
  
  // ===== CUSTOM INVITE COMMAND =====
  {
    name: 'createinvite',
    description: 'Create a custom invite link',
    options: [
      {
        name: 'max_uses',
        description: 'Maximum uses (0 = unlimited)',
        type: 4,
        required: false,
        min_value: 0
      }
    ]
  },
  
  // ===== MESSAGE COMMANDS =====
  {
    name: 'messages',
    description: 'View your or another user\'s message stats',
    options: [
      { name: 'user', description: 'User to view message stats for', type: 6, required: false }
    ]
  },
  {
    name: 'messageleaderboard',
    description: 'View the top message senders in the server',
    options: [
      { 
        name: 'period', 
        description: 'Time period for the leaderboard', 
        type: 3, 
        required: false,
        choices: [
          { name: 'All Time', value: 'total' },
          { name: 'Today', value: 'daily' },
          { name: 'This Week', value: 'weekly' }
        ]
      },
      { name: 'limit', description: 'Number of users to show (1-10)', type: 4, required: false, min_value: 1, max_value: 10 }
    ]
  },
  
  // ===== SHOP ADMIN COMMANDS =====
  {
    name: 'additem',
    description: 'Add an item to the shop (Admin only)',
    options: [
      { name: 'name', description: 'Item name', type: 3, required: true, max_length: 100 },
      { name: 'price', description: 'Item price in crystals', type: 4, required: true, min_value: 0 },
      { name: 'description', description: 'Item description', type: 3, required: false, max_length: 500 },
      { name: 'stock', description: 'Stock (-1 for unlimited)', type: 4, required: false, min_value: -1 },
      { name: 'category', description: 'Item category', type: 3, required: false, max_length: 50 },
      { name: 'image', description: 'Item image URL', type: 3, required: false },
      { name: 'role', description: 'Role ID to grant on purchase', type: 3, required: false },
      { name: 'limited', description: 'Is this a limited item?', type: 5, required: false },
      { name: 'limit_per_user', description: 'Limit per user', type: 4, required: false, min_value: 1 }
    ]
  },
  {
    name: 'edititem',
    description: 'Edit a shop item (Admin only)',
    options: [
      { name: 'item_id', description: 'ID of the item to edit', type: 4, required: true },
      { name: 'name', description: 'New item name', type: 3, required: false, max_length: 100 },
      { name: 'price', description: 'New item price', type: 4, required: false, min_value: 0 },
      { name: 'description', description: 'New item description', type: 3, required: false, max_length: 500 },
      { name: 'stock', description: 'New stock (-1 for unlimited)', type: 4, required: false, min_value: -1 },
      { name: 'category', description: 'New item category', type: 3, required: false, max_length: 50 },
      { name: 'image', description: 'New item image URL', type: 3, required: false },
      { name: 'role', description: 'New role ID to grant', type: 3, required: false },
      { name: 'limited', description: 'Is this a limited item?', type: 5, required: false },
      { name: 'limit_per_user', description: 'New limit per user', type: 4, required: false, min_value: 1 }
    ]
  },
  {
    name: 'removeitem',
    description: 'Remove an item from the shop (Admin only)',
    options: [
      { name: 'item_id', description: 'ID of the item to remove', type: 4, required: true }
    ]
  },
  {
    name: 'restock',
    description: 'Restock a shop item (Admin only)',
    options: [
      { name: 'item_id', description: 'ID of the item to restock', type: 4, required: true },
      { name: 'amount', description: 'Amount to add to stock', type: 4, required: true, min_value: 1 }
    ]
  },
  {
    name: 'shoplist',
    description: 'View all items in the shop',
    options: [
      { name: 'inactive', description: 'Show inactive items', type: 5, required: false }
    ]
  },
  
  // ===== NEW SHOP UI COMMAND =====
  {
    name: 'shop',
    description: 'Open the interactive shop menu'
  },
  
  // ===== NEW SELL UI COMMAND =====
  {
    name: 'sell',
    description: 'Open the interactive sell system'
  },
  
  // ===== SELL ADMIN COMMANDS =====
  {
    name: 'createsellpanel',
    description: 'Create a new sell panel (Admin only)',
    options: [
      { name: 'title', description: 'Panel title', type: 3, required: true, max_length: 100 },
      { name: 'description', description: 'Panel description', type: 3, required: true, max_length: 1000 },
      { name: 'channel', description: 'Channel for the sell panel', type: 7, required: true },
      { name: 'color', description: 'Embed color (hex code)', type: 3, required: false, max_length: 7 },
      { name: 'thumbnail', description: 'Thumbnail image URL', type: 3, required: false },
      { name: 'require_approval', description: 'Require manager approval for listings?', type: 5, required: false },
      { name: 'auto_delete', description: 'Auto-delete listings after completion?', type: 5, required: false }
    ]
  },
  {
    name: 'editsellpanel',
    description: 'Edit an existing sell panel (Admin only)',
    options: [
      { name: 'panel_id', description: 'ID of the panel to edit', type: 4, required: true },
      { name: 'title', description: 'New panel title', type: 3, required: false, max_length: 100 },
      { name: 'description', description: 'New panel description', type: 3, required: false, max_length: 1000 },
      { name: 'channel', description: 'New channel for the panel', type: 7, required: false },
      { name: 'color', description: 'New embed color (hex code)', type: 3, required: false, max_length: 7 },
      { name: 'thumbnail', description: 'New thumbnail image URL', type: 3, required: false },
      { name: 'require_approval', description: 'Require manager approval for listings?', type: 5, required: false },
      { name: 'auto_delete', description: 'Auto-delete listings after completion?', type: 5, required: false }
    ]
  },
  {
    name: 'deletesellpanel',
    description: 'Delete a sell panel (Admin only)',
    options: [
      { name: 'panel_id', description: 'ID of the panel to delete', type: 4, required: true }
    ]
  },
  
  // ===== TICKET MANAGEMENT COMMANDS =====
  {
    name: 'claim',
    description: 'Claim a ticket (Ticket Manager only)',
    options: [
      { name: 'ticket_id', description: 'ID of the ticket to claim', type: 4, required: true }
    ]
  },
  {
    name: 'close',
    description: 'Close a ticket (Ticket Manager only)',
    options: [
      { name: 'ticket_id', description: 'ID of the ticket to close', type: 4, required: true },
      { name: 'reason', description: 'Reason for closing the ticket', type: 3, required: false, max_length: 200 }
    ]
  },
  {
    name: 'reopen',
    description: 'Reopen a closed ticket (Ticket Manager only)',
    options: [
      { name: 'ticket_id', description: 'ID of the ticket to reopen', type: 4, required: true }
    ]
  },
  {
    name: 'delete',
    description: 'Delete a ticket (generates transcript) (Ticket Manager only)',
    options: [
      { name: 'ticket_id', description: 'ID of the ticket to delete', type: 4, required: true }
    ]
  },
  {
    name: 'rename',
    description: 'Rename a ticket channel (Ticket Manager only)',
    options: [
      { name: 'ticket_id', description: 'ID of the ticket to rename', type: 4, required: true },
      { name: 'name', description: 'New channel name', type: 3, required: true, max_length: 100 }
    ]
  },
  {
    name: 'adduser',
    description: 'Add a user to a ticket (Ticket Manager only)',
    options: [
      { name: 'ticket_id', description: 'ID of the ticket', type: 4, required: true },
      { name: 'user', description: 'User to add', type: 6, required: true }
    ]
  },
  {
    name: 'removeuser',
    description: 'Remove a user from a ticket (Ticket Manager only)',
    options: [
      { name: 'ticket_id', description: 'ID of the ticket', type: 4, required: true },
      { name: 'user', description: 'User to remove', type: 6, required: true }
    ]
  },
  {
    name: 'transcript',
    description: 'Generate a transcript for a ticket (Ticket Manager only)',
    options: [
      { name: 'ticket_id', description: 'ID of the ticket', type: 4, required: true }
    ]
  },
  
  // ===== MODERATION COMMANDS =====
  {
    name: 'ban',
    description: 'Ban a user from the server',
    options: [
      { name: 'user', description: 'User to ban', type: 6, required: true },
      { name: 'reason', description: 'Reason for the ban', type: 3, required: false, max_length: 200 },
      { name: 'delete_days', description: 'Days of messages to delete (0-7)', type: 4, required: false, min_value: 0, max_value: 7 }
    ]
  },
  {
    name: 'kick',
    description: 'Kick a user from the server',
    options: [
      { name: 'user', description: 'User to kick', type: 6, required: true },
      { name: 'reason', description: 'Reason for the kick', type: 3, required: false, max_length: 200 }
    ]
  },
  {
    name: 'timeout',
    description: 'Timeout a user (mute)',
    options: [
      { name: 'user', description: 'User to timeout', type: 6, required: true },
      { name: 'duration', description: 'Duration in minutes (1-40320)', type: 4, required: true, min_value: 1, max_value: 40320 },
      { name: 'reason', description: 'Reason for the timeout', type: 3, required: false, max_length: 200 }
    ]
  },
  {
    name: 'untimeout',
    description: 'Remove timeout from a user',
    options: [
      { name: 'user', description: 'User to untimeout', type: 6, required: true },
      { name: 'reason', description: 'Reason for removing timeout', type: 3, required: false, max_length: 200 }
    ]
  },
  {
    name: 'purge',
    description: 'Delete messages in the channel',
    options: [
      { name: 'amount', description: 'Number of messages to delete (1-100)', type: 4, required: true, min_value: 1, max_value: 100 },
      { name: 'user', description: 'Delete only messages from this user', type: 6, required: false },
      { name: 'reason', description: 'Reason for the purge', type: 3, required: false, max_length: 200 }
    ]
  },
  {
    name: 'warn',
    description: 'Warn a user',
    options: [
      { name: 'user', description: 'User to warn', type: 6, required: true },
      { name: 'reason', description: 'Reason for the warning', type: 3, required: false, max_length: 200 },
      { name: 'points', description: 'Warning points (default: 1)', type: 4, required: false, min_value: 1 }
    ]
  },
  {
    name: 'warnings',
    description: 'View warnings for a user',
    options: [
      { name: 'user', description: 'User to view warnings for', type: 6, required: true }
    ]
  },
  {
    name: 'clearwarnings',
    description: 'Clear all warnings for a user',
    options: [
      { name: 'user', description: 'User to clear warnings for', type: 6, required: true }
    ]
  },
  
  // ===== UTILITY COMMANDS =====
  {
    name: 'ping',
    description: 'Check bot latency and database connection'
  },
  {
    name: 'help',
    description: 'Get help with bot commands and features'
  },
  {
    name: 'serverinfo',
    description: 'View detailed server information'
  },
  {
    name: 'userinfo',
    description: 'View detailed user information',
    options: [
      { name: 'user', description: 'User to view info for', type: 6, required: false }
    ]
  },
  {
    name: 'avatar',
    description: 'View a user\'s avatar',
    options: [
      { name: 'user', description: 'User to view avatar of', type: 6, required: false }
    ]
  },
  {
    name: 'banner',
    description: 'View a user\'s banner',
    options: [
      { name: 'user', description: 'User to view banner of', type: 6, required: false }
    ]
  },
  {
    name: 'botinfo',
    description: 'View bot information and statistics'
  },
  
  // ===== WELCOME/LEAVE COMMANDS =====
  {
    name: 'setwelcome',
    description: 'Configure welcome system (Admin only)',
    options: [
      { name: 'channel', description: 'Channel for welcome messages', type: 7, required: false },
      { name: 'message', description: 'Welcome message (use {user} placeholder)', type: 3, required: false, max_length: 500 },
      { name: 'title', description: 'Embed title', type: 3, required: false, max_length: 100 },
      { name: 'description', description: 'Embed description', type: 3, required: false, max_length: 500 },
      { name: 'color', description: 'Embed color (hex code)', type: 3, required: false, max_length: 7 },
      { name: 'dm_enabled', description: 'Send DM welcome message', type: 5, required: false },
      { name: 'dm_message', description: 'DM welcome message', type: 3, required: false, max_length: 500 },
      { name: 'role', description: 'Auto-assign role on join', type: 8, required: false },
      { name: 'show_count', description: 'Show member count', type: 5, required: false },
      { name: 'show_avatar', description: 'Show user avatar', type: 5, required: false }
    ]
  },
  {
    name: 'setleave',
    description: 'Configure leave system (Admin only)',
    options: [
      { name: 'channel', description: 'Channel for leave messages', type: 7, required: false },
      { name: 'message', description: 'Leave message (use {user} placeholder)', type: 3, required: false, max_length: 500 },
      { name: 'title', description: 'Embed title', type: 3, required: false, max_length: 100 },
      { name: 'description', description: 'Embed description', type: 3, required: false, max_length: 500 },
      { name: 'color', description: 'Embed color (hex code)', type: 3, required: false, max_length: 7 },
      { name: 'show_count', description: 'Show member count', type: 5, required: false },
      { name: 'show_avatar', description: 'Show user avatar', type: 5, required: false }
    ]
  },
  
  // ===== LOGGING COMMAND =====
  {
    name: 'setlogchannel',
    description: 'Set the logging channel (Admin only)',
    options: [
      { name: 'channel', description: 'Channel for logs', type: 7, required: true }
    ]
  },
  
  // ===== AUTOMOD COMMANDS =====
  {
    name: 'automod',
    description: 'Configure AutoMod settings',
    options: [
      {
        name: 'enable',
        description: 'Enable AutoMod',
        type: 1,
        options: []
      },
      {
        name: 'disable',
        description: 'Disable AutoMod',
        type: 1,
        options: []
      },
      {
        name: 'settings',
        description: 'Configure AutoMod settings',
        type: 1,
        options: [
          { name: 'anti_spam', description: 'Enable/disable anti-spam', type: 5, required: false },
          { name: 'anti_invite', description: 'Enable/disable anti-invite links', type: 5, required: false },
          { name: 'anti_bad_words', description: 'Enable/disable bad word filter', type: 5, required: false },
          { name: 'anti_mention_spam', description: 'Enable/disable mention spam protection', type: 5, required: false },
          { name: 'anti_duplicate', description: 'Enable/disable duplicate message protection', type: 5, required: false },
          { name: 'anti_link_spam', description: 'Enable/disable link spam protection', type: 5, required: false },
          { name: 'spam_threshold', description: 'Number of messages to trigger spam (default: 5)', type: 4, required: false, min_value: 3, max_value: 20 },
          { name: 'spam_window', description: 'Time window in seconds (default: 5)', type: 4, required: false, min_value: 3, max_value: 30 },
          { name: 'mention_threshold', description: 'Number of mentions to trigger (default: 3)', type: 4, required: false, min_value: 2, max_value: 10 },
          { name: 'action_type', description: 'Action to take on violation', type: 3, required: false, choices: [
            { name: 'Warn', value: 'warn' },
            { name: 'Timeout', value: 'timeout' },
            { name: 'Log Only', value: 'log' }
          ]},
          { name: 'timeout_duration', description: 'Timeout duration in minutes (default: 5)', type: 4, required: false, min_value: 1, max_value: 60 },
          { name: 'log_channel', description: 'Channel for AutoMod logs', type: 7, required: false }
        ]
      }
    ]
  },
  
  // ===== BACKUP COMMANDS =====
  {
    name: 'backup',
    description: 'Create a full backup of all server data (Admin only)'
  },
  {
    name: 'restore',
    description: 'Restore data from a backup (Admin only)',
    options: [
      { name: 'code', description: 'The backup code to restore from', type: 3, required: true, max_length: 19 }
    ]
  },
  {
    name: 'backuplist',
    description: 'List all backups for this server (Admin only)'
  },
  
 // ===== ADMIN CRYSTAL COMMANDS =====
{
  name: 'add-crystals',
  description: 'Add crystals to a user (Admin only)',
  options: [
    {
      name: 'user',
      description: 'User to add crystals to',
      type: 6, // USER
      required: true
    },
    {
      name: 'amount',
      description: 'Number of crystals to add',
      type: 4, // INTEGER
      required: true,
      min_value: 1,
      max_value: 1000000
    },
    {
      name: 'reason',
      description: 'Reason for adding crystals',
      type: 3, // STRING
      required: false,
      max_length: 200
    }
  ]
},
{
  name: 'remove-crystals',
  description: 'Remove crystals from a user (Admin only)',
  options: [
    {
      name: 'user',
      description: 'User to remove crystals from',
      type: 6, // USER
      required: true
    },
    {
      name: 'amount',
      description: 'Number of crystals to remove',
      type: 4, // INTEGER
      required: true,
      min_value: 1,
      max_value: 1000000
    },
    {
      name: 'reason',
      description: 'Reason for removing crystals',
      type: 3, // STRING
      required: false,
      max_length: 200
    }
  ]
},
{
  name: 'set-crystals',
  description: 'Set a user\'s crystals to a specific amount (Admin only)',
  options: [
    {
      name: 'user',
      description: 'User to set crystals for',
      type: 6, // USER
      required: true
    },
    {
      name: 'amount',
      description: 'Amount of crystals to set',
      type: 4, // INTEGER
      required: true,
      min_value: 0,
      max_value: 1000000
    },
    {
      name: 'reason',
      description: 'Reason for setting crystals',
      type: 3, // STRING
      required: false,
      max_length: 200
    }
  ]
}
  
];

// ================ SLASH COMMAND REGISTRATION ================

const registerCommands = async () => {
  try {
    const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN || config.token);
    
    // Prefer env var, then config, then fall back to the logged-in client's own ID
    const clientId = process.env.CLIENT_ID
      || (config.clientId !== 'YOUR_CLIENT_ID_HERE' ? config.clientId : null)
      || client.user?.id;

    if (!clientId) {
      console.error('❌ No client ID available — set CLIENT_ID env var on Railway');
      return;
    }

    console.log('🔄 Registering slash commands...');
    
    const guildId = process.env.GUILD_ID || config.guildId;
    if (guildId && guildId !== 'YOUR_GUILD_ID_HERE') {
      // Guild registration is instant — skip global to avoid the 1-hour propagation delay
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      console.log(`✅ ${commands.length} guild commands registered (instant)`);
      return;
    }

    // No guild ID — fall back to global registration (up to 1 hour to propagate)
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands }
    );
    console.log(`✅ ${commands.length} global commands registered (1 hour delay)`);
    
  } catch (error) {
    console.error('❌ Failed to register slash commands:', error);
  }
};

// ================ LEADERBOARD HANDLER ================

/**
 * /leaderboard - Enhanced with pagination and categories
 */
const handleLeaderboard = async (interaction) => {
  const type = interaction.options.getString('type') || 'crystals';
  let page = interaction.options.getInteger('page') || 1;
  const searchRank = interaction.options.getInteger('search');
  const guildId = interaction.guildId;
  const userId = interaction.user.id;
  const limit = 10;
  
  try {
    // If searching for a specific rank
    if (searchRank) {
      page = Math.ceil(searchRank / limit);
    }
    
    let data;
    let userRank;
    let userValue;
    
    switch (type) {
      case 'crystals':
        data = await getFullCrystalLeaderboard(guildId, page, limit);
        userRank = await getUserRankInLeaderboard(guildId, userId, 'crystals');
        const crystalStats = await getUserLeaderboardStats(guildId, userId, 'crystals');
        userValue = `${crystalStats.value} 💎`;
        break;
        
      case 'messages':
        data = await getFullMessageLeaderboard(guildId, page, limit);
        userRank = await getUserRankInLeaderboard(guildId, userId, 'messages');
        const msgStats = await getUserLeaderboardStats(guildId, userId, 'messages');
        userValue = `${msgStats.value} messages`;
        break;
        
      case 'invites':
        data = await getFullInviteLeaderboard(guildId, page, limit);
        userRank = await getUserRankInLeaderboard(guildId, userId, 'invites');
        const inviteStats = await getUserLeaderboardStats(guildId, userId, 'invites');
        userValue = `${inviteStats.value} invites`;
        break;
        
      default:
        data = await getFullCrystalLeaderboard(guildId, page, limit);
        userRank = await getUserRankInLeaderboard(guildId, userId, 'crystals');
        const defaultStats = await getUserLeaderboardStats(guildId, userId, 'crystals');
        userValue = `${defaultStats.value} 💎`;
    }
    
    // Fetch usernames for entries
    const enrichedEntries = [];
    for (const entry of data.entries) {
      try {
        const user = await client.users.fetch(entry.user_id);
        enrichedEntries.push({
          ...entry,
          username: user.username
        });
      } catch (err) {
        enrichedEntries.push({
          ...entry,
          username: `Unknown (${entry.user_id})`
        });
      }
    }
    data.entries = enrichedEntries;
    
    const { embed, row } = fullLeaderboardEmbed(data, type, {
      userRank: userRank,
      userValue: userValue,
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      },
      thumbnail: interaction.guild.iconURL()
    });
    
    const message = await interaction.editReply({
      embeds: [embed],
      components: [row],
      fetchReply: true
    });
    
    // Button collector
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120000
    });
    
    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        await i.reply({ content: '❌ These buttons are not for you!', ephemeral: true });
        return;
      }
      
      let newPage = page;
      
      switch (i.customId) {
        case 'lb_first': newPage = 1; break;
        case 'lb_prev': newPage = Math.max(1, page - 1); break;
        case 'lb_next': newPage = Math.min(data.totalPages, page + 1); break;
        case 'lb_last': newPage = data.totalPages; break;
        case 'lb_jump': {
          // Show modal to jump to specific page
          const modal = new ModalBuilder()
            .setCustomId('lb_jump_modal')
            .setTitle('Jump to Page');
          
          const pageInput = new TextInputBuilder()
            .setCustomId('page_number')
            .setLabel(`Enter page number (1-${data.totalPages})`)
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
          
          const row = new ActionRowBuilder().addComponents(pageInput);
          modal.addComponents(row);
          
          await i.showModal(modal);
          return;
        }
      }
      
      // If page changed, refresh data
      if (newPage !== page) {
        page = newPage;
        
        // Re-fetch data for new page
        let newData;
        switch (type) {
          case 'crystals': newData = await getFullCrystalLeaderboard(guildId, page, limit); break;
          case 'messages': newData = await getFullMessageLeaderboard(guildId, page, limit); break;
          case 'invites': newData = await getFullInviteLeaderboard(guildId, page, limit); break;
          default: newData = await getFullCrystalLeaderboard(guildId, page, limit);
        }
        
        // Enrich with usernames
        const enriched = [];
        for (const entry of newData.entries) {
          try {
            const user = await client.users.fetch(entry.user_id);
            enriched.push({ ...entry, username: user.username });
          } catch (err) {
            enriched.push({ ...entry, username: `Unknown (${entry.user_id})` });
          }
        }
        newData.entries = enriched;
        data = newData;
        
        const { embed: newEmbed, row: newRow } = fullLeaderboardEmbed(data, type, {
          userRank: userRank,
          userValue: userValue,
          author: {
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL()
          },
          thumbnail: interaction.guild.iconURL()
        });
        
        await i.update({ embeds: [newEmbed], components: [newRow] });
      }
    });
    
    // Handle jump modal submission
    const modalHandler = async (modalInteraction) => {
      if (!modalInteraction.isModalSubmit()) return;
      if (modalInteraction.customId !== 'lb_jump_modal') return;
      if (modalInteraction.user.id !== interaction.user.id) return;
      
      const pageNum = parseInt(modalInteraction.fields.getTextInputValue('page_number'));
      if (isNaN(pageNum) || pageNum < 1 || pageNum > data.totalPages) {
        await modalInteraction.reply({
          content: `❌ Invalid page number. Please enter a number between 1 and ${data.totalPages}.`,
          ephemeral: true
        });
        return;
      }
      
      page = pageNum;
      
      // Re-fetch data
      let newData;
      switch (type) {
        case 'crystals': newData = await getFullCrystalLeaderboard(guildId, page, limit); break;
        case 'messages': newData = await getFullMessageLeaderboard(guildId, page, limit); break;
        case 'invites': newData = await getFullInviteLeaderboard(guildId, page, limit); break;
        default: newData = await getFullCrystalLeaderboard(guildId, page, limit);
      }
      
      const enriched = [];
      for (const entry of newData.entries) {
        try {
          const user = await client.users.fetch(entry.user_id);
          enriched.push({ ...entry, username: user.username });
        } catch (err) {
          enriched.push({ ...entry, username: `Unknown (${entry.user_id})` });
        }
      }
      newData.entries = enriched;
      data = newData;
      
      const { embed: newEmbed, row: newRow } = fullLeaderboardEmbed(data, type, {
        userRank: userRank,
        userValue: userValue,
        author: {
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL()
        },
        thumbnail: interaction.guild.iconURL()
      });
      
      await modalInteraction.update({ embeds: [newEmbed], components: [newRow] });
    };
    
    // Listen for modal submissions — remove after 5 min to prevent memory leak
    client.once('interactionCreate', modalHandler);
    setTimeout(() => client.removeListener('interactionCreate', modalHandler), 5 * 60 * 1000);
    
  } catch (error) {
    console.error('Error in /leaderboard:', error);
    const embed = errorEmbed('Failed to fetch leaderboard. Please try again later.');
    await interaction.editReply({ embeds: [embed] });
  }
};

// ================ SHOP HANDLER ================

/**
 * /shop - Main shop menu with dropdown
 */
const handleShop = async (interaction) => {
  try {
    const guildId = interaction.guildId;
    const userId = interaction.user.id;
    
    const shopData = await getFullShopList(guildId);
    const balance = await getBalance(userId, guildId);
    
    const embed = shopMenuEmbed(shopData, {
      balance: balance,
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    // Create category dropdown
    const categories = Object.keys(shopData.categories || {});
    const row = new ActionRowBuilder();
    
    if (categories.length > 0) {
      const select = new StringSelectMenuBuilder()
        .setCustomId('shop_category')
        .setPlaceholder('Select a category...')
        .addOptions([
          {
            label: '📋 All Items',
            value: 'all',
            description: 'View all items in the shop',
            emoji: '📋'
          },
          ...categories.slice(0, 24).map(cat => ({
            label: cat.length > 25 ? cat.slice(0, 22) + '...' : cat,
            value: cat,
            description: `View ${cat} items`,
            emoji: '📂'
          }))
        ]);
      row.addComponents(select);
    }
    
    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('shop_view_all')
          .setLabel('📋 View All Items')
          .setStyle(ButtonStyle.Primary)
      );
    
    await interaction.editReply({
      embeds: [embed],
      components: categories.length > 0 ? [row, row2] : [row2]
    });
  } catch (error) {
    console.error('Error in /shop:', error);
    const embed = errorEmbed('Failed to load shop.');
    await interaction.editReply({ embeds: [embed] });
  }
};

// ================ SELL HANDLER ================

/**
 * /sell - Main sell menu
 */
const handleSell = async (interaction) => {
  try {
    const guildId = interaction.guildId;
    
    const panels = await getSellPanelsByGuild(guildId);
    
    const embed = sellMenuEmbed(panels, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    const row = new ActionRowBuilder();
    
    if (panels.length > 0) {
      const select = new StringSelectMenuBuilder()
        .setCustomId('sell_panel_select')
        .setPlaceholder('Select a sell panel...')
        .addOptions([
          ...panels.slice(0, 25).map(panel => ({
            label: panel.title.length > 25 ? panel.title.slice(0, 22) + '...' : panel.title,
            value: panel.panel_id.toString(),
            description: panel.description ? panel.description.slice(0, 50) : 'No description',
            emoji: '💰'
          }))
        ]);
      row.addComponents(select);
    }
    
    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('sell_create_listing')
          .setLabel('📝 Create Listing')
          .setStyle(ButtonStyle.Success)
      );
    
    await interaction.editReply({
      embeds: [embed],
      components: panels.length > 0 ? [row, row2] : [row2]
    });
  } catch (error) {
    console.error('Error in /sell:', error);
    const embed = errorEmbed('Failed to load sell system.');
    await interaction.editReply({ embeds: [embed] });
  }
};

// ================ OTHER COMMAND HANDLERS ================

/**
 * /balance - Check crystal balance
 */
const handleBalance = async (interaction) => {
  const targetUser = interaction.options.getUser('user') || interaction.user;
  const guildId = interaction.guildId;
  const userId = targetUser.id;
  
  try {
    const stats = await getStats(userId, guildId);
    const rank = await getRank(userId, guildId);
    
    const embed = economyEmbed(
      `💎 ${targetUser.username}'s Balance`,
      `Here are the crystal stats for ${targetUser}`,
      {
        balance: stats.crystals,
        wallet: stats.crystals,
        bank: stats.totalEarned - stats.totalSpent,
        streak: stats.messageMilestones || 0,
        author: {
          name: `${targetUser.username}`,
          iconURL: targetUser.displayAvatarURL()
        },
        fields: [
          { name: '📊 Rank', value: `#${rank} out of all members`, inline: true },
          { name: '📈 Total Earned', value: `${stats.totalEarned} 💎`, inline: true },
          { name: '💸 Total Spent', value: `${stats.totalSpent} 💎`, inline: true },
          { name: '💬 Messages', value: `${stats.messages} messages`, inline: true },
          { name: '📅 Message Milestones', value: `${stats.messageMilestones} milestones`, inline: true },
          { name: '🎯 Invites', value: `${stats.invites} invites (${stats.activeInvites} active)`, inline: true }
        ],
        thumbnail: targetUser.displayAvatarURL()
      }
    );
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /balance:', error);
    const embed = errorEmbed('Failed to fetch balance. Please try again later.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /invites - View invite stats
 */
const handleInvites = async (interaction) => {
  const targetUser = interaction.options.getUser('user') || interaction.user;
  const guildId = interaction.guildId;
  
  try {
    const stats = await getUserInviteStats(targetUser.id, guildId);
    
    const embed = inviteStatsEmbed(stats, targetUser, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /invites:', error);
    const embed = errorEmbed('Failed to fetch invite stats.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /inviteleaderboard - View top inviters
 */
const handleInviteLeaderboard = async (interaction) => {
  const limit = interaction.options.getInteger('limit') || 10;
  const guildId = interaction.guildId;
  
  try {
    const data = await getInviteLeaderboardWithUsers(guildId, limit);
    
    const entries = [];
    for (let i = 0; i < data.length; i++) {
      const entry = data[i];
      try {
        const user = await client.users.fetch(entry.user_id);
        entries.push({
          name: user.username,
          joins: entry.total_joins,
          active: entry.active_joins
        });
      } catch (err) {
        entries.push({
          name: `Unknown User (${entry.user_id})`,
          joins: entry.total_joins,
          active: entry.active_joins
        });
      }
    }
    
    const embed = inviteLeaderboardEmbed(entries, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /inviteleaderboard:', error);
    const embed = errorEmbed('Failed to fetch leaderboard.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /createinvite - Create a custom invite
 */
const handleCreateInvite = async (interaction) => {
  const maxUses = interaction.options.getInteger('max_uses') || 0;
  const guildId = interaction.guildId;
  const userId = interaction.user.id;
  
  try {
    const result = await createCustomInviteLink(guildId, userId, maxUses);
    
    const embed = successEmbed('✅ Custom Invite Created', {
      fields: [
        { name: '🔗 Invite Code', value: `\`${result.code}\``, inline: true },
        { name: '📊 Max Uses', value: maxUses === 0 ? '♾️ Unlimited' : `${maxUses}`, inline: true },
        { name: '🔗 Invite Link', value: result.link, inline: false },
        { name: '📝 Info', value: 'Users can join using this invite in any channel.', inline: false }
      ],
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /createinvite:', error);
    const embed = errorEmbed(error.message || 'Failed to create invite.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /messages - View message stats
 */
const handleMessages = async (interaction) => {
  const targetUser = interaction.options.getUser('user') || interaction.user;
  const guildId = interaction.guildId;
  
  try {
    const stats = await getUserMessageStats(targetUser.id, guildId);
    
    const embed = messageStatsEmbed(stats, targetUser, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /messages:', error);
    const embed = errorEmbed('Failed to fetch message stats.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /messageleaderboard - View top message senders
 */
const handleMessageLeaderboard = async (interaction) => {
  const period = interaction.options.getString('period') || 'total';
  const limit = interaction.options.getInteger('limit') || 10;
  const guildId = interaction.guildId;
  
  try {
    const data = await getMessageLeaderboardWithUsers(guildId, limit, period);
    
    const entries = [];
    for (let i = 0; i < data.length; i++) {
      const entry = data[i];
      try {
        const user = await client.users.fetch(entry.user_id);
        entries.push({
          name: user.username,
          count: entry.count
        });
      } catch (err) {
        entries.push({
          name: `Unknown User (${entry.user_id})`,
          count: entry.count
        });
      }
    }
    
    const embed = messageLeaderboardEmbed(entries, period, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /messageleaderboard:', error);
    const embed = errorEmbed('Failed to fetch leaderboard.');
    await interaction.editReply({ embeds: [embed] });
  }
};

// ================ BALANCE COMMAND ================

/**
 * /balance - Check crystal balance
 */

// ================ PING COMMAND ================

/**
 * /ping - Check bot latency
 */
const handlePing = async (interaction) => {
  try {
    const startTime = Date.now();
    
    const dbStart = Date.now();
    await pool.query('SELECT NOW();');
    const dbEnd = Date.now();
    const dbPing = dbEnd - dbStart;
    
    const endTime = Date.now();
    const wsPing = interaction.client.ws.ping;
    const apiPing = endTime - startTime;
    
    const embed = pingEmbed({
      wsPing,
      apiPing,
      dbPing
    }, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /ping:', error);
    const embed = errorEmbed('Failed to ping. Please try again later.');
    await interaction.editReply({ embeds: [embed] });
  }
};

// ================ HELP COMMAND ================

/**
 * /help - Show available commands
 */
const handleHelp = async (interaction) => {
  try {
    const commandList = [
      // Economy
      { name: 'balance', description: 'Check your crystal balance', usage: '/balance [user]', category: 'Economy' },
      { name: 'leaderboard', description: 'View top members in different categories', usage: '/leaderboard [type] [page] [search]', category: 'Economy' },
      
      // Tracking
      { name: 'invites', description: 'View invite stats', usage: '/invites [user]', category: 'Tracking' },
      { name: 'inviteleaderboard', description: 'View top inviters', usage: '/inviteleaderboard [limit]', category: 'Tracking' },
      { name: 'messages', description: 'View message stats', usage: '/messages [user]', category: 'Tracking' },
      { name: 'messageleaderboard', description: 'View top message senders', usage: '/messageleaderboard [period] [limit]', category: 'Tracking' },
      
      // Shop
      { name: 'shop', description: 'Open interactive shop menu', usage: '/shop', category: 'Shop' },
      { name: 'additem', description: 'Add shop item (Admin)', usage: '/additem', category: 'Shop (Admin)' },
      { name: 'edititem', description: 'Edit shop item (Admin)', usage: '/edititem', category: 'Shop (Admin)' },
      { name: 'removeitem', description: 'Remove shop item (Admin)', usage: '/removeitem', category: 'Shop (Admin)' },
      { name: 'restock', description: 'Restock item (Admin)', usage: '/restock', category: 'Shop (Admin)' },
      { name: 'shoplist', description: 'View shop items', usage: '/shoplist', category: 'Shop' },
      
      // Sell
      { name: 'sell', description: 'Open interactive sell system', usage: '/sell', category: 'Sell' },
      { name: 'createsellpanel', description: 'Create sell panel (Admin)', usage: '/createsellpanel', category: 'Sell (Admin)' },
      { name: 'editsellpanel', description: 'Edit sell panel (Admin)', usage: '/editsellpanel', category: 'Sell (Admin)' },
      { name: 'deletesellpanel', description: 'Delete sell panel (Admin)', usage: '/deletesellpanel', category: 'Sell (Admin)' },
      
      // Tickets
      { name: 'claim', description: 'Claim a ticket', usage: '/claim [ticket_id]', category: 'Tickets' },
      { name: 'close', description: 'Close a ticket', usage: '/close [ticket_id]', category: 'Tickets' },
      { name: 'reopen', description: 'Reopen a ticket', usage: '/reopen [ticket_id]', category: 'Tickets' },
      { name: 'delete', description: 'Delete a ticket', usage: '/delete [ticket_id]', category: 'Tickets' },
      { name: 'rename', description: 'Rename ticket channel', usage: '/rename [ticket_id] [name]', category: 'Tickets' },
      { name: 'adduser', description: 'Add user to ticket', usage: '/adduser [ticket_id] [user]', category: 'Tickets' },
      { name: 'removeuser', description: 'Remove user from ticket', usage: '/removeuser [ticket_id] [user]', category: 'Tickets' },
      { name: 'transcript', description: 'Generate ticket transcript', usage: '/transcript [ticket_id]', category: 'Tickets' },
      
      // Moderation
      { name: 'ban', description: 'Ban a user', usage: '/ban [user] [reason]', category: 'Moderation' },
      { name: 'kick', description: 'Kick a user', usage: '/kick [user] [reason]', category: 'Moderation' },
      { name: 'timeout', description: 'Timeout a user', usage: '/timeout [user] [duration]', category: 'Moderation' },
      { name: 'untimeout', description: 'Remove timeout', usage: '/untimeout [user]', category: 'Moderation' },
      { name: 'purge', description: 'Delete messages', usage: '/purge [amount]', category: 'Moderation' },
      { name: 'warn', description: 'Warn a user', usage: '/warn [user] [reason]', category: 'Moderation' },
      { name: 'warnings', description: 'View warnings', usage: '/warnings [user]', category: 'Moderation' },
      { name: 'clearwarnings', description: 'Clear warnings', usage: '/clearwarnings [user]', category: 'Moderation' },
      
      // AutoMod (Admin)
      { name: 'automod enable', description: 'Enable AutoMod', usage: '/automod enable', category: 'AutoMod (Admin)' },
      { name: 'automod disable', description: 'Disable AutoMod', usage: '/automod disable', category: 'AutoMod (Admin)' },
      { name: 'automod settings', description: 'Configure AutoMod', usage: '/automod settings', category: 'AutoMod (Admin)' },
      
      // Backup (Admin)
      { name: 'backup', description: 'Create backup', usage: '/backup', category: 'Backup (Admin)' },
      { name: 'restore', description: 'Restore backup', usage: '/restore [code]', category: 'Backup (Admin)' },
      { name: 'backuplist', description: 'List backups', usage: '/backuplist', category: 'Backup (Admin)' },
      
      // Welcome/Leave (Admin)
      { name: 'setwelcome', description: 'Configure welcome system', usage: '/setwelcome', category: 'Welcome/Leave (Admin)' },
      { name: 'setleave', description: 'Configure leave system', usage: '/setleave', category: 'Welcome/Leave (Admin)' },
      
      // Logging (Admin)
      { name: 'setlogchannel', description: 'Set logging channel', usage: '/setlogchannel [channel]', category: 'Logging (Admin)' },
      
      // Custom Invite
      { name: 'createinvite', description: 'Create a custom invite link', usage: '/createinvite [max_uses]', category: 'Invites' },
      
      // Utility
      { name: 'ping', description: 'Check bot latency', usage: '/ping', category: 'Utility' },
      { name: 'help', description: 'Show this help message', usage: '/help', category: 'Utility' },
      { name: 'serverinfo', description: 'View server information', usage: '/serverinfo', category: 'Utility' },
      { name: 'userinfo', description: 'View user information', usage: '/userinfo [user]', category: 'Utility' },
      { name: 'avatar', description: 'View user avatar', usage: '/avatar [user]', category: 'Utility' },
      { name: 'banner', description: 'View user banner', usage: '/banner [user]', category: 'Utility' },
      { name: 'botinfo', description: 'View bot information', usage: '/botinfo', category: 'Utility' }
    ];
    
    // Group by category
    const categories = {};
    commandList.forEach(cmd => {
      if (!categories[cmd.category]) categories[cmd.category] = [];
      categories[cmd.category].push(cmd);
    });
    
    // Build fields
    const fields = [];
    Object.entries(categories).forEach(([category, commands]) => {
      const commandNames = commands.map(cmd => `\`/${cmd.name}\``).join(' • ');
      fields.push({
        name: `📂 ${category} (${commands.length})`,
        value: commandNames || 'No commands',
        inline: false
      });
    });
    
    const embed = customEmbed({
      color: '#1ABC9C',
      title: '📚 Help Center',
      description: 'Here are all available commands:',
      author: {
        name: interaction.client.user.username,
        iconURL: interaction.client.user.displayAvatarURL()
      },
      fields: fields,
      footer: `Requested by ${interaction.user.username}`,
      timestamp: true
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /help:', error);
    const embed = errorEmbed('Failed to show help. Please try again later.');
    await interaction.editReply({ embeds: [embed] });
  }
};

// ================ UTILITY COMMAND HANDLERS ================

/**
 * /serverinfo - Show server information
 */
const handleServerInfo = async (interaction) => {
  try {
    const info = getServerInfo(interaction.guild);
    
    const embed = serverInfoEmbed(info, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /serverinfo:', error);
    const embed = errorEmbed('Failed to fetch server info.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /userinfo - Show user information
 */
const handleUserInfo = async (interaction) => {
  try {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    
    const info = getUserInfo(targetUser, member);
    
    const embed = userInfoEmbed(info, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /userinfo:', error);
    const embed = errorEmbed('Failed to fetch user info.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /avatar - Show user avatar
 */
const handleAvatar = async (interaction) => {
  try {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const avatarURL = targetUser.displayAvatarURL({ dynamic: true, size: 512 });
    
    const { embed, row } = avatarEmbed(targetUser, avatarURL, {
      requestedBy: interaction.user.username,
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed], components: [row] });
  } catch (error) {
    console.error('Error in /avatar:', error);
    const embed = errorEmbed('Failed to fetch avatar.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /banner - Show user banner
 */
const handleBanner = async (interaction) => {
  try {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const bannerURL = await getUserBanner(targetUser);
    
    const embed = bannerEmbed(targetUser, bannerURL, {
      requestedBy: interaction.user.username,
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /banner:', error);
    const embed = errorEmbed('Failed to fetch banner.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /botinfo - Show bot information
 */
const handleBotInfo = async (interaction) => {
  try {
    const info = getBotInfo(interaction.client);
    
    const embed = botInfoEmbed(info, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /botinfo:', error);
    const embed = errorEmbed('Failed to fetch bot info.');
    await interaction.editReply({ embeds: [embed] });
  }
};

// ================ WELCOME/LEAVE HANDLERS ================

/**
 * /setwelcome - Configure welcome system
 */
const handleSetWelcome = async (interaction) => {
  if (!interaction.memberPermissions.has('Administrator')) {
    const embed = errorEmbed('You need **Administrator** permissions to use this command.');
    await interaction.editReply({ embeds: [embed] });
    return;
  }
  
  const channel = interaction.options.getChannel('channel');
  const message = interaction.options.getString('message');
  const title = interaction.options.getString('title');
  const description = interaction.options.getString('description');
  const color = interaction.options.getString('color');
  const dmEnabled = interaction.options.getBoolean('dm_enabled');
  const dmMessage = interaction.options.getString('dm_message');
  const role = interaction.options.getRole('role');
  const showCount = interaction.options.getBoolean('show_count');
  const showAvatar = interaction.options.getBoolean('show_avatar');
  
  try {
    const { getWelcomeSettings, updateWelcomeSettings } = require('./database.js');
    const current = await getWelcomeSettings(interaction.guildId);
    
    const settings = {
      enabled: true,
      channel_id: channel?.id || current.channel_id,
      message: message || current.message,
      embed_title: title || current.embed_title,
      embed_description: description || current.embed_description,
      embed_color: color || current.embed_color || '#2ECC71',
      dm_enabled: dmEnabled !== null ? dmEnabled : current.dm_enabled,
      dm_message: dmMessage || current.dm_message,
      role_on_join: role?.id || current.role_on_join,
      show_member_count: showCount !== null ? showCount : current.show_member_count,
      show_avatar: showAvatar !== null ? showAvatar : current.show_avatar
    };
    
    await updateWelcomeSettings(interaction.guildId, settings);
    
    const embed = successEmbed('✅ Welcome System Configured', {
      fields: [
        { name: '📢 Channel', value: channel ? `<#${channel.id}>` : 'Not set', inline: true },
        { name: '📊 Status', value: '✅ Enabled', inline: true },
        { name: '📝 Message', value: message || current.message || 'Default welcome message', inline: false },
        { name: '💬 DM Enabled', value: settings.dm_enabled ? '✅ Yes' : '❌ No', inline: true },
        { name: '🎭 Auto Role', value: role ? `<@&${role.id}>` : 'None', inline: true }
      ],
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /setwelcome:', error);
    const embed = errorEmbed(error.message || 'Failed to configure welcome system.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /setleave - Configure leave system
 */
const handleSetLeave = async (interaction) => {
  if (!interaction.memberPermissions.has('Administrator')) {
    const embed = errorEmbed('You need **Administrator** permissions to use this command.');
    await interaction.editReply({ embeds: [embed] });
    return;
  }
  
  const channel = interaction.options.getChannel('channel');
  const message = interaction.options.getString('message');
  const title = interaction.options.getString('title');
  const description = interaction.options.getString('description');
  const color = interaction.options.getString('color');
  const showCount = interaction.options.getBoolean('show_count');
  const showAvatar = interaction.options.getBoolean('show_avatar');
  
  try {
    const { getLeaveSettings, updateLeaveSettings } = require('./database.js');
    const current = await getLeaveSettings(interaction.guildId);
    
    const settings = {
      enabled: true,
      channel_id: channel?.id || current.channel_id,
      message: message || current.message,
      embed_title: title || current.embed_title,
      embed_description: description || current.embed_description,
      embed_color: color || current.embed_color || '#E74C3C',
      show_member_count: showCount !== null ? showCount : current.show_member_count,
      show_avatar: showAvatar !== null ? showAvatar : current.show_avatar
    };
    
    await updateLeaveSettings(interaction.guildId, settings);
    
    const embed = successEmbed('✅ Leave System Configured', {
      fields: [
        { name: '📢 Channel', value: channel ? `<#${channel.id}>` : 'Not set', inline: true },
        { name: '📊 Status', value: '✅ Enabled', inline: true },
        { name: '📝 Message', value: message || current.message || 'Default leave message', inline: false }
      ],
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /setleave:', error);
    const embed = errorEmbed(error.message || 'Failed to configure leave system.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /setlogchannel - Set logging channel
 */
const handleSetLogChannel = async (interaction) => {
  if (!interaction.memberPermissions.has('Administrator')) {
    const embed = errorEmbed('You need **Administrator** permissions to use this command.');
    await interaction.editReply({ embeds: [embed] });
    return;
  }
  
  const channel = interaction.options.getChannel('channel');
  
  try {
    const settings = await setLogChannel(interaction.guildId, channel.id);
    
    const embed = logChannelEmbed(settings, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /setlogchannel:', error);
    const embed = errorEmbed(error.message || 'Failed to set log channel.');
    await interaction.editReply({ embeds: [embed] });
  }
};

// ================ TICKET COMMAND HANDLERS ================

/**
 * /claim - Claim a ticket
 */
const handleClaim = async (interaction) => {
  const ticketId = interaction.options.getInteger('ticket_id');
  
  try {
    const isManager = await hasTicketManagerRole(interaction.guild, interaction.user.id);
    if (!isManager) {
      const embed = ticketPermissionErrorEmbed({
        author: {
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL()
        }
      });
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    const ticket = await getTicketById(ticketId);
    if (!ticket) {
      const embed = errorEmbed('Ticket not found.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    if (ticket.guild_id !== interaction.guildId) {
      const embed = errorEmbed('This ticket does not belong to this server.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    const result = await claimTicketById(ticketId, interaction.user.id);
    
    const embed = ticketClaimEmbed(result, interaction.user, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /claim:', error);
    const embed = errorEmbed(error.message || 'Failed to claim ticket.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /close - Close a ticket
 */
const handleClose = async (interaction) => {
  const ticketId = interaction.options.getInteger('ticket_id');
  const reason = interaction.options.getString('reason');
  
  try {
    const isManager = await hasTicketManagerRole(interaction.guild, interaction.user.id);
    if (!isManager) {
      const embed = ticketPermissionErrorEmbed({
        author: {
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL()
        }
      });
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    const ticket = await getTicketById(ticketId);
    if (!ticket) {
      const embed = errorEmbed('Ticket not found.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    if (ticket.guild_id !== interaction.guildId) {
      const embed = errorEmbed('This ticket does not belong to this server.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    const result = await closeTicketById(ticketId, interaction.user.id, reason);
    
    const embed = ticketCloseEmbed(result, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      },
      reason: reason
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /close:', error);
    const embed = errorEmbed(error.message || 'Failed to close ticket.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /reopen - Reopen a closed ticket
 */
const handleReopen = async (interaction) => {
  const ticketId = interaction.options.getInteger('ticket_id');
  
  try {
    const isManager = await hasTicketManagerRole(interaction.guild, interaction.user.id);
    if (!isManager) {
      const embed = ticketPermissionErrorEmbed({
        author: {
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL()
        }
      });
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    const ticket = await getTicketById(ticketId);
    if (!ticket) {
      const embed = errorEmbed('Ticket not found.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    if (ticket.guild_id !== interaction.guildId) {
      const embed = errorEmbed('This ticket does not belong to this server.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    const result = await reopenTicketById(ticketId, interaction.user.id);
    
    const embed = ticketReopenEmbed(result, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      },
      reopenedBy: interaction.user.id
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /reopen:', error);
    const embed = errorEmbed(error.message || 'Failed to reopen ticket.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /delete - Delete a ticket (with transcript)
 */
const handleDelete = async (interaction) => {
  const ticketId = interaction.options.getInteger('ticket_id');
  
  try {
    const isManager = await hasTicketManagerRole(interaction.guild, interaction.user.id);
    if (!isManager) {
      const embed = ticketPermissionErrorEmbed({
        author: {
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL()
        }
      });
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    const ticket = await getTicketById(ticketId);
    if (!ticket) {
      const embed = errorEmbed('Ticket not found.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    if (ticket.guild_id !== interaction.guildId) {
      const embed = errorEmbed('This ticket does not belong to this server.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    const result = await deleteTicketById(ticketId, interaction.user.id, interaction.channelId);
    
    const embed = ticketDeleteEmbed(result, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      },
      transcript: result.transcript
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /delete:', error);
    const embed = errorEmbed(error.message || 'Failed to delete ticket.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /rename - Rename a ticket channel
 */
const handleRename = async (interaction) => {
  const ticketId = interaction.options.getInteger('ticket_id');
  const newName = interaction.options.getString('name');
  
  try {
    const isManager = await hasTicketManagerRole(interaction.guild, interaction.user.id);
    if (!isManager) {
      const embed = ticketPermissionErrorEmbed({
        author: {
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL()
        }
      });
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    const ticket = await getTicketById(ticketId);
    if (!ticket) {
      const embed = errorEmbed('Ticket not found.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    if (ticket.guild_id !== interaction.guildId) {
      const embed = errorEmbed('This ticket does not belong to this server.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    const channel = await interaction.guild.channels.fetch(ticket.channel_id);
    if (!channel) {
      const embed = errorEmbed('Ticket channel not found.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    const result = await renameTicketChannel(ticketId, interaction.user.id, newName, channel);
    
    const embed = ticketRenameEmbed(result, newName, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      },
      renamedBy: interaction.user.id
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /rename:', error);
    const embed = errorEmbed(error.message || 'Failed to rename ticket channel.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /adduser - Add a user to a ticket
 */
const handleAddUser = async (interaction) => {
  const ticketId = interaction.options.getInteger('ticket_id');
  const targetUser = interaction.options.getUser('user');
  
  try {
    const isManager = await hasTicketManagerRole(interaction.guild, interaction.user.id);
    if (!isManager) {
      const embed = ticketPermissionErrorEmbed({
        author: {
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL()
        }
      });
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    const ticket = await getTicketById(ticketId);
    if (!ticket) {
      const embed = errorEmbed('Ticket not found.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    if (ticket.guild_id !== interaction.guildId) {
      const embed = errorEmbed('This ticket does not belong to this server.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    const channel = await interaction.guild.channels.fetch(ticket.channel_id);
    if (!channel) {
      const embed = errorEmbed('Ticket channel not found.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    const result = await addUserToTicket(ticketId, interaction.user.id, targetUser.id, channel);
    
    const embed = ticketUserAddEmbed(result, targetUser.id, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      },
      addedBy: interaction.user.id
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /adduser:', error);
    const embed = errorEmbed(error.message || 'Failed to add user to ticket.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /removeuser - Remove a user from a ticket
 */
const handleRemoveUser = async (interaction) => {
  const ticketId = interaction.options.getInteger('ticket_id');
  const targetUser = interaction.options.getUser('user');
  
  try {
    const isManager = await hasTicketManagerRole(interaction.guild, interaction.user.id);
    if (!isManager) {
      const embed = ticketPermissionErrorEmbed({
        author: {
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL()
        }
      });
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    const ticket = await getTicketById(ticketId);
    if (!ticket) {
      const embed = errorEmbed('Ticket not found.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    if (ticket.guild_id !== interaction.guildId) {
      const embed = errorEmbed('This ticket does not belong to this server.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    const channel = await interaction.guild.channels.fetch(ticket.channel_id);
    if (!channel) {
      const embed = errorEmbed('Ticket channel not found.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    const result = await removeUserFromTicket(ticketId, interaction.user.id, targetUser.id, channel);
    
    const embed = ticketUserRemoveEmbed(result, targetUser.id, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      },
      removedBy: interaction.user.id
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /removeuser:', error);
    const embed = errorEmbed(error.message || 'Failed to remove user from ticket.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /transcript - Generate a ticket transcript
 */
const handleTranscript = async (interaction) => {
  const ticketId = interaction.options.getInteger('ticket_id');
  
  try {
    const isManager = await hasTicketManagerRole(interaction.guild, interaction.user.id);
    if (!isManager) {
      const embed = ticketPermissionErrorEmbed({
        author: {
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL()
        }
      });
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    const ticket = await getTicketById(ticketId);
    if (!ticket) {
      const embed = errorEmbed('Ticket not found.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    if (ticket.guild_id !== interaction.guildId) {
      const embed = errorEmbed('This ticket does not belong to this server.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    const transcript = await generateTranscript(ticketId, interaction.channelId, interaction.user.id);
    
    const embed = ticketTranscriptEmbed(transcript, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /transcript:', error);
    const embed = errorEmbed(error.message || 'Failed to generate transcript.');
    await interaction.editReply({ embeds: [embed] });
  }
};

// ================ MODERATION COMMAND HANDLERS ================

// [Moderation command handlers - ban, kick, timeout, untimeout, purge, warn, warnings, clearwarnings]
// These are identical to the previous implementation - keeping them short for brevity

/**
 * /ban - Ban a user
 */
const handleBan = async (interaction) => {
  const targetUser = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason') || 'No reason provided';
  const deleteDays = interaction.options.getInteger('delete_days') || 0;
  
  try {
    if (!interaction.memberPermissions.has('BanMembers')) {
      const embed = permissionErrorEmbed('You do not have permission to ban members.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    const result = await banUser(interaction.guild, interaction.user.id, targetUser.id, reason, deleteDays);
    
    const embed = banEmbed(result, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /ban:', error);
    const embed = errorEmbed(error.message || 'Failed to ban user.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /kick - Kick a user
 */
const handleKick = async (interaction) => {
  const targetUser = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason') || 'No reason provided';
  
  try {
    if (!interaction.memberPermissions.has('KickMembers')) {
      const embed = permissionErrorEmbed('You do not have permission to kick members.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    const result = await kickUser(interaction.guild, interaction.user.id, targetUser.id, reason);
    
    const embed = kickEmbed(result, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /kick:', error);
    const embed = errorEmbed(error.message || 'Failed to kick user.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /timeout - Timeout a user
 */
const handleTimeout = async (interaction) => {
  const targetUser = interaction.options.getUser('user');
  const duration = interaction.options.getInteger('duration');
  const reason = interaction.options.getString('reason') || 'No reason provided';
  
  try {
    if (!interaction.memberPermissions.has('ModerateMembers')) {
      const embed = permissionErrorEmbed('You do not have permission to timeout members.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    const result = await timeoutUser(interaction.guild, interaction.user.id, targetUser.id, duration * 60000, reason);
    
    const embed = timeoutEmbed(result, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /timeout:', error);
    const embed = errorEmbed(error.message || 'Failed to timeout user.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /untimeout - Remove timeout from a user
 */
const handleUntimeout = async (interaction) => {
  const targetUser = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason') || 'No reason provided';
  
  try {
    if (!interaction.memberPermissions.has('ModerateMembers')) {
      const embed = permissionErrorEmbed('You do not have permission to remove timeouts.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    const result = await untimeoutUser(interaction.guild, interaction.user.id, targetUser.id, reason);
    
    const embed = untimeoutEmbed(result, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /untimeout:', error);
    const embed = errorEmbed(error.message || 'Failed to remove timeout.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /purge - Purge messages
 */
const handlePurge = async (interaction) => {
  const amount = interaction.options.getInteger('amount');
  const targetUser = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason') || 'No reason provided';
  
  try {
    if (!interaction.memberPermissions.has('ManageMessages')) {
      const embed = permissionErrorEmbed('You do not have permission to manage messages.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    const result = await purgeMessages(interaction.channel, interaction.user.id, amount, reason, targetUser ? targetUser.id : null);
    
    const embed = purgeEmbed(result, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      },
      reason: reason
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /purge:', error);
    const embed = errorEmbed(error.message || 'Failed to purge messages.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /warn - Warn a user
 */
const handleWarn = async (interaction) => {
  const targetUser = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason') || 'No reason provided';
  const points = interaction.options.getInteger('points') || 1;
  
  try {
    if (!interaction.memberPermissions.has('ModerateMembers')) {
      const embed = permissionErrorEmbed('You do not have permission to warn members.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    const result = await warnUser(interaction.guild, interaction.user.id, targetUser.id, reason, points);
    
    const embed = moderationWarningEmbed(result, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /warn:', error);
    const embed = errorEmbed(error.message || 'Failed to warn user.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /warnings - View warnings for a user
 */
const handleWarnings = async (interaction) => {
  const targetUser = interaction.options.getUser('user');
  
  try {
    if (!interaction.memberPermissions.has('ModerateMembers')) {
      const embed = permissionErrorEmbed('You do not have permission to view warnings.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    const data = await getUserWarnings(targetUser.id, interaction.guildId);
    
    const embed = warningsListEmbed(data, targetUser, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      },
      thumbnail: targetUser.displayAvatarURL()
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /warnings:', error);
    const embed = errorEmbed(error.message || 'Failed to fetch warnings.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /clearwarnings - Clear all warnings for a user
 */
const handleClearWarnings = async (interaction) => {
  const targetUser = interaction.options.getUser('user');
  
  try {
    if (!interaction.memberPermissions.has('ModerateMembers')) {
      const embed = permissionErrorEmbed('You do not have permission to clear warnings.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    const result = await clearAllWarnings(targetUser.id, interaction.guildId, interaction.user.id);
    
    const embed = clearWarningsEmbed(result, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /clearwarnings:', error);
    const embed = errorEmbed(error.message || 'Failed to clear warnings.');
    await interaction.editReply({ embeds: [embed] });
  }
};

// ================ SHOP ADMIN COMMAND HANDLERS ================

/**
 * /additem - Add a shop item
 */
const handleAddItem = async (interaction) => {
  if (!interaction.memberPermissions.has('Administrator')) {
    const embed = errorEmbed('You need **Administrator** permissions to use this command.');
    await interaction.editReply({ embeds: [embed] });
    return;
  }
  
  const name = interaction.options.getString('name');
  const price = interaction.options.getInteger('price');
  const description = interaction.options.getString('description');
  const stock = interaction.options.getInteger('stock') || -1;
  const category = interaction.options.getString('category');
  const imageUrl = interaction.options.getString('image');
  const roleId = interaction.options.getString('role');
  const isLimited = interaction.options.getBoolean('limited') || false;
  const limitPerUser = interaction.options.getInteger('limit_per_user') || 1;
  
  try {
    const result = await createShopItemCommand(interaction.guildId, {
      name, price, description, stock, category, imageUrl, roleId, isLimited, limitPerUser
    });
    
    const embed = shopAddItemEmbed(result.item, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /additem:', error);
    const embed = errorEmbed(error.message || 'Failed to add item.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /edititem - Edit a shop item
 */
const handleEditItem = async (interaction) => {
  if (!interaction.memberPermissions.has('Administrator')) {
    const embed = errorEmbed('You need **Administrator** permissions to use this command.');
    await interaction.editReply({ embeds: [embed] });
    return;
  }
  
  const itemId = interaction.options.getInteger('item_id');
  const name = interaction.options.getString('name');
  const price = interaction.options.getInteger('price');
  const description = interaction.options.getString('description');
  const stock = interaction.options.getInteger('stock');
  const category = interaction.options.getString('category');
  const imageUrl = interaction.options.getString('image');
  const roleId = interaction.options.getString('role');
  const isLimited = interaction.options.getBoolean('limited');
  const limitPerUser = interaction.options.getInteger('limit_per_user');
  
  try {
    const updateData = {};
    if (name !== null) updateData.name = name;
    if (price !== null) updateData.price = price;
    if (description !== null) updateData.description = description;
    if (stock !== null) updateData.stock = stock;
    if (category !== null) updateData.category = category;
    if (imageUrl !== null) updateData.image_url = imageUrl;
    if (roleId !== null) updateData.role_id = roleId;
    if (isLimited !== null) updateData.is_limited = isLimited;
    if (limitPerUser !== null) updateData.limit_per_user = limitPerUser;
    
    const result = await editShopItemCommand(itemId, interaction.guildId, updateData);
    
    const embed = shopEditItemEmbed(result.item, updateData, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /edititem:', error);
    const embed = errorEmbed(error.message || 'Failed to edit item.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /removeitem - Remove a shop item
 */
const handleRemoveItem = async (interaction) => {
  if (!interaction.memberPermissions.has('Administrator')) {
    const embed = errorEmbed('You need **Administrator** permissions to use this command.');
    await interaction.editReply({ embeds: [embed] });
    return;
  }
  
  const itemId = interaction.options.getInteger('item_id');
  
  try {
    const result = await deleteShopItemCommand(itemId, interaction.guildId);
    
    const embed = shopRemoveItemEmbed(result.item, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /removeitem:', error);
    const embed = errorEmbed(error.message || 'Failed to remove item.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /restock - Restock a shop item
 */
const handleRestock = async (interaction) => {
  if (!interaction.memberPermissions.has('Administrator')) {
    const embed = errorEmbed('You need **Administrator** permissions to use this command.');
    await interaction.editReply({ embeds: [embed] });
    return;
  }
  
  const itemId = interaction.options.getInteger('item_id');
  const amount = interaction.options.getInteger('amount');
  
  try {
    const result = await restockShopItem(itemId, interaction.guildId, amount);
    
    const embed = shopRestockEmbed(result.item, amount, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /restock:', error);
    const embed = errorEmbed(error.message || 'Failed to restock item.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /shoplist - View all shop items
 */
const handleShopList = async (interaction) => {
  try {
    const includeInactive = interaction.options.getBoolean('inactive') || false;
    const shopData = await getFullShopList(interaction.guildId, includeInactive);
    
    const embed = shopListEmbed(shopData, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /shoplist:', error);
    const embed = errorEmbed('Failed to fetch shop list.');
    await interaction.editReply({ embeds: [embed] });
  }
};

// ================ SELL ADMIN COMMAND HANDLERS ================

/**
 * /createsellpanel - Create a sell panel
 */
const handleCreateSellPanel = async (interaction) => {
  if (!interaction.memberPermissions.has('Administrator')) {
    const embed = errorEmbed('You need **Administrator** permissions to use this command.');
    await interaction.editReply({ embeds: [embed] });
    return;
  }
  
  const title = interaction.options.getString('title');
  const description = interaction.options.getString('description');
  const channel = interaction.options.getChannel('channel');
  const color = interaction.options.getString('color') || '#F39C12';
  const thumbnail = interaction.options.getString('thumbnail');
  const requireApproval = interaction.options.getBoolean('require_approval') ?? true;
  const autoDelete = interaction.options.getBoolean('auto_delete') || false;
  
  try {
    const result = await createSellPanelCommand(interaction.guildId, channel.id, {
      title, description, color, thumbnailUrl: thumbnail, requireApproval, autoDelete
    });
    
    const embed = sellPanelCreateEmbed(result.panel, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      },
      thumbnail: thumbnail || null
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /createsellpanel:', error);
    const embed = errorEmbed(error.message || 'Failed to create sell panel.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /editsellpanel - Edit a sell panel
 */
const handleEditSellPanel = async (interaction) => {
  if (!interaction.memberPermissions.has('Administrator')) {
    const embed = errorEmbed('You need **Administrator** permissions to use this command.');
    await interaction.editReply({ embeds: [embed] });
    return;
  }
  
  const panelId = interaction.options.getInteger('panel_id');
  const title = interaction.options.getString('title');
  const description = interaction.options.getString('description');
  const channel = interaction.options.getChannel('channel');
  const color = interaction.options.getString('color');
  const thumbnail = interaction.options.getString('thumbnail');
  const requireApproval = interaction.options.getBoolean('require_approval');
  const autoDelete = interaction.options.getBoolean('auto_delete');
  
  try {
    const updateData = {};
    if (title !== null) updateData.title = title;
    if (description !== null) updateData.description = description;
    if (channel !== null) updateData.channel_id = channel.id;
    if (color !== null) updateData.color = color;
    if (thumbnail !== null) updateData.thumbnail_url = thumbnail;
    if (requireApproval !== null) updateData.require_approval = requireApproval;
    if (autoDelete !== null) updateData.auto_delete = autoDelete;
    
    const result = await editSellPanelCommand(panelId, interaction.guildId, updateData);
    
    const embed = sellPanelEditEmbed(result.panel, updateData, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /editsellpanel:', error);
    const embed = errorEmbed(error.message || 'Failed to edit sell panel.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /deletesellpanel - Delete a sell panel
 */
const handleDeleteSellPanel = async (interaction) => {
  if (!interaction.memberPermissions.has('Administrator')) {
    const embed = errorEmbed('You need **Administrator** permissions to use this command.');
    await interaction.editReply({ embeds: [embed] });
    return;
  }
  
  const panelId = interaction.options.getInteger('panel_id');
  
  try {
    const result = await deleteSellPanelCommand(panelId, interaction.guildId);
    
    const embed = sellPanelDeleteEmbed(result.panel, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /deletesellpanel:', error);
    const embed = errorEmbed(error.message || 'Failed to delete sell panel.');
    await interaction.editReply({ embeds: [embed] });
  }
};

// ================ AUTOMOD COMMAND HANDLERS ================

/**
 * /automod enable - Enable AutoMod
 */
const handleAutoModEnable = async (interaction) => {
  if (!interaction.memberPermissions.has('Administrator')) {
    const embed = errorEmbed('You need **Administrator** permissions to use this command.');
    await interaction.editReply({ embeds: [embed] });
    return;
  }
  
  try {
    await enableAutoMod(interaction.guildId);
    
    const embed = successEmbed('✅ AutoMod Enabled', {
      fields: [
        { name: '📊 Status', value: '🟢 Enabled', inline: true },
        { name: '🛡️ Protection', value: 'Active', inline: true }
      ],
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /automod enable:', error);
    const embed = errorEmbed(error.message || 'Failed to enable AutoMod.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /automod disable - Disable AutoMod
 */
const handleAutoModDisable = async (interaction) => {
  if (!interaction.memberPermissions.has('Administrator')) {
    const embed = errorEmbed('You need **Administrator** permissions to use this command.');
    await interaction.editReply({ embeds: [embed] });
    return;
  }
  
  try {
    await disableAutoMod(interaction.guildId);
    
    const embed = successEmbed('✅ AutoMod Disabled', {
      fields: [
        { name: '📊 Status', value: '🔴 Disabled', inline: true },
        { name: '🛡️ Protection', value: 'Inactive', inline: true }
      ],
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /automod disable:', error);
    const embed = errorEmbed(error.message || 'Failed to disable AutoMod.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /automod settings - Configure AutoMod
 */
const handleAutoModSettings = async (interaction) => {
  if (!interaction.memberPermissions.has('Administrator')) {
    const embed = errorEmbed('You need **Administrator** permissions to use this command.');
    await interaction.editReply({ embeds: [embed] });
    return;
  }
  
  const antiSpam = interaction.options.getBoolean('anti_spam');
  const antiInvite = interaction.options.getBoolean('anti_invite');
  const antiBadWords = interaction.options.getBoolean('anti_bad_words');
  const antiMentionSpam = interaction.options.getBoolean('anti_mention_spam');
  const antiDuplicate = interaction.options.getBoolean('anti_duplicate');
  const antiLinkSpam = interaction.options.getBoolean('anti_link_spam');
  const spamThreshold = interaction.options.getInteger('spam_threshold');
  const spamWindow = interaction.options.getInteger('spam_window');
  const mentionThreshold = interaction.options.getInteger('mention_threshold');
  const actionType = interaction.options.getString('action_type');
  const timeoutDuration = interaction.options.getInteger('timeout_duration');
  const logChannel = interaction.options.getChannel('log_channel');
  
  try {
    const settings = {};
    if (antiSpam !== null) settings.anti_spam = antiSpam;
    if (antiInvite !== null) settings.anti_invite = antiInvite;
    if (antiBadWords !== null) settings.anti_bad_words = antiBadWords;
    if (antiMentionSpam !== null) settings.anti_mention_spam = antiMentionSpam;
    if (antiDuplicate !== null) settings.anti_duplicate = antiDuplicate;
    if (antiLinkSpam !== null) settings.anti_link_spam = antiLinkSpam;
    if (spamThreshold !== null) settings.spam_threshold = spamThreshold;
    if (spamWindow !== null) settings.spam_window = spamWindow;
    if (mentionThreshold !== null) settings.mention_threshold = mentionThreshold;
    if (actionType !== null) settings.action_type = actionType;
    if (timeoutDuration !== null) settings.timeout_duration = timeoutDuration;
    if (logChannel !== null) settings.log_channel = logChannel.id;
    
    await updateAutoModConfig(interaction.guildId, settings);
    
    const updatedSettings = await getAutoModConfig(interaction.guildId);
    
    const embed = successEmbed('✅ AutoMod Settings Updated', {
      fields: [
        { name: '🛡️ Anti-Spam', value: updatedSettings.anti_spam ? '✅' : '❌', inline: true },
        { name: '🚫 Anti-Invite', value: updatedSettings.anti_invite ? '✅' : '❌', inline: true },
        { name: '📝 Anti-Bad Words', value: updatedSettings.anti_bad_words ? '✅' : '❌', inline: true },
        { name: '👥 Anti-Mention Spam', value: updatedSettings.anti_mention_spam ? '✅' : '❌', inline: true },
        { name: '🔄 Anti-Duplicate', value: updatedSettings.anti_duplicate ? '✅' : '❌', inline: true },
        { name: '🔗 Anti-Link Spam', value: updatedSettings.anti_link_spam ? '✅' : '❌', inline: true },
        { name: '📊 Spam Threshold', value: `${updatedSettings.spam_threshold} in ${updatedSettings.spam_window}s`, inline: true },
        { name: '👥 Mention Threshold', value: `${updatedSettings.mention_threshold}`, inline: true },
        { name: '⚡ Action Type', value: updatedSettings.action_type.toUpperCase(), inline: true },
        { name: '⏱️ Timeout Duration', value: `${updatedSettings.timeout_duration} minutes`, inline: true },
        { name: '📢 Log Channel', value: updatedSettings.log_channel ? `<#${updatedSettings.log_channel}>` : 'Not set', inline: true }
      ],
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /automod settings:', error);
    const embed = errorEmbed(error.message || 'Failed to update AutoMod settings.');
    await interaction.editReply({ embeds: [embed] });
  }
};

// ================ BACKUP COMMAND HANDLERS ================

/**
 * /backup - Create a full backup
 */
const handleBackup = async (interaction) => {
  if (!interaction.memberPermissions.has('Administrator')) {
    const embed = backupErrorEmbed({ message: 'You need **Administrator** permissions to use this command.' }, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    await interaction.editReply({ embeds: [embed] });
    return;
  }
  
  try {
    const result = await createFullBackup(interaction.guildId, interaction.user.id);
    
    const embed = backupCreatedEmbed(result, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /backup:', error);
    const embed = backupErrorEmbed({ message: error.message || 'Failed to create backup.' }, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /restore - Restore from a backup
 */
const handleRestore = async (interaction) => {
  if (!interaction.memberPermissions.has('Administrator')) {
    const embed = backupErrorEmbed({ message: 'You need **Administrator** permissions to use this command.' }, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    await interaction.editReply({ embeds: [embed] });
    return;
  }
  
  const backupCode = interaction.options.getString('code');
  
  try {
    if (!isValidBackupCode(backupCode)) {
      const embed = backupErrorEmbed({ message: 'Invalid backup code format. Use the code provided when creating the backup.' }, {
        author: {
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL()
        }
      });
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    const details = await getBackupDetails(backupCode);
    
    if (!details || !details.backup) {
      const embed = backupErrorEmbed({ message: 'Backup not found. Please check the code and try again.' }, {
        author: {
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL()
        }
      });
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    if (details.backup.guild_id !== interaction.guildId) {
      const embed = backupErrorEmbed({ message: 'This backup belongs to a different server.' }, {
        author: {
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL()
        }
      });
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    const confirmEmbed = backupConfirmRestoreEmbed(details.backup, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('confirm_restore')
          .setLabel('✅ Confirm Restore')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('cancel_restore')
          .setLabel('❌ Cancel')
          .setStyle(ButtonStyle.Secondary)
      );
    
    const message = await interaction.editReply({
      embeds: [confirmEmbed],
      components: [row]
    });
    
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000,
      max: 1
    });
    
    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        await i.reply({ content: '❌ These buttons are not for you!', ephemeral: true });
        return;
      }
      
      if (i.customId === 'confirm_restore') {
        await i.update({ embeds: [infoEmbed('⏳ Restoring backup... Please wait.')], components: [] });
        
        try {
          const result = await restoreFromBackup(backupCode, interaction.guildId, interaction.user.id);
          
          const embed = backupRestoredEmbed(result, {
            author: {
              name: interaction.user.username,
              iconURL: interaction.user.displayAvatarURL()
            }
          });
          
          await i.editReply({ embeds: [embed], components: [] });
        } catch (error) {
          console.error('Error in restore:', error);
          const embed = backupErrorEmbed({ message: error.message || 'Failed to restore backup.' }, {
            author: {
              name: interaction.user.username,
              iconURL: interaction.user.displayAvatarURL()
            }
          });
          await i.editReply({ embeds: [embed], components: [] });
        }
      } else {
        await i.update({
          embeds: [infoEmbed('❌ Restore cancelled.')],
          components: []
        });
      }
    });
    
    collector.on('end', async () => {
      row.components.forEach(btn => btn.setDisabled(true));
      await message.edit({ components: [row] }).catch(() => {});
    });
    
  } catch (error) {
    console.error('Error in /restore:', error);
    const embed = backupErrorEmbed({ message: error.message || 'Failed to restore backup.' }, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /backuplist - List all backups
 */
const handleBackupList = async (interaction) => {
  if (!interaction.memberPermissions.has('Administrator')) {
    const embed = backupErrorEmbed({ message: 'You need **Administrator** permissions to use this command.' }, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    await interaction.editReply({ embeds: [embed] });
    return;
  }
  
  try {
    const data = await listBackups(interaction.guildId);
    
    const embed = backupListEmbed(data, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /backuplist:', error);
    const embed = backupErrorEmbed({ message: error.message || 'Failed to list backups.' }, {
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    await interaction.editReply({ embeds: [embed] });
  }
};

// ================ PERMISSION ERROR EMBED HELPER ================

const permissionErrorEmbed = (error, options = {}) => {
  return new EmbedBuilder()
    .setColor('#ED4245')
    .setTitle('⛔ Permission Denied')
    .setDescription(error || 'You do not have permission to perform this action.')
    .setAuthor({
      name: options.author?.name || 'Unknown',
      iconURL: options.author?.iconURL || null
    })
    .setTimestamp()
    .setFooter({ text: 'Moderation System' });
};

// ================ TICKET USER ADD/REMOVE EMBED HELPERS ================

const ticketUserAddEmbed = (result, options = {}) => {
  return new EmbedBuilder()
    .setColor('#2ECC71')
    .setTitle('👤 User Added')
    .setDescription(`User has been added to the ticket #${result.ticket.ticket_id}`)
    .setAuthor({
      name: options.author?.name || 'Unknown',
      iconURL: options.author?.iconURL || null
    })
    .addFields(
      { name: '🎫 Ticket ID', value: `#${result.ticket.ticket_id}`, inline: true },
      { name: '👤 Added User', value: `<@${result.addedUser}>`, inline: true },
      { name: '👤 Added By', value: `<@${options.addedBy}>`, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: 'Ticket System' });
};

const ticketUserRemoveEmbed = (result, options = {}) => {
  return new EmbedBuilder()
    .setColor('#E74C3C')
    .setTitle('🚫 User Removed')
    .setDescription(`User has been removed from the ticket #${result.ticket.ticket_id}`)
    .setAuthor({
      name: options.author?.name || 'Unknown',
      iconURL: options.author?.iconURL || null
    })
    .addFields(
      { name: '🎫 Ticket ID', value: `#${result.ticket.ticket_id}`, inline: true },
      { name: '🚫 Removed User', value: `<@${result.removedUser}>`, inline: true },
      { name: '👤 Removed By', value: `<@${options.removedBy}>`, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: 'Ticket System' });
};

// ================ COMPONENT HANDLERS ================

// Shop Category Select
// Shop Category Select (UPDATED)
client.on('interactionCreate', async (interaction) => {
  if (interaction.isStringSelectMenu() && interaction.customId === 'shop_category') {
    const selected = interaction.values[0];
    const guildId = interaction.guildId;
    
    try {
      const shopData = await getFullShopList(guildId);
      let items = [];
      let categoryName = selected;
      
      if (selected === 'all') {
        items = shopData.items;
        categoryName = '📋 All Items';
      } else {
        const catData = shopData.categories[selected];
        items = catData?.items || [];
        categoryName = selected;
      }
      
      const { embed, rows } = shopCategoryEmbed(categoryName, items, {
        author: {
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL()
        }
      });
      
      if (rows.length > 0) {
        await interaction.update({ embeds: [embed], components: rows });
      } else {
        await interaction.update({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error in category select:', error);
      const embed = errorEmbed('Failed to load category.');
      await interaction.update({ embeds: [embed] });
    }
  }
});

// View All Items Button
// View All Items Button (UPDATED)
client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton() && interaction.customId === 'shop_view_all') {
    try {
      const shopData = await getFullShopList(interaction.guildId);
      const { embed, rows } = shopCategoryEmbed('📋 All Items', shopData.items, {
        author: {
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL()
        }
      });
      
      if (rows.length > 0) {
        await interaction.update({ embeds: [embed], components: rows });
      } else {
        await interaction.update({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error in view all:', error);
      const embed = errorEmbed('Failed to load items.');
      await interaction.update({ embeds: [embed] });
    }
  }
});

// Purchase Button Handler (NEW)
client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton() && interaction.customId.startsWith('purchase_')) {
    const itemId = parseInt(interaction.customId.split('_')[1]);
    
    if (!interaction.guildId) {
      await interaction.reply({ embeds: [errorEmbed('This command can only be used in a server.')] });
      return;
    }
    
    const modal = new ModalBuilder()
      .setCustomId(`purchase_modal_${itemId}`)
      .setTitle('🛒 Purchase Item');
    
    const quantityInput = new TextInputBuilder()
      .setCustomId('quantity')
      .setLabel('How many would you like to buy?')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter quantity (default: 1)')
      .setRequired(true)
      .setMinLength(1)
      .setMaxLength(3);
    
    const row = new ActionRowBuilder().addComponents(quantityInput);
    modal.addComponents(row);
    
    await interaction.showModal(modal);
  }
});

// Purchase Modal Submit Handler (NEW)
// Purchase Modal Submit Handler (UPDATED)
client.on('interactionCreate', async (interaction) => {
  if (interaction.isModalSubmit() && interaction.customId.startsWith('purchase_modal_')) {
    const itemId = parseInt(interaction.customId.split('_')[2]);
    const quantity = parseInt(interaction.fields.getTextInputValue('quantity')) || 1;
    const userId = interaction.user.id;
    const guildId = interaction.guildId;
    
    if (!guildId) {
      await interaction.reply({ embeds: [errorEmbed('This command can only be used in a server.')] });
      return;
    }
    
    try {
      await interaction.deferReply();
      
      // ✅ Pass the interaction to create Discord ticket
      const result = await purchaseShopItem(userId, guildId, itemId, quantity, interaction);
      
      const embed = purchaseConfirmEmbed(result, {
        author: {
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL()
        }
      });
      
      await interaction.editReply({ embeds: [embed] });
      
      // If ticket channel was created, send a follow-up
      if (result.ticketChannel) {
        await interaction.followUp({ 
          content: `🎫 A purchase ticket has been created: ${result.ticketChannel}`,
          ephemeral: false
        });
      }
    } catch (error) {
      console.error('Error in purchase:', error);
      const embed = errorEmbed(error.message || 'Failed to purchase item.');
      await interaction.editReply({ embeds: [embed] });
    }
  }
});

// Sell Panel Select
client.on('interactionCreate', async (interaction) => {
  if (interaction.isStringSelectMenu() && interaction.customId === 'sell_panel_select') {
    const panelId = parseInt(interaction.values[0]);
    try {
      const panel = await getSellPanel(panelId);
      const embed = sellListingEmbed(panel, {
        author: {
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL()
        }
      });
      await interaction.update({ embeds: [embed] });
    } catch (error) {
      console.error('Error in sell panel select:', error);
      const embed = errorEmbed('Failed to load panel.');
      await interaction.update({ embeds: [embed] });
    }
  }
});

// Create Listing Button
client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton() && interaction.customId === 'sell_create_listing') {
    const modal = new ModalBuilder()
      .setCustomId('sell_listing_modal')
      .setTitle('📝 Create Sell Listing');
    
    const nameInput = new TextInputBuilder()
      .setCustomId('item_name')
      .setLabel('Item Name')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter the item name')
      .setRequired(true)
      .setMaxLength(100);
    
    const priceInput = new TextInputBuilder()
      .setCustomId('item_price')
      .setLabel('Price (in crystals)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter the price')
      .setRequired(true);
    
    const quantityInput = new TextInputBuilder()
      .setCustomId('item_quantity')
      .setLabel('Quantity')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter the quantity (default: 1)')
      .setRequired(false);
    
    const descInput = new TextInputBuilder()
      .setCustomId('item_description')
      .setLabel('Description')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Describe your item...')
      .setRequired(false)
      .setMaxLength(500);
    
    const row1 = new ActionRowBuilder().addComponents(nameInput);
    const row2 = new ActionRowBuilder().addComponents(priceInput);
    const row3 = new ActionRowBuilder().addComponents(quantityInput);
    const row4 = new ActionRowBuilder().addComponents(descInput);
    
    modal.addComponents(row1, row2, row3, row4);
    
    await interaction.showModal(modal);
  }
});

// Sell Listing Modal Submit
// Sell Listing Modal Submit (UPDATED)
client.on('interactionCreate', async (interaction) => {
  if (interaction.isModalSubmit() && interaction.customId === 'sell_listing_modal') {
    const name = interaction.fields.getTextInputValue('item_name');
    const price = parseInt(interaction.fields.getTextInputValue('item_price'));
    const quantity = parseInt(interaction.fields.getTextInputValue('item_quantity')) || 1;
    const description = interaction.fields.getTextInputValue('item_description');
    
    if (!interaction.guildId) {
      await interaction.reply({ embeds: [errorEmbed('This command can only be used in a server.')] });
      return;
    }
    
    try {
      await interaction.deferReply();
      
      const panels = await getSellPanelsByGuild(interaction.guildId);
      if (panels.length === 0) {
        await interaction.editReply({ embeds: [errorEmbed('No sell panels available. Please contact an admin.')] });
        return;
      }
      
      const panelId = panels[0].panel_id;
      
      // ✅ Pass interaction to create Discord ticket
      const result = await createSellListing(
        panelId,
        interaction.user.id,
        interaction.guildId,
        {
          name: name,
          price: price,
          quantity: quantity,
          description: description
        },
        interaction  // ← Pass the interaction
      );
      
      const embed = successEmbed('✅ Sell Listing Created', {
        fields: [
          { name: '🛒 Item', value: name, inline: true },
          { name: '💰 Price', value: `${price} 💎`, inline: true },
          { name: '🔢 Quantity', value: `${quantity}`, inline: true },
          { name: '📝 Description', value: description || 'No description', inline: false },
          { name: '📊 Status', value: '⏳ Pending Approval', inline: true }
        ],
        author: {
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL()
        }
      });
      
      await interaction.editReply({ embeds: [embed] });
      
      // If ticket channel was created, send a follow-up
      if (result.ticketChannel) {
        await interaction.followUp({ 
          content: `🎫 A sell ticket has been created: ${result.ticketChannel}`,
          ephemeral: false
        });
      }
    } catch (error) {
      console.error('Error in sell listing modal:', error);
      await interaction.editReply({
        embeds: [errorEmbed(error.message || 'Failed to create sell listing.')]
      });
    }
  }
});

// Close Purchase Ticket Button
client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton() && interaction.customId.startsWith('close_purchase_')) {
    const ticketId = parseInt(interaction.customId.split('_')[2]);
    
    // Check if user is the ticket owner or admin
    const isAdmin = interaction.memberPermissions.has('Administrator');
    const ticket = await getOne('purchase_tickets', { ticket_id: ticketId });
    
    if (!ticket) {
      await interaction.reply({ embeds: [errorEmbed('Ticket not found.')], ephemeral: true });
      return;
    }
    
    if (ticket.user_id !== interaction.user.id && !isAdmin) {
      await interaction.reply({ 
        embeds: [errorEmbed('You do not have permission to close this ticket.')], 
        ephemeral: true 
      });
      return;
    }
    
    await interaction.reply({ embeds: [infoEmbed('🔒 Closing ticket...')] });
    
    await closePurchaseTicket(interaction, ticketId);
  }
});

// Transcript Purchase Ticket Button
client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton() && interaction.customId.startsWith('transcript_purchase_')) {
    const ticketId = parseInt(interaction.customId.split('_')[2]);
    
    // Get messages from the channel
    const messages = await interaction.channel.messages.fetch({ limit: 100 });
    
    // Create transcript
    let transcript = `📋 PURCHASE TICKET TRANSCRIPT\n`;
    transcript += `Ticket ID: #${ticketId}\n`;
    transcript += `Generated: ${new Date().toLocaleString()}\n`;
    transcript += `${'='.repeat(50)}\n\n`;
    
    messages.reverse().forEach(msg => {
      const time = msg.createdAt.toLocaleString();
      const username = msg.author.tag;
      transcript += `[${time}] ${username}: ${msg.content || '(No content)'}\n`;
    });
    
    // Send as file
    const buffer = Buffer.from(transcript, 'utf-8');
    await interaction.reply({
      content: '📄 Here is your ticket transcript:',
      files: [{
        attachment: buffer,
        name: `transcript_${ticketId}.txt`
      }],
      ephemeral: true
    });
  }
});

// ================ SELL TICKET BUTTON HANDLERS ================

// Approve Sell Listing Button
client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton() && interaction.customId.startsWith('approve_sell_')) {
    const sellId = parseInt(interaction.customId.split('_')[2]);
    
    // Check if user is admin or has permission
    if (!interaction.memberPermissions.has('Administrator')) {
      await interaction.reply({ 
        embeds: [errorEmbed('You need **Administrator** permissions to approve sell listings.')], 
        ephemeral: true 
      });
      return;
    }
    
    await interaction.reply({ embeds: [infoEmbed('✅ Approving sell listing...')] });
    await approveSellListingWithChannel(interaction, sellId);
  }
});

// Reject Sell Listing Button
client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton() && interaction.customId.startsWith('reject_sell_')) {
    const sellId = parseInt(interaction.customId.split('_')[2]);
    
    // Check if user is admin or has permission
    if (!interaction.memberPermissions.has('Administrator')) {
      await interaction.reply({ 
        embeds: [errorEmbed('You need **Administrator** permissions to reject sell listings.')], 
        ephemeral: true 
      });
      return;
    }
    
    // Create modal for rejection reason
    const modal = new ModalBuilder()
      .setCustomId(`reject_sell_modal_${sellId}`)
      .setTitle('❌ Reject Sell Listing');
    
    const reasonInput = new TextInputBuilder()
      .setCustomId('reason')
      .setLabel('Reason for rejection')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Enter the reason for rejection...')
      .setRequired(true)
      .setMaxLength(500);
    
    const row = new ActionRowBuilder().addComponents(reasonInput);
    modal.addComponents(row);
    
    await interaction.showModal(modal);
  }
});

// Reject Sell Modal Submit
client.on('interactionCreate', async (interaction) => {
  if (interaction.isModalSubmit() && interaction.customId.startsWith('reject_sell_modal_')) {
    const sellId = parseInt(interaction.customId.split('_')[3]);
    const reason = interaction.fields.getTextInputValue('reason');
    
    await interaction.reply({ embeds: [infoEmbed('❌ Rejecting sell listing...')] });
    await rejectSellListingWithChannel(interaction, sellId, reason);
  }
});

// Close Sell Ticket Button
// Note: button custom ID uses sell_id (from sell_items), so we look up by sell_id
client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton() && interaction.customId.startsWith('close_sell_')) {
    const sellId = parseInt(interaction.customId.split('_')[2]);
    
    // Check if user is the ticket owner or admin
    const isAdmin = interaction.memberPermissions.has('Administrator');
    const ticket = await getOne('sell_tickets', { sell_id: sellId });
    
    if (!ticket) {
      await interaction.reply({ embeds: [errorEmbed('Ticket not found.')], ephemeral: true });
      return;
    }
    
    if (ticket.user_id !== interaction.user.id && !isAdmin) {
      await interaction.reply({ 
        embeds: [errorEmbed('You do not have permission to close this ticket.')], 
        ephemeral: true 
      });
      return;
    }
    
    await interaction.reply({ embeds: [infoEmbed('🔒 Closing sell ticket...')] });
    await closeSellTicket(interaction, ticket.ticket_id);
  }
});


// ================ ADMIN CRYSTAL HANDLERS ================

/**
 * /add-crystals - Add crystals to a user (Admin only)
 */
const handleAddCrystals = async (interaction) => {
  // Check admin permissions
  if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
    const embed = errorEmbed('You need **Administrator** permissions to use this command.');
    await interaction.editReply({ embeds: [embed] });
    return;
  }
  
  const targetUser = interaction.options.getUser('user');
  const amount = interaction.options.getInteger('amount');
  const reason = interaction.options.getString('reason') || 'Admin added';
  
  try {
    const result = await adminAddCrystals(targetUser.id, interaction.guildId, amount, reason);
    
    const embed = successEmbed('✅ Crystals Added', {
      fields: [
        { name: '👤 User', value: `<@${result.user}>`, inline: true },
        { name: '➕ Amount Added', value: `${result.amount} 💎`, inline: true },
        { name: '💰 New Balance', value: `${result.newBalance} 💎`, inline: true },
        { name: '📝 Reason', value: reason, inline: false }
      ],
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /add-crystals:', error);
    const embed = errorEmbed(error.message || 'Failed to add crystals.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /remove-crystals - Remove crystals from a user (Admin only)
 */
const handleRemoveCrystals = async (interaction) => {
  // Check admin permissions
  if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
    const embed = errorEmbed('You need **Administrator** permissions to use this command.');
    await interaction.editReply({ embeds: [embed] });
    return;
  }
  
  const targetUser = interaction.options.getUser('user');
  const amount = interaction.options.getInteger('amount');
  const reason = interaction.options.getString('reason') || 'Admin removed';
  
  try {
    const result = await adminRemoveCrystals(targetUser.id, interaction.guildId, amount, reason);
    
    const embed = successEmbed('✅ Crystals Removed', {
      fields: [
        { name: '👤 User', value: `<@${result.user}>`, inline: true },
        { name: '➖ Amount Removed', value: `${result.amount} 💎`, inline: true },
        { name: '💰 New Balance', value: `${result.newBalance} 💎`, inline: true },
        { name: '📝 Reason', value: reason, inline: false }
      ],
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /remove-crystals:', error);
    const embed = errorEmbed(error.message || 'Failed to remove crystals.');
    await interaction.editReply({ embeds: [embed] });
  }
};

/**
 * /set-crystals - Set a user's crystals (Admin only)
 */
const handleSetCrystals = async (interaction) => {
  // Check admin permissions
  if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
    const embed = errorEmbed('You need **Administrator** permissions to use this command.');
    await interaction.editReply({ embeds: [embed] });
    return;
  }
  
  const targetUser = interaction.options.getUser('user');
  const amount = interaction.options.getInteger('amount');
  const reason = interaction.options.getString('reason') || 'Admin set';
  
  try {
    const result = await adminSetCrystals(targetUser.id, interaction.guildId, amount, reason);
    
    const embed = successEmbed('✅ Crystals Set', {
      fields: [
        { name: '👤 User', value: `<@${result.user}>`, inline: true },
        { name: '💰 New Balance', value: `${result.newBalance} 💎`, inline: true },
        { name: '📝 Reason', value: reason, inline: false }
      ],
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /set-crystals:', error);
    const embed = errorEmbed(error.message || 'Failed to set crystals.');
    await interaction.editReply({ embeds: [embed] });
  }
};

// ================ INTERACTION HANDLER ================

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  
  const { commandName } = interaction;
  
  console.log(`📝 Command executed: /${commandName} by ${interaction.user.tag}`);
  
  try {
    // Defer immediately so we have the full 15 minutes for DB calls
    // (Discord gives only 3 seconds for the first reply without deferral)
    await interaction.deferReply();

    switch (commandName) {
      // Economy
      case 'balance': await handleBalance(interaction); break;
      case 'leaderboard': await handleLeaderboard(interaction); break;
      
      // Invites
      case 'invites': await handleInvites(interaction); break;
      case 'inviteleaderboard': await handleInviteLeaderboard(interaction); break;
      
      // Custom Invite
      case 'createinvite': await handleCreateInvite(interaction); break;
      
      // Messages
      case 'messages': await handleMessages(interaction); break;
      case 'messageleaderboard': await handleMessageLeaderboard(interaction); break;
      
      // Shop
      case 'shop': await handleShop(interaction); break;
      case 'additem': await handleAddItem(interaction); break;
      case 'edititem': await handleEditItem(interaction); break;
      case 'removeitem': await handleRemoveItem(interaction); break;
      case 'restock': await handleRestock(interaction); break;
      case 'shoplist': await handleShopList(interaction); break;
      
      // Sell
      case 'sell': await handleSell(interaction); break;
      case 'createsellpanel': await handleCreateSellPanel(interaction); break;
      case 'editsellpanel': await handleEditSellPanel(interaction); break;
      case 'deletesellpanel': await handleDeleteSellPanel(interaction); break;
      
      // Utility
      case 'ping': await handlePing(interaction); break;
      case 'help': await handleHelp(interaction); break;
      case 'serverinfo': await handleServerInfo(interaction); break;
      case 'userinfo': await handleUserInfo(interaction); break;
      case 'avatar': await handleAvatar(interaction); break;
      case 'banner': await handleBanner(interaction); break;
      case 'botinfo': await handleBotInfo(interaction); break;
      
      // Welcome/Leave
      case 'setwelcome': await handleSetWelcome(interaction); break;
      case 'setleave': await handleSetLeave(interaction); break;
      
      // Logging
      case 'setlogchannel': await handleSetLogChannel(interaction); break;
      
      // Tickets
      case 'claim': await handleClaim(interaction); break;
      case 'close': await handleClose(interaction); break;
      case 'reopen': await handleReopen(interaction); break;
      case 'delete': await handleDelete(interaction); break;
      case 'rename': await handleRename(interaction); break;
      case 'adduser': await handleAddUser(interaction); break;
      case 'removeuser': await handleRemoveUser(interaction); break;
      case 'transcript': await handleTranscript(interaction); break;
      
      // Moderation
      case 'ban': await handleBan(interaction); break;
      case 'kick': await handleKick(interaction); break;
      case 'timeout': await handleTimeout(interaction); break;
      case 'untimeout': await handleUntimeout(interaction); break;
      case 'purge': await handlePurge(interaction); break;
      case 'warn': await handleWarn(interaction); break;
      case 'warnings': await handleWarnings(interaction); break;
      case 'clearwarnings': await handleClearWarnings(interaction); break;
      
      // AutoMod
      case 'automod':
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'enable') await handleAutoModEnable(interaction);
        else if (subcommand === 'disable') await handleAutoModDisable(interaction);
        else if (subcommand === 'settings') await handleAutoModSettings(interaction);
        break;

 case 'add-crystals':
  await handleAddCrystals(interaction);
  break;
case 'remove-crystals':
  await handleRemoveCrystals(interaction);
  break;
case 'set-crystals':
  await handleSetCrystals(interaction);
  break;
        
      // Backup
      case 'backup': await handleBackup(interaction); break;
      case 'restore': await handleRestore(interaction); break;
      case 'backuplist': await handleBackupList(interaction); break;
      
      default: {
        const embed = errorEmbed(`Unknown command: /${commandName}`);
        await interaction.editReply({ embeds: [embed] });
      }
    }
  } catch (error) {
    console.error(`❌ Error in /${commandName}:`, error);
    const embed = errorEmbed('An unexpected error occurred. Please try again later.');
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply({ embeds: [embed] });
    }
  }
});

// ================ READY EVENT ================

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`📡 Connected to ${client.guilds.cache.size} guilds`);
  
  await initDatabase();
  await registerCommands();
  registerEvents(client);
  
  // 🔥 INITIALIZE INVITE CACHE
  await initializeInviteCache(client);
  
  client.user.setPresence({
    activities: [{ 
      name: `${client.guilds.cache.size} servers | /help`, 
      type: ActivityType.Listening 
    }],
    status: 'online',
  });
  
  console.log('🚀 Bot is fully operational');
});

// ================ START BOT ================

const startBot = async () => {
  try {
    await client.login(process.env.BOT_TOKEN || config.token);
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
};

startBot();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down gracefully...');
  await pool.end();
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Shutting down gracefully...');
  await pool.end();
  client.destroy();
  process.exit(0);
});
