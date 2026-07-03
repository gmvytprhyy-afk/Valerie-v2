// moderation.js - Complete Moderation System with AutoMod
const {
  // Database functions
  addWarning,
  getWarnings,
  getActiveWarningsCount,
  removeWarning,
  clearWarnings,
  addMute,
  removeMute,
  getActiveMutes,
  getGuildActiveMutes,
  isUserMuted,
  logModerationAction,
  getModerationLogs,
  getGuildModerationLogs,
  getModerationStats,
  getAutoModSettings,
  updateAutoModSettings,
  logViolation,
  getBadWords,
  addBadWord,
  removeBadWord,
  getWhitelistedLinks,
  addWhitelistedLink,
  removeWhitelistedLink,
  pool,
  query,
  getOne,
  getAll,
  insert,
  update
} = require('./database.js');

// ================ PERMISSION HELPERS ================

/**
 * Check if moderator can act on target user
 */
const canModerate = async (guild, moderatorId, targetId) => {
  try {
    const moderator = await guild.members.fetch(moderatorId);
    const target = await guild.members.fetch(targetId);
    
    // Cannot moderate self
    if (moderatorId === targetId) {
      return { allowed: false, error: 'You cannot moderate yourself.' };
    }
    
    // Check if target is the guild owner
    if (target.id === guild.ownerId) {
      return { allowed: false, error: 'You cannot moderate the server owner.' };
    }
    
    // Check role hierarchy
    if (moderator.roles.highest.position <= target.roles.highest.position) {
      return { allowed: false, error: 'You cannot moderate someone with a higher or equal role.' };
    }
    
    // Check bot permissions
    const bot = await guild.members.fetch(guild.client.user.id);
    if (bot.roles.highest.position <= target.roles.highest.position) {
      return { allowed: false, error: 'Bot cannot moderate this user due to role hierarchy.' };
    }
    
    return { allowed: true };
  } catch (error) {
    return { allowed: false, error: 'User not found or unable to moderate.' };
  }
};

/**
 * Check if user has moderation permissions
 */
const hasModerationPermissions = (member) => {
  return member.permissions.has('ModerateMembers') || 
         member.permissions.has('BanMembers') || 
         member.permissions.has('KickMembers') ||
         member.permissions.has('Administrator');
};

/**
 * Get target member from guild
 */
const getTargetMember = async (guild, userId) => {
  try {
    return await guild.members.fetch(userId);
  } catch (error) {
    return null;
  }
};

// ================ BAN COMMANDS ================

/**
 * Ban a user
 */
const banUser = async (guild, moderatorId, targetId, reason = 'No reason provided', deleteDays = 0) => {
  // Check permissions
  const permissionCheck = await canModerate(guild, moderatorId, targetId);
  if (!permissionCheck.allowed) {
    throw new Error(permissionCheck.error);
  }
  
  const target = await getTargetMember(guild, targetId);
  if (!target) {
    throw new Error('User not found in this server.');
  }
  
  // Check if bot can ban
  const bot = await guild.members.fetch(guild.client.user.id);
  if (!bot.permissions.has('BanMembers')) {
    throw new Error('Bot does not have Ban Members permission.');
  }
  
  // Ban the user
  await target.ban({ 
    reason: `${reason} | Banned by ${guild.members.cache.get(moderatorId)?.user.tag}`,
    deleteMessageSeconds: deleteDays * 86400
  });
  
  // Log the ban
  await logModerationAction({
    guildId: guild.id,
    userId: targetId,
    moderatorId: moderatorId,
    action: 'ban',
    reason: reason,
    duration: null
  });
  
  return {
    success: true,
    user: target.user,
    reason: reason,
    message: `✅ ${target.user.tag} has been banned.`
  };
};

/**
 * Unban a user
 */
const unbanUser = async (guild, moderatorId, targetId, reason = 'No reason provided') => {
  // Check moderator permissions
  const moderator = await guild.members.fetch(moderatorId);
  if (!moderator.permissions.has('BanMembers')) {
    throw new Error('You do not have permission to unban members.');
  }
  
  // Check bot permissions
  const bot = await guild.members.fetch(guild.client.user.id);
  if (!bot.permissions.has('BanMembers')) {
    throw new Error('Bot does not have Ban Members permission.');
  }
  
  // Get banned users
  const bans = await guild.bans.fetch();
  const banEntry = bans.find(ban => ban.user.id === targetId);
  
  if (!banEntry) {
    throw new Error('User is not banned in this server.');
  }
  
  // Unban the user
  await guild.bans.remove(targetId, `${reason} | Unbanned by ${moderator.user.tag}`);
  
  // Log the unban
  await logModerationAction({
    guildId: guild.id,
    userId: targetId,
    moderatorId: moderatorId,
    action: 'unban',
    reason: reason
  });
  
  return {
    success: true,
    user: banEntry.user,
    reason: reason,
    message: `✅ ${banEntry.user.tag} has been unbanned.`
  };
};

// ================ KICK COMMAND ================

/**
 * Kick a user
 */
const kickUser = async (guild, moderatorId, targetId, reason = 'No reason provided') => {
  // Check permissions
  const permissionCheck = await canModerate(guild, moderatorId, targetId);
  if (!permissionCheck.allowed) {
    throw new Error(permissionCheck.error);
  }
  
  const target = await getTargetMember(guild, targetId);
  if (!target) {
    throw new Error('User not found in this server.');
  }
  
  // Check if bot can kick
  const bot = await guild.members.fetch(guild.client.user.id);
  if (!bot.permissions.has('KickMembers')) {
    throw new Error('Bot does not have Kick Members permission.');
  }
  
  // Kick the user
  await target.kick(`${reason} | Kicked by ${guild.members.cache.get(moderatorId)?.user.tag}`);
  
  // Log the kick
  await logModerationAction({
    guildId: guild.id,
    userId: targetId,
    moderatorId: moderatorId,
    action: 'kick',
    reason: reason
  });
  
  return {
    success: true,
    user: target.user,
    reason: reason,
    message: `✅ ${target.user.tag} has been kicked.`
  };
};

// ================ TIMEOUT COMMANDS ================

/**
 * Timeout a user
 */
const timeoutUser = async (guild, moderatorId, targetId, duration, reason = 'No reason provided') => {
  // Check permissions
  const permissionCheck = await canModerate(guild, moderatorId, targetId);
  if (!permissionCheck.allowed) {
    throw new Error(permissionCheck.error);
  }
  
  const target = await getTargetMember(guild, targetId);
  if (!target) {
    throw new Error('User not found in this server.');
  }
  
  // Check if bot can timeout
  const bot = await guild.members.fetch(guild.client.user.id);
  if (!bot.permissions.has('ModerateMembers')) {
    throw new Error('Bot does not have Moderate Members permission.');
  }
  
  // Validate duration (max 28 days)
  const maxDuration = 28 * 24 * 60 * 60 * 1000; // 28 days in ms
  if (duration > maxDuration) {
    throw new Error('Timeout duration cannot exceed 28 days.');
  }
  
  if (duration < 60 * 1000) { // 1 minute in ms
    throw new Error('Timeout duration must be at least 1 minute.');
  }
  
  // Apply timeout
  await target.timeout(duration, `${reason} | Timed out by ${guild.members.cache.get(moderatorId)?.user.tag}`);
  
  // Store in database
  await addMute(guild.id, targetId, moderatorId, reason, duration);
  
  const durationMinutes = Math.floor(duration / 60000);
  const durationHours = Math.floor(duration / 3600000);
  const durationDays = Math.floor(duration / 86400000);
  
  let durationText = '';
  if (durationDays > 0) {
    durationText = `${durationDays} day${durationDays > 1 ? 's' : ''}`;
  } else if (durationHours > 0) {
    durationText = `${durationHours} hour${durationHours > 1 ? 's' : ''}`;
  } else {
    durationText = `${durationMinutes} minute${durationMinutes > 1 ? 's' : ''}`;
  }
  
  return {
    success: true,
    user: target.user,
    duration: duration,
    durationText: durationText,
    reason: reason,
    message: `✅ ${target.user.tag} has been timed out for ${durationText}.`
  };
};

/**
 * Remove timeout from a user
 */
const untimeoutUser = async (guild, moderatorId, targetId, reason = 'No reason provided') => {
  // Check permissions
  const permissionCheck = await canModerate(guild, moderatorId, targetId);
  if (!permissionCheck.allowed) {
    throw new Error(permissionCheck.error);
  }
  
  const target = await getTargetMember(guild, targetId);
  if (!target) {
    throw new Error('User not found in this server.');
  }
  
  // Check if bot can moderate
  const bot = await guild.members.fetch(guild.client.user.id);
  if (!bot.permissions.has('ModerateMembers')) {
    throw new Error('Bot does not have Moderate Members permission.');
  }
  
  // Check if user is actually timed out
  if (!target.isCommunicationDisabled()) {
    throw new Error('This user is not currently timed out.');
  }
  
  // Remove timeout
  await target.timeout(null, `${reason} | Untimed out by ${guild.members.cache.get(moderatorId)?.user.tag}`);
  
  // Update database
  const activeMutes = await getActiveMutes(targetId, guild.id);
  for (const mute of activeMutes) {
    await removeMute(mute.mute_id, guild.id);
  }
  
  // Log the untimeout
  await logModerationAction({
    guildId: guild.id,
    userId: targetId,
    moderatorId: moderatorId,
    action: 'untimeout',
    reason: reason
  });
  
  return {
    success: true,
    user: target.user,
    reason: reason,
    message: `✅ ${target.user.tag} has been untimed out.`
  };
};

// ================ PURGE COMMAND ================

/**
 * Purge messages in a channel
 */
const purgeMessages = async (channel, moderatorId, messageCount, reason = 'No reason provided', targetUser = null) => {
  // Check bot permissions
  if (!channel.guild.members.me.permissions.has('ManageMessages')) {
    throw new Error('Bot does not have Manage Messages permission.');
  }
  
  // Validate count
  if (messageCount < 1) {
    throw new Error('Message count must be at least 1.');
  }
  
  if (messageCount > 100) {
    throw new Error('Cannot purge more than 100 messages at a time.');
  }
  
  // Fetch messages
  let messages = await channel.messages.fetch({ limit: messageCount });
  
  // Filter by target user if specified
  if (targetUser) {
    messages = messages.filter(msg => msg.author.id === targetUser);
  }
  
  if (messages.size === 0) {
    throw new Error('No messages found to delete.');
  }
  
  // Delete messages
  const deleted = await channel.bulkDelete(messages, true);
  
  // Log the purge
  await logModerationAction({
    guildId: channel.guild.id,
    userId: moderatorId,
    moderatorId: moderatorId,
    action: 'purge',
    reason: reason,
    channelId: channel.id,
    messageCount: deleted.size
  });
  
  // Also log for target user if specified
  if (targetUser) {
    await logModerationAction({
      guildId: channel.guild.id,
      userId: targetUser,
      moderatorId: moderatorId,
      action: 'purge',
      reason: reason,
      channelId: channel.id,
      messageCount: deleted.size
    });
  }
  
  return {
    success: true,
    count: deleted.size,
    targetUser: targetUser,
    channel: channel,
    message: `✅ ${deleted.size} message${deleted.size > 1 ? 's' : ''} purged${targetUser ? ` from <@${targetUser}>` : ''}.`
  };
};

// ================ WARNING COMMANDS ================

/**
 * Warn a user
 */
const warnUser = async (guild, moderatorId, targetId, reason = 'No reason provided', points = 1) => {
  // Check permissions
  const permissionCheck = await canModerate(guild, moderatorId, targetId);
  if (!permissionCheck.allowed) {
    throw new Error(permissionCheck.error);
  }
  
  const target = await getTargetMember(guild, targetId);
  if (!target) {
    throw new Error('User not found in this server.');
  }
  
  // Add warning
  const warning = await addWarning(
    guild.id,
    targetId,
    moderatorId,
    reason,
    points
  );
  
  // Get warning count
  const stats = await getActiveWarningsCount(targetId, guild.id);
  
  return {
    success: true,
    warning: warning,
    user: target.user,
    reason: reason,
    points: points,
    totalWarnings: stats.count,
    totalPoints: stats.totalPoints,
    message: `⚠️ ${target.user.tag} has been warned. (Total: ${stats.count} warnings, ${stats.totalPoints} points)`
  };
};

/**
 * Get warnings for a user
 */
const getUserWarnings = async (userId, guildId, includeInactive = false) => {
  const warnings = await getWarnings(userId, guildId, includeInactive);
  const stats = await getActiveWarningsCount(userId, guildId);
  
  return {
    warnings: warnings,
    total: warnings.length,
    activeCount: stats.count,
    totalPoints: stats.totalPoints
  };
};

/**
 * Remove a specific warning
 */
const removeWarningById = async (warningId, guildId, moderatorId) => {
  const warning = await removeWarning(warningId, guildId);
  
  if (!warning) {
    throw new Error('Warning not found or already removed.');
  }
  
  // Log the removal
  await logModerationAction({
    guildId: guildId,
    userId: warning.user_id,
    moderatorId: moderatorId,
    action: 'clearwarn',
    reason: `Removed warning #${warningId}`
  });
  
  return {
    success: true,
    warning: warning,
    message: `✅ Warning #${warningId} has been removed.`
  };
};

/**
 * Clear all warnings for a user
 */
const clearAllWarnings = async (userId, guildId, moderatorId) => {
  const result = await clearWarnings(userId, guildId);
  
  // Log the clearance
  await logModerationAction({
    guildId: guildId,
    userId: userId,
    moderatorId: moderatorId,
    action: 'clearwarnings',
    reason: 'Cleared all warnings'
  });
  
  return {
    success: true,
    user: userId,
    message: `✅ All warnings have been cleared for <@${userId}>.`
  };
};

// ================ MODERATION HISTORY ================

/**
 * Get moderation history for a user
 */
const getUserModerationHistory = async (userId, guildId, limit = 20) => {
  return await getModerationLogs(userId, guildId, limit);
};

/**
 * Get guild moderation statistics
 */
const getGuildModerationStats = async (guildId) => {
  return await getModerationStats(guildId);
};

// ================ AUTOMOD SYSTEM ================

// ================ AUTOMOD CONFIGURATION ================

/**
 * Enable or disable AutoMod
 */
const setAutoModEnabled = async (guildId, enabled) => {
  return await updateAutoModSettings(guildId, { enabled });
};

/**
 * Configure AutoMod settings
 */
const configureAutoMod = async (guildId, settings) => {
  return await updateAutoModSettings(guildId, settings);
};

/**
 * Get AutoMod configuration
 */
const getAutoModConfig = async (guildId) => {
  return await getAutoModSettings(guildId);
};

/**
 * Enable AutoMod
 */
const enableAutoMod = async (guildId) => {
  return await setAutoModEnabled(guildId, true);
};

/**
 * Disable AutoMod
 */
const disableAutoMod = async (guildId) => {
  return await setAutoModEnabled(guildId, false);
};

/**
 * Update AutoMod settings
 */
const updateAutoModConfig = async (guildId, settings) => {
  return await configureAutoMod(guildId, settings);
};

/**
 * Add bad word
 */
const addBadWordToGuild = async (guildId, word, severity = 1) => {
  return await addBadWord(guildId, word, severity);
};

/**
 * Remove bad word
 */
const removeBadWordFromGuild = async (guildId, word) => {
  return await removeBadWord(guildId, word);
};

/**
 * Get bad words
 */
const getBadWordsFromGuild = async (guildId) => {
  return await getBadWords(guildId);
};

/**
 * Add whitelisted link
 */
const addWhitelistedLinkToGuild = async (guildId, domain) => {
  return await addWhitelistedLink(guildId, domain);
};

/**
 * Remove whitelisted link
 */
const removeWhitelistedLinkFromGuild = async (guildId, domain) => {
  return await removeWhitelistedLink(guildId, domain);
};

/**
 * Get whitelisted links
 */
const getWhitelistedLinksFromGuild = async (guildId) => {
  return await getWhitelistedLinks(guildId);
};

// ================ AUTOMOD CHECK FUNCTIONS ================

/**
 * Check if message should be processed by AutoMod
 */
const shouldProcessMessage = async (message, settings) => {
  // Check if AutoMod is enabled
  if (!settings.enabled) return false;
  
  // Ignore bot messages
  if (message.author.bot) return false;
  
  // Check ignored roles
  if (settings.ignored_roles && settings.ignored_roles.length > 0) {
    const member = await message.guild.members.fetch(message.author.id);
    if (member.roles.cache.some(role => settings.ignored_roles.includes(role.id))) {
      return false;
    }
  }
  
  // Check ignored channels
  if (settings.ignored_channels && settings.ignored_channels.includes(message.channel.id)) {
    return false;
  }
  
  return true;
};

/**
 * Check for spam (message frequency)
 */
const checkSpam = async (message, settings) => {
  if (!settings.anti_spam) return null;
  
  const threshold = settings.spam_threshold || 5;
  const window = settings.spam_window || 5;
  
  // Get recent messages from this user
  const messages = await message.channel.messages.fetch({ limit: threshold + 5 });
  const userMessages = messages.filter(m => m.author.id === message.author.id);
  
  if (userMessages.size >= threshold) {
    // Check if messages are within the time window
    const firstMsg = userMessages.last();
    const lastMsg = userMessages.first();
    const timeDiff = (lastMsg.createdTimestamp - firstMsg.createdTimestamp) / 1000;
    
    if (timeDiff <= window) {
      return {
        violation: 'spam',
        details: `${userMessages.size} messages in ${timeDiff}s`,
        action: settings.action_type || 'warn'
      };
    }
  }
  
  return null;
};

/**
 * Check for invite links
 */
const checkInviteLinks = async (message, settings) => {
  if (!settings.anti_invite) return null;
  
  const inviteRegex = /(discord\.gg\/|discord\.com\/invite\/|discordapp\.com\/invite\/)[a-zA-Z0-9]+/gi;
  const matches = message.content.match(inviteRegex);
  
  if (matches && matches.length > 0) {
    return {
      violation: 'invite_link',
      details: matches.join(', '),
      action: settings.action_type || 'warn'
    };
  }
  
  return null;
};

/**
 * Check for bad words
 */
const checkBadWords = async (message, settings) => {
  if (!settings.anti_bad_words) return null;
  
  const badWords = await getBadWords(message.guild.id);
  if (badWords.length === 0) return null;
  
  const content = message.content.toLowerCase();
  const foundWords = badWords.filter(word => content.includes(word.toLowerCase()));
  
  if (foundWords.length > 0) {
    return {
      violation: 'bad_word',
      details: foundWords.join(', '),
      action: settings.action_type || 'warn',
      severity: foundWords.length
    };
  }
  
  return null;
};

/**
 * Check for mention spam
 */
const checkMentionSpam = async (message, settings) => {
  if (!settings.anti_mention_spam) return null;
  
  const threshold = settings.mention_threshold || 3;
  const mentions = message.mentions.users.size + message.mentions.roles.size + (message.mentions.everyone ? 1 : 0);
  
  if (mentions >= threshold) {
    return {
      violation: 'mention_spam',
      details: `${mentions} mentions`,
      action: settings.action_type || 'warn'
    };
  }
  
  return null;
};

/**
 * Check for duplicate messages
 */
const checkDuplicateMessages = async (message, settings) => {
  if (!settings.anti_duplicate) return null;
  
  const threshold = settings.duplicate_threshold || 3;
  
  // Get recent messages
  const messages = await message.channel.messages.fetch({ limit: threshold + 2 });
  const userMessages = messages.filter(m => m.author.id === message.author.id);
  
  // Count duplicate content
  const duplicates = userMessages.filter(m => m.content === message.content);
  
  if (duplicates.size >= threshold) {
    return {
      violation: 'duplicate_message',
      details: `${duplicates.size} duplicates`,
      action: settings.action_type || 'warn'
    };
  }
  
  return null;
};

/**
 * Check for link spam
 */
const checkLinkSpam = async (message, settings) => {
  if (!settings.anti_link_spam) return null;
  
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const matches = message.content.match(urlRegex);
  
  if (matches && matches.length > 0) {
    // Check whitelisted links
    const whitelisted = await getWhitelistedLinks(message.guild.id);
    const filtered = matches.filter(url => {
      try {
        const domain = new URL(url.includes('://') ? url : `https://${url}`).hostname.toLowerCase();
        return !whitelisted.some(w => domain.includes(w.toLowerCase()));
      } catch {
        return true;
      }
    });
    
    if (filtered.length > 0) {
      // Check if it's link spam (multiple links)
      if (filtered.length >= 3) {
        return {
          violation: 'link_spam',
          details: `${filtered.length} links`,
          action: 'timeout'
        };
      }
      
      return {
        violation: 'link',
        details: filtered.join(', '),
        action: settings.action_type || 'warn'
      };
    }
  }
  
  return null;
};

// ================ AUTOMOD ACTION HANDLERS ================

/**
 * Execute AutoMod action
 */
const executeAutoModAction = async (message, violationResult, settings) => {
  const { violation, details, action } = violationResult;
  const guildId = message.guild.id;
  const userId = message.author.id;
  const channelId = message.channel.id;
  
  let actionTaken = action || 'warn';
  let actionDetails = '';
  
  // Delete the message
  try {
    await message.delete();
  } catch (error) {
    console.error('Failed to delete message:', error);
  }
  
  // Log violation
  await logViolation(
    guildId,
    userId,
    channelId,
    violation,
    details,
    actionTaken,
    message.id
  );
  
  // Increment violation count
  await incrementUserViolations(userId, guildId, actionTaken);
  
  // Take action based on configured action
  switch (actionTaken) {
    case 'warn':
      await addWarning(guildId, userId, message.client.user.id, `AutoMod: ${violation} - ${details}`, settings.warn_points || 1);
      actionDetails = `⚠️ Warned (${settings.warn_points || 1} points)`;
      break;
      
    case 'timeout':
      const duration = (settings.timeout_duration || 5) * 60 * 1000;
      const member = await message.guild.members.fetch(userId);
      await member.timeout(duration, `AutoMod: ${violation} - ${details}`);
      await addMute(guildId, userId, message.client.user.id, `AutoMod: ${violation} - ${details}`, duration);
      actionDetails = `⏰ Timed out for ${settings.timeout_duration || 5} minutes`;
      break;
      
    default:
      actionDetails = `📝 Logged only`;
      break;
  }
  
  // Send warning to channel
  let warningMessage = `**AutoMod Alert**\n`;
  warningMessage += `📌 **Violation:** ${violation}\n`;
  warningMessage += `👤 **User:** <@${userId}>\n`;
  warningMessage += `📝 **Details:** ${details}\n`;
  warningMessage += `⚡ **Action:** ${actionDetails}`;
  
  // Send to channel or log channel
  const logChannelId = settings.log_channel;
  if (logChannelId) {
    try {
      const logChannel = await message.guild.channels.fetch(logChannelId);
      if (logChannel) {
        await logChannel.send(warningMessage);
      }
    } catch (error) {
      console.error('Failed to send to log channel:', error);
    }
  }
  
  return {
    violation,
    details,
    actionTaken,
    actionDetails,
    warningMessage
  };
};

/**
 * Increment user violation count
 */
const incrementUserViolations = async (userId, guildId, type) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Get or create user violations
    let data = await client.query(
      `INSERT INTO automod_user_violations (user_id, guild_id, violation_count, last_violation)
       VALUES ($1, $2, 1, NOW())
       ON CONFLICT (user_id, guild_id) 
       DO UPDATE SET 
         violation_count = automod_user_violations.violation_count + 1,
         last_violation = NOW(),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *;`,
      [userId, guildId]
    );
    
    // Update specific counters
    if (type === 'warn') {
      await client.query(
        `UPDATE automod_user_violations 
         SET warning_count = warning_count + 1
         WHERE user_id = $1 AND guild_id = $2;`,
        [userId, guildId]
      );
    } else if (type === 'timeout') {
      await client.query(
        `UPDATE automod_user_violations 
         SET timeout_count = timeout_count + 1
         WHERE user_id = $1 AND guild_id = $2;`,
        [userId, guildId]
      );
    }
    
    await client.query('COMMIT');
    return data.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Process message through AutoMod
 */
const processAutoMod = async (message) => {
  try {
    // Get settings
    const settings = await getAutoModSettings(message.guild.id);
    
    // Check if message should be processed
    if (!await shouldProcessMessage(message, settings)) return null;
    
    // Run all checks
    const checks = [
      checkSpam(message, settings),
      checkInviteLinks(message, settings),
      checkBadWords(message, settings),
      checkMentionSpam(message, settings),
      checkDuplicateMessages(message, settings),
      checkLinkSpam(message, settings)
    ];
    
    // Execute first violation found
    for (const check of checks) {
      const result = await check;
      if (result) {
        return await executeAutoModAction(message, result, settings);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error in AutoMod:', error);
    return null;
  }
};

// ================ PERMISSION ERROR EMBED HELPER ================

/**
 * Permission error embed helper (used by commands)
 */
const permissionErrorEmbed = (error, options = {}) => {
  const { EmbedBuilder } = require('discord.js');
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

// ================ EXPORTS ================
module.exports = {
  // Permission Helpers
  canModerate,
  hasModerationPermissions,
  getTargetMember,
  
  // Ban
  banUser,
  unbanUser,
  
  // Kick
  kickUser,
  
  // Timeout
  timeoutUser,
  untimeoutUser,
  
  // Purge
  purgeMessages,
  
  // Warnings
  warnUser,
  getUserWarnings,
  removeWarningById,
  clearAllWarnings,
  
  // History & Stats
  getUserModerationHistory,
  getGuildModerationStats,
  
  // AutoMod Configuration
  getAutoModConfig,
  enableAutoMod,
  disableAutoMod,
  updateAutoModConfig,
  setAutoModEnabled,
  configureAutoMod,
  
  // AutoMod Processing
  processAutoMod,
  shouldProcessMessage,
  
  // Bad Words
  addBadWordToGuild,
  removeBadWordFromGuild,
  getBadWordsFromGuild,
  
  // Whitelisted Links
  addWhitelistedLinkToGuild,
  removeWhitelistedLinkFromGuild,
  getWhitelistedLinksFromGuild,
  
  // Permission Error Embed
  permissionErrorEmbed
};