// tickets.js - Complete Ticket System Backend
const {
  // Database ticket functions
  getTicketConfig,
  updateTicketConfig,
  createTicket,
  getTicket,
  getTickets,
  claimTicket,
  unclaimTicket,
  closeTicket,
  reopenTicket,
  deleteTicket,
  addTicketMessage,
  getTicketMessages,
  createTranscript,
  getTranscript,
  assignManager,
  unassignManager,
  getTicketStats,
  getUserTicketStats,
  pool,
  query,
  getOne,
  getAll,
  insert,
  update,
  remove
} = require('./database.js');

// ================ TICKET CONFIGURATION ================

/**
 * Get ticket configuration for a guild
 */
const getGuildTicketConfig = async (guildId) => {
  return await getTicketConfig(guildId);
};

/**
 * Update ticket configuration for a guild
 */
const updateGuildTicketConfig = async (guildId, config) => {
  return await updateTicketConfig(guildId, config);
};

// ================ TICKET CREATION ================

/**
 * Create a new ticket
 */
const createNewTicket = async (guildId, channelId, userId, type, subject, description = null) => {
  const validTypes = ['support', 'purchase', 'sell'];
  if (!validTypes.includes(type)) {
    throw new Error('Invalid ticket type. Must be support, purchase, or sell');
  }
  
  return await createTicket(guildId, channelId, userId, type, subject, description);
};

// ================ TICKET RETRIEVAL ================

/**
 * Get a ticket by ID
 */
const getTicketById = async (ticketId) => {
  return await getTicket(ticketId);
};

/**
 * Get tickets with filters
 */
const getTicketsByGuild = async (guildId, filters = {}) => {
  return await getTickets(guildId, filters);
};

/**
 * Get user's tickets
 */
const getUserTickets = async (userId, guildId, status = null) => {
  const filters = { userId };
  if (status) filters.status = status;
  return await getTickets(guildId, filters);
};

/**
 * Get claimed tickets
 */
const getClaimedTickets = async (guildId, claimerId = null) => {
  const filters = { status: 'claimed' };
  if (claimerId) filters.claimerId = claimerId;
  return await getTickets(guildId, filters);
};

/**
 * Get open tickets
 */
const getOpenTickets = async (guildId) => {
  return await getTickets(guildId, { status: 'open' });
};

/**
 * Get closed tickets
 */
const getClosedTickets = async (guildId) => {
  return await getTickets(guildId, { status: 'closed' });
};

// ================ TICKET MANAGEMENT ================

/**
 * Claim a ticket
 */
const claimTicketById = async (ticketId, claimerId) => {
  const ticket = await getTicket(ticketId);
  if (!ticket) throw new Error('Ticket not found');
  if (ticket.status === 'closed') throw new Error('Cannot claim a closed ticket');
  if (ticket.status === 'claimed') throw new Error('Ticket already claimed');
  if (ticket.status === 'deleted') throw new Error('Ticket has been deleted');
  
  const result = await claimTicket(ticketId, claimerId);
  
  // Add system message
  await addTicketMessage(
    ticketId,
    claimerId,
    'System',
    `🔒 Ticket claimed by <@${claimerId}>`,
    [],
    true
  );
  
  return result;
};

/**
 * Unclaim a ticket
 */
const unclaimTicketById = async (ticketId, userId) => {
  const result = await unclaimTicket(ticketId, userId);
  
  // Add system message
  await addTicketMessage(
    ticketId,
    userId,
    'System',
    `🔓 Ticket unclaimed by <@${userId}>`,
    [],
    true
  );
  
  return result;
};

/**
 * Close a ticket
 */
const closeTicketById = async (ticketId, userId, reason = null) => {
  const ticket = await getTicket(ticketId);
  if (!ticket) throw new Error('Ticket not found');
  if (ticket.status === 'closed') throw new Error('Ticket already closed');
  if (ticket.status === 'deleted') throw new Error('Ticket has been deleted');
  
  const result = await closeTicket(ticketId, userId, reason);
  
  // Add system message
  const reasonText = reason ? ` Reason: ${reason}` : '';
  await addTicketMessage(
    ticketId,
    userId,
    'System',
    `🔒 Ticket closed by <@${userId}>${reasonText}`,
    [],
    true
  );
  
  return result;
};

/**
 * Reopen a closed ticket
 */
const reopenTicketById = async (ticketId, userId) => {
  const ticket = await getTicket(ticketId);
  if (!ticket) throw new Error('Ticket not found');
  if (ticket.status !== 'closed') throw new Error('Only closed tickets can be reopened');
  if (ticket.status === 'deleted') throw new Error('Ticket has been deleted');
  
  const result = await reopenTicket(ticketId, userId);
  
  // Add system message
  await addTicketMessage(
    ticketId,
    userId,
    'System',
    `🔄 Ticket reopened by <@${userId}>`,
    [],
    true
  );
  
  return result;
};

/**
 * Delete a ticket (with transcript)
 */
const deleteTicketById = async (ticketId, userId, channelId) => {
  const ticket = await getTicket(ticketId);
  if (!ticket) throw new Error('Ticket not found');
  if (ticket.status === 'deleted') throw new Error('Ticket already deleted');
  
  // Generate transcript before deletion
  const transcript = await generateTranscript(ticketId, channelId, userId);
  
  const result = await deleteTicket(ticketId, userId);
  
  // Add system message (won't be visible after deletion)
  await addTicketMessage(
    ticketId,
    userId,
    'System',
    `🗑️ Ticket deleted by <@${userId}>`,
    [],
    true
  );
  
  return {
    ...result,
    transcript: transcript
  };
};

/**
 * Rename a ticket channel
 */
const renameTicketChannel = async (ticketId, userId, newName, channel) => {
  const ticket = await getTicket(ticketId);
  if (!ticket) throw new Error('Ticket not found');
  if (ticket.status === 'deleted') throw new Error('Ticket has been deleted');
  
  // Update channel name
  await channel.setName(newName);
  
  // Add system message
  await addTicketMessage(
    ticketId,
    userId,
    'System',
    `✏️ Channel renamed to "${newName}" by <@${userId}>`,
    [],
    true
  );
  
  return {
    success: true,
    ticket: ticket,
    newName: newName,
    message: `✅ Ticket channel renamed to "${newName}"`
  };
};

/**
 * Add user to ticket channel
 */
const addUserToTicket = async (ticketId, userId, targetUserId, channel) => {
  const ticket = await getTicket(ticketId);
  if (!ticket) throw new Error('Ticket not found');
  if (ticket.status === 'deleted') throw new Error('Ticket has been deleted');
  
  // Add user to channel
  await channel.permissionOverwrites.edit(targetUserId, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true,
    AttachFiles: true,
    EmbedLinks: true
  });
  
  // Add system message
  await addTicketMessage(
    ticketId,
    userId,
    'System',
    `👤 <@${targetUserId}> added to ticket by <@${userId}>`,
    [],
    true
  );
  
  return {
    success: true,
    ticket: ticket,
    addedUser: targetUserId,
    message: `✅ <@${targetUserId}> has been added to the ticket`
  };
};

/**
 * Remove user from ticket channel
 */
const removeUserFromTicket = async (ticketId, userId, targetUserId, channel) => {
  const ticket = await getTicket(ticketId);
  if (!ticket) throw new Error('Ticket not found');
  if (ticket.status === 'deleted') throw new Error('Ticket has been deleted');
  
  // Remove user from channel
  await channel.permissionOverwrites.delete(targetUserId);
  
  // Add system message
  await addTicketMessage(
    ticketId,
    userId,
    'System',
    `🚫 <@${targetUserId}> removed from ticket by <@${userId}>`,
    [],
    true
  );
  
  return {
    success: true,
    ticket: ticket,
    removedUser: targetUserId,
    message: `✅ <@${targetUserId}> has been removed from the ticket`
  };
};

// ================ TICKET MESSAGES ================

/**
 * Add a message to a ticket
 */
const addTicketMessageById = async (ticketId, userId, username, content, attachments = [], isSystem = false) => {
  const ticket = await getTicket(ticketId);
  if (!ticket) throw new Error('Ticket not found');
  if (ticket.status === 'closed') throw new Error('Cannot add messages to a closed ticket');
  if (ticket.status === 'deleted') throw new Error('Cannot add messages to a deleted ticket');
  
  return await addTicketMessage(ticketId, userId, username, content, attachments, isSystem);
};

/**
 * Get messages for a ticket
 */
const getTicketMessagesById = async (ticketId, limit = 100) => {
  const ticket = await getTicket(ticketId);
  if (!ticket) throw new Error('Ticket not found');
  
  return await getTicketMessages(ticketId, limit);
};

// ================ TRANSCRIPTS ================

/**
 * Generate a transcript for a ticket
 */
const generateTranscript = async (ticketId, channelId, userId) => {
  const ticket = await getTicket(ticketId);
  if (!ticket) throw new Error('Ticket not found');
  
  const messages = await getTicketMessages(ticketId);
  
  // Build transcript content
  let transcriptContent = `=== TICKET TRANSCRIPT ===\n`;
  transcriptContent += `Ticket ID: #${ticketId}\n`;
  transcriptContent += `Type: ${ticket.type}\n`;
  transcriptContent += `Subject: ${ticket.subject}\n`;
  transcriptContent += `User: <@${ticket.user_id}>\n`;
  transcriptContent += `Created: ${new Date(ticket.created_at).toLocaleString()}\n`;
  transcriptContent += `Status: ${ticket.status}\n`;
  
  if (ticket.claimer_id) {
    transcriptContent += `Claimed By: <@${ticket.claimer_id}>\n`;
  }
  
  if (ticket.assigned_manager) {
    transcriptContent += `Assigned Manager: <@${ticket.assigned_manager}>\n`;
  }
  
  if (ticket.closed_at) {
    transcriptContent += `Closed: ${new Date(ticket.closed_at).toLocaleString()}\n`;
  }
  
  transcriptContent += `\n--- MESSAGES ---\n\n`;
  
  messages.forEach(msg => {
    const time = new Date(msg.sent_at).toLocaleString();
    const systemTag = msg.is_system ? '[SYSTEM] ' : '';
    const username = msg.username || `User ${msg.user_id}`;
    transcriptContent += `[${time}] ${systemTag}${username}: ${msg.content || '(No content)'}\n`;
    
    if (msg.attachment_urls && msg.attachment_urls.length > 0) {
      msg.attachment_urls.forEach(url => {
        transcriptContent += `  📎 Attachment: ${url}\n`;
      });
    }
  });
  
  transcriptContent += `\n--- END OF TRANSCRIPT ---\n`;
  transcriptContent += `Generated: ${new Date().toLocaleString()}\n`;
  
  // Store transcript
  const transcript = await createTranscript(
    ticketId,
    channelId,
    userId,
    transcriptContent,
    `transcript_${ticketId}_${Date.now()}.txt`
  );
  
  return {
    transcriptId: transcript.transcript_id,
    content: transcriptContent,
    ticketId: ticketId,
    attachmentUrl: transcript.attachment_url
  };
};

/**
 * Get transcript for a ticket
 */
const getTicketTranscript = async (ticketId) => {
  return await getTranscript(ticketId);
};

// ================ MANAGER ASSIGNMENT ================

/**
 * Assign a manager to a ticket
 */
const assignManagerToTicket = async (ticketId, managerId) => {
  const ticket = await getTicket(ticketId);
  if (!ticket) throw new Error('Ticket not found');
  if (ticket.status === 'closed') throw new Error('Cannot assign manager to a closed ticket');
  if (ticket.status === 'deleted') throw new Error('Ticket has been deleted');
  
  const result = await assignManager(ticketId, managerId);
  
  // Add system message
  await addTicketMessage(
    ticketId,
    managerId,
    'System',
    `👔 <@${managerId}> assigned as manager to this ticket`,
    [],
    true
  );
  
  return result;
};

/**
 * Unassign manager from a ticket
 */
const unassignManagerFromTicket = async (ticketId, managerId) => {
  const ticket = await getTicket(ticketId);
  if (!ticket) throw new Error('Ticket not found');
  
  const result = await unassignManager(ticketId, managerId);
  
  // Add system message
  await addTicketMessage(
    ticketId,
    managerId,
    'System',
    `👔 <@${managerId}> unassigned as manager from this ticket`,
    [],
    true
  );
  
  return result;
};

// ================ STATISTICS ================

/**
 * Get ticket statistics for a guild
 */
const getTicketStatistics = async (guildId) => {
  return await getTicketStats(guildId);
};

/**
 * Get user's ticket statistics
 */
const getUserTicketStatistics = async (userId, guildId) => {
  return await getUserTicketStats(userId, guildId);
};

// ================ UTILITY FUNCTIONS ================

/**
 * Check if a user can create a ticket
 */
const canCreateTicket = async (userId, guildId) => {
  const config = await getTicketConfig(guildId);
  const maxTickets = config?.max_tickets_per_user || 5;
  
  const stats = await getUserTicketStats(userId, guildId);
  return stats.open < maxTickets;
};

/**
 * Get ticket type emoji
 */
const getTicketTypeEmoji = (type) => {
  const emojis = {
    support: '🎫',
    purchase: '🛒',
    sell: '💰'
  };
  return emojis[type] || '📌';
};

/**
 * Get ticket status emoji
 */
const getTicketStatusEmoji = (status) => {
  const emojis = {
    open: '🟢',
    claimed: '🟡',
    reopened: '🔵',
    closed: '🔴',
    deleted: '⚫'
  };
  return emojis[status] || '⚪';
};

/**
 * Check if user has ticket manager role
 */
const hasTicketManagerRole = async (guild, userId) => {
  try {
    const config = await getTicketConfig(guild.id);
    if (!config || !config.support_role_id) return false;
    
    const member = await guild.members.fetch(userId);
    return member.roles.cache.has(config.support_role_id) || member.permissions.has('Administrator');
  } catch (error) {
    return false;
  }
};

/**
 * Format ticket for display
 */
const formatTicketForDisplay = (ticket) => {
  return {
    id: ticket.ticket_id,
    guildId: ticket.guild_id,
    channelId: ticket.channel_id,
    userId: ticket.user_id,
    claimerId: ticket.claimer_id,
    type: ticket.type,
    typeEmoji: getTicketTypeEmoji(ticket.type),
    subject: ticket.subject,
    description: ticket.description,
    status: ticket.status,
    statusEmoji: getTicketStatusEmoji(ticket.status),
    priority: ticket.priority,
    assignedManager: ticket.assigned_manager,
    closedBy: ticket.closed_by,
    closedAt: ticket.closed_at,
    reopenedAt: ticket.reopened_at,
    deletedBy: ticket.deleted_by,
    deletedAt: ticket.deleted_at,
    transcriptUrl: ticket.transcript_url,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at
  };
};

/**
 * Format tickets list for display
 */
const formatTicketsList = (tickets) => {
  return tickets.map(ticket => formatTicketForDisplay(ticket));
};

// ================ TICKET USER ADD/REMOVE EMBED HELPERS ================

/**
 * Ticket user add embed (for command responses)
 */
const ticketUserAddEmbed = (result, options = {}) => {
  const { EmbedBuilder } = require('discord.js');
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

/**
 * Ticket user remove embed (for command responses)
 */
const ticketUserRemoveEmbed = (result, options = {}) => {
  const { EmbedBuilder } = require('discord.js');
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

// ================ SELL TICKET FUNCTIONS ================

// Import sell ticket functions from database
const {
  getSellTickets,
  getSellTicketsByUser,
  getSellTicket,
  updateSellTicket,
  createSellTicket,
  getSellItem,
  approveSellItem,
  rejectSellItem,
  completeSellTransaction
} = require('./database.js');

/**
 * Create a sell ticket
 */
const createSellTicketById = async (sellId, userId, guildId, itemName, price, quantity = 1) => {
  return await createSellTicket(sellId, userId, guildId, itemName, price, quantity);
};

/**
 * Get sell tickets for a guild
 */
const getSellTicketsByGuild = async (guildId, status = null) => {
  return await getSellTickets(guildId, status);
};

/**
 * Get user's sell tickets
 */
const getUserSellTickets = async (userId, guildId, status = null) => {
  return await getSellTicketsByUser(userId, guildId, status);
};

/**
 * Get sell ticket by ID
 */
const getSellTicketById = async (ticketId) => {
  return await getSellTicket(ticketId);
};

/**
 * Update sell ticket status
 */
const updateSellTicketStatus = async (ticketId, status, managerId = null) => {
  const data = { status };
  if (managerId) data.manager_id = managerId;
  if (status === 'reviewed' || status === 'completed' || status === 'rejected') {
    data.reviewed_at = new Date();
  }
  return await updateSellTicket(ticketId, data);
};

/**
 * Approve a sell listing
 */
const approveSellListing = async (sellId, managerId) => {
  return await approveSellItem(sellId, managerId);
};

/**
 * Reject a sell listing
 */
const rejectSellListing = async (sellId, managerId, reason) => {
  return await rejectSellItem(sellId, managerId, reason);
};

/**
 * Complete a sell transaction
 */
const completeSellTransactionById = async (sellId, managerId, notes = null) => {
  return await completeSellTransaction(sellId, managerId, notes);
};

/**
 * Format sell ticket for display
 */
const formatSellTicketForDisplay = (ticket) => {
  const statusEmoji = {
    'pending': '⏳',
    'approved': '✅',
    'rejected': '❌',
    'completed': '💰',
    'inactive': '⛔'
  };
  
  return {
    id: ticket.ticket_id,
    sellId: ticket.sell_id,
    itemName: ticket.item_name,
    price: ticket.price,
    quantity: ticket.quantity,
    totalValue: ticket.price * ticket.quantity,
    status: ticket.status,
    statusEmoji: statusEmoji[ticket.status] || '📌',
    sellerId: ticket.user_id,
    managerId: ticket.manager_id,
    createdAt: ticket.created_at,
    reviewedAt: ticket.reviewed_at,
    notes: ticket.notes
  };
};

/**
 * Format sell tickets list for display
 */
const formatSellTicketsList = (tickets) => {
  return tickets.map(ticket => formatSellTicketForDisplay(ticket));
};

// ================ EXPORTS ================
module.exports = {
  // Configuration
  getGuildTicketConfig,
  updateGuildTicketConfig,
  
  // Creation
  createNewTicket,
  
  // Retrieval
  getTicketById,
  getTicketsByGuild,
  getUserTickets,
  getClaimedTickets,
  getOpenTickets,
  getClosedTickets,
  
  // Management
  claimTicketById,
  unclaimTicketById,
  closeTicketById,
  reopenTicketById,
  deleteTicketById,
  renameTicketChannel,
  addUserToTicket,
  removeUserFromTicket,
  
  // Messages
  addTicketMessageById,
  getTicketMessagesById,
  
  // Transcripts
  generateTranscript,
  getTicketTranscript,
  
  // Manager Assignment
  assignManagerToTicket,
  unassignManagerFromTicket,
  
  // Statistics
  getTicketStatistics,
  getUserTicketStatistics,
  
  // Utilities
  canCreateTicket,
  getTicketTypeEmoji,
  getTicketStatusEmoji,
  hasTicketManagerRole,
  formatTicketForDisplay,
  formatTicketsList,
  
  // Ticket User Embed Helpers
  ticketUserAddEmbed,
  ticketUserRemoveEmbed,
  
  // Sell Tickets
  createSellTicketById,
  getSellTicketsByGuild,
  getUserSellTickets,
  getSellTicketById,
  updateSellTicketStatus,
  approveSellListing,
  rejectSellListing,
  completeSellTransactionById,
  formatSellTicketForDisplay,
  formatSellTicketsList
};