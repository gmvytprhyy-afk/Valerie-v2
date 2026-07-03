// economy.js - Complete Economy System (FIXED - Removed Duplicate Imports)
const {
  // Core Database Functions
  getOrCreateCrystalEntry,
  getCrystals,
  addCrystals,
  removeCrystals,
  getCrystalStats,
  getCrystalLeaderboard,
  getUserCrystalRank,
  
  // Message Tracking
  updateMessageCount,
  checkMessageMilestone,
  getMessageStats,
  getMessageLeaderboard,
  
  // Invite Tracking
  trackInviteUse,
  trackInviteLeave,
  getInviteStats,
  getInviteLeaderboard,
  getUserInvites,
  
  // Shop
  createShopItem,
  getShopItems,
  getShopItem,
  updateShopItem,
  deleteShopItem,
  getAllShopItems,
  getShopItemWithCategory,
  restockItem,
  getShopStats,
  createPurchase,
  getPurchaseHistory,
  getTotalSpent,
  
  // economy.js - Add to the imports at the top
  // ... existing imports
  createPurchaseTicketChannel,
  sendPurchaseTicketMessage,
  closePurchaseTicket,
  createSellTicketChannel,
  sendSellTicketMessage,
  closeSellTicket,
  approveSellListingWithChannel,
  rejectSellListingWithChannel,
  // ... rest of 
  
  // Sell
  createSellPanel,
  getSellPanels,
  getSellPanel,
  updateSellPanel,
  deleteSellPanel,
  createSellItem,
  getSellItems,
  getSellItemsByUser,
  getSellItem,
  updateSellItem,
  deactivateSellItem,
  createSellTicket,
  getSellTickets,
  getSellTicketsByUser,
  getSellTicket,
  updateSellTicket,
  approveSellItem,
  rejectSellItem,
  completeSellTransaction,
  createSellHistory,
  getSellHistory,
  getSellHistoryByManager,
  
  // Custom Invites
  createCustomInvite,
  getCustomInvite,
  incrementInviteUses,
  markInviteJoinInactive,
  getCustomInviteStats,
  getCustomInviteLeaderboard,
  getCustomInvitesByUser,
  
  // Utilities
  pool,
  query,
  getOne,
  getAll,
  insert,
  update,
  upsert,
  remove
} = require('./database.js');

// ================ CRYSTAL ECONOMY FUNCTIONS ================

/**
 * Get a user's crystal balance
 */
const getBalance = async (userId, guildId) => {
  return await getCrystals(userId, guildId);
};

/**
 * Get detailed economy stats for a user
 */
const getStats = async (userId, guildId) => {
  const stats = await getCrystalStats(userId, guildId);
  const messageStats = await getMessageStats(userId, guildId);
  const inviteStats = await getInviteStats(userId, guildId);
  const rank = await getUserCrystalRank(userId, guildId);
  const history = await getTransactionHistory(userId, guildId, 10);
  
  return {
    crystals: stats.crystals || 0,
    totalEarned: stats.totalEarned || 0,
    totalSpent: stats.totalSpent || 0,
    rank: rank,
    messages: messageStats.total || 0,
    messageMilestones: messageStats.milestones || 0,
    invites: inviteStats.total_joins || 0,
    inviteCrystalsEarned: inviteStats.total_joins || 0,
    activeInvites: inviteStats.active_joins || 0,
    recentTransactions: history
  };
};

/**
 * Add crystals to a user
 */
const addCrystalsToUser = async (userId, guildId, amount, reason = 'Manual add') => {
  if (amount <= 0) throw new Error('Amount must be positive');
  return await addCrystals(userId, guildId, amount, reason);
};

/**
 * Remove crystals from a user
 */
const removeCrystalsFromUser = async (userId, guildId, amount, reason = 'Manual remove') => {
  if (amount <= 0) throw new Error('Amount must be positive');
  return await removeCrystals(userId, guildId, amount, reason);
};

/**
 * Check if user has sufficient crystals
 */
const hasSufficientCrystals = async (userId, guildId, amount) => {
  const balance = await getCrystals(userId, guildId);
  return balance >= amount;
};

/**
 * Transfer crystals between users
 */
const transferCrystals = async (fromUserId, toUserId, guildId, amount, reason = 'Transfer') => {
  if (amount <= 0) throw new Error('Amount must be positive');
  if (fromUserId === toUserId) throw new Error('Cannot transfer to yourself');
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const senderBalance = await client.query(
      'SELECT crystals FROM crystal_economy WHERE user_id = $1 AND guild_id = $2;',
      [fromUserId, guildId]
    );
    
    if (senderBalance.rows.length === 0 || senderBalance.rows[0].crystals < amount) {
      throw new Error('Insufficient crystals');
    }
    
    await client.query(
      `UPDATE crystal_economy 
       SET crystals = crystals - $1, total_spent = total_spent + $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND guild_id = $3;`,
      [amount, fromUserId, guildId]
    );
    
    await client.query(
      `INSERT INTO crystal_economy (user_id, guild_id, crystals, total_earned)
       VALUES ($1, $2, $3, $3)
       ON CONFLICT (user_id, guild_id) 
       DO UPDATE SET 
         crystals = crystal_economy.crystals + $3,
         total_earned = crystal_economy.total_earned + $3,
         updated_at = CURRENT_TIMESTAMP;`,
      [toUserId, guildId, amount]
    );
    
    await client.query(
      `INSERT INTO economy_transactions (user_id, guild_id, amount, type, reason, reference_id)
       VALUES ($1, $2, $3, 'spend', $4, $5);`,
      [fromUserId, guildId, amount, `Transfer to ${toUserId}`, toUserId]
    );
    
    await client.query(
      `INSERT INTO economy_transactions (user_id, guild_id, amount, type, reason, reference_id)
       VALUES ($1, $2, $3, 'earn', $4, $5);`,
      [toUserId, guildId, amount, `Transfer from ${fromUserId}`, fromUserId]
    );
    
    await client.query('COMMIT');
    return { success: true, amount: amount };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Get transaction history for a user
 */
const getTransactionHistory = async (userId, guildId, limit = 20) => {
  const result = await query(
    `SELECT * FROM economy_transactions
     WHERE user_id = $1 AND guild_id = $2
     ORDER BY created_at DESC
     LIMIT $3;`,
    [userId, guildId, limit]
  );
  return result.rows;
};

/**
 * Get crystal leaderboard
 */
const getCrystalLeaderboardWithUsers = async (guildId, limit = 10) => {
  return await getCrystalLeaderboard(guildId, limit);
};

/**
 * Get user's rank
 */
const getRank = async (userId, guildId) => {
  return await getUserCrystalRank(userId, guildId);
};

// ================ MESSAGE REWARD FUNCTIONS ================

/**
 * Process message reward - awards crystals for milestones
 */
const processMessageReward = async (userId, guildId) => {
  try {
    // Update message count
    await updateMessageCount(userId, guildId);
    
    // Check for milestone
    const earned = await checkMessageMilestone(userId, guildId);
    
    if (earned > 0) {
      // Award crystals
      await addCrystals(
        userId,
        guildId,
        earned,
        `Message milestone reward`,
        `msg_milestone`
      );
      
      return {
        success: true,
        crystalsEarned: earned,
        message: `💎 ${userId} earned ${earned} crystal(s) for reaching a message milestone!`
      };
    }
    
    return {
      success: true,
      crystalsEarned: 0,
      message: `📝 ${userId} sent a message`
    };
  } catch (error) {
    console.error('Error processing message reward:', error);
    return { 
      success: false, 
      crystalsEarned: 0,
      message: 'Error processing message reward' 
    };
  }
};

/**
 * Get user's message stats
 */
const getUserMessageStats = async (userId, guildId) => {
  return await getMessageStats(userId, guildId);
};

/**
 * Get message leaderboard
 */
const getMessageLeaderboardWithUsers = async (guildId, limit = 10, period = 'total') => {
  return await getMessageLeaderboard(guildId, limit, period);
};

// ================ INVITE REWARD FUNCTIONS ================

/**
 * Process invite join with crystal reward
 */
const processInviteJoin = async (inviteCode, userId, guildId) => {
  try {
    const invite = await trackInviteUse(inviteCode, userId);
    
    if (!invite) {
      return { success: false, message: 'Invalid invite code' };
    }
    
    const isFarming = await checkInviteFarming(userId, guildId);
    if (isFarming) {
      return { success: false, message: 'Invite farming detected' };
    }
    
    await addCrystals(
      invite.inviter_id,
      guildId,
      1,
      `Invite reward for ${userId} joining`,
      `invite_${inviteCode}`
    );
    
    return {
      success: true,
      inviterId: invite.inviter_id,
      crystalsEarned: 1,
      message: `✅ ${invite.inviter_id} earned 1 crystal for inviting ${userId}`
    };
  } catch (error) {
    console.error('Error processing invite join reward:', error);
    return { success: false, message: 'Error processing invite reward' };
  }
};

/**
 * Process invite leave with crystal penalty
 */
const processInviteLeave = async (userId, guildId) => {
  try {
    const join = await trackInviteLeave(userId, guildId);
    
    if (!join) {
      return { success: false, message: 'No active invite found' };
    }
    
    const inviterBalance = await getCrystals(join.inviter_id, guildId);
    
    if (inviterBalance > 0) {
      await removeCrystals(
        join.inviter_id,
        guildId,
        1,
        `Invite penalty for ${userId} leaving`,
        `leave_${userId}`
      );
      
      return {
        success: true,
        inviterId: join.inviter_id,
        crystalsRemoved: 1,
        message: `🔻 ${join.inviter_id} lost 1 crystal because ${userId} left`
      };
    } else {
      return {
        success: true,
        inviterId: join.inviter_id,
        crystalsRemoved: 0,
        message: `ℹ️ ${userId} left but ${join.inviter_id} has 0 crystals (no penalty)`
      };
    }
  } catch (error) {
    console.error('Error processing invite leave penalty:', error);
    return { success: false, message: 'Error processing invite penalty' };
  }
};

/**
 * Check for invite farming
 */
const checkInviteFarming = async (userId, guildId) => {
  const stats = await getInviteStats(userId, guildId);
  if (stats.active_joins >= 5) {
    return true;
  }
  return false;
};

/**
 * Get user's invite stats
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
 * Get invite leaderboard
 */
const getInviteLeaderboardWithUsers = async (guildId, limit = 10) => {
  return await getInviteLeaderboard(guildId, limit);
};

// ================ SHOP FUNCTIONS ================

/**
 * Create a shop category
 */
const createShopCategory = async (guildId, name, description = null, emoji = null) => {
  return await insert('shop_categories', {
    guild_id: guildId,
    name: name,
    description: description,
    emoji: emoji
  });
};

/**
 * Get all shop categories
 */
const getShopCategories = async (guildId) => {
  return await getAll('shop_categories', { guild_id: guildId });
};

/**
 * Create a shop item
 */
const createShopItemCommand = async (guildId, itemData) => {
  if (!itemData.name || itemData.name.length < 1) {
    throw new Error('Item name is required');
  }
  
  if (itemData.price < 0) {
    throw new Error('Price must be a positive number');
  }
  
  if (itemData.stock !== undefined && itemData.stock < -1) {
    throw new Error('Stock must be -1 (unlimited) or a positive number');
  }
  
  const item = await createShopItem(guildId, itemData);
  
  return {
    success: true,
    item: item,
    message: `✅ Shop item "${itemData.name}" created successfully!`
  };
};

/**
 * Edit a shop item
 */
const editShopItemCommand = async (itemId, guildId, updateData) => {
  const existingItem = await getShopItem(itemId);
  
  if (!existingItem) {
    throw new Error('Item not found');
  }
  
  if (existingItem.guild_id !== guildId) {
    throw new Error('You do not have permission to edit this item');
  }
  
  if (updateData.name !== undefined && updateData.name.length < 1) {
    throw new Error('Item name cannot be empty');
  }
  
  if (updateData.price !== undefined && updateData.price < 0) {
    throw new Error('Price must be a positive number');
  }
  
  if (updateData.stock !== undefined && updateData.stock < -1) {
    throw new Error('Stock must be -1 (unlimited) or a positive number');
  }
  
  const updatedItem = await updateShopItem(itemId, updateData);
  
  return {
    success: true,
    item: updatedItem,
    message: `✅ Shop item "${updatedItem.name}" updated successfully!`
  };
};

/**
 * Delete a shop item
 */
const deleteShopItemCommand = async (itemId, guildId) => {
  const existingItem = await getShopItem(itemId);
  
  if (!existingItem) {
    throw new Error('Item not found');
  }
  
  if (existingItem.guild_id !== guildId) {
    throw new Error('You do not have permission to delete this item');
  }
  
  await deleteShopItem(itemId);
  
  return {
    success: true,
    item: existingItem,
    message: `✅ Shop item "${existingItem.name}" deleted successfully!`
  };
};

/**
 * Restock a shop item
 */
const restockShopItem = async (itemId, guildId, amount) => {
  const existingItem = await getShopItem(itemId);
  
  if (!existingItem) {
    throw new Error('Item not found');
  }
  
  if (existingItem.guild_id !== guildId) {
    throw new Error('You do not have permission to restock this item');
  }
  
  if (amount < 0) {
    throw new Error('Restock amount must be positive');
  }
  
  const updated = await restockItem(itemId, amount);
  
  return {
    success: true,
    item: updated,
    amount: amount,
    message: `✅ Restocked ${amount} of "${updated.name}". New stock: ${updated.stock === -1 ? '♾️ Unlimited' : updated.stock}`
  };
};

/**
 * Purchase an item from the shop
 */
// economy.js - Updated purchase with Discord ticket

const purchaseShopItem = async (userId, guildId, itemId, quantity = 1, interaction = null) => {
  if (quantity < 1) {
    throw new Error('Quantity must be at least 1');
  }
  
  const item = await getShopItem(itemId);
  
  if (!item) {
    throw new Error('Item not found');
  }
  
  if (item.guild_id !== guildId) {
    throw new Error('Item not available in this server');
  }
  
  if (item.stock !== -1 && item.stock < quantity) {
    throw new Error(`Insufficient stock. Only ${item.stock} available.`);
  }
  
  const totalCost = item.price * quantity;
  const balance = await getCrystals(userId, guildId);
  
  if (balance < totalCost) {
    throw new Error(`Insufficient crystals. You need ${totalCost} but have ${balance}.`);
  }
  
  // Process purchase
  const purchase = await createPurchase(userId, guildId, itemId, quantity);
  const newBalance = await getCrystals(userId, guildId);
  
  // 🔥 CREATE DISCORD TICKET CHANNEL
  if (interaction && interaction.guild) {
    try {
      const guild = interaction.guild;
      const user = interaction.user;
      
      // Create channel ticket
      const channel = await createPurchaseTicketChannel(guild, userId, purchase, item);
      
      // Send initial message
      await sendPurchaseTicketMessage(channel, purchase, item, user);
      
      // Update ticket with channel ID
      await update('purchase_tickets', 
        { channel_id: channel.id }, 
        { ticket_id: purchase.purchase_id }
      );
      
      return {
        success: true,
        purchase: purchase,
        item: item,
        quantity: quantity,
        totalCost: totalCost,
        newBalance: newBalance,
        ticketChannel: channel,
        message: `✅ You purchased ${quantity}x ${item.name} for ${totalCost} crystals! A ticket has been created in ${channel}.`
      };
    } catch (error) {
      console.error('Error creating ticket channel:', error);
      // Still return purchase even if ticket creation fails
      return {
        success: true,
        purchase: purchase,
        item: item,
        quantity: quantity,
        totalCost: totalCost,
        newBalance: newBalance,
        ticketChannel: null,
        message: `✅ You purchased ${quantity}x ${item.name} for ${totalCost} crystals! (Ticket creation failed)`
      };
    }
  }
  
  return {
    success: true,
    purchase: purchase,
    item: item,
    quantity: quantity,
    totalCost: totalCost,
    newBalance: newBalance,
    ticketChannel: null,
    message: `✅ You purchased ${quantity}x ${item.name} for ${totalCost} crystals!`
  };
};
/**
 * Get shop items with category filter
 */
const getShopItemsByCategory = async (guildId, categoryId = null) => {
  return await getShopItems(guildId, categoryId);
};

/**
 * Get all shop items with categories
 */
const getFullShopList = async (guildId, includeInactive = false) => {
  const items = await getAllShopItems(guildId, includeInactive);
  const stats = await getShopStats(guildId);
  
  const categories = {};
  items.forEach(item => {
    const catName = item.category_name || 'Uncategorized';
    if (!categories[catName]) {
      categories[catName] = {
        emoji: item.category_emoji || '📂',
        items: []
      };
    }
    categories[catName].items.push(item);
  });
  
  return {
    items: items,
    categories: categories,
    stats: stats,
    total: items.length
  };
};

/**
 * Format shop item for display
 */
const formatShopItemForDisplay = (item) => {
  return {
    id: item.item_id,
    name: item.name,
    description: item.description || 'No description',
    price: item.price,
    priceText: item.price === 0 ? 'FREE' : `${item.price} 💎`,
    stock: item.stock,
    stockText: item.stock === -1 ? '♾️ Unlimited' : item.stock === 0 ? '❌ Out of Stock' : `${item.stock} left`,
    imageUrl: item.image_url,
    category: item.category_name || 'Uncategorized',
    emoji: item.category_emoji || '🛒',
    roleId: item.role_id,
    isLimited: item.is_limited,
    limitPerUser: item.limit_per_user,
    isActive: item.is_active,
    createdAt: item.created_at
  };
};

/**
 * Get user's purchase history
 */
const getUserPurchaseHistory = async (userId, guildId, limit = 20) => {
  return await getPurchaseHistory(userId, guildId, limit);
};

// ================ SELL FUNCTIONS ================

/**
 * Create a sell panel
 */
const createSellPanelCommand = async (guildId, channelId, panelData) => {
  if (!panelData.title || panelData.title.length < 1) {
    throw new Error('Panel title is required');
  }
  
  if (!panelData.description || panelData.description.length < 1) {
    throw new Error('Panel description is required');
  }
  
  const panel = await createSellPanel(
    guildId,
    channelId,
    panelData.title,
    panelData.description,
    {
      color: panelData.color || '#F39C12',
      thumbnailUrl: panelData.thumbnailUrl || null,
      requireApproval: panelData.requireApproval !== undefined ? panelData.requireApproval : true,
      autoDelete: panelData.autoDelete || false
    }
  );
  
  return {
    success: true,
    panel: panel,
    message: `✅ Sell panel "${panelData.title}" created successfully!`
  };
};

/**
 * Edit a sell panel
 */
const editSellPanelCommand = async (panelId, guildId, updateData) => {
  const existingPanel = await getSellPanel(panelId);
  
  if (!existingPanel) {
    throw new Error('Sell panel not found');
  }
  
  if (existingPanel.guild_id !== guildId) {
    throw new Error('You do not have permission to edit this panel');
  }
  
  if (updateData.title !== undefined && updateData.title.length < 1) {
    throw new Error('Panel title cannot be empty');
  }
  
  if (updateData.description !== undefined && updateData.description.length < 1) {
    throw new Error('Panel description cannot be empty');
  }
  
  const updatedPanel = await updateSellPanel(panelId, updateData);
  
  return {
    success: true,
    panel: updatedPanel,
    message: `✅ Sell panel "${updatedPanel.title}" updated successfully!`
  };
};

/**
 * Delete a sell panel
 */
const deleteSellPanelCommand = async (panelId, guildId) => {
  const existingPanel = await getSellPanel(panelId);
  
  if (!existingPanel) {
    throw new Error('Sell panel not found');
  }
  
  if (existingPanel.guild_id !== guildId) {
    throw new Error('You do not have permission to delete this panel');
  }
  
  await deleteSellPanel(panelId);
  
  return {
    success: true,
    panel: existingPanel,
    message: `✅ Sell panel "${existingPanel.title}" deleted successfully!`
  };
};

/**
 * Create a sell listing (User)
 */
// economy.js - Updated sell listing with Discord ticket

const createSellListing = async (panelId, userId, guildId, itemData, interaction = null) => {
  if (!itemData.name || itemData.name.length < 1) {
    throw new Error('Item name is required');
  }
  
  if (itemData.price < 0) {
    throw new Error('Price must be a positive number');
  }
  
  if (itemData.quantity < 1) {
    throw new Error('Quantity must be at least 1');
  }
  
  const panel = await getSellPanel(panelId);
  
  if (!panel) {
    throw new Error('Sell panel not found');
  }
  
  if (panel.guild_id !== guildId) {
    throw new Error('Panel not available in this server');
  }
  
  // Create sell item
  const sellItem = await createSellItem(panelId, userId, guildId, itemData);
  
  // Create ticket
  const ticket = await createSellTicket(
    sellItem.sell_id,
    userId,
    guildId,
    itemData.name,
    itemData.price,
    itemData.quantity
  );
  
  // 🔥 CREATE DISCORD TICKET CHANNEL
  if (interaction && interaction.guild) {
    try {
      const guild = interaction.guild;
      const user = interaction.user;
      
      // Create channel ticket
      const channel = await createSellTicketChannel(guild, userId, sellItem);
      
      // Send initial message
      await sendSellTicketMessage(channel, sellItem, user);
      
      // Update ticket with channel ID
      await update('sell_tickets', 
        { channel_id: channel.id }, 
        { ticket_id: ticket.ticket_id }
      );
      
      return {
        success: true,
        sellItem: sellItem,
        ticket: ticket,
        ticketChannel: channel,
        message: `✅ Your listing for "${itemData.name}" has been created and is pending review! A ticket has been created in ${channel}.`
      };
    } catch (error) {
      console.error('Error creating sell ticket channel:', error);
      return {
        success: true,
        sellItem: sellItem,
        ticket: ticket,
        ticketChannel: null,
        message: `✅ Your listing for "${itemData.name}" has been created and is pending review! (Ticket creation failed)`
      };
    }
  }
  
  return {
    success: true,
    sellItem: sellItem,
    ticket: ticket,
    ticketChannel: null,
    message: `✅ Your listing for "${itemData.name}" has been created and is pending review!`
  };
};
/**
 * Get sell panels for a guild
 */
const getSellPanelsByGuild = async (guildId) => {
  return await getSellPanels(guildId);
};

/**
 * Get sell listings with filters
 */
const getSellListingsByGuild = async (guildId, status = null) => {
  return await getSellItems(guildId, status);
};

/**
 * Get user's sell listings
 */
const getUserSellListings = async (userId, guildId, status = null) => {
  return await getSellItemsByUser(userId, guildId, status);
};

/**
 * Approve a sell listing
 */
const approveSellListing = async (sellId, managerId) => {
  const sellItem = await getSellItem(sellId);
  
  if (!sellItem) {
    throw new Error('Sell listing not found');
  }
  
  if (sellItem.status !== 'pending') {
    throw new Error('This listing has already been processed');
  }
  
  const approved = await approveSellItem(sellId, managerId);
  
  return {
    success: true,
    sellItem: approved,
    message: `✅ Sell listing "${sellItem.item_name}" approved!`
  };
};

/**
 * Reject a sell listing
 */
const rejectSellListing = async (sellId, managerId, reason) => {
  const sellItem = await getSellItem(sellId);
  
  if (!sellItem) {
    throw new Error('Sell listing not found');
  }
  
  if (sellItem.status !== 'pending') {
    throw new Error('This listing has already been processed');
  }
  
  const rejected = await rejectSellItem(sellId, managerId, reason);
  
  return {
    success: true,
    sellItem: rejected,
    message: `❌ Sell listing "${sellItem.item_name}" rejected. Reason: ${reason}`
  };
};

/**
 * Complete a sell transaction
 */
const completeSellTransactionCommand = async (sellId, managerId, notes = null) => {
  const sellItem = await getSellItem(sellId);
  
  if (!sellItem) {
    throw new Error('Sell listing not found');
  }
  
  if (sellItem.status !== 'approved') {
    throw new Error('Listing must be approved before completion');
  }
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(
      `INSERT INTO sell_history (
        sell_id, user_id, guild_id, item_name, price, quantity, total_amount, manager_id, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'completed');`,
      [
        sellId,
        sellItem.user_id,
        sellItem.guild_id,
        sellItem.item_name,
        sellItem.price,
        sellItem.quantity,
        sellItem.price * sellItem.quantity,
        managerId,
        notes
      ]
    );
    
    await client.query(
      `UPDATE sell_items 
       SET status = 'completed', is_active = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE sell_id = $1;`,
      [sellId]
    );
    
    await client.query(
      `UPDATE sell_tickets 
       SET status = 'completed', manager_id = $1, reviewed_at = CURRENT_TIMESTAMP, notes = $2, updated_at = CURRENT_TIMESTAMP
       WHERE sell_id = $3;`,
      [managerId, notes, sellId]
    );
    
    await client.query('COMMIT');
    
    return {
      success: true,
      sellId: sellId,
      message: `✅ Sell transaction completed for "${sellItem.item_name}"! Payment must be arranged manually.`
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Get user's sell history
 */
const getUserSellHistory = async (userId, guildId, limit = 20) => {
  return await getSellHistory(userId, guildId, limit);
};

/**
 * Format sell panels for display
 */
const formatSellPanelsForDisplay = async (panels, guildId) => {
  const formattedPanels = panels.map((panel) => {
    return {
      id: panel.panel_id,
      title: panel.title,
      description: panel.description,
      color: panel.color || '#F39C12',
      thumbnailUrl: panel.thumbnail_url,
      requireApproval: panel.require_approval,
      autoDelete: panel.auto_delete,
      channelId: panel.channel_id,
      messageId: panel.message_id
    };
  });
  
  return {
    panels: formattedPanels,
    totalPanels: panels.length
  };
};

/**
 * Format sell listings for display
 */
const formatSellListingsForDisplay = (listings) => {
  const statusEmoji = {
    'pending': '⏳',
    'approved': '✅',
    'rejected': '❌',
    'completed': '💰',
    'inactive': '⛔'
  };
  
  return listings.map((listing) => ({
    id: listing.sell_id,
    itemName: listing.item_name,
    description: listing.item_description || 'No description',
    price: listing.price,
    quantity: listing.quantity,
    totalValue: listing.price * listing.quantity,
    status: listing.status,
    statusEmoji: statusEmoji[listing.status] || '📌',
    category: listing.category || 'Uncategorized',
    imageUrl: listing.item_image_url,
    sellerId: listing.user_id,
    createdAt: listing.created_at,
    approvedBy: listing.approved_by,
    approvedAt: listing.approved_at,
    rejectionReason: listing.rejection_reason
  }));
};

// ================ CUSTOM INVITE FUNCTIONS ================

/**
 * Create a custom invite link
 */
const createCustomInviteLink = async (guildId, inviterId, maxUses = 0) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const invite = await createCustomInvite(code, guildId, inviterId, maxUses);
  return {
    success: true,
    code: code,
    link: `https://discord.gg/${code}`,
    maxUses: maxUses,
    message: `✅ Custom invite created: \`${code}\``
  };
};

/**
 * Process custom invite join
 */
const processCustomInviteJoin = async (inviteCode, userId, guildId) => {
  try {
    const invite = await getCustomInvite(inviteCode);
    if (!invite || !invite.is_active) {
      return { success: false, message: 'Invalid or inactive invite code' };
    }
    if (invite.inviter_id === userId) {
      return { success: false, message: 'You cannot use your own invite' };
    }
    if (invite.max_uses > 0 && invite.uses >= invite.max_uses) {
      return { success: false, message: 'This invite has reached maximum uses' };
    }
    await incrementInviteUses(inviteCode, userId);
    await addCrystals(invite.inviter_id, guildId, 1, `Custom invite reward for ${userId} joining`, `invite_${inviteCode}`);
    return {
      success: true,
      inviterId: invite.inviter_id,
      crystalsEarned: 1,
      message: `✅ ${invite.inviter_id} earned 1 crystal for inviting ${userId}`
    };
  } catch (error) {
    console.error('Error processing custom invite join:', error);
    return { success: false, message: error.message || 'Error processing invite' };
  }
};

/**
 * Process custom invite leave (penalty)
 */
const processCustomInviteLeave = async (userId, guildId) => {
  try {
    const join = await markInviteJoinInactive(userId, guildId);
    if (!join) {
      return { success: false, message: 'No active invite found' };
    }
    const balance = await getCrystals(join.inviter_id, guildId);
    if (balance > 0) {
      await removeCrystals(join.inviter_id, guildId, 1, `Invite penalty for ${userId} leaving`, `leave_${userId}`);
      return {
        success: true,
        inviterId: join.inviter_id,
        crystalsRemoved: 1,
        message: `🔻 ${join.inviter_id} lost 1 crystal because ${userId} left`
      };
    }
    return {
      success: true,
      inviterId: join.inviter_id,
      crystalsRemoved: 0,
      message: `ℹ️ ${userId} left but ${join.inviter_id} has 0 crystals (no penalty)`
    };
  } catch (error) {
    console.error('Error processing custom invite leave:', error);
    return { success: false, message: 'Error processing invite penalty' };
  }
};

/**
 * Get custom invite stats for a user
 */
const getCustomInviteStatsForUser = async (userId, guildId) => {
  const stats = await getCustomInviteStats(userId, guildId);
  const invites = await getCustomInvitesByUser(userId, guildId);
  return {
    totalInvites: invites.length,
    totalJoins: stats.total_joins || 0,
    activeJoins: stats.active_joins || 0,
    totalLeaves: stats.total_leaves || 0,
    invites: invites.map(i => ({
      code: i.invite_code,
      uses: i.uses,
      maxUses: i.max_uses,
      createdAt: i.created_at,
      isActive: i.is_active
    }))
  };
};

/**
 * Get custom invite leaderboard with users
 */
const getCustomInviteLeaderboardWithUsers = async (guildId, limit = 10, client) => {
  const data = await getCustomInviteLeaderboard(guildId, limit);
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

// ================ ADMIN CRYSTAL MANAGEMENT ================

/**
 * Add crystals to a user (Admin only)
 */
const adminAddCrystals = async (userId, guildId, amount, reason = 'Admin added') => {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }
  
  if (amount > 1000000) {
    throw new Error('Cannot add more than 1,000,000 crystals at once');
  }
  
  // Check if user exists in economy
  const userExists = await getOne('crystal_economy', { user_id: userId, guild_id: guildId });
  if (!userExists) {
    // Create entry if it doesn't exist
    await getOrCreateCrystalEntry(userId, guildId);
  }
  
  const result = await addCrystals(userId, guildId, amount, reason, 'admin_add');
  
  return {
    success: true,
    user: userId,
    amount: amount,
    newBalance: result.crystals,
    message: `✅ Added ${amount} crystals to <@${userId}>. New balance: ${result.crystals} 💎`
  };
};

/**
 * Remove crystals from a user (Admin only)
 */
const adminRemoveCrystals = async (userId, guildId, amount, reason = 'Admin removed') => {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }
  
  // Check if user exists
  const userExists = await getOne('crystal_economy', { user_id: userId, guild_id: guildId });
  if (!userExists) {
    throw new Error('User not found in economy system');
  }
  
  // Check if user has enough crystals
  const currentBalance = await getCrystals(userId, guildId);
  if (currentBalance < amount) {
    throw new Error(`User only has ${currentBalance} crystals, cannot remove ${amount}`);
  }
  
  const result = await removeCrystals(userId, guildId, amount, reason, 'admin_remove');
  
  return {
    success: true,
    user: userId,
    amount: amount,
    newBalance: result.crystals,
    message: `✅ Removed ${amount} crystals from <@${userId}>. New balance: ${result.crystals} 💎`
  };
};

/**
 * Set crystals to a specific amount (Admin only)
 */
const adminSetCrystals = async (userId, guildId, amount, reason = 'Admin set') => {
  if (amount < 0) {
    throw new Error('Amount cannot be negative');
  }
  
  if (amount > 1000000) {
    throw new Error('Cannot set more than 1,000,000 crystals');
  }
  
  // Check if user exists
  const userExists = await getOne('crystal_economy', { user_id: userId, guild_id: guildId });
  if (!userExists) {
    await getOrCreateCrystalEntry(userId, guildId);
  }
  
  const currentBalance = await getCrystals(userId, guildId);
  const difference = amount - currentBalance;
  
  if (difference > 0) {
    await addCrystals(userId, guildId, difference, reason, 'admin_set');
  } else if (difference < 0) {
    await removeCrystals(userId, guildId, Math.abs(difference), reason, 'admin_set');
  }
  
  const newBalance = await getCrystals(userId, guildId);
  
  return {
    success: true,
    user: userId,
    amount: amount,
    newBalance: newBalance,
    message: `✅ Set <@${userId}>'s crystals to ${amount} 💎`
  };
};

// economy.js - Add these if not already there

// ================ EXPORTS ================
module.exports = {
  // Core Economy
  getBalance,
  getStats,
  addCrystalsToUser,
  removeCrystalsFromUser,
  hasSufficientCrystals,
  transferCrystals,
  getTransactionHistory,
  getCrystalLeaderboardWithUsers,
  getRank,
  
  // Message Rewards
  processMessageReward,
  getUserMessageStats,
  getMessageLeaderboardWithUsers,
  
  // Invite Rewards
  processInviteJoin,
  processInviteLeave,
  checkInviteFarming,
  getUserInviteStats,
  getInviteLeaderboardWithUsers,
  
  // Shop Categories
  createShopCategory,
  getShopCategories,
  
  // Shop Items
  createShopItemCommand,
  editShopItemCommand,
  deleteShopItemCommand,
  restockShopItem,
  purchaseShopItem,
  getShopItemsByCategory,
  getFullShopList,
  formatShopItemForDisplay,
  getUserPurchaseHistory,
  
  // Sell Panels
  createSellPanelCommand,
  editSellPanelCommand,
  deleteSellPanelCommand,
  getSellPanelsByGuild,
  formatSellPanelsForDisplay,
  // ... existing ...
  
  // Admin Crystal Management
  adminAddCrystals,
  adminRemoveCrystals,
  adminSetCrystals,
  
  // ... rest of exports
  
  // Sell Listings
  createSellListing,
  getSellListingsByGuild,
  getUserSellListings,
  approveSellListing,
  rejectSellListing,
  completeSellTransactionCommand,
  getUserSellHistory,
  formatSellListingsForDisplay,
  
  // Custom Invites
  createCustomInviteLink,
  processCustomInviteJoin,
  processCustomInviteLeave,
  getCustomInviteStatsForUser,
  getCustomInviteLeaderboardWithUsers,
  
  // Direct Database Access (for advanced use)
  getOrCreateCrystalEntry,
  addCrystals,
  removeCrystals,
  getCrystals,
  getCrystalStats,
  getCrystalLeaderboard,
  getUserCrystalRank,
  getShopItem,
  getSellItem,
  getSellPanel
};