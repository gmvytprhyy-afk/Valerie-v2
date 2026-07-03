// utility.js - Complete Utility Functions (UPDATED with Enhanced Leaderboard)
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { successEmbed, errorEmbed, infoEmbed, customEmbed } = require('./embeds.js');
const { pool } = require('./database.js');

// ================ FORMATTING FUNCTIONS ================

/**
 * Format a number with commas
 */
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Format time duration from milliseconds
 */
const formatDuration = (ms) => {
  if (!ms || ms < 0) return '0s';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

/**
 * Truncate text to a certain length
 */
const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Convert a string to title case
 */
const toTitleCase = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format a date
 */
const formatDate = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Get relative time string
 */
const getRelativeTime = (date) => {
  if (!date) return 'N/A';
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
};

/**
 * Create a progress bar
 */
const createProgressBar = (current, max, length = 15) => {
  if (max <= 0) return '█'.repeat(length) + '░'.repeat(0);
  const percentage = Math.min((current / max) * 100, 100);
  const filled = Math.round((percentage / 100) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
};

/**
 * Get emoji for a user's position
 */
const getPositionEmoji = (position) => {
  const emojis = {
    1: '🥇',
    2: '🥈',
    3: '🥉'
  };
  return emojis[position] || `${position}.`;
};

/**
 * Get status emoji for a boolean
 */
const getStatusEmoji = (value) => {
  return value ? '✅' : '❌';
};

// ================ VALIDATION FUNCTIONS ================

/**
 * Validate user input
 */
const validateInput = (input, options = {}) => {
  const { minLength = 1, maxLength = 100, required = true } = options;
  
  if (required && (!input || input.trim().length === 0)) {
    return { valid: false, error: 'Input is required' };
  }
  
  if (input && input.length < minLength) {
    return { valid: false, error: `Input must be at least ${minLength} characters` };
  }
  
  if (input && input.length > maxLength) {
    return { valid: false, error: `Input must be at most ${maxLength} characters` };
  }
  
  return { valid: true };
};

/**
 * Check if a value is a valid number
 */
const isValidNumber = (value, options = {}) => {
  const { min = 0, max = Infinity } = options;
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validate URL format
 */
const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// ================ PERMISSION FUNCTIONS ================

/**
 * Check if a user has permissions
 */
const hasPermission = async (guild, userId, permission) => {
  try {
    const member = await guild.members.fetch(userId);
    return member.permissions.has(permission);
  } catch (error) {
    return false;
  }
};

/**
 * Get user's display name
 */
const getDisplayName = async (guild, userId) => {
  try {
    const member = await guild.members.fetch(userId);
    return member.displayName;
  } catch (error) {
    return `User ${userId}`;
  }
};

/**
 * Check if user is admin
 */
const isAdmin = async (guild, userId) => {
  return await hasPermission(guild, userId, 'Administrator');
};

/**
 * Check if user is moderator
 */
const isModerator = async (guild, userId) => {
  return await hasPermission(guild, userId, 'ModerateMembers') || 
         await hasPermission(guild, userId, 'BanMembers') ||
         await hasPermission(guild, userId, 'KickMembers') ||
         await isAdmin(guild, userId);
};

// ================ ID GENERATION ================

/**
 * Create a random ID
 */
const generateId = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate a random hex color
 */
const generateRandomColor = () => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
};

/**
 * Generate a unique code
 */
const generateUniqueCode = (prefix = '', length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = prefix;
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
    if (i === 3 || i === 7) result += '-';
  }
  return result;
};

// ================ PAGINATION HELPERS ================

/**
 * Create a pagination button row
 */
const createPaginationButtons = (currentPage, totalPages) => {
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('prev')
        .setLabel('◀️ Previous')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === 1),
      new ButtonBuilder()
        .setCustomId('page_info')
        .setLabel(`Page ${currentPage}/${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('next')
        .setLabel('Next ▶️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === totalPages)
    );
  return row;
};

/**
 * Create paginated embed response
 */
const createPaginatedResponse = async (interaction, pages, initialPage = 0) => {
  if (pages.length === 1) {
    await interaction.reply({ embeds: [pages[0]], ephemeral: false });
    return;
  }
  
  let currentPage = initialPage;
  const totalPages = pages.length;
  
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('prev_page')
        .setLabel('◀️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === 0),
      new ButtonBuilder()
        .setCustomId('page_info')
        .setLabel(`Page ${currentPage + 1}/${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('next_page')
        .setLabel('▶️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === totalPages - 1)
    );
  
  const message = await interaction.reply({
    embeds: [pages[currentPage]],
    components: [row],
    ephemeral: false,
    fetchReply: true
  });
  
  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 120000
  });
  
  collector.on('collect', async (i) => {
    if (i.user.id !== interaction.user.id) {
      await i.reply({ content: '❌ These buttons are not for you!', ephemeral: true });
      return;
    }
    
    if (i.customId === 'prev_page' && currentPage > 0) {
      currentPage--;
    } else if (i.customId === 'next_page' && currentPage < totalPages - 1) {
      currentPage++;
    }
    
    row.components[0].setDisabled(currentPage === 0);
    row.components[1].setLabel(`Page ${currentPage + 1}/${totalPages}`);
    row.components[2].setDisabled(currentPage === totalPages - 1);
    
    await i.update({
      embeds: [pages[currentPage]],
      components: [row]
    });
  });
  
  collector.on('end', async () => {
    row.components.forEach(btn => btn.setDisabled(true));
    await message.edit({ components: [row] }).catch(() => {});
  });
};

// ================ INVITE COMMAND FUNCTIONS ================

const {
  getInviteStats,
  getInviteLeaderboard,
  getUserInvites
} = require('./database.js');

/**
 * Get user's invite stats for display
 */
const getUserInviteStats = async (userId, guildId) => {
  const stats = await getInviteStats(userId, guildId);
  const invites = await getUserInvites(userId, guildId);
  
  return {
    totalInvites: stats.total_invites || 0,
    activeInvites: stats.active_invites || 0,
    totalJoins: stats.total_joins || 0,
    activeJoins: stats.active_joins || 0,
    totalLeaves: stats.total_leaves || 0,
    inviteCodes: invites.map(i => ({
      code: i.invite_code,
      uses: i.uses,
      maxUses: i.max_uses,
      createdAt: i.created_at
    }))
  };
};

/**
 * Format invite leaderboard for display
 */
const formatInviteLeaderboard = async (guildId, limit = 10, client) => {
  const data = await getInviteLeaderboard(guildId, limit);
  
  const formatted = [];
  for (let i = 0; i < data.length; i++) {
    const entry = data[i];
    try {
      const user = await client.users.fetch(entry.user_id);
      formatted.push({
        name: user.username,
        tag: user.tag,
        avatar: user.displayAvatarURL(),
        joins: entry.total_joins,
        active: entry.active_joins
      });
    } catch (err) {
      formatted.push({
        name: `Unknown User`,
        tag: `Unknown#0000`,
        avatar: null,
        joins: entry.total_joins,
        active: entry.active_joins
      });
    }
  }
  
  return formatted;
};

// ================ MESSAGE COMMAND FUNCTIONS ================

const {
  getMessageStats,
  getMessageLeaderboard
} = require('./database.js');

/**
 * Get user's message stats for display
 */
const getUserMessageStats = async (userId, guildId) => {
  const stats = await getMessageStats(userId, guildId);
  
  return {
    total: stats.total || 0,
    daily: stats.daily || 0,
    weekly: stats.weekly || 0,
    milestones: stats.milestones || 0,
    lastMessage: stats.lastMessage
  };
};

/**
 * Format message leaderboard for display
 */
const formatMessageLeaderboard = async (guildId, limit = 10, period = 'total', client) => {
  const data = await getMessageLeaderboard(guildId, limit, period);
  
  const formatted = [];
  for (let i = 0; i < data.length; i++) {
    const entry = data[i];
    try {
      const user = await client.users.fetch(entry.user_id);
      formatted.push({
        name: user.username,
        tag: user.tag,
        avatar: user.displayAvatarURL(),
        count: entry.count
      });
    } catch (err) {
      formatted.push({
        name: `Unknown User`,
        tag: `Unknown#0000`,
        avatar: null,
        count: entry.count
      });
    }
  }
  
  return formatted;
};

// ================ LOGGING COMMAND FUNCTIONS ================

const {
  getLoggingSettings,
  updateLoggingSettings,
  getLogEntries
} = require('./database.js');

/**
 * Set log channel
 */
const setLogChannel = async (guildId, channelId, settings = {}) => {
  const updated = await updateLoggingSettings(guildId, {
    log_channel: channelId,
    ...settings
  });
  
  return updated;
};

/**
 * Get log settings
 */
const getLogSettings = async (guildId) => {
  return await getLoggingSettings(guildId);
};

/**
 * Get recent logs
 */
const getRecentLogs = async (guildId, limit = 20, action = null) => {
  return await getLogEntries(guildId, limit, action);
};

// ================ UTILITY COMMAND FUNCTIONS ================

/**
 * Get formatted bot info
 */
const getBotInfo = (client) => {
  const uptime = client.uptime;
  const days = Math.floor(uptime / 86400000);
  const hours = Math.floor((uptime % 86400000) / 3600000);
  const minutes = Math.floor((uptime % 3600000) / 60000);
  const seconds = Math.floor((uptime % 60000) / 1000);
  
  const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  
  return {
    username: client.user.username,
    tag: client.user.tag,
    id: client.user.id,
    avatar: client.user.displayAvatarURL({ dynamic: true, size: 512 }),
    createdAt: client.user.createdAt,
    uptime: uptimeString,
    guildCount: client.guilds.cache.size,
    userCount: client.users.cache.size,
    channelCount: client.channels.cache.size,
    shardCount: client.shard?.count || 1,
    ping: client.ws.ping,
    version: 'v14.14.1'
  };
};

/**
 * Get formatted server info
 */
const getServerInfo = (guild) => {
  const channels = guild.channels.cache;
  const textChannels = channels.filter(c => c.type === 0).size;
  const voiceChannels = channels.filter(c => c.type === 2).size;
  const categoryChannels = channels.filter(c => c.type === 4).size;
  
  const members = guild.members.cache;
  const humans = members.filter(m => !m.user.bot).size;
  const bots = members.filter(m => m.user.bot).size;
  
  const roles = guild.roles.cache;
  const emojis = guild.emojis.cache;
  
  return {
    name: guild.name,
    id: guild.id,
    icon: guild.iconURL({ dynamic: true, size: 512 }),
    banner: guild.bannerURL({ dynamic: true, size: 512 }),
    splash: guild.splashURL({ dynamic: true, size: 512 }),
    createdAt: guild.createdAt,
    ownerId: guild.ownerId,
    owner: guild.members.cache.get(guild.ownerId)?.user?.tag || 'Unknown',
    memberCount: guild.memberCount,
    humanCount: humans,
    botCount: bots,
    textChannels: textChannels,
    voiceChannels: voiceChannels,
    categoryChannels: categoryChannels,
    totalChannels: channels.size,
    roleCount: roles.size,
    emojiCount: emojis.size,
    boostLevel: guild.premiumTier,
    boostCount: guild.premiumSubscriptionCount,
    verified: guild.verified,
    partnered: guild.partnered,
    vanityCode: guild.vanityURLCode,
    vanityUses: guild.vanityURLUses,
    maxMembers: guild.maximumMembers,
    maxPresences: guild.maximumPresences,
    nsfwLevel: guild.nsfwLevel,
    afkChannel: guild.afkChannel?.name || 'None',
    systemChannel: guild.systemChannel?.name || 'None'
  };
};

/**
 * Get formatted user info
 */
const getUserInfo = (user, member = null) => {
  const info = {
    username: user.username,
    tag: user.tag,
    id: user.id,
    avatar: user.displayAvatarURL({ dynamic: true, size: 512 }),
    banner: user.bannerURL({ dynamic: true, size: 512 }),
    createdAt: user.createdAt,
    bot: user.bot,
    system: user.system,
    accentColor: user.accentColor
  };
  
  if (member) {
    info.displayName = member.displayName;
    info.joinedAt = member.joinedAt;
    info.nickname = member.nickname;
    info.roles = member.roles.cache
      .filter(r => r.id !== member.guild.id)
      .map(r => r.name);
    info.hoistRole = member.roles.hoist?.name || 'None';
    info.premiumSince = member.premiumSince;
    info.pending = member.pending;
    info.communicationDisabledUntil = member.communicationDisabledUntil;
    info.permissions = member.permissions.toArray().slice(0, 10).join(', ');
    if (member.permissions.toArray().length > 10) {
      info.permissions += ` +${member.permissions.toArray().length - 10} more`;
    }
    info.avatarURL = member.displayAvatarURL({ dynamic: true, size: 512 });
  }
  
  return info;
};

/**
 * Get user's banner with fallback
 */
const getUserBanner = async (user) => {
  if (user.bannerURL({ dynamic: true })) {
    return user.bannerURL({ dynamic: true, size: 512 });
  }
  return null;
};

// ================ ENHANCED LEADERBOARD FUNCTIONS ================

/**
 * Get full leaderboard with pagination for crystals
 */
const getFullCrystalLeaderboard = async (guildId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  
  const result = await pool.query(
    `SELECT user_id, crystals, total_earned, total_spent
     FROM crystal_economy
     WHERE guild_id = $1
     ORDER BY crystals DESC
     LIMIT $2 OFFSET $3;`,
    [guildId, limit, offset]
  );
  
  const total = await pool.query(
    `SELECT COUNT(*) as count FROM crystal_economy WHERE guild_id = $1;`,
    [guildId]
  );
  
  return {
    entries: result.rows,
    total: parseInt(total.rows[0]?.count) || 0,
    page: page,
    totalPages: Math.ceil((parseInt(total.rows[0]?.count) || 0) / limit)
  };
};

/**
 * Get full leaderboard with pagination for messages
 */
const getFullMessageLeaderboard = async (guildId, page = 1, limit = 10, period = 'total') => {
  const offset = (page - 1) * limit;
  
  let orderBy = 'total_messages';
  if (period === 'daily') orderBy = 'daily_messages';
  if (period === 'weekly') orderBy = 'weekly_messages';
  
  const result = await pool.query(
    `SELECT user_id, ${orderBy} as count
     FROM message_counts
     WHERE guild_id = $1
     ORDER BY ${orderBy} DESC
     LIMIT $2 OFFSET $3;`,
    [guildId, limit, offset]
  );
  
  const total = await pool.query(
    `SELECT COUNT(*) as count FROM message_counts WHERE guild_id = $1;`,
    [guildId]
  );
  
  return {
    entries: result.rows,
    total: parseInt(total.rows[0]?.count) || 0,
    page: page,
    totalPages: Math.ceil((parseInt(total.rows[0]?.count) || 0) / limit)
  };
};

/**
 * Get full leaderboard with pagination for invites
 */
const getFullInviteLeaderboard = async (guildId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  
  const result = await pool.query(
    `SELECT user_id, total_joins as count
     FROM invite_stats
     WHERE guild_id = $1
     ORDER BY total_joins DESC
     LIMIT $2 OFFSET $3;`,
    [guildId, limit, offset]
  );
  
  const total = await pool.query(
    `SELECT COUNT(*) as count FROM invite_stats WHERE guild_id = $1;`,
    [guildId]
  );
  
  return {
    entries: result.rows,
    total: parseInt(total.rows[0]?.count) || 0,
    page: page,
    totalPages: Math.ceil((parseInt(total.rows[0]?.count) || 0) / limit)
  };
};

/**
 * Get user's rank in leaderboard
 */
const getUserRankInLeaderboard = async (guildId, userId, type = 'crystals') => {
  let queryText = '';
  
  if (type === 'crystals') {
    queryText = `
      SELECT COUNT(*) + 1 as rank
      FROM crystal_economy
      WHERE guild_id = $1 AND crystals > (SELECT crystals FROM crystal_economy WHERE user_id = $2 AND guild_id = $1);
    `;
  } else if (type === 'messages') {
    queryText = `
      SELECT COUNT(*) + 1 as rank
      FROM message_counts
      WHERE guild_id = $1 AND total_messages > (SELECT total_messages FROM message_counts WHERE user_id = $2 AND guild_id = $1);
    `;
  } else if (type === 'invites') {
    queryText = `
      SELECT COUNT(*) + 1 as rank
      FROM invite_stats
      WHERE guild_id = $1 AND total_joins > (SELECT total_joins FROM invite_stats WHERE user_id = $2 AND guild_id = $1);
    `;
  }
  
  const result = await pool.query(queryText, [guildId, userId]);
  return parseInt(result.rows[0]?.rank) || 0;
};

/**
 * Get user's own stats for leaderboard display
 */
const getUserLeaderboardStats = async (guildId, userId, type = 'crystals') => {
  let result;
  
  if (type === 'crystals') {
    result = await pool.query(
      `SELECT crystals as value, total_earned, total_spent
       FROM crystal_economy
       WHERE guild_id = $1 AND user_id = $2;`,
      [guildId, userId]
    );
    return {
      value: result.rows[0]?.crystals || 0,
      totalEarned: result.rows[0]?.total_earned || 0,
      totalSpent: result.rows[0]?.total_spent || 0
    };
  } else if (type === 'messages') {
    result = await pool.query(
      `SELECT total_messages as value, daily_messages, weekly_messages
       FROM message_counts
       WHERE guild_id = $1 AND user_id = $2;`,
      [guildId, userId]
    );
    return {
      value: result.rows[0]?.total_messages || 0,
      daily: result.rows[0]?.daily_messages || 0,
      weekly: result.rows[0]?.weekly_messages || 0
    };
  } else if (type === 'invites') {
    result = await pool.query(
      `SELECT total_joins as value, active_joins, total_leaves
       FROM invite_stats
       WHERE guild_id = $1 AND user_id = $2;`,
      [guildId, userId]
    );
    return {
      value: result.rows[0]?.total_joins || 0,
      active: result.rows[0]?.active_joins || 0,
      leaves: result.rows[0]?.total_leaves || 0
    };
  }
  
  return { value: 0 };
};

// ================ EMBED UTILITY FUNCTIONS ================

/**
 * Create a simple embed with fields
 */
const createFieldEmbed = (title, description, fields, color = '#5865F2') => {
  return customEmbed({
    title,
    description,
    fields,
    color
  });
};

/**
 * Create a list embed from an array
 */
const createListEmbed = (title, items, options = {}) => {
  const fields = [];
  const itemsPerPage = options.itemsPerPage || 10;
  
  if (items.length === 0) {
    fields.push({
      name: '📭 No Items',
      value: options.emptyMessage || 'No items to display.',
      inline: false
    });
  } else {
    const pageItems = items.slice(0, itemsPerPage);
    pageItems.forEach((item, index) => {
      fields.push({
        name: `${index + 1}. ${item.title || item.name || 'Item'}`,
        value: item.description || item.value || 'No description',
        inline: false
      });
    });
    
    if (items.length > itemsPerPage) {
      fields.push({
        name: '📊 Showing First ' + itemsPerPage,
        value: `${items.length - itemsPerPage} more items available.`,
        inline: false
      });
    }
  }
  
  return createFieldEmbed(title, options.description || '', fields, options.color);
};

// ================ SHOP UTILITY FUNCTIONS ================

/**
 * Format price for display
 */
const formatPrice = (price) => {
  if (price === 0) return 'FREE';
  return `${formatNumber(price)} 💎`;
};

/**
 * Format stock for display
 */
const formatStock = (stock) => {
  if (stock === -1) return '♾️ Unlimited';
  if (stock === 0) return '❌ Out of Stock';
  return `${formatNumber(stock)} left`;
};

// ================ EXPORTS ================
module.exports = {
  // Formatting
  formatNumber,
  formatDuration,
  truncateText,
  toTitleCase,
  formatDate,
  getRelativeTime,
  createProgressBar,
  getPositionEmoji,
  getStatusEmoji,
  formatPrice,
  formatStock,
  
  // Validation
  validateInput,
  isValidNumber,
  isValidEmail,
  isValidURL,
  
  // Permissions
  hasPermission,
  getDisplayName,
  isAdmin,
  isModerator,
  
  // IDs
  generateId,
  generateRandomColor,
  generateUniqueCode,
  
  // Pagination
  createPaginationButtons,
  createPaginatedResponse,
  
  // Invite Commands
  getUserInviteStats,
  formatInviteLeaderboard,
  
  // Message Commands
  getUserMessageStats,
  formatMessageLeaderboard,
  
  // Logging Commands
  setLogChannel,
  getLogSettings,
  getRecentLogs,
  
  // Utility Commands
  getBotInfo,
  getServerInfo,
  getUserInfo,
  getUserBanner,
  
  // Enhanced Leaderboard
  getFullCrystalLeaderboard,
  getFullMessageLeaderboard,
  getFullInviteLeaderboard,
  getUserRankInLeaderboard,
  getUserLeaderboardStats,
  
  // Embed Utilities
  createFieldEmbed,
  createListEmbed
};