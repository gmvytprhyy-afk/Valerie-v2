// embeds.js - Complete Embed Builder System (FIXED with Purchase Buttons)
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// ================ CONSTANTS ================
const COLORS = {
  SUCCESS: '#57F287',
  ERROR: '#ED4245',
  WARNING: '#FEE75C',
  INFO: '#5865F2',
  ECONOMY: '#F1C40F',
  SHOP: '#E67E22',
  SELL: '#F39C12',
  TICKET: '#9B59B6',
  MODERATION: '#E74C3C',
  WELCOME: '#2ECC71',
  GOODBYE: '#E74C3C',
  LEADERBOARD: '#F39C12',
  LOGS: '#3498DB',
  HELP: '#1ABC9C',
  DEFAULT: '#2B2D31'
};

const FOOTER_TEXT = 'Valerie Helper • v1.0';
const FOOTER_ICON = 'https://cdn.discordapp.com/embed/avatars/0.png';

// ================ BASE EMBED BUILDER ================
const createBaseEmbed = (options = {}) => {
  const embed = new EmbedBuilder()
    .setColor(options.color || COLORS.DEFAULT)
    .setTimestamp(options.timestamp !== false ? new Date() : null)
    .setFooter({
      text: options.footer || FOOTER_TEXT,
      iconURL: options.footerIcon || FOOTER_ICON
    });

  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);
  if (options.url) embed.setURL(options.url);
  
  if (options.author) {
    embed.setAuthor({
      name: options.author.name,
      iconURL: options.author.iconURL || null,
      url: options.author.url || null
    });
  }

  if (options.fields && options.fields.length > 0) {
    embed.addFields(options.fields);
  }

  return embed;
};

// ================ BASIC EMBEDS ================
const successEmbed = (description, options = {}) => {
  return createBaseEmbed({
    color: COLORS.SUCCESS,
    title: options.title || '✅ Success',
    description: description,
    author: options.author,
    thumbnail: options.thumbnail,
    image: options.image,
    fields: options.fields,
    footer: options.footer,
    footerIcon: options.footerIcon,
    timestamp: options.timestamp
  });
};

const errorEmbed = (description, options = {}) => {
  return createBaseEmbed({
    color: COLORS.ERROR,
    title: options.title || '❌ Error',
    description: description,
    author: options.author,
    thumbnail: options.thumbnail,
    image: options.image,
    fields: options.fields,
    footer: options.footer,
    footerIcon: options.footerIcon,
    timestamp: options.timestamp
  });
};

const warningEmbed = (description, options = {}) => {
  return createBaseEmbed({
    color: COLORS.WARNING,
    title: options.title || '⚠️ Warning',
    description: description,
    author: options.author,
    thumbnail: options.thumbnail,
    image: options.image,
    fields: options.fields,
    footer: options.footer,
    footerIcon: options.footerIcon,
    timestamp: options.timestamp
  });
};

const infoEmbed = (description, options = {}) => {
  return createBaseEmbed({
    color: COLORS.INFO,
    title: options.title || 'ℹ️ Information',
    description: description,
    author: options.author,
    thumbnail: options.thumbnail,
    image: options.image,
    fields: options.fields,
    footer: options.footer,
    footerIcon: options.footerIcon,
    timestamp: options.timestamp
  });
};

const customEmbed = (options = {}) => {
  return createBaseEmbed({
    color: options.color || COLORS.DEFAULT,
    title: options.title,
    description: options.description,
    author: options.author,
    thumbnail: options.thumbnail,
    image: options.image,
    fields: options.fields,
    footer: options.footer || FOOTER_TEXT,
    footerIcon: options.footerIcon || FOOTER_ICON,
    timestamp: options.timestamp,
    url: options.url
  });
};

// ================ ECONOMY EMBEDS ================
const economyEmbed = (title, description, options = {}) => {
  const fields = options.fields || [];
  
  if (options.balance !== undefined) {
    fields.push({
      name: '💰 Balance',
      value: `${options.balance.toLocaleString()} 💎`,
      inline: true
    });
  }
  
  if (options.bank !== undefined) {
    fields.push({
      name: '🏦 Bank',
      value: `${options.bank.toLocaleString()} 💎`,
      inline: true
    });
  }
  
  if (options.wallet !== undefined) {
    fields.push({
      name: '👛 Wallet',
      value: `${options.wallet.toLocaleString()} 💎`,
      inline: true
    });
  }
  
  if (options.streak !== undefined) {
    fields.push({
      name: '🔥 Streak',
      value: `${options.streak} days`,
      inline: true
    });
  }

  return createBaseEmbed({
    color: COLORS.ECONOMY,
    title: title || '💰 Economy',
    description: description,
    author: options.author,
    thumbnail: options.thumbnail || 'https://cdn.discordapp.com/emojis/1000500000000000000.png',
    image: options.image,
    fields: fields,
    footer: options.footer,
    footerIcon: options.footerIcon,
    timestamp: options.timestamp
  });
};

// ================ SHOP UI EMBEDS ================

const shopMenuEmbed = (shopData, options = {}) => {
  const fields = [];
  
  fields.push({
    name: '📊 Shop Statistics',
    value: `**Total Items:** ${shopData.stats?.active_items || 0}\n**Categories:** ${Object.keys(shopData.categories || {}).length}`,
    inline: false
  });
  
  if (shopData.categories) {
    const categoryList = Object.entries(shopData.categories)
      .map(([name, data]) => `${data.emoji || '📂'} ${name} (${data.items.length})`)
      .join('\n');
    fields.push({
      name: '📂 Categories',
      value: categoryList || 'No categories available',
      inline: false
    });
  }
  
  if (options.balance !== undefined) {
    fields.push({
      name: '💎 Your Balance',
      value: `${options.balance} crystals`,
      inline: false
    });
  }
  
  return createBaseEmbed({
    color: COLORS.SHOP,
    title: options.title || '🏪 Shop',
    description: options.description || 'Select a category below to browse items.',
    author: options.author,
    thumbnail: options.thumbnail || 'https://cdn.discordapp.com/emojis/1000500000000000001.png',
    fields: fields,
    footer: 'Use the dropdown menu to browse categories',
    timestamp: true
  });
};

// ================ SHOP CATEGORY EMBED WITH PURCHASE BUTTONS ================

const shopCategoryEmbed = (category, items, options = {}) => {
  const fields = [];
  const buttons = [];
  
  items.slice(0, 10).forEach((item, index) => {
    const stockText = item.stock === -1 ? '♾️' : item.stock === 0 ? '❌' : `${item.stock}`;
    const priceText = item.price === 0 ? 'FREE' : `${item.price} 💎`;
    
    fields.push({
      name: `${index + 1}. ${item.emoji || '🛒'} ${item.name}`,
      value: `💰 ${priceText} | 📦 ${stockText}\n📝 ${item.description || 'No description'}`,
      inline: false
    });
    
    // Add a purchase button for each item (if in stock)
    if (item.stock !== 0 && item.is_active !== false) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId(`purchase_${item.item_id}`)
          .setLabel(`🛒 Purchase ${item.name}`)
          .setStyle(ButtonStyle.Success)
      );
    }
  });
  
  if (items.length > 10) {
    fields.push({
      name: '📊 Showing First 10',
      value: `${items.length - 10} more items available.`,
      inline: false
    });
  }
  
  // Create embed
  const embed = createBaseEmbed({
    color: COLORS.SHOP,
    title: `📂 ${category}`,
    description: options.description || 'Select an item below to purchase.',
    author: options.author,
    thumbnail: options.thumbnail,
    fields: fields,
    footer: `Total: ${items.length} items`,
    timestamp: true
  });
  
  // Return embed with button rows (max 5 buttons per row)
  const rows = [];
  if (buttons.length > 0) {
    for (let i = 0; i < buttons.length; i += 5) {
      const row = new ActionRowBuilder();
      buttons.slice(i, i + 5).forEach(btn => row.addComponents(btn));
      rows.push(row);
    }
  }
  
  return { embed, rows };
};

const purchaseConfirmEmbed = (result, options = {}) => {
  const fields = [
    { name: '🛒 Item', value: result.item.name, inline: true },
    { name: '🔢 Quantity', value: `${result.quantity}`, inline: true },
    { name: '💰 Total Cost', value: `${result.totalCost} 💎`, inline: true },
    { name: '📦 Remaining Stock', value: result.item.stock === -1 ? '♾️ Unlimited' : `${result.item.stock - result.quantity}`, inline: true },
    { name: '💎 New Balance', value: `${result.newBalance} 💎`, inline: true }
  ];
  
  if (result.item.role_id) {
    fields.push({ name: '🎭 Role Granted', value: `<@&${result.item.role_id}>`, inline: true });
  }
  
  return createBaseEmbed({
    color: COLORS.SUCCESS,
    title: '✅ Purchase Successful!',
    description: `You have successfully purchased **${result.quantity}x ${result.item.name}**!`,
    author: options.author,
    thumbnail: result.item.image_url || null,
    fields: fields,
    footer: `Purchase ID: #${result.purchase.purchase_id}`,
    timestamp: true
  });
};

const sellMenuEmbed = (panels, options = {}) => {
  const fields = [];
  
  panels.forEach((panel, index) => {
    fields.push({
      name: `${index + 1}. 📋 ${panel.title}`,
      value: `📢 <#${panel.channel_id}>\n📝 ${panel.description || 'No description'}\n✅ Approval: ${panel.require_approval ? 'Required' : 'Not Required'}`,
      inline: false
    });
  });
  
  if (panels.length === 0) {
    fields.push({
      name: '📭 No Sell Panels',
      value: 'No sell panels have been created in this server.',
      inline: false
    });
  }
  
  return createBaseEmbed({
    color: COLORS.SELL,
    title: '💰 Sell System',
    description: 'Select a panel below to start selling your items.',
    author: options.author,
    thumbnail: options.thumbnail || 'https://cdn.discordapp.com/emojis/1000500000000000004.png',
    fields: fields,
    footer: 'Use the dropdown menu to select a panel',
    timestamp: true
  });
};

const sellListingEmbed = (panel, options = {}) => {
  const fields = [
    { name: '📋 Panel', value: panel.title, inline: true },
    { name: '📢 Channel', value: `<#${panel.channel_id}>`, inline: true },
    { name: '✅ Approval Required', value: panel.require_approval ? 'Yes' : 'No', inline: true }
  ];
  
  return createBaseEmbed({
    color: COLORS.SELL,
    title: '📝 Create Sell Listing',
    description: 'Fill out the form below to list your item for sale.',
    author: options.author,
    thumbnail: options.thumbnail,
    fields: fields,
    footer: 'Click the button below to open the form',
    timestamp: true
  });
};

// ================ SHOP COMMAND EMBEDS ================
const shopAddItemEmbed = (item, options = {}) => {
  const fields = [
    { name: '🛒 Name', value: item.name, inline: true },
    { name: '💰 Price', value: `${item.price} 💎`, inline: true },
    { name: '📦 Stock', value: item.stock === -1 ? '♾️ Unlimited' : `${item.stock}`, inline: true }
  ];
  
  if (item.description) fields.push({ name: '📝 Description', value: item.description, inline: false });
  if (item.category_name) fields.push({ name: '📂 Category', value: item.category_name, inline: true });
  if (item.role_id) fields.push({ name: '🎭 Role', value: `<@&${item.role_id}>`, inline: true });
  if (item.is_limited) fields.push({ name: '🔒 Limited', value: `Limit: ${item.limit_per_user} per user`, inline: true });
  if (item.image_url) fields.push({ name: '🖼️ Image', value: `[Click to view](${item.image_url})`, inline: false });
  
  return createBaseEmbed({
    color: COLORS.SUCCESS,
    title: '✅ Shop Item Added',
    description: `Successfully added **${item.name}** to the shop!`,
    author: options.author,
    thumbnail: item.image_url || null,
    fields: fields,
    footer: `Item ID: ${item.item_id}`,
    timestamp: true
  });
};

const shopEditItemEmbed = (item, changes, options = {}) => {
  const fields = [
    { name: '🛒 Name', value: item.name, inline: true },
    { name: '💰 Price', value: `${item.price} 💎`, inline: true },
    { name: '📦 Stock', value: item.stock === -1 ? '♾️ Unlimited' : `${item.stock}`, inline: true }
  ];
  
  if (changes && Object.keys(changes).length > 0) {
    const changeList = Object.entries(changes).map(([key, value]) => `• **${key}**: ${value}`).join('\n');
    fields.push({ name: '📝 Changes Made', value: changeList, inline: false });
  }
  if (item.description) fields.push({ name: '📝 Description', value: item.description, inline: false });
  
  return createBaseEmbed({
    color: COLORS.INFO,
    title: '✏️ Shop Item Updated',
    description: `Successfully updated **${item.name}**!`,
    author: options.author,
    thumbnail: item.image_url || null,
    fields: fields,
    footer: `Item ID: ${item.item_id}`,
    timestamp: true
  });
};

const shopRemoveItemEmbed = (item, options = {}) => {
  const fields = [
    { name: '🛒 Name', value: item.name, inline: true },
    { name: '💰 Price', value: `${item.price} 💎`, inline: true },
    { name: '📦 Stock', value: item.stock === -1 ? '♾️ Unlimited' : `${item.stock}`, inline: true }
  ];
  if (item.description) fields.push({ name: '📝 Description', value: item.description, inline: false });
  
  return createBaseEmbed({
    color: COLORS.ERROR,
    title: '🗑️ Shop Item Removed',
    description: `Successfully removed **${item.name}** from the shop.`,
    author: options.author,
    fields: fields,
    footer: `Item ID: ${item.item_id}`,
    timestamp: true
  });
};

const shopRestockEmbed = (item, amount, options = {}) => {
  const fields = [
    { name: '🛒 Name', value: item.name, inline: true },
    { name: '📦 Added Stock', value: `${amount}`, inline: true },
    { name: '📊 New Stock', value: item.stock === -1 ? '♾️ Unlimited' : `${item.stock}`, inline: true },
    { name: '💰 Price', value: `${item.price} 💎`, inline: true }
  ];
  
  return createBaseEmbed({
    color: COLORS.SUCCESS,
    title: '📦 Item Restocked',
    description: `Successfully restocked **${item.name}**!`,
    author: options.author,
    thumbnail: item.image_url || null,
    fields: fields,
    footer: `Item ID: ${item.item_id}`,
    timestamp: true
  });
};

const shopListEmbed = (shopData, options = {}) => {
  const fields = [];
  
  fields.push({
    name: '📊 Shop Statistics',
    value: `**Total Items:** ${shopData.stats?.total_items || 0}\n**Active Items:** ${shopData.stats?.active_items || 0}\n**Out of Stock:** ${shopData.stats?.out_of_stock || 0}`,
    inline: false
  });
  
  if (shopData.categories) {
    Object.entries(shopData.categories).forEach(([category, data]) => {
      const itemList = data.items.map(item => {
        const stockText = item.stock === -1 ? '♾️' : item.stock === 0 ? '❌' : `${item.stock}`;
        const statusText = item.is_active ? '🟢' : '🔴';
        return `${statusText} **${item.name}** — ${item.price} 💎 (${stockText})`;
      }).join('\n');
      fields.push({
        name: `${data.emoji} ${category} (${data.items.length})`,
        value: itemList || 'No items in this category',
        inline: false
      });
    });
  }
  
  if (fields.length === 0) {
    fields.push({ name: '📭 Shop Empty', value: 'No items available in the shop.', inline: false });
  }
  
  return createBaseEmbed({
    color: options.color || COLORS.SHOP,
    title: options.title || '🛒 Shop Inventory',
    description: options.description || 'All items currently available in the shop.',
    author: options.author,
    thumbnail: options.thumbnail,
    fields: fields,
    footer: `Total: ${shopData.total || 0} items`,
    timestamp: true
  });
};

// ================ SELL EMBEDS ================
const sellPanelCreateEmbed = (panel, options = {}) => {
  const fields = [
    { name: '📋 Panel Title', value: panel.title, inline: true },
    { name: '📢 Channel ID', value: `<#${panel.channel_id}>`, inline: true },
    { name: '📝 Description', value: panel.description || 'No description', inline: false }
  ];
  if (panel.thumbnail_url) fields.push({ name: '🖼️ Thumbnail', value: `[Click to view](${panel.thumbnail_url})`, inline: false });
  fields.push(
    { name: '✅ Require Approval', value: panel.require_approval ? 'Yes' : 'No', inline: true },
    { name: '🗑️ Auto Delete', value: panel.auto_delete ? 'Yes' : 'No', inline: true }
  );
  
  return createBaseEmbed({
    color: panel.color || COLORS.SELL,
    title: '✅ Sell Panel Created',
    description: `Successfully created sell panel **${panel.title}**!`,
    author: options.author,
    thumbnail: options.thumbnail || panel.thumbnail_url || null,
    fields: fields,
    footer: `Panel ID: ${panel.panel_id}`,
    timestamp: true
  });
};

const sellPanelEditEmbed = (panel, changes, options = {}) => {
  const fields = [
    { name: '📋 Panel Title', value: panel.title, inline: true },
    { name: '📢 Channel ID', value: `<#${panel.channel_id}>`, inline: true }
  ];
  if (changes && Object.keys(changes).length > 0) {
    const changeList = Object.entries(changes).map(([key, value]) => `• **${key}**: ${value}`).join('\n');
    fields.push({ name: '📝 Changes Made', value: changeList, inline: false });
  }
  if (panel.description) fields.push({ name: '📝 Description', value: panel.description, inline: false });
  
  return createBaseEmbed({
    color: panel.color || COLORS.INFO,
    title: '✏️ Sell Panel Updated',
    description: `Successfully updated **${panel.title}**!`,
    author: options.author,
    thumbnail: options.thumbnail || panel.thumbnail_url || null,
    fields: fields,
    footer: `Panel ID: ${panel.panel_id}`,
    timestamp: true
  });
};

const sellPanelDeleteEmbed = (panel, options = {}) => {
  return createBaseEmbed({
    color: COLORS.ERROR,
    title: '🗑️ Sell Panel Deleted',
    description: `Successfully deleted **${panel.title}** from the server.`,
    author: options.author,
    fields: [
      { name: '📋 Panel Title', value: panel.title, inline: true },
      { name: '📢 Channel ID', value: `<#${panel.channel_id}>`, inline: true },
      { name: '📝 Description', value: panel.description || 'No description', inline: false }
    ],
    footer: `Panel ID: ${panel.panel_id}`,
    timestamp: true
  });
};

// ================ TICKET EMBEDS ================
const ticketCreateEmbed = (ticket, options = {}) => {
  const fields = [
    { name: '🎫 Ticket ID', value: `#${ticket.ticket_id}`, inline: true },
    { name: '📋 Type', value: ticket.type.toUpperCase(), inline: true },
    { name: '📊 Status', value: `🟢 OPEN`, inline: true },
    { name: '📝 Subject', value: ticket.subject, inline: false }
  ];
  if (ticket.description) fields.push({ name: '📄 Description', value: ticket.description, inline: false });
  fields.push(
    { name: '👤 Created By', value: `<@${ticket.user_id}>`, inline: true },
    { name: '📅 Created At', value: `<t:${Math.floor(new Date(ticket.created_at).getTime() / 1000)}:F>`, inline: true }
  );
  
  return createBaseEmbed({
    color: COLORS.TICKET,
    title: `🎟️ ${ticket.type.toUpperCase()} Ticket #${ticket.ticket_id}`,
    description: 'Your ticket has been created!',
    author: options.author,
    thumbnail: options.thumbnail || 'https://cdn.discordapp.com/emojis/1000500000000000002.png',
    fields: fields,
    footer: 'A staff member will assist you shortly',
    timestamp: true
  });
};

const ticketClaimEmbed = (ticket, claimer, options = {}) => {
  return createBaseEmbed({
    color: COLORS.SUCCESS,
    title: '🔒 Ticket Claimed',
    description: `Ticket #${ticket.ticket_id} has been claimed`,
    author: options.author || {
      name: `Claimed by ${claimer.username || 'Unknown'}`,
      iconURL: claimer.displayAvatarURL ? claimer.displayAvatarURL() : null
    },
    fields: [
      { name: '🎫 Ticket ID', value: `#${ticket.ticket_id}`, inline: true },
      { name: '👤 Claimed By', value: `<@${claimer.id || claimer}>`, inline: true },
      { name: '📊 Status', value: '🟡 CLAIMED', inline: true },
      { name: '📝 Subject', value: ticket.subject || 'No subject', inline: false }
    ],
    footer: 'Ticket is now being handled',
    timestamp: true
  });
};

const ticketCloseEmbed = (ticket, options = {}) => {
  const fields = [
    { name: '🎫 Ticket ID', value: `#${ticket.ticket_id}`, inline: true },
    { name: '👤 Closed By', value: `<@${ticket.closed_by}>`, inline: true },
    { name: '📊 Status', value: '🔴 CLOSED', inline: true },
    { name: '📅 Closed At', value: `<t:${Math.floor(new Date(ticket.closed_at).getTime() / 1000)}:F>`, inline: true }
  ];
  if (options.reason) fields.push({ name: '📝 Reason', value: options.reason, inline: false });
  if (ticket.claimer_id) fields.push({ name: '👤 Claimed By', value: `<@${ticket.claimer_id}>`, inline: true });
  
  return createBaseEmbed({
    color: COLORS.ERROR,
    title: '🔒 Ticket Closed',
    description: `Ticket #${ticket.ticket_id} has been closed`,
    author: options.author,
    fields: fields,
    footer: 'Ticket can be reopened if needed',
    timestamp: true
  });
};

const ticketReopenEmbed = (ticket, options = {}) => {
  return createBaseEmbed({
    color: COLORS.WARNING,
    title: '🔄 Ticket Reopened',
    description: `Ticket #${ticket.ticket_id} has been reopened`,
    author: options.author,
    fields: [
      { name: '🎫 Ticket ID', value: `#${ticket.ticket_id}`, inline: true },
      { name: '👤 Reopened By', value: `<@${options.reopenedBy || ticket.closed_by}>`, inline: true },
      { name: '📊 Status', value: '🔵 REOPENED', inline: true }
    ],
    timestamp: true
  });
};

const ticketDeleteEmbed = (ticket, options = {}) => {
  const fields = [
    { name: '🎫 Ticket ID', value: `#${ticket.ticket_id}`, inline: true },
    { name: '👤 Deleted By', value: `<@${ticket.deleted_by}>`, inline: true },
    { name: '📊 Status', value: '⚫ DELETED', inline: true },
    { name: '📅 Deleted At', value: `<t:${Math.floor(new Date(ticket.deleted_at).getTime() / 1000)}:F>`, inline: true }
  ];
  if (options.transcript) fields.push({ name: '📄 Transcript', value: `[View Transcript](#)`, inline: false });
  
  return createBaseEmbed({
    color: COLORS.ERROR,
    title: '🗑️ Ticket Deleted',
    description: `Ticket #${ticket.ticket_id} has been deleted`,
    author: options.author,
    fields: fields,
    footer: 'Transcript has been generated',
    timestamp: true
  });
};

const ticketRenameEmbed = (ticket, newName, options = {}) => {
  return createBaseEmbed({
    color: COLORS.INFO,
    title: '✏️ Ticket Renamed',
    description: `Ticket channel has been renamed`,
    author: options.author,
    fields: [
      { name: '🎫 Ticket ID', value: `#${ticket.ticket_id}`, inline: true },
      { name: '📋 New Name', value: `${newName}`, inline: true },
      { name: '👤 Renamed By', value: `<@${options.renamedBy}>`, inline: true }
    ],
    timestamp: true
  });
};

const ticketTranscriptEmbed = (transcript, options = {}) => {
  const fields = [
    { name: '🎫 Ticket ID', value: `#${transcript.ticket_id}`, inline: true },
    { name: '📄 Transcript ID', value: `#${transcript.transcript_id}`, inline: true },
    { name: '📅 Generated At', value: `<t:${Math.floor(new Date(transcript.created_at).getTime() / 1000)}:F>`, inline: true },
    { name: '📊 Status', value: '✅ Generated', inline: true }
  ];
  if (transcript.attachment_url) fields.push({ name: '📎 Transcript File', value: `[Download Transcript](${transcript.attachment_url})`, inline: false });
  
  return createBaseEmbed({
    color: COLORS.LOGS,
    title: '📋 Ticket Transcript',
    description: 'Transcript generated successfully',
    author: options.author,
    fields: fields,
    footer: 'Transcript stored for records',
    timestamp: true
  });
};

const ticketPermissionErrorEmbed = (options = {}) => {
  return createBaseEmbed({
    color: COLORS.ERROR,
    title: '⛔ Permission Denied',
    description: options.description || 'You do not have permission to perform this action.',
    author: options.author,
    fields: [
      { name: '⚠️ Required Role', value: 'Ticket Manager', inline: true },
      { name: '💡 Suggestion', value: 'Contact a server administrator to get the required role.', inline: false }
    ],
    footer: 'Permission Required',
    timestamp: true
  });
};

// ================ MODERATION EMBEDS ================
const banEmbed = (result, options = {}) => {
  return createBaseEmbed({
    color: COLORS.ERROR,
    title: '🔨 User Banned',
    description: `${result.user.tag} has been banned.`,
    author: options.author,
    thumbnail: result.user.displayAvatarURL ? result.user.displayAvatarURL() : null,
    fields: [
      { name: '👤 User', value: `${result.user.tag} (${result.user.id})`, inline: true },
      { name: '📝 Reason', value: result.reason || 'No reason provided', inline: false },
      { name: '🕒 Banned At', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
    ],
    footer: 'Moderation Action',
    timestamp: true
  });
};

const kickEmbed = (result, options = {}) => {
  return createBaseEmbed({
    color: COLORS.WARNING,
    title: '👢 User Kicked',
    description: `${result.user.tag} has been kicked.`,
    author: options.author,
    thumbnail: result.user.displayAvatarURL ? result.user.displayAvatarURL() : null,
    fields: [
      { name: '👤 User', value: `${result.user.tag} (${result.user.id})`, inline: true },
      { name: '📝 Reason', value: result.reason || 'No reason provided', inline: false },
      { name: '🕒 Kicked At', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
    ],
    footer: 'Moderation Action',
    timestamp: true
  });
};

const timeoutEmbed = (result, options = {}) => {
  return createBaseEmbed({
    color: COLORS.WARNING,
    title: '⏰ User Timed Out',
    description: `${result.user.tag} has been timed out for ${result.durationText}.`,
    author: options.author,
    thumbnail: result.user.displayAvatarURL ? result.user.displayAvatarURL() : null,
    fields: [
      { name: '👤 User', value: `${result.user.tag} (${result.user.id})`, inline: true },
      { name: '⏱️ Duration', value: result.durationText, inline: true },
      { name: '📝 Reason', value: result.reason || 'No reason provided', inline: false },
      { name: '🕒 Timed Out At', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
      { name: '⏳ Expires At', value: `<t:${Math.floor((Date.now() + result.duration) / 1000)}:F>`, inline: true }
    ],
    footer: 'Moderation Action',
    timestamp: true
  });
};

const untimeoutEmbed = (result, options = {}) => {
  return createBaseEmbed({
    color: COLORS.SUCCESS,
    title: '⏰ Timeout Removed',
    description: `${result.user.tag} has been untimed out.`,
    author: options.author,
    thumbnail: result.user.displayAvatarURL ? result.user.displayAvatarURL() : null,
    fields: [
      { name: '👤 User', value: `${result.user.tag} (${result.user.id})`, inline: true },
      { name: '📝 Reason', value: result.reason || 'No reason provided', inline: false }
    ],
    footer: 'Moderation Action',
    timestamp: true
  });
};

const purgeEmbed = (result, options = {}) => {
  const fields = [
    { name: '📊 Messages Deleted', value: `${result.count}`, inline: true },
    { name: '📢 Channel', value: `<#${result.channel.id}>`, inline: true }
  ];
  if (result.targetUser) fields.push({ name: '👤 Target User', value: `<@${result.targetUser}>`, inline: true });
  fields.push({ name: '📝 Reason', value: options.reason || 'No reason provided', inline: false });
  
  return createBaseEmbed({
    color: COLORS.LOGS,
    title: '🗑️ Messages Purged',
    description: `Successfully purged ${result.count} message${result.count > 1 ? 's' : ''}.`,
    author: options.author,
    fields: fields,
    footer: 'Moderation Action',
    timestamp: true
  });
};

const moderationWarningEmbed = (result, options = {}) => {
  return createBaseEmbed({
    color: COLORS.WARNING,
    title: '⚠️ User Warned',
    description: `${result.user.tag} has been warned.`,
    author: options.author,
    thumbnail: result.user.displayAvatarURL ? result.user.displayAvatarURL() : null,
    fields: [
      { name: '👤 User', value: `${result.user.tag} (${result.user.id})`, inline: true },
      { name: '📊 Warning Points', value: `${result.points}`, inline: true },
      { name: '📝 Reason', value: result.reason || 'No reason provided', inline: false },
      { name: '📊 Total Warnings', value: `${result.totalWarnings}`, inline: true },
      { name: '📊 Total Points', value: `${result.totalPoints}`, inline: true }
    ],
    footer: 'Moderation Action',
    timestamp: true
  });
};

const warningsListEmbed = (data, user, options = {}) => {
  const fields = [];
  if (data.warnings.length > 0) {
    data.warnings.slice(0, 10).forEach((warning) => {
      const status = warning.is_active ? '🟢 Active' : '🔴 Removed';
      fields.push({
        name: `Warning #${warning.warning_id}`,
        value: `📝 ${warning.reason || 'No reason'}\n📊 Points: ${warning.points}\n📌 ${status}\n👤 By: <@${warning.moderator_id}>\n🕒 ${new Date(warning.created_at).toLocaleString()}`,
        inline: false
      });
    });
    if (data.warnings.length > 10) {
      fields.push({ name: '📊 Showing First 10', value: `${data.warnings.length - 10} more warnings available.`, inline: false });
    }
  } else {
    fields.push({ name: '📭 No Warnings', value: 'This user has no warnings.', inline: false });
  }
  
  return createBaseEmbed({
    color: COLORS.LOGS,
    title: `📋 Warnings for ${user.tag || user}`,
    description: `Total: ${data.total} warnings | Active: ${data.activeCount} | Points: ${data.totalPoints}`,
    author: options.author,
    thumbnail: options.thumbnail,
    fields: fields,
    footer: 'Moderation History',
    timestamp: true
  });
};

const clearWarningsEmbed = (result, options = {}) => {
  return createBaseEmbed({
    color: COLORS.SUCCESS,
    title: '✅ Warnings Cleared',
    description: `All warnings have been cleared for <@${result.user}>.`,
    author: options.author,
    fields: [
      { name: '👤 User', value: `<@${result.user}>`, inline: true },
      { name: '🕒 Cleared At', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
    ],
    footer: 'Moderation Action',
    timestamp: true
  });
};

// ================ WELCOME/LEAVE EMBEDS ================
const createWelcomeEmbed = (member, settings) => {
  const embed = new EmbedBuilder()
    .setColor(settings.embed_color || '#2ECC71')
    .setTitle(settings.embed_title || '👋 Welcome!')
    .setDescription(settings.embed_description || settings.message || `Welcome to **${member.guild.name}**, ${member.user.username}!`)
    .setTimestamp();
  
  if (settings.show_avatar !== false) {
    embed.setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }));
  }
  
  if (settings.show_member_count !== false) {
    embed.addFields({ name: '👥 Member Count', value: `${member.guild.memberCount}`, inline: true });
  }
  
  embed.addFields(
    { name: '📅 Joined At', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: true },
    { name: '🆔 User ID', value: member.user.id, inline: true }
  );
  
  embed.setFooter({ text: member.guild.name, iconURL: member.guild.iconURL() });
  return embed;
};

const createLeaveEmbed = (member, settings) => {
  const embed = new EmbedBuilder()
    .setColor(settings.embed_color || '#E74C3C')
    .setTitle(settings.embed_title || '👋 Goodbye!')
    .setDescription(settings.embed_description || settings.message || `${member.user.username} has left the server.`)
    .setTimestamp();
  
  if (settings.show_avatar !== false) {
    embed.setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }));
  }
  
  if (settings.show_member_count !== false) {
    embed.addFields({ name: '👥 Member Count', value: `${member.guild.memberCount}`, inline: true });
  }
  
  embed.addFields(
    { name: '📅 Left At', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
    { name: '🆔 User ID', value: member.user.id, inline: true }
  );
  
  embed.setFooter({ text: member.guild.name, iconURL: member.guild.iconURL() });
  return embed;
};

// ================ UTILITY EMBEDS ================
const pingEmbed = (data, options = {}) => {
  const fields = [
    { name: '📡 WebSocket Latency', value: `${data.wsPing}ms`, inline: true },
    { name: '⚡ API Latency', value: `${data.apiPing}ms`, inline: true },
    { name: '🐘 Database Latency', value: `${data.dbPing}ms`, inline: true },
    { name: '📊 Status', value: data.dbPing < 100 ? '✅ Excellent' : data.dbPing < 500 ? '🟡 Good' : '🔴 Slow', inline: false },
    { name: '🕒 Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
  ];
  
  return createBaseEmbed({
    color: data.dbPing < 100 ? COLORS.SUCCESS : data.dbPing < 500 ? COLORS.WARNING : COLORS.ERROR,
    title: '🏓 Pong!',
    description: 'Bot latency information',
    author: options.author,
    fields: fields,
    footer: 'Utility System',
    timestamp: true
  });
};

const helpEmbed = (options = {}) => {
  const fields = [];
  
  if (options.commands && options.commands.length > 0) {
    options.commands.forEach(cmd => {
      fields.push({
        name: `/${cmd.name}`,
        value: `${cmd.description}\nUsage: \`${cmd.usage || cmd.name}\``,
        inline: false
      });
    });
  }
  
  if (options.categories && options.categories.length > 0) {
    options.categories.forEach(category => {
      const commandsList = category.commands.map(cmd => `\`/${cmd}\``).join(' ');
      fields.push({ name: `📂 ${category.name}`, value: commandsList || 'No commands available', inline: false });
    });
  }
  
  return createBaseEmbed({
    color: COLORS.HELP,
    title: options.title || '📚 Help Center',
    description: options.description || 'Here are all available commands:',
    author: options.author,
    thumbnail: options.thumbnail,
    fields: fields,
    footer: options.footer || `Requested by ${options.user || 'Unknown'}`,
    timestamp: true
  });
};

const serverInfoEmbed = (info, options = {}) => {
  const fields = [
    {
      name: '📊 General Info',
      value: `**Name:** ${info.name}\n**ID:** ${info.id}\n**Owner:** ${info.owner}\n**Created:** <t:${Math.floor(info.createdAt.getTime() / 1000)}:R>`,
      inline: false
    },
    {
      name: '👥 Members',
      value: `**Total:** ${info.memberCount}\n**Humans:** ${info.humanCount}\n**Bots:** ${info.botCount}`,
      inline: true
    },
    {
      name: '📢 Channels',
      value: `**Total:** ${info.totalChannels}\n**Text:** ${info.textChannels}\n**Voice:** ${info.voiceChannels}\n**Categories:** ${info.categoryChannels}`,
      inline: true
    },
    {
      name: '🎭 Roles & Emojis',
      value: `**Roles:** ${info.roleCount}\n**Emojis:** ${info.emojiCount}`,
      inline: true
    },
    {
      name: '💎 Boosts',
      value: `**Level:** ${info.boostLevel}\n**Count:** ${info.boostCount}`,
      inline: true
    }
  ];
  if (info.vanityCode) fields.push({ name: '🔗 Vanity URL', value: `**Code:** ${info.vanityCode}\n**Uses:** ${info.vanityUses || 'N/A'}`, inline: true });
  if (info.afkChannel !== 'None') fields.push({ name: '💤 AFK Channel', value: info.afkChannel, inline: true });
  if (info.systemChannel !== 'None') fields.push({ name: '📋 System Channel', value: info.systemChannel, inline: true });
  fields.push({ name: '✅ Server Status', value: `**Verified:** ${info.verified ? '✅ Yes' : '❌ No'}\n**Partnered:** ${info.partnered ? '✅ Yes' : '❌ No'}\n**NSFW Level:** ${info.nsfwLevel}`, inline: false });
  
  return createBaseEmbed({
    color: COLORS.INFO,
    title: `📊 ${info.name}`,
    description: 'Server information',
    author: options.author,
    thumbnail: info.icon || null,
    image: info.banner || null,
    fields: fields,
    footer: `Server ID: ${info.id}`,
    timestamp: true
  });
};

const userInfoEmbed = (userInfo, options = {}) => {
  const fields = [
    {
      name: '👤 User Info',
      value: `**Username:** ${userInfo.tag}\n**ID:** ${userInfo.id}\n**Bot:** ${userInfo.bot ? '✅ Yes' : '❌ No'}\n**Created:** <t:${Math.floor(userInfo.createdAt.getTime() / 1000)}:R>`,
      inline: false
    }
  ];
  
  if (userInfo.displayName) {
    fields.push({
      name: '🖋️ Server Info',
      value: `**Display Name:** ${userInfo.displayName}\n**Joined:** <t:${Math.floor(userInfo.joinedAt.getTime() / 1000)}:R>\n**Nickname:** ${userInfo.nickname || 'None'}`,
      inline: false
    });
  }
  
  if (userInfo.roles && userInfo.roles.length > 0) {
    const roleList = userInfo.roles.slice(0, 10).join(', ');
    fields.push({ name: `🎭 Roles (${userInfo.roles.length})`, value: roleList + (userInfo.roles.length > 10 ? ` +${userInfo.roles.length - 10} more` : ''), inline: false });
  }
  
  if (userInfo.premiumSince) fields.push({ name: '💎 Boosting Since', value: `<t:${Math.floor(userInfo.premiumSince.getTime() / 1000)}:R>`, inline: true });
  if (userInfo.communicationDisabledUntil) fields.push({ name: '🔇 Timed Out Until', value: `<t:${Math.floor(userInfo.communicationDisabledUntil.getTime() / 1000)}:R>`, inline: true });
  if (userInfo.permissions) fields.push({ name: '🔑 Key Permissions', value: userInfo.permissions, inline: false });
  
  return createBaseEmbed({
    color: userInfo.accentColor || COLORS.INFO,
    title: `👤 ${userInfo.tag}`,
    description: 'User information',
    author: options.author,
    thumbnail: userInfo.avatar || userInfo.avatarURL || null,
    image: userInfo.banner || null,
    fields: fields,
    footer: `User ID: ${userInfo.id}`,
    timestamp: true
  });
};

const avatarEmbed = (user, avatarURL, options = {}) => {
  const fields = [
    { name: '👤 User', value: user.tag, inline: true },
    { name: '🆔 ID', value: user.id, inline: true }
  ];
  
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel('128px').setURL(avatarURL.replace('512', '128')).setStyle(ButtonStyle.Link),
    new ButtonBuilder().setLabel('256px').setURL(avatarURL.replace('512', '256')).setStyle(ButtonStyle.Link),
    new ButtonBuilder().setLabel('512px').setURL(avatarURL.replace('512', '512')).setStyle(ButtonStyle.Link),
    new ButtonBuilder().setLabel('1024px').setURL(avatarURL.replace('512', '1024')).setStyle(ButtonStyle.Link)
  );
  
  const embed = createBaseEmbed({
    color: COLORS.INFO,
    title: `🖼️ ${user.tag}'s Avatar`,
    description: 'Click a button below to view in different sizes',
    author: options.author,
    image: avatarURL,
    fields: fields,
    footer: `Requested by ${options.requestedBy || 'Unknown'}`,
    timestamp: true
  });
  
  return { embed, row };
};

const bannerEmbed = (user, bannerURL, options = {}) => {
  const fields = [
    { name: '👤 User', value: user.tag, inline: true },
    { name: '🆔 ID', value: user.id, inline: true }
  ];
  
  return createBaseEmbed({
    color: COLORS.INFO,
    title: `🖼️ ${user.tag}'s Banner`,
    description: user.banner ? 'User banner preview' : 'This user does not have a banner.',
    author: options.author,
    image: bannerURL || null,
    fields: fields,
    footer: `Requested by ${options.requestedBy || 'Unknown'}`,
    timestamp: true
  });
};

const botInfoEmbed = (info, options = {}) => {
  const fields = [
    {
      name: '🤖 Bot Info',
      value: `**Name:** ${info.tag}\n**ID:** ${info.id}\n**Version:** ${info.version}\n**Created:** <t:${Math.floor(info.createdAt.getTime() / 1000)}:R>`,
      inline: false
    },
    {
      name: '📊 Statistics',
      value: `**Guilds:** ${info.guildCount}\n**Users:** ${info.userCount}\n**Channels:** ${info.channelCount}\n**Shards:** ${info.shardCount}`,
      inline: true
    },
    { name: '⏱️ Uptime', value: info.uptime, inline: true },
    { name: '📡 Ping', value: `${info.ping}ms`, inline: true }
  ];
  
  return createBaseEmbed({
    color: COLORS.INFO,
    title: `🤖 ${info.username}`,
    description: 'Bot information and statistics',
    author: options.author,
    thumbnail: info.avatar || null,
    fields: fields,
    footer: `Bot ID: ${info.id}`,
    timestamp: true
  });
};

// ================ INVITE EMBEDS ================
const inviteStatsEmbed = (stats, user, options = {}) => {
  const fields = [
    { name: '📊 Total Invites', value: `${stats.totalInvites}`, inline: true },
    { name: '🟢 Active Invites', value: `${stats.activeInvites}`, inline: true },
    { name: '👤 Total Joins', value: `${stats.totalJoins}`, inline: true },
    { name: '🟢 Active Joins', value: `${stats.activeJoins}`, inline: true },
    { name: '🚪 Total Leaves', value: `${stats.totalLeaves}`, inline: true },
    { name: '💎 Crystals Earned', value: `${stats.totalJoins || 0} 💎`, inline: true }
  ];
  
  if (stats.inviteCodes && stats.inviteCodes.length > 0) {
    const codes = stats.inviteCodes.slice(0, 5).map(inv => `• \`${inv.code}\` — ${inv.uses} uses${inv.maxUses > 0 ? ` (max: ${inv.maxUses})` : ''}`).join('\n');
    fields.push({ name: '📋 Recent Invite Codes', value: codes || 'No invite codes', inline: false });
  }
  
  return createBaseEmbed({
    color: COLORS.ECONOMY,
    title: '📊 Invite Statistics',
    description: `Invite stats for ${user.tag || user}`,
    author: options.author,
    thumbnail: options.thumbnail || (user.displayAvatarURL ? user.displayAvatarURL() : null),
    fields: fields,
    footer: 'Invite Tracking System',
    timestamp: true
  });
};

const inviteLeaderboardEmbed = (entries, options = {}) => {
  const fields = [];
  if (entries && entries.length > 0) {
    const leaderboardText = entries.map((entry, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      return `${medal} **${entry.name}** — ${entry.joins} joins (${entry.active} active)`;
    }).join('\n');
    fields.push({ name: '🏆 Top Inviters', value: leaderboardText || 'No entries yet.', inline: false });
  } else {
    fields.push({ name: '📭 No Data', value: 'No invite data available.', inline: false });
  }
  
  return createBaseEmbed({
    color: COLORS.LEADERBOARD,
    title: '🏆 Invite Leaderboard',
    description: 'Top inviters in the server',
    author: options.author,
    fields: fields,
    footer: 'Invite Tracking System',
    timestamp: true
  });
};

// ================ MESSAGE EMBEDS ================
const messageStatsEmbed = (stats, user, options = {}) => {
  const fields = [
    { name: '📊 Total Messages', value: `${stats.total}`, inline: true },
    { name: '📅 Today\'s Messages', value: `${stats.daily}`, inline: true },
    { name: '📆 Weekly Messages', value: `${stats.weekly}`, inline: true },
    { name: '🏆 Milestones Reached', value: `${stats.milestones}`, inline: true },
    { name: '💎 Crystals Earned', value: `${stats.milestones || 0} 💎`, inline: true }
  ];
  if (stats.lastMessage) fields.push({ name: '🕒 Last Message', value: `<t:${Math.floor(new Date(stats.lastMessage).getTime() / 1000)}:R>`, inline: true });
  
  return createBaseEmbed({
    color: COLORS.LOGS,
    title: '📊 Message Statistics',
    description: `Message stats for ${user.tag || user}`,
    author: options.author,
    thumbnail: options.thumbnail || (user.displayAvatarURL ? user.displayAvatarURL() : null),
    fields: fields,
    footer: 'Message Tracking System',
    timestamp: true
  });
};

const messageLeaderboardEmbed = (entries, period, options = {}) => {
  const periodLabels = { total: 'All Time', daily: 'Today', weekly: 'This Week' };
  const fields = [];
  
  if (entries && entries.length > 0) {
    const leaderboardText = entries.map((entry, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      return `${medal} **${entry.name}** — ${entry.count} messages`;
    }).join('\n');
    fields.push({ name: `🏆 Top Message Senders (${periodLabels[period] || 'All Time'})`, value: leaderboardText || 'No entries yet.', inline: false });
  } else {
    fields.push({ name: '📭 No Data', value: 'No message data available.', inline: false });
  }
  
  return createBaseEmbed({
    color: COLORS.LEADERBOARD,
    title: '🏆 Message Leaderboard',
    description: `Top message senders ${periodLabels[period] ? `(${periodLabels[period]})` : ''}`,
    author: options.author,
    fields: fields,
    footer: 'Message Tracking System',
    timestamp: true
  });
};

// ================ LOGGING EMBEDS ================
const logChannelEmbed = (settings, options = {}) => {
  const fields = [
    { name: '📢 Log Channel', value: settings.log_channel ? `<#${settings.log_channel}>` : 'Not set', inline: true },
    { name: '📊 Status', value: settings.log_channel ? '✅ Configured' : '❌ Not Configured', inline: true }
  ];
  
  const enabledFeatures = [];
  if (settings.log_messages) enabledFeatures.push('Messages');
  if (settings.log_edits) enabledFeatures.push('Edits');
  if (settings.log_deletes) enabledFeatures.push('Deletes');
  if (settings.log_joins) enabledFeatures.push('Joins');
  if (settings.log_leaves) enabledFeatures.push('Leaves');
  if (settings.log_roles) enabledFeatures.push('Roles');
  if (settings.log_nicknames) enabledFeatures.push('Nicknames');
  if (settings.log_channels) enabledFeatures.push('Channels');
  if (settings.log_voice) enabledFeatures.push('Voice');
  if (settings.log_tickets) enabledFeatures.push('Tickets');
  if (settings.log_purchases) enabledFeatures.push('Purchases');
  if (settings.log_sells) enabledFeatures.push('Sells');
  if (settings.log_moderation) enabledFeatures.push('Moderation');
  
  fields.push({ name: '📋 Enabled Logging Features', value: enabledFeatures.join(', ') || 'None', inline: false });
  
  return createBaseEmbed({
    color: COLORS.SUCCESS,
    title: '📊 Logging System Configured',
    description: 'Logging settings updated successfully',
    author: options.author,
    fields: fields,
    footer: 'Logging System',
    timestamp: true
  });
};

// ================ ENHANCED LEADERBOARD EMBEDS ================

const fullLeaderboardEmbed = (data, type, options = {}) => {
  const fields = [];
  
  const typeLabels = {
    crystals: { emoji: '💎', label: 'Crystals', value: 'crystals' },
    messages: { emoji: '💬', label: 'Messages', value: 'messages' },
    invites: { emoji: '🎯', label: 'Invites', value: 'invites' }
  };
  
  const typeInfo = typeLabels[type] || typeLabels.crystals;
  
  fields.push({
    name: `📊 ${typeInfo.emoji} ${typeInfo.label} Leaderboard`,
    value: `**Total Members:** ${data.total}\n**Page:** ${data.page}/${data.totalPages}`,
    inline: false
  });
  
  if (data.entries && data.entries.length > 0) {
    const entriesText = data.entries.map((entry, index) => {
      const globalIndex = ((data.page - 1) * 10) + index + 1;
      const medal = globalIndex === 1 ? '🥇' : globalIndex === 2 ? '🥈' : globalIndex === 3 ? '🥉' : `${globalIndex}.`;
      
      let valueText = '';
      if (type === 'crystals') {
        valueText = `${entry.crystals} 💎`;
        if (entry.total_earned) valueText += ` (${entry.total_earned} earned)`;
      } else if (type === 'messages') {
        valueText = `${entry.count} messages`;
      } else if (type === 'invites') {
        valueText = `${entry.count} invites`;
      }
      
      return `${medal} **${entry.username || entry.user_id}** — ${valueText}`;
    }).join('\n');
    
    fields.push({
      name: `🏆 Top Members`,
      value: entriesText || 'No entries found.',
      inline: false
    });
  } else {
    fields.push({
      name: '📭 No Data',
      value: 'No members found in this category.',
      inline: false
    });
  }
  
  if (options.userRank && options.userRank > 0) {
    const medal = options.userRank === 1 ? '🥇' : options.userRank === 2 ? '🥈' : options.userRank === 3 ? '🥉' : `#${options.userRank}`;
    fields.push({
      name: `📍 Your Rank`,
      value: `${medal} — ${options.userValue || '0'} ${typeInfo.label}`,
      inline: false
    });
  }
  
  const embed = createBaseEmbed({
    color: options.color || COLORS.LEADERBOARD,
    title: options.title || `🏆 ${typeInfo.label} Leaderboard`,
    description: options.description || `Showing members ranked by ${typeInfo.label.toLowerCase()}.`,
    author: options.author,
    thumbnail: options.thumbnail,
    fields: fields,
    footer: `Page ${data.page}/${data.totalPages} • Total: ${data.total} members`,
    timestamp: true
  });
  
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('lb_first')
        .setLabel('⏮️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(data.page === 1),
      new ButtonBuilder()
        .setCustomId('lb_prev')
        .setLabel('◀️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(data.page === 1),
      new ButtonBuilder()
        .setCustomId('lb_jump')
        .setLabel(`Page ${data.page}/${data.totalPages}`)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(data.totalPages <= 1),
      new ButtonBuilder()
        .setCustomId('lb_next')
        .setLabel('▶️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(data.page === data.totalPages),
      new ButtonBuilder()
        .setCustomId('lb_last')
        .setLabel('⏭️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(data.page === data.totalPages)
    );
  
  return { embed, row };
};

// ================ BACKUP EMBEDS ================
const backupCreatedEmbed = (result, options = {}) => {
  const fields = [
    { name: '🔑 Backup Code', value: `\`${result.backupCode}\``, inline: true },
    { name: '📊 Total Records', value: `${result.totalRecords}`, inline: true },
    { name: '💾 Data Size', value: `${(result.totalSize / 1024).toFixed(2)} KB`, inline: true },
    { name: '⏰ Expires At', value: `<t:${Math.floor(new Date(result.backup.expires_at).getTime() / 1000)}:R>`, inline: true },
    { name: '📅 Created At', value: `<t:${Math.floor(new Date(result.backup.created_at).getTime() / 1000)}:F>`, inline: true }
  ];
  
  return createBaseEmbed({
    color: COLORS.SUCCESS,
    title: '💾 Backup Created Successfully',
    description: `Your server data has been backed up. Save this code: \`${result.backupCode}\``,
    author: options.author,
    fields: fields,
    footer: '⚠️ This code will expire in 7 days',
    timestamp: true
  });
};

const backupRestoredEmbed = (result, options = {}) => {
  const fields = [
    { name: '🔑 Backup Code', value: `\`${result.backup.backup_code}\``, inline: true },
    { name: '📊 Records Restored', value: `${result.restoredCount}`, inline: true },
    { name: '📋 Tables Restored', value: Object.keys(result.details).map(t => `• ${t}: ${result.details[t]} records`).join('\n') || 'All tables', inline: false }
  ];
  
  return createBaseEmbed({
    color: COLORS.SUCCESS,
    title: '✅ Backup Restored Successfully',
    description: `All data has been restored from backup \`${result.backup.backup_code}\``,
    author: options.author,
    fields: fields,
    footer: '⚠️ Please verify your data is correct',
    timestamp: true
  });
};

const backupListEmbed = (data, options = {}) => {
  const fields = [];
  fields.push({
    name: '📊 Backup Statistics',
    value: `**Total Backups:** ${data.stats?.total_backups || 0}\n**Active Backups:** ${data.stats?.active_backups || 0}\n**Restored:** ${data.stats?.restored_backups || 0}`,
    inline: false
  });
  
  if (data.backups && data.backups.length > 0) {
    const backupList = data.backups.slice(0, 10).map(b => {
      const status = b.is_restored ? '✅ Restored' : b.expires_at < new Date() ? '❌ Expired' : '🟢 Active';
      return `• \`${b.backup_code}\` — ${status} — ${new Date(b.created_at).toLocaleDateString()}`;
    }).join('\n');
    fields.push({ name: `📋 Recent Backups (${data.total})`, value: backupList || 'No backups found.', inline: false });
  } else {
    fields.push({ name: '📭 No Backups', value: 'No backups have been created for this server yet.', inline: false });
  }
  
  return createBaseEmbed({
    color: COLORS.INFO,
    title: '📋 Backup List',
    description: 'All backups for this server.',
    author: options.author,
    fields: fields,
    footer: 'Backups expire after 7 days',
    timestamp: true
  });
};

const backupErrorEmbed = (error, options = {}) => {
  return createBaseEmbed({
    color: COLORS.ERROR,
    title: '❌ Backup Error',
    description: error.message || 'An error occurred during backup operation.',
    author: options.author,
    fields: options.fields || [],
    footer: 'Please try again or contact support',
    timestamp: true
  });
};

const backupConfirmRestoreEmbed = (backup, options = {}) => {
  const fields = [
    { name: '🔑 Backup Code', value: `\`${backup.backup_code}\``, inline: true },
    { name: '📅 Created At', value: `<t:${Math.floor(new Date(backup.created_at).getTime() / 1000)}:F>`, inline: true },
    { name: '👤 Created By', value: `<@${backup.created_by}>`, inline: true },
    { name: '⏰ Expires At', value: `<t:${Math.floor(new Date(backup.expires_at).getTime() / 1000)}:R>`, inline: true }
  ];
  
  return createBaseEmbed({
    color: COLORS.WARNING,
    title: '⚠️ Confirm Restore',
    description: `Are you sure you want to restore from backup \`${backup.backup_code}\`?\n\n**This will overwrite ALL current data for this server!**`,
    author: options.author,
    fields: fields,
    footer: 'This action cannot be undone',
    timestamp: true
  });
};

// ================ PAGINATION HELPERS ================
const paginateEmbed = (baseEmbed, items, itemsPerPage = 10) => {
  const pages = [];
  const totalPages = Math.ceil(items.length / itemsPerPage);
  
  for (let i = 0; i < totalPages; i++) {
    const start = i * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = items.slice(start, end);
    
    const embed = EmbedBuilder.from(baseEmbed);
    embed.setFooter({
      text: `${baseEmbed.data.footer?.text || ''} • Page ${i + 1}/${totalPages}`,
      iconURL: baseEmbed.data.footer?.icon_url || FOOTER_ICON
    });
    
    pages.push(embed);
  }
  
  return pages;
};

// ================ EXPORTS ================
module.exports = {
  // Constants
  COLORS,
  FOOTER_TEXT,
  FOOTER_ICON,
  
  // Base
  createBaseEmbed,
  customEmbed,
  
  // Basic Embeds
  successEmbed,
  errorEmbed,
  warningEmbed,
  infoEmbed,
  
  // Economy
  economyEmbed,
  
  // Shop
  shopAddItemEmbed,
  shopEditItemEmbed,
  shopRemoveItemEmbed,
  shopRestockEmbed,
  shopListEmbed,
  
  // Shop UI
  shopMenuEmbed,
  shopCategoryEmbed,
  purchaseConfirmEmbed,
  sellMenuEmbed,
  sellListingEmbed,
  
  // Sell
  sellPanelCreateEmbed,
  sellPanelEditEmbed,
  sellPanelDeleteEmbed,
  
  // Tickets
  ticketCreateEmbed,
  ticketClaimEmbed,
  ticketCloseEmbed,
  ticketReopenEmbed,
  ticketDeleteEmbed,
  ticketRenameEmbed,
  ticketTranscriptEmbed,
  ticketPermissionErrorEmbed,
  
  // Moderation
  banEmbed,
  kickEmbed,
  timeoutEmbed,
  untimeoutEmbed,
  purgeEmbed,
  moderationWarningEmbed,
  warningsListEmbed,
  clearWarningsEmbed,
  
  // Welcome/Leave
  createWelcomeEmbed,
  createLeaveEmbed,
  
  // Utility
  pingEmbed,
  helpEmbed,
  serverInfoEmbed,
  userInfoEmbed,
  avatarEmbed,
  bannerEmbed,
  botInfoEmbed,
  
  // Invites
  inviteStatsEmbed,
  inviteLeaderboardEmbed,
  
  // Messages
  messageStatsEmbed,
  messageLeaderboardEmbed,
  
  // Logging
  logChannelEmbed,
  
  // Enhanced Leaderboard
  fullLeaderboardEmbed,
  
  // Backup
  backupCreatedEmbed,
  backupRestoredEmbed,
  backupListEmbed,
  backupErrorEmbed,
  backupConfirmRestoreEmbed,
  
  // Pagination
  paginateEmbed
};
