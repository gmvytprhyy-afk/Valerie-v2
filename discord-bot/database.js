// database.js - PostgreSQL Connection & Complete Database Helpers
const { Pool } = require('pg');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Check if running on Railway
const isRailway = !!process.env.DATABASE_URL;

let pool;

if (isRailway) {
  console.log('🚂 Running on Railway - connecting to PostgreSQL');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  console.log('💻 Running locally - using config.json');
  const config = require('./config.json');
  pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database
  });
}

pool.on('connect', () => console.log('✅ Connected to PostgreSQL'));
pool.on('error', (err) => console.error('❌ PostgreSQL error:', err));

pool.on('connect', () => console.log('✅ Connected to PostgreSQL'));
pool.on('error', (err) => console.error('❌ PostgreSQL error:', err));

// ================ TABLE CREATION ================
const initDatabase = async () => {
  try {
    // 1. Guild Settings
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guild_settings (
        guild_id VARCHAR(20) PRIMARY KEY,
        prefix VARCHAR(10) DEFAULT '!',
        language VARCHAR(5) DEFAULT 'en',
        timezone VARCHAR(50) DEFAULT 'UTC',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Welcome Settings
    await pool.query(`
      CREATE TABLE IF NOT EXISTS welcome_settings (
        guild_id VARCHAR(20) PRIMARY KEY,
        enabled BOOLEAN DEFAULT FALSE,
        channel_id VARCHAR(20),
        message TEXT,
        embed_color VARCHAR(7) DEFAULT '#2ECC71',
        embed_title VARCHAR(200),
        embed_description TEXT,
        show_member_count BOOLEAN DEFAULT TRUE,
        show_avatar BOOLEAN DEFAULT TRUE,
        dm_enabled BOOLEAN DEFAULT FALSE,
        dm_message TEXT,
        role_on_join VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Leave Settings
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leave_settings (
        guild_id VARCHAR(20) PRIMARY KEY,
        enabled BOOLEAN DEFAULT FALSE,
        channel_id VARCHAR(20),
        message TEXT,
        embed_color VARCHAR(7) DEFAULT '#E74C3C',
        embed_title VARCHAR(200),
        embed_description TEXT,
        show_member_count BOOLEAN DEFAULT TRUE,
        show_avatar BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Logging Settings
    await pool.query(`
      CREATE TABLE IF NOT EXISTS logging_settings (
        guild_id VARCHAR(20) PRIMARY KEY,
        log_channel VARCHAR(20),
        log_messages BOOLEAN DEFAULT TRUE,
        log_edits BOOLEAN DEFAULT TRUE,
        log_deletes BOOLEAN DEFAULT TRUE,
        log_joins BOOLEAN DEFAULT TRUE,
        log_leaves BOOLEAN DEFAULT TRUE,
        log_roles BOOLEAN DEFAULT TRUE,
        log_nicknames BOOLEAN DEFAULT TRUE,
        log_channels BOOLEAN DEFAULT TRUE,
        log_voice BOOLEAN DEFAULT TRUE,
        log_tickets BOOLEAN DEFAULT TRUE,
        log_purchases BOOLEAN DEFAULT TRUE,
        log_sells BOOLEAN DEFAULT TRUE,
        log_moderation BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Ticket Config
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ticket_config (
        config_id SERIAL PRIMARY KEY,
        guild_id VARCHAR(20) NOT NULL UNIQUE,
        support_category_id VARCHAR(20),
        purchase_category_id VARCHAR(20),
        sell_category_id VARCHAR(20),
        support_channel_id VARCHAR(20),
        purchase_channel_id VARCHAR(20),
        sell_channel_id VARCHAR(20),
        transcript_channel_id VARCHAR(20),
        log_channel_id VARCHAR(20),
        support_role_id VARCHAR(20),
        admin_role_id VARCHAR(20),
        max_tickets_per_user INT DEFAULT 5,
        auto_close_days INT DEFAULT 7,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Economy - Crystal Economy
    await pool.query(`
      CREATE TABLE IF NOT EXISTS crystal_economy (
        user_id VARCHAR(20) NOT NULL,
        guild_id VARCHAR(20) NOT NULL,
        crystals INT DEFAULT 0,
        total_earned INT DEFAULT 0,
        total_spent INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, guild_id)
      );
    `);

    // 7. Economy Transactions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS economy_transactions (
        transaction_id SERIAL PRIMARY KEY,
        user_id VARCHAR(20) NOT NULL,
        guild_id VARCHAR(20) NOT NULL,
        amount INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        reason TEXT,
        reference_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Message Tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS message_counts (
        user_id VARCHAR(20) NOT NULL,
        guild_id VARCHAR(20) NOT NULL,
        total_messages INT DEFAULT 0,
        daily_messages INT DEFAULT 0,
        weekly_messages INT DEFAULT 0,
        last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_daily_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_weekly_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, guild_id)
      );
    `);

    // 9. Message Milestones
    await pool.query(`
      CREATE TABLE IF NOT EXISTS message_milestones (
        user_id VARCHAR(20) NOT NULL,
        guild_id VARCHAR(20) NOT NULL,
        milestone_count INT DEFAULT 0,
        last_milestone INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, guild_id)
      );
    `);

    // 10. Invite Tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invite_tracking (
        invite_code VARCHAR(20) PRIMARY KEY,
        guild_id VARCHAR(20) NOT NULL,
        inviter_id VARCHAR(20) NOT NULL,
        uses INT DEFAULT 0,
        max_uses INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP
      );
    `);

    // 11. Invite Joins
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invite_joins (
        join_id SERIAL PRIMARY KEY,
        invite_code VARCHAR(20) NOT NULL,
        user_id VARCHAR(20) NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (invite_code) REFERENCES invite_tracking(invite_code) ON DELETE CASCADE
      );
    `);

    // 12. Invite Stats
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invite_stats (
        user_id VARCHAR(20) NOT NULL,
        guild_id VARCHAR(20) NOT NULL,
        total_invites INT DEFAULT 0,
        active_invites INT DEFAULT 0,
        total_joins INT DEFAULT 0,
        active_joins INT DEFAULT 0,
        total_leaves INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, guild_id)
      );
    `);

    // 13. Shop Categories
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shop_categories (
        category_id SERIAL PRIMARY KEY,
        guild_id VARCHAR(20) NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        emoji VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(guild_id, name)
      );
    `);

    // 14. Shop Items
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shop_items (
        item_id SERIAL PRIMARY KEY,
        guild_id VARCHAR(20) NOT NULL,
        category_id INT,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        image_url TEXT,
        price INT NOT NULL CHECK (price >= 0),
        stock INT DEFAULT -1 CHECK (stock >= -1),
        role_id VARCHAR(20),
        is_limited BOOLEAN DEFAULT FALSE,
        limit_per_user INT DEFAULT 1,
        requires_level INT DEFAULT 0,
        requires_role VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES shop_categories(category_id) ON DELETE SET NULL
      );
    `);

    // 15. Purchase History
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchase_history (
        purchase_id SERIAL PRIMARY KEY,
        user_id VARCHAR(20) NOT NULL,
        guild_id VARCHAR(20) NOT NULL,
        item_id INT NOT NULL,
        item_name VARCHAR(100) NOT NULL,
        price INT NOT NULL,
        quantity INT DEFAULT 1,
        total_cost INT NOT NULL,
        status VARCHAR(20) DEFAULT 'completed',
        refunded BOOLEAN DEFAULT FALSE,
        refund_reason TEXT,
        purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        refunded_at TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES shop_items(item_id) ON DELETE CASCADE
      );
    `);

    // 16. Purchase Tickets
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchase_tickets (
        ticket_id SERIAL PRIMARY KEY,
        user_id VARCHAR(20) NOT NULL,
        guild_id VARCHAR(20) NOT NULL,
        item_id INT NOT NULL,
        quantity INT NOT NULL,
        total_cost INT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        transaction_reference VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES shop_items(item_id) ON DELETE CASCADE
      );
    `);

    // 17. Sell Panels
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sell_panels (
        panel_id SERIAL PRIMARY KEY,
        guild_id VARCHAR(20) NOT NULL,
        channel_id VARCHAR(20) NOT NULL,
        message_id VARCHAR(20),
        title VARCHAR(200),
        description TEXT,
        color VARCHAR(7) DEFAULT '#F39C12',
        thumbnail_url TEXT,
        require_approval BOOLEAN DEFAULT TRUE,
        auto_delete BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 18. Sell Items
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sell_items (
        sell_id SERIAL PRIMARY KEY,
        panel_id INT NOT NULL,
        user_id VARCHAR(20) NOT NULL,
        guild_id VARCHAR(20) NOT NULL,
        item_name VARCHAR(100) NOT NULL,
        item_description TEXT,
        item_image_url TEXT,
        price INT NOT NULL CHECK (price >= 0),
        quantity INT DEFAULT 1 CHECK (quantity >= 1),
        category VARCHAR(50),
        status VARCHAR(20) DEFAULT 'pending',
        is_active BOOLEAN DEFAULT TRUE,
        approved_by VARCHAR(20),
        approved_at TIMESTAMP,
        rejected_by VARCHAR(20),
        rejected_at TIMESTAMP,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (panel_id) REFERENCES sell_panels(panel_id) ON DELETE CASCADE
      );
    `);

    // 19. Sell Tickets
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sell_tickets (
        ticket_id SERIAL PRIMARY KEY,
        sell_id INT NOT NULL,
        user_id VARCHAR(20) NOT NULL,
        guild_id VARCHAR(20) NOT NULL,
        item_name VARCHAR(100) NOT NULL,
        price INT NOT NULL,
        quantity INT DEFAULT 1,
        channel_id VARCHAR(20),
        status VARCHAR(20) DEFAULT 'pending',
        manager_id VARCHAR(20),
        reviewed_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sell_id) REFERENCES sell_items(sell_id) ON DELETE CASCADE
      );
    `);

    // 20. Tickets
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        ticket_id SERIAL PRIMARY KEY,
        guild_id VARCHAR(20) NOT NULL,
        channel_id VARCHAR(20) NOT NULL,
        user_id VARCHAR(20) NOT NULL,
        claimer_id VARCHAR(20),
        type VARCHAR(20) NOT NULL CHECK (type IN ('support', 'purchase', 'sell')),
        subject VARCHAR(200) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'closed', 'reopened', 'deleted')),
        priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
        assigned_manager VARCHAR(20),
        closed_by VARCHAR(20),
        closed_at TIMESTAMP,
        reopened_at TIMESTAMP,
        deleted_by VARCHAR(20),
        deleted_at TIMESTAMP,
        transcript_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 21. Ticket Messages
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ticket_messages (
        message_id SERIAL PRIMARY KEY,
        ticket_id INT NOT NULL,
        user_id VARCHAR(20) NOT NULL,
        username VARCHAR(100) NOT NULL,
        content TEXT,
        attachment_urls TEXT[],
        is_system BOOLEAN DEFAULT FALSE,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE
      );
    `);

    // 22. Ticket Transcripts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ticket_transcripts (
        transcript_id SERIAL PRIMARY KEY,
        ticket_id INT NOT NULL,
        channel_id VARCHAR(20) NOT NULL,
        user_id VARCHAR(20) NOT NULL,
        content TEXT,
        attachment_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE
      );
    `);

    // 23. Ticket Actions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ticket_actions (
        action_id SERIAL PRIMARY KEY,
        ticket_id INT NOT NULL,
        user_id VARCHAR(20) NOT NULL,
        action VARCHAR(50) NOT NULL,
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE
      );
    `);

    // 24. Moderation Logs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS moderation_logs (
        log_id SERIAL PRIMARY KEY,
        guild_id VARCHAR(20) NOT NULL,
        user_id VARCHAR(20) NOT NULL,
        moderator_id VARCHAR(20) NOT NULL,
        action VARCHAR(50) NOT NULL,
        reason TEXT,
        duration INT,
        channel_id VARCHAR(20),
        message_id VARCHAR(20),
        message_count INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
      );
    `);

    // 25. Warnings
    await pool.query(`
      CREATE TABLE IF NOT EXISTS warnings (
        warning_id SERIAL PRIMARY KEY,
        guild_id VARCHAR(20) NOT NULL,
        user_id VARCHAR(20) NOT NULL,
        moderator_id VARCHAR(20) NOT NULL,
        reason TEXT,
        points INT DEFAULT 1,
        channel_id VARCHAR(20),
        message_id VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 26. Mutes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mutes (
        mute_id SERIAL PRIMARY KEY,
        guild_id VARCHAR(20) NOT NULL,
        user_id VARCHAR(20) NOT NULL,
        moderator_id VARCHAR(20) NOT NULL,
        reason TEXT,
        duration INT,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ends_at TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        channel_id VARCHAR(20)
      );
    `);

    // 27. AutoMod Settings
    await pool.query(`
      CREATE TABLE IF NOT EXISTS automod_settings (
        guild_id VARCHAR(20) PRIMARY KEY,
        enabled BOOLEAN DEFAULT FALSE,
        anti_spam BOOLEAN DEFAULT TRUE,
        anti_invite BOOLEAN DEFAULT TRUE,
        anti_bad_words BOOLEAN DEFAULT TRUE,
        anti_mention_spam BOOLEAN DEFAULT TRUE,
        anti_duplicate BOOLEAN DEFAULT TRUE,
        anti_link_spam BOOLEAN DEFAULT TRUE,
        spam_threshold INT DEFAULT 5,
        spam_window INT DEFAULT 5,
        mention_threshold INT DEFAULT 3,
        duplicate_threshold INT DEFAULT 3,
        action_type VARCHAR(20) DEFAULT 'warn',
        warn_points INT DEFAULT 1,
        timeout_duration INT DEFAULT 5,
        log_channel VARCHAR(20),
        ignored_roles TEXT[],
        ignored_channels TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 28. Bad Words
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bad_words (
        word_id SERIAL PRIMARY KEY,
        guild_id VARCHAR(20) NOT NULL,
        word VARCHAR(100) NOT NULL,
        severity INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(guild_id, word)
      );
    `);

    // 29. Whitelisted Links
    await pool.query(`
      CREATE TABLE IF NOT EXISTS whitelisted_links (
        link_id SERIAL PRIMARY KEY,
        guild_id VARCHAR(20) NOT NULL,
        domain VARCHAR(200) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(guild_id, domain)
      );
    `);

    // 30. AutoMod Violations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS automod_violations (
        violation_id SERIAL PRIMARY KEY,
        guild_id VARCHAR(20) NOT NULL,
        user_id VARCHAR(20) NOT NULL,
        channel_id VARCHAR(20) NOT NULL,
        message_id VARCHAR(20),
        violation_type VARCHAR(50) NOT NULL,
        content TEXT,
        action_taken VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 31. AutoMod User Violations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS automod_user_violations (
        user_id VARCHAR(20) NOT NULL,
        guild_id VARCHAR(20) NOT NULL,
        violation_count INT DEFAULT 0,
        last_violation TIMESTAMP,
        warning_count INT DEFAULT 0,
        timeout_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, guild_id)
      );
    `);

    // 32. Log Entries
    await pool.query(`
      CREATE TABLE IF NOT EXISTS log_entries (
        log_id SERIAL PRIMARY KEY,
        guild_id VARCHAR(20) NOT NULL,
        channel_id VARCHAR(20),
        user_id VARCHAR(20),
        target_id VARCHAR(20),
        action VARCHAR(50) NOT NULL,
        details JSONB,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 33. Guild Members
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guild_members (
        user_id VARCHAR(20) NOT NULL,
        guild_id VARCHAR(20) NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        invite_code VARCHAR(20),
        inviter_id VARCHAR(20),
        left_at TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, guild_id)
      );
    `);

    // 34. Backup Records
    await pool.query(`
      CREATE TABLE IF NOT EXISTS backup_records (
        backup_id SERIAL PRIMARY KEY,
        guild_id VARCHAR(20) NOT NULL,
        backup_code VARCHAR(32) UNIQUE NOT NULL,
        created_by VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        is_restored BOOLEAN DEFAULT FALSE,
        restored_at TIMESTAMP,
        restored_by VARCHAR(20),
        data_size INT,
        version VARCHAR(10) DEFAULT '1.0'
      );
    `);
    // database.js - Add to initDatabase function

// Custom Invite Tracking
await pool.query(`
  CREATE TABLE IF NOT EXISTS custom_invites (
    invite_code VARCHAR(20) PRIMARY KEY,
    guild_id VARCHAR(20) NOT NULL,
    inviter_id VARCHAR(20) NOT NULL,
    max_uses INT DEFAULT 0,
    uses INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
  );
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS custom_invite_joins (
    join_id SERIAL PRIMARY KEY,
    invite_code VARCHAR(20) NOT NULL,
    user_id VARCHAR(20) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (invite_code) REFERENCES custom_invites(invite_code) ON DELETE CASCADE
  );
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS custom_invite_stats (
    user_id VARCHAR(20) NOT NULL,
    guild_id VARCHAR(20) NOT NULL,
    total_invites INT DEFAULT 0,
    total_joins INT DEFAULT 0,
    active_joins INT DEFAULT 0,
    total_leaves INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, guild_id)
  );
`);

    // 35. Backup Data
    await pool.query(`
      CREATE TABLE IF NOT EXISTS backup_data (
        backup_id INT NOT NULL,
        table_name VARCHAR(50) NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (backup_id) REFERENCES backup_records(backup_id) ON DELETE CASCADE
      );
    `);

    // 36. Restore History
    await pool.query(`
      CREATE TABLE IF NOT EXISTS restore_history (
        restore_id SERIAL PRIMARY KEY,
        backup_id INT NOT NULL,
        restored_by VARCHAR(20) NOT NULL,
        restored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        details JSONB,
        FOREIGN KEY (backup_id) REFERENCES backup_records(backup_id) ON DELETE CASCADE
      );
    `);

    // ================ INDEXES ================
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_economy_guild ON crystal_economy(guild_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_economy_balance ON crystal_economy(crystals DESC);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_transactions_user ON economy_transactions(user_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_messages_guild ON message_counts(guild_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_invites_guild ON invite_tracking(guild_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tickets_guild ON tickets(guild_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_moderation_guild ON moderation_logs(guild_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_moderation_user ON moderation_logs(user_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_warnings_guild ON warnings(guild_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_mutes_active ON mutes(is_active) WHERE is_active = true;`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_shop_guild ON shop_items(guild_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sell_items_active ON sell_items(is_active) WHERE is_active = true;`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_automod_violations_guild ON automod_violations(guild_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_log_entries_guild ON log_entries(guild_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_backup_records_guild ON backup_records(guild_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_backup_records_code ON backup_records(backup_code);`);

    console.log('✅ All database tables and indexes created successfully');
  } catch (err) {
    console.error('❌ Database initialization failed:', err);
    throw err;
  }
};

// ================ CRUD HELPERS ================
const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('📊 Executed query:', { text, duration, rows: res.rowCount });
  return res;
};

const getOne = async (table, conditions = {}, columns = '*', orderBy = null) => {
  const keys = Object.keys(conditions);
  const values = Object.values(conditions);
  const whereClause = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
  const orderClause = orderBy ? `ORDER BY ${orderBy}` : '';
  const sql = `SELECT ${columns} FROM ${table}${whereClause ? ' WHERE ' + whereClause : ''} ${orderClause} LIMIT 1;`;
  const res = await query(sql, values);
  return res.rows[0] || null;
};

const getAll = async (table, conditions = {}, columns = '*', orderBy = null, limit = null) => {
  const keys = Object.keys(conditions);
  const values = Object.values(conditions);
  const whereClause = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
  const orderClause = orderBy ? `ORDER BY ${orderBy}` : '';
  const limitClause = limit ? `LIMIT ${limit}` : '';
  const sql = `SELECT ${columns} FROM ${table}${whereClause ? ' WHERE ' + whereClause : ''} ${orderClause} ${limitClause};`;
  const res = await query(sql, values);
  return res.rows || [];
};

const insert = async (table, data) => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *;`;
  const res = await query(sql, values);
  return res.rows[0] || null;
};

const update = async (table, data, conditions) => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
  
  const condKeys = Object.keys(conditions);
  const condValues = Object.values(conditions);
  const whereClause = condKeys.map((key, i) => `${key} = $${i + keys.length + 1}`).join(' AND ');
  
  const sql = `UPDATE ${table} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE ${whereClause} RETURNING *;`;
  const res = await query(sql, [...values, ...condValues]);
  return res.rows[0] || null;
};

const upsert = async (table, data, conflictColumns) => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const updateClause = keys.map((key) => `${key} = EXCLUDED.${key}`).join(', ');
  const conflictStr = conflictColumns.join(', ');
  
  const sql = `
    INSERT INTO ${table} (${keys.join(', ')}) 
    VALUES (${placeholders})
    ON CONFLICT (${conflictStr}) 
    DO UPDATE SET ${updateClause}, updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;
  const res = await query(sql, values);
  return res.rows[0] || null;
};

const remove = async (table, conditions) => {
  const keys = Object.keys(conditions);
  const values = Object.values(conditions);
  const whereClause = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
  const sql = `DELETE FROM ${table} WHERE ${whereClause} RETURNING *;`;
  const res = await query(sql, values);
  return res.rows[0] || null;
};

// ================ ECONOMY HELPERS ================
const getOrCreateCrystalEntry = async (userId, guildId) => {
  let entry = await getOne('crystal_economy', { user_id: userId, guild_id: guildId });
  if (!entry) {
    entry = await insert('crystal_economy', {
      user_id: userId,
      guild_id: guildId,
      crystals: 0,
      total_earned: 0,
      total_spent: 0
    });
  }
  return entry;
};

const getCrystals = async (userId, guildId) => {
  const entry = await getOrCreateCrystalEntry(userId, guildId);
  return entry.crystals;
};

const addCrystals = async (userId, guildId, amount, reason = 'Unknown', referenceId = null) => {
  if (amount <= 0) throw new Error('Amount must be positive');
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE crystal_economy 
       SET crystals = crystals + $1, total_earned = total_earned + $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND guild_id = $3 RETURNING *;`,
      [amount, userId, guildId]
    );
    if (result.rows.length === 0) throw new Error('User not found in economy system');
    await client.query(
      `INSERT INTO economy_transactions (user_id, guild_id, amount, type, reason, reference_id)
       VALUES ($1, $2, $3, 'earn', $4, $5);`,
      [userId, guildId, amount, reason, referenceId]
    );
    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const removeCrystals = async (userId, guildId, amount, reason = 'Unknown', referenceId = null) => {
  if (amount <= 0) throw new Error('Amount must be positive');
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const checkResult = await client.query(
      'SELECT crystals FROM crystal_economy WHERE user_id = $1 AND guild_id = $2;',
      [userId, guildId]
    );
    if (checkResult.rows.length === 0) throw new Error('User not found in economy system');
    if (checkResult.rows[0].crystals < amount) throw new Error('Insufficient crystals');
    
    const result = await client.query(
      `UPDATE crystal_economy 
       SET crystals = crystals - $1, total_spent = total_spent + $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND guild_id = $3 RETURNING *;`,
      [amount, userId, guildId]
    );
    await client.query(
      `INSERT INTO economy_transactions (user_id, guild_id, amount, type, reason, reference_id)
       VALUES ($1, $2, $3, 'spend', $4, $5);`,
      [userId, guildId, amount, reason, referenceId]
    );
    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getCrystalStats = async (userId, guildId) => {
  const entry = await getOrCreateCrystalEntry(userId, guildId);
  return {
    crystals: entry.crystals,
    totalEarned: entry.total_earned,
    totalSpent: entry.total_spent
  };
};

const getCrystalLeaderboard = async (guildId, limit = 10) => {
  const result = await query(
    `SELECT user_id, crystals, total_earned FROM crystal_economy
     WHERE guild_id = $1 ORDER BY crystals DESC LIMIT $2;`,
    [guildId, limit]
  );
  return result.rows;
};

const getUserCrystalRank = async (userId, guildId) => {
  const result = await query(
    `SELECT COUNT(*) + 1 as rank FROM crystal_economy
     WHERE guild_id = $1 AND crystals > (SELECT crystals FROM crystal_economy WHERE user_id = $2 AND guild_id = $1);`,
    [guildId, userId]
  );
  return parseInt(result.rows[0]?.rank) || 0;
};

// ================ MESSAGE TRACKING HELPERS ================
const updateMessageCount = async (userId, guildId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let counts = await client.query(
      'SELECT * FROM message_counts WHERE user_id = $1 AND guild_id = $2;',
      [userId, guildId]
    );
    if (counts.rows.length === 0) {
      await client.query(
        `INSERT INTO message_counts (user_id, guild_id, total_messages, daily_messages, weekly_messages)
         VALUES ($1, $2, 1, 1, 1);`,
        [userId, guildId]
      );
      await client.query(
        `INSERT INTO message_milestones (user_id, guild_id, milestone_count, last_milestone)
         VALUES ($1, $2, 0, 0);`,
        [userId, guildId]
      );
    } else {
      const now = new Date();
      const lastDaily = counts.rows[0].last_daily_reset;
      const lastWeekly = counts.rows[0].last_weekly_reset;
      
      if (now.getDate() !== lastDaily.getDate() || now.getMonth() !== lastDaily.getMonth()) {
        await client.query(
          `UPDATE message_counts SET daily_messages = 0, last_daily_reset = CURRENT_TIMESTAMP
           WHERE user_id = $1 AND guild_id = $2;`,
          [userId, guildId]
        );
      }
      
      const weekDiff = (now - lastWeekly) / (7 * 24 * 60 * 60 * 1000);
      if (weekDiff >= 1) {
        await client.query(
          `UPDATE message_counts SET weekly_messages = 0, last_weekly_reset = CURRENT_TIMESTAMP
           WHERE user_id = $1 AND guild_id = $2;`,
          [userId, guildId]
        );
      }
      
      await client.query(
        `UPDATE message_counts 
         SET total_messages = total_messages + 1, daily_messages = daily_messages + 1,
             weekly_messages = weekly_messages + 1, last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND guild_id = $2;`,
        [userId, guildId]
      );
    }
    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const checkMessageMilestone = async (userId, guildId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const counts = await client.query(
      'SELECT total_messages FROM message_counts WHERE user_id = $1 AND guild_id = $2;',
      [userId, guildId]
    );
    if (counts.rows.length === 0) return 0;
    const total = counts.rows[0].total_messages;
    const milestone = Math.floor(total / 100);
    const milestones = await client.query(
      'SELECT last_milestone FROM message_milestones WHERE user_id = $1 AND guild_id = $2;',
      [userId, guildId]
    );
    let lastMilestone = 0;
    if (milestones.rows.length === 0) {
      await client.query(
        `INSERT INTO message_milestones (user_id, guild_id, milestone_count, last_milestone)
         VALUES ($1, $2, 0, 0);`,
        [userId, guildId]
      );
    } else {
      lastMilestone = milestones.rows[0].last_milestone;
    }
    if (milestone > lastMilestone) {
      const earned = milestone - lastMilestone;
      await client.query(
        `UPDATE message_milestones 
         SET milestone_count = milestone_count + $1, last_milestone = $2, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $3 AND guild_id = $4;`,
        [earned, milestone, userId, guildId]
      );
      await client.query('COMMIT');
      return earned;
    }
    await client.query('COMMIT');
    return 0;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getMessageStats = async (userId, guildId) => {
  const counts = await getOne('message_counts', { user_id: userId, guild_id: guildId });
  const milestones = await getOne('message_milestones', { user_id: userId, guild_id: guildId });
  return {
    total: counts?.total_messages || 0,
    daily: counts?.daily_messages || 0,
    weekly: counts?.weekly_messages || 0,
    milestones: milestones?.milestone_count || 0,
    lastMessage: counts?.last_message_at || null
  };
};

const getMessageLeaderboard = async (guildId, limit = 10, period = 'total') => {
  let orderBy = 'total_messages';
  if (period === 'daily') orderBy = 'daily_messages';
  if (period === 'weekly') orderBy = 'weekly_messages';
  const result = await query(
    `SELECT user_id, ${orderBy} as count FROM message_counts
     WHERE guild_id = $1 ORDER BY ${orderBy} DESC LIMIT $2;`,
    [guildId, limit]
  );
  return result.rows;
};

// ================ INVITE HELPERS ================
const trackInvite = async (inviteCode, guildId, inviterId, maxUses = 0) => {
  return await insert('invite_tracking', {
    invite_code: inviteCode,
    guild_id: guildId,
    inviter_id: inviterId,
    max_uses: maxUses,
    uses: 0
  });
};

const trackInviteUse = async (inviteCode, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updateResult = await client.query(
      `UPDATE invite_tracking SET uses = uses + 1 WHERE invite_code = $1 RETURNING *;`,
      [inviteCode]
    );
    if (updateResult.rows.length === 0) throw new Error('Invite not found');
    const invite = updateResult.rows[0];
    await client.query(
      `INSERT INTO invite_joins (invite_code, user_id) VALUES ($1, $2);`,
      [inviteCode, userId]
    );
    await client.query(
      `INSERT INTO invite_stats (user_id, guild_id, total_joins, active_joins)
       VALUES ($1, $2, 1, 1)
       ON CONFLICT (user_id, guild_id) 
       DO UPDATE SET total_joins = invite_stats.total_joins + 1, active_joins = invite_stats.active_joins + 1, updated_at = CURRENT_TIMESTAMP;`,
      [invite.inviter_id, invite.guild_id]
    );
    await client.query('COMMIT');
    return invite;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const trackInviteLeave = async (userId, guildId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // JOIN with invite_tracking to get the inviter_id (not stored on invite_joins itself)
    const joinResult = await client.query(
      `SELECT ij.*, it.inviter_id
       FROM invite_joins ij
       JOIN invite_tracking it ON it.invite_code = ij.invite_code
       WHERE ij.user_id = $1 AND ij.is_active = TRUE
       ORDER BY ij.joined_at DESC LIMIT 1;`,
      [userId]
    );
    if (joinResult.rows.length === 0) {
      await client.query('COMMIT');
      return null;
    }
    const join = joinResult.rows[0];
    await client.query(`UPDATE invite_joins SET is_active = FALSE WHERE join_id = $1;`, [join.join_id]);
    if (join.inviter_id) {
      await client.query(
        `UPDATE invite_stats 
         SET active_joins = GREATEST(active_joins - 1, 0), total_leaves = total_leaves + 1, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND guild_id = $2;`,
        [join.inviter_id, guildId]
      );
    }
    await client.query('COMMIT');
    return join;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Get the inviter_id for a member by looking up the guild_members record.
 * Works for ALL invite types (regular Discord invites and bot-tracked invites).
 */
const getInviterForMember = async (userId, guildId) => {
  const row = await getOne('guild_members', { user_id: userId, guild_id: guildId });
  return row?.inviter_id || null;
};

/**
 * Upsert invite_stats for a regular (non-bot-tracked) invite join.
 * For bot-tracked invites this is handled inside trackInviteUse.
 */
const upsertInviteStatsJoin = async (inviterId, guildId) => {
  await pool.query(
    `INSERT INTO invite_stats (user_id, guild_id, total_joins, active_joins)
     VALUES ($1, $2, 1, 1)
     ON CONFLICT (user_id, guild_id)
     DO UPDATE SET total_joins = invite_stats.total_joins + 1,
                   active_joins = invite_stats.active_joins + 1,
                   updated_at = CURRENT_TIMESTAMP;`,
    [inviterId, guildId]
  );
};

/**
 * Update invite_stats for a regular (non-bot-tracked) invite leave.
 * For bot-tracked invites this is handled inside trackInviteLeave.
 */
const upsertInviteStatsLeave = async (inviterId, guildId) => {
  await pool.query(
    `UPDATE invite_stats
     SET active_joins = GREATEST(active_joins - 1, 0),
         total_leaves = total_leaves + 1,
         updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $1 AND guild_id = $2;`,
    [inviterId, guildId]
  );
};

const getInviteStats = async (userId, guildId) => {
  let stats = await getOne('invite_stats', { user_id: userId, guild_id: guildId });
  if (!stats) {
    stats = await insert('invite_stats', {
      user_id: userId,
      guild_id: guildId,
      total_invites: 0,
      active_invites: 0,
      total_joins: 0,
      active_joins: 0,
      total_leaves: 0
    });
  }
  return stats;
};

const getInviteLeaderboard = async (guildId, limit = 10) => {
  const result = await query(
    `SELECT user_id, total_joins, active_joins FROM invite_stats
     WHERE guild_id = $1 ORDER BY total_joins DESC LIMIT $2;`,
    [guildId, limit]
  );
  return result.rows;
};

const getUserInvites = async (userId, guildId) => {
  return await getAll('invite_tracking', { inviter_id: userId, guild_id: guildId });
};

// ================ SHOP HELPERS ================
const createShopItem = async (guildId, itemData) => {
  const data = {
    guild_id: guildId,
    name: itemData.name,
    description: itemData.description || null,
    image_url: itemData.imageUrl || null,
    price: itemData.price,
    stock: itemData.stock || -1,
    category_id: itemData.categoryId || null,
    role_id: itemData.roleId || null,
    is_limited: itemData.isLimited || false,
    limit_per_user: itemData.limitPerUser || 1,
    requires_level: itemData.requiresLevel || 0,
    requires_role: itemData.requiresRole || null,
    is_active: true
  };
  return await insert('shop_items', data);
};

const getShopItems = async (guildId, categoryId = null) => {
  const conditions = { guild_id: guildId, is_active: true };
  if (categoryId) conditions.category_id = categoryId;
  return await getAll('shop_items', conditions);
};

const getShopItem = async (itemId) => {
  return await getOne('shop_items', { item_id: itemId });
};

const updateShopItem = async (itemId, data) => {
  return await update('shop_items', data, { item_id: itemId });
};

const deleteShopItem = async (itemId) => {
  return await remove('shop_items', { item_id: itemId });
};

const getAllShopItems = async (guildId, includeInactive = false) => {
  const queryText = `
    SELECT i.*, c.name as category_name, c.emoji as category_emoji
    FROM shop_items i
    LEFT JOIN shop_categories c ON i.category_id = c.category_id
    WHERE i.guild_id = $1 ${includeInactive ? '' : 'AND i.is_active = TRUE'}
    ORDER BY i.category_id NULLS FIRST, i.name ASC;
  `;
  const result = await pool.query(queryText, [guildId]);
  return result.rows;
};

const getShopItemWithCategory = async (itemId) => {
  const queryText = `
    SELECT i.*, c.name as category_name, c.emoji as category_emoji
    FROM shop_items i
    LEFT JOIN shop_categories c ON i.category_id = c.category_id
    WHERE i.item_id = $1;
  `;
  const result = await pool.query(queryText, [itemId]);
  return result.rows[0] || null;
};

const restockItem = async (itemId, amount) => {
  if (amount < 0) throw new Error('Restock amount must be positive');
  const result = await pool.query(
    `UPDATE shop_items 
     SET stock = CASE WHEN stock = -1 THEN -1 ELSE stock + $1 END, updated_at = CURRENT_TIMESTAMP
     WHERE item_id = $2 RETURNING *;`,
    [amount, itemId]
  );
  if (result.rows.length === 0) throw new Error('Item not found');
  return result.rows[0];
};

const getShopStats = async (guildId) => {
  const result = await pool.query(
    `SELECT 
      COUNT(*) as total_items,
      COUNT(CASE WHEN is_active THEN 1 END) as active_items,
      COUNT(CASE WHEN stock = -1 THEN 1 END) as unlimited_items,
      COUNT(CASE WHEN stock = 0 THEN 1 END) as out_of_stock,
      SUM(CASE WHEN is_active AND stock > -1 THEN stock ELSE 0 END) as total_stock
     FROM shop_items WHERE guild_id = $1;`,
    [guildId]
  );
  return result.rows[0];
};

const createPurchase = async (userId, guildId, itemId, quantity = 1) => {
  const item = await getShopItem(itemId);
  if (!item) throw new Error('Item not found');
  const totalCost = item.price * quantity;
  const balance = await getCrystals(userId, guildId);
  if (balance < totalCost) throw new Error('Insufficient crystals');
  if (item.stock !== -1 && item.stock < quantity) throw new Error('Insufficient stock');
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE crystal_economy SET crystals = crystals - $1, total_spent = total_spent + $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND guild_id = $3;`,
      [totalCost, userId, guildId]
    );
    if (item.stock !== -1) {
      await client.query(
        `UPDATE shop_items SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP WHERE item_id = $2;`,
        [quantity, itemId]
      );
    }
    const purchase = await client.query(
      `INSERT INTO purchase_history (user_id, guild_id, item_id, item_name, price, quantity, total_cost)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;`,
      [userId, guildId, itemId, item.name, item.price, quantity, totalCost]
    );
    await client.query(
      `INSERT INTO purchase_tickets (user_id, guild_id, item_id, quantity, total_cost, status, transaction_reference)
       VALUES ($1, $2, $3, $4, $5, 'completed', $6);`,
      [userId, guildId, itemId, quantity, totalCost, `PURCHASE_${Date.now()}`]
    );
    await client.query(
      `INSERT INTO economy_transactions (user_id, guild_id, amount, type, reason, reference_id)
       VALUES ($1, $2, $3, 'spend', $4, $5);`,
      [userId, guildId, totalCost, `Purchased ${quantity}x ${item.name}`, itemId]
    );
    await client.query('COMMIT');
    return purchase.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getPurchaseHistory = async (userId, guildId, limit = 20) => {
  const result = await query(
    `SELECT * FROM purchase_history WHERE user_id = $1 AND guild_id = $2 ORDER BY purchased_at DESC LIMIT $3;`,
    [userId, guildId, limit]
  );
  return result.rows;
};

// ================ SELL HELPERS ================
const createSellPanel = async (guildId, channelId, title, description, options = {}) => {
  return await insert('sell_panels', {
    guild_id: guildId,
    channel_id: channelId,
    title: title,
    description: description,
    color: options.color || '#F39C12',
    thumbnail_url: options.thumbnailUrl || null,
    require_approval: options.requireApproval !== undefined ? options.requireApproval : true,
    auto_delete: options.autoDelete || false
  });
};

const getSellPanels = async (guildId) => {
  return await getAll('sell_panels', { guild_id: guildId });
};

const getSellPanel = async (panelId) => {
  return await getOne('sell_panels', { panel_id: panelId });
};

const updateSellPanel = async (panelId, data) => {
  return await update('sell_panels', data, { panel_id: panelId });
};

const deleteSellPanel = async (panelId) => {
  return await remove('sell_panels', { panel_id: panelId });
};

const createSellItem = async (panelId, userId, guildId, itemData) => {
  const data = {
    panel_id: panelId,
    user_id: userId,
    guild_id: guildId,
    item_name: itemData.name,
    item_description: itemData.description || null,
    item_image_url: itemData.imageUrl || null,
    price: itemData.price,
    quantity: itemData.quantity || 1,
    category: itemData.category || null,
    status: 'pending',
    is_active: true
  };
  return await insert('sell_items', data);
};

const getSellItems = async (guildId, status = null) => {
  const conditions = { guild_id: guildId, is_active: true };
  if (status) conditions.status = status;
  return await getAll('sell_items', conditions);
};

const getSellItemsByUser = async (userId, guildId, status = null) => {
  const conditions = { user_id: userId, guild_id: guildId, is_active: true };
  if (status) conditions.status = status;
  return await getAll('sell_items', conditions);
};

const getSellItem = async (sellId) => {
  return await getOne('sell_items', { sell_id: sellId });
};

const updateSellItem = async (sellId, data) => {
  return await update('sell_items', data, { sell_id: sellId });
};

const createSellTicket = async (sellId, userId, guildId, itemName, price, quantity = 1) => {
  return await insert('sell_tickets', {
    sell_id: sellId,
    user_id: userId,
    guild_id: guildId,
    item_name: itemName,
    price: price,
    quantity: quantity,
    status: 'pending'
  });
};

const getSellTickets = async (guildId, status = null) => {
  const conditions = { guild_id: guildId };
  if (status) conditions.status = status;
  return await getAll('sell_tickets', conditions);
};

const getSellTicketsByUser = async (userId, guildId, status = null) => {
  const conditions = { user_id: userId, guild_id: guildId };
  if (status) conditions.status = status;
  return await getAll('sell_tickets', conditions);
};

const approveSellItem = async (sellId, managerId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sellItem = await client.query(
      `UPDATE sell_items SET status = 'approved', approved_by = $1, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE sell_id = $2 AND is_active = TRUE RETURNING *;`,
      [managerId, sellId]
    );
    if (sellItem.rows.length === 0) throw new Error('Sell item not found');
    await client.query(
      `UPDATE sell_tickets SET status = 'approved', manager_id = $1, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE sell_id = $2;`,
      [managerId, sellId]
    );
    await client.query('COMMIT');
    return sellItem.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const rejectSellItem = async (sellId, managerId, reason) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sellItem = await client.query(
      `UPDATE sell_items SET status = 'rejected', is_active = FALSE, rejected_by = $1, rejected_at = CURRENT_TIMESTAMP, rejection_reason = $2, updated_at = CURRENT_TIMESTAMP
       WHERE sell_id = $3 RETURNING *;`,
      [managerId, reason, sellId]
    );
    if (sellItem.rows.length === 0) throw new Error('Sell item not found');
    await client.query(
      `UPDATE sell_tickets SET status = 'rejected', manager_id = $1, reviewed_at = CURRENT_TIMESTAMP, notes = $2, updated_at = CURRENT_TIMESTAMP
       WHERE sell_id = $3;`,
      [managerId, reason, sellId]
    );
    await client.query('COMMIT');
    return sellItem.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ================ TICKET HELPERS ================
const getTicketConfig = async (guildId) => {
  return await getOne('ticket_config', { guild_id: guildId });
};

const updateTicketConfig = async (guildId, config) => {
  return await upsert('ticket_config', { guild_id: guildId, ...config }, ['guild_id']);
};

const createTicket = async (guildId, channelId, userId, type, subject, description = null) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const config = await getTicketConfig(guildId);
    const maxTickets = config?.max_tickets_per_user || 5;
    const openTickets = await client.query(
      `SELECT COUNT(*) as count FROM tickets WHERE guild_id = $1 AND user_id = $2 AND status IN ('open', 'claimed', 'reopened');`,
      [guildId, userId]
    );
    if (parseInt(openTickets.rows[0].count) >= maxTickets) {
      throw new Error(`You have reached the maximum of ${maxTickets} open tickets`);
    }
    const result = await client.query(
      `INSERT INTO tickets (guild_id, channel_id, user_id, type, subject, description, status, priority)
       VALUES ($1, $2, $3, $4, $5, $6, 'open', 'medium') RETURNING *;`,
      [guildId, channelId, userId, type, subject, description]
    );
    await client.query(
      `INSERT INTO ticket_actions (ticket_id, user_id, action, details) VALUES ($1, $2, 'create', $3);`,
      [result.rows[0].ticket_id, userId, JSON.stringify({ type, subject })]
    );
    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getTicket = async (ticketId) => {
  return await getOne('tickets', { ticket_id: ticketId });
};

const getTickets = async (guildId, filters = {}) => {
  const conditions = { guild_id: guildId };
  if (filters.userId) conditions.user_id = filters.userId;
  if (filters.type) conditions.type = filters.type;
  if (filters.status) conditions.status = filters.status;
  if (filters.claimerId) conditions.claimer_id = filters.claimerId;
  if (filters.assignedManager) conditions.assigned_manager = filters.assignedManager;
  const orderBy = filters.orderBy || 'created_at DESC';
  const limit = filters.limit || 50;
  const result = await query(
    `SELECT * FROM tickets WHERE guild_id = $1 ${filters.userId ? 'AND user_id = $2' : ''} ${filters.type ? 'AND type = $3' : ''} ${filters.status ? 'AND status = $4' : ''} ORDER BY ${orderBy} LIMIT $${Object.keys(conditions).length + 1};`,
    [guildId, ...Object.values(filters)]
  );
  return result.rows;
};

const claimTicket = async (ticketId, claimerId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE tickets SET claimer_id = $1, status = 'claimed', updated_at = CURRENT_TIMESTAMP
       WHERE ticket_id = $2 AND status IN ('open', 'reopened') RETURNING *;`,
      [claimerId, ticketId]
    );
    if (result.rows.length === 0) throw new Error('Ticket not found or already claimed/closed');
    await client.query(
      `INSERT INTO ticket_actions (ticket_id, user_id, action, details) VALUES ($1, $2, 'claim', $3);`,
      [ticketId, claimerId, JSON.stringify({ claimed_by: claimerId })]
    );
    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const closeTicket = async (ticketId, userId, reason = null) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE tickets SET status = 'closed', closed_by = $1, closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE ticket_id = $2 AND status IN ('open', 'claimed', 'reopened') RETURNING *;`,
      [userId, ticketId]
    );
    if (result.rows.length === 0) throw new Error('Ticket not found or already closed');
    await client.query(
      `INSERT INTO ticket_actions (ticket_id, user_id, action, details) VALUES ($1, $2, 'close', $3);`,
      [ticketId, userId, JSON.stringify({ reason })]
    );
    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const reopenTicket = async (ticketId, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE tickets SET status = 'reopened', reopened_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE ticket_id = $1 AND status = 'closed' RETURNING *;`,
      [ticketId]
    );
    if (result.rows.length === 0) throw new Error('Ticket not found or not closed');
    await client.query(
      `INSERT INTO ticket_actions (ticket_id, user_id, action, details) VALUES ($1, $2, 'reopen', $3);`,
      [ticketId, userId, JSON.stringify({ reopened_by: userId })]
    );
    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const deleteTicket = async (ticketId, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE tickets SET status = 'deleted', deleted_by = $1, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE ticket_id = $2 RETURNING *;`,
      [userId, ticketId]
    );
    if (result.rows.length === 0) throw new Error('Ticket not found');
    await client.query(
      `INSERT INTO ticket_actions (ticket_id, user_id, action, details) VALUES ($1, $2, 'delete', $3);`,
      [ticketId, userId, JSON.stringify({ deleted_by: userId })]
    );
    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const addTicketMessage = async (ticketId, userId, username, content, attachments = [], isSystem = false) => {
  return await insert('ticket_messages', {
    ticket_id: ticketId,
    user_id: userId,
    username: username,
    content: content,
    attachment_urls: attachments,
    is_system: isSystem
  });
};

const getTicketMessages = async (ticketId, limit = 100) => {
  const result = await query(
    `SELECT * FROM ticket_messages WHERE ticket_id = $1 ORDER BY sent_at ASC LIMIT $2;`,
    [ticketId, limit]
  );
  return result.rows;
};

const createTranscript = async (ticketId, channelId, userId, content, attachmentUrl = null) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const transcript = await client.query(
      `INSERT INTO ticket_transcripts (ticket_id, channel_id, user_id, content, attachment_url) VALUES ($1, $2, $3, $4, $5) RETURNING *;`,
      [ticketId, channelId, userId, content, attachmentUrl]
    );
    await client.query(
      `UPDATE tickets SET transcript_url = $1, updated_at = CURRENT_TIMESTAMP WHERE ticket_id = $2;`,
      [attachmentUrl || `transcript_${ticketId}`, ticketId]
    );
    await client.query(
      `INSERT INTO ticket_actions (ticket_id, user_id, action, details) VALUES ($1, $2, 'transcript', $3);`,
      [ticketId, userId, JSON.stringify({ transcript_id: transcript.rows[0].transcript_id })]
    );
    await client.query('COMMIT');
    return transcript.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const assignManager = async (ticketId, managerId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE tickets SET assigned_manager = $1, updated_at = CURRENT_TIMESTAMP WHERE ticket_id = $2 RETURNING *;`,
      [managerId, ticketId]
    );
    if (result.rows.length === 0) throw new Error('Ticket not found');
    await client.query(
      `INSERT INTO ticket_actions (ticket_id, user_id, action, details) VALUES ($1, $2, 'assign_manager', $3);`,
      [ticketId, managerId, JSON.stringify({ assigned_manager: managerId })]
    );
    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getTicketStats = async (guildId) => {
  const result = await query(
    `SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'open' THEN 1 END) as open,
      COUNT(CASE WHEN status = 'claimed' THEN 1 END) as claimed,
      COUNT(CASE WHEN status = 'reopened' THEN 1 END) as reopened,
      COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed,
      COUNT(CASE WHEN status = 'deleted' THEN 1 END) as deleted,
      COUNT(CASE WHEN type = 'support' THEN 1 END) as support,
      COUNT(CASE WHEN type = 'purchase' THEN 1 END) as purchase,
      COUNT(CASE WHEN type = 'sell' THEN 1 END) as sell
    FROM tickets WHERE guild_id = $1;`,
    [guildId]
  );
  return result.rows[0];
};

// ================ MODERATION HELPERS ================
const addWarning = async (guildId, userId, moderatorId, reason, points = 1, channelId = null, messageId = null) => {
  const result = await insert('warnings', {
    guild_id: guildId,
    user_id: userId,
    moderator_id: moderatorId,
    reason: reason,
    points: points,
    channel_id: channelId,
    message_id: messageId,
    is_active: true
  });
  await insert('moderation_logs', {
    guild_id: guildId,
    user_id: userId,
    moderator_id: moderatorId,
    action: 'warn',
    reason: reason,
    channel_id: channelId,
    message_id: messageId
  });
  return result;
};

const getWarnings = async (userId, guildId, includeInactive = false) => {
  const conditions = { user_id: userId, guild_id: guildId };
  if (!includeInactive) conditions.is_active = true;
  return await getAll('warnings', conditions, '*', 'created_at DESC');
};

const getActiveWarningsCount = async (userId, guildId) => {
  const result = await query(
    `SELECT COUNT(*) as count, SUM(points) as total_points
     FROM warnings WHERE user_id = $1 AND guild_id = $2 AND is_active = true;`,
    [userId, guildId]
  );
  return {
    count: parseInt(result.rows[0]?.count) || 0,
    totalPoints: parseInt(result.rows[0]?.total_points) || 0
  };
};

const clearWarnings = async (userId, guildId) => {
  return await update('warnings', { is_active: false }, { user_id: userId, guild_id: guildId });
};

const addMute = async (guildId, userId, moderatorId, reason, duration, channelId = null) => {
  const endsAt = new Date(Date.now() + duration);
  const result = await insert('mutes', {
    guild_id: guildId,
    user_id: userId,
    moderator_id: moderatorId,
    reason: reason,
    duration: duration,
    ends_at: endsAt,
    is_active: true,
    channel_id: channelId
  });
  await insert('moderation_logs', {
    guildId: guildId,
    userId: userId,
    moderatorId: moderatorId,
    action: 'timeout',
    reason: reason,
    duration: duration,
    expiresAt: endsAt,
    channelId: channelId
  });
  return result;
};

const removeMute = async (muteId, guildId) => {
  return await update('mutes', { is_active: false }, { mute_id: muteId, guild_id: guildId });
};

const getActiveMutes = async (userId, guildId) => {
  return await getAll('mutes', { user_id: userId, guild_id: guildId, is_active: true });
};

const isUserMuted = async (userId, guildId) => {
  const result = await query(
    `SELECT * FROM mutes WHERE user_id = $1 AND guild_id = $2 AND is_active = true AND ends_at > NOW() LIMIT 1;`,
    [userId, guildId]
  );
  return result.rows.length > 0;
};

const logModerationAction = async (data) => {
  return await insert('moderation_logs', {
    guild_id: data.guildId,
    user_id: data.userId,
    moderator_id: data.moderatorId,
    action: data.action,
    reason: data.reason || null,
    duration: data.duration || null,
    channel_id: data.channelId || null,
    message_id: data.messageId || null,
    message_count: data.messageCount || null,
    expires_at: data.expiresAt || null,
    is_active: true
  });
};

const getModerationLogs = async (userId, guildId, limit = 20) => {
  const result = await query(
    `SELECT * FROM moderation_logs WHERE user_id = $1 AND guild_id = $2 ORDER BY created_at DESC LIMIT $3;`,
    [userId, guildId, limit]
  );
  return result.rows;
};

// ================ AUTOMOD HELPERS ================
const getAutoModSettings = async (guildId) => {
  let settings = await getOne('automod_settings', { guild_id: guildId });
  if (!settings) {
    settings = await insert('automod_settings', {
      guild_id: guildId,
      enabled: false,
      anti_spam: true,
      anti_invite: true,
      anti_bad_words: true,
      anti_mention_spam: true,
      anti_duplicate: true,
      anti_link_spam: true,
      spam_threshold: 5,
      spam_window: 5,
      mention_threshold: 3,
      duplicate_threshold: 3,
      action_type: 'warn',
      warn_points: 1,
      timeout_duration: 5,
      ignored_roles: [],
      ignored_channels: []
    });
  }
  return settings;
};

const updateAutoModSettings = async (guildId, settings) => {
  return await upsert('automod_settings', { guild_id: guildId, ...settings }, ['guild_id']);
};

const logViolation = async (guildId, userId, channelId, violationType, content, actionTaken, messageId = null) => {
  return await insert('automod_violations', {
    guild_id: guildId,
    user_id: userId,
    channel_id: channelId,
    message_id: messageId,
    violation_type: violationType,
    content: content,
    action_taken: actionTaken
  });
};

const getBadWords = async (guildId) => {
  const words = await getAll('bad_words', { guild_id: guildId });
  return words.map(w => w.word);
};

const addBadWord = async (guildId, word, severity = 1) => {
  return await insert('bad_words', { guild_id: guildId, word: word.toLowerCase(), severity: severity });
};

// ================ WELCOME/LEAVE HELPERS ================
const getWelcomeSettings = async (guildId) => {
  let settings = await getOne('welcome_settings', { guild_id: guildId });
  if (!settings) {
    settings = await insert('welcome_settings', { guild_id: guildId, enabled: false, show_member_count: true, show_avatar: true });
  }
  return settings;
};

const updateWelcomeSettings = async (guildId, settings) => {
  return await upsert('welcome_settings', { guild_id: guildId, ...settings }, ['guild_id']);
};

const getLeaveSettings = async (guildId) => {
  let settings = await getOne('leave_settings', { guild_id: guildId });
  if (!settings) {
    settings = await insert('leave_settings', { guild_id: guildId, enabled: false, show_member_count: true, show_avatar: true });
  }
  return settings;
};

const updateLeaveSettings = async (guildId, settings) => {
  return await upsert('leave_settings', { guild_id: guildId, ...settings }, ['guild_id']);
};

// ================ LOGGING HELPERS ================
const getLoggingSettings = async (guildId) => {
  let settings = await getOne('logging_settings', { guild_id: guildId });
  if (!settings) {
    settings = await insert('logging_settings', {
      guild_id: guildId,
      log_messages: true,
      log_edits: true,
      log_deletes: true,
      log_joins: true,
      log_leaves: true,
      log_roles: true,
      log_nicknames: true,
      log_channels: true,
      log_voice: true,
      log_tickets: true,
      log_purchases: true,
      log_sells: true,
      log_moderation: true
    });
  }
  return settings;
};

const updateLoggingSettings = async (guildId, settings) => {
  return await upsert('logging_settings', { guild_id: guildId, ...settings }, ['guild_id']);
};

const logAction = async (guildId, action, data = {}) => {
  return await insert('log_entries', {
    guild_id: guildId,
    channel_id: data.channelId || null,
    user_id: data.userId || null,
    target_id: data.targetId || null,
    action: action,
    details: data.details || null,
    content: data.content || null
  });
};

// ================ GUILD MEMBER HELPERS ================
const trackMemberJoin = async (userId, guildId, inviteCode = null, inviterId = null) => {
  // Upsert so that rejoins update the record rather than failing on PK conflict.
  // This ensures guild_members.inviter_id always reflects the most recent join.
  await pool.query(
    `INSERT INTO guild_members (user_id, guild_id, invite_code, inviter_id, joined_at, left_at, is_active, updated_at)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, NULL, TRUE, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id, guild_id)
     DO UPDATE SET invite_code = EXCLUDED.invite_code,
                   inviter_id  = EXCLUDED.inviter_id,
                   joined_at   = CURRENT_TIMESTAMP,
                   left_at     = NULL,
                   is_active   = TRUE,
                   updated_at  = CURRENT_TIMESTAMP;`,
    [userId, guildId, inviteCode, inviterId]
  );
};

const trackMemberLeave = async (userId, guildId) => {
  return await update('guild_members', { left_at: new Date(), is_active: false, updated_at: new Date() }, { user_id: userId, guild_id: guildId });
};

const getMemberJoinInfo = async (userId, guildId) => {
  return await getOne('guild_members', { user_id: userId, guild_id: guildId });
};

// ================ BACKUP HELPERS ================
const generateBackupCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 16; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
    if (i === 3 || i === 7 || i === 11) code += '-';
  }
  return code;
};

const createBackupRecord = async (guildId, createdBy, dataSize) => {
  const backupCode = generateBackupCode();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const result = await insert('backup_records', {
    guild_id: guildId,
    backup_code: backupCode,
    created_by: createdBy,
    expires_at: expiresAt,
    data_size: dataSize,
    version: '1.0'
  });
  return result;
};

const storeBackupData = async (backupId, tableName, data) => {
  return await insert('backup_data', {
    backup_id: backupId,
    table_name: tableName,
    data: data
  });
};

const getBackupByCode = async (backupCode) => {
  return await getOne('backup_records', { backup_code: backupCode });
};

const getBackupData = async (backupId) => {
  const result = await pool.query(`SELECT * FROM backup_data WHERE backup_id = $1;`, [backupId]);
  return result.rows;
};

const getBackupRecords = async (guildId, limit = 20) => {
  const result = await pool.query(
    `SELECT * FROM backup_records WHERE guild_id = $1 ORDER BY created_at DESC LIMIT $2;`,
    [guildId, limit]
  );
  return result.rows;
};

const markBackupRestored = async (backupId, restoredBy) => {
  return await update('backup_records', {
    is_restored: true,
    restored_at: new Date(),
    restored_by: restoredBy
  }, { backup_id: backupId });
};

const logRestore = async (backupId, restoredBy, details) => {
  return await insert('restore_history', {
    backup_id: backupId,
    restored_by: restoredBy,
    details: details
  });
};

const deleteExpiredBackups = async () => {
  const result = await pool.query(
    `DELETE FROM backup_records WHERE expires_at < NOW() AND is_restored = FALSE RETURNING backup_id;`
  );
  return result.rows;
};

const getBackupStats = async (guildId) => {
  const result = await pool.query(
    `SELECT 
      COUNT(*) as total_backups,
      COUNT(CASE WHEN is_restored THEN 1 END) as restored_backups,
      COUNT(CASE WHEN expires_at > NOW() AND NOT is_restored THEN 1 END) as active_backups
     FROM backup_records WHERE guild_id = $1;`,
    [guildId]
  );
  return result.rows[0];
};

// ================ CUSTOM INVITE HELPERS ================

const createCustomInvite = async (inviteCode, guildId, inviterId, maxUses = 0) => {
  return await insert('custom_invites', {
    invite_code: inviteCode,
    guild_id: guildId,
    inviter_id: inviterId,
    max_uses: maxUses,
    uses: 0,
    is_active: true
  });
};

const getCustomInvite = async (inviteCode) => {
  return await getOne('custom_invites', { invite_code: inviteCode });
};

const incrementInviteUses = async (inviteCode, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE custom_invites 
       SET uses = uses + 1 
       WHERE invite_code = $1 AND is_active = TRUE
       RETURNING *;`,
      [inviteCode]
    );
    if (result.rows.length === 0) throw new Error('Invalid invite code');
    const invite = result.rows[0];
    if (invite.max_uses > 0 && invite.uses > invite.max_uses) {
      await client.query(`UPDATE custom_invites SET is_active = FALSE WHERE invite_code = $1;`, [inviteCode]);
      throw new Error('Invite has reached maximum uses');
    }
    await client.query(
      `INSERT INTO custom_invite_joins (invite_code, user_id) VALUES ($1, $2);`,
      [inviteCode, userId]
    );
    await client.query(
      `INSERT INTO custom_invite_stats (user_id, guild_id, total_joins, active_joins)
       VALUES ($1, $2, 1, 1)
       ON CONFLICT (user_id, guild_id) 
       DO UPDATE SET 
         total_joins = custom_invite_stats.total_joins + 1,
         active_joins = custom_invite_stats.active_joins + 1,
         updated_at = CURRENT_TIMESTAMP;`,
      [invite.inviter_id, invite.guild_id]
    );
    await client.query('COMMIT');
    return invite;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const markInviteJoinInactive = async (userId, guildId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const joinResult = await client.query(
      `SELECT * FROM custom_invite_joins 
       WHERE user_id = $1 AND is_active = TRUE
       ORDER BY joined_at DESC LIMIT 1;`,
      [userId]
    );
    if (joinResult.rows.length === 0) {
      await client.query('COMMIT');
      return null;
    }
    const join = joinResult.rows[0];
    await client.query(`UPDATE custom_invite_joins SET is_active = FALSE WHERE join_id = $1;`, [join.join_id]);
    await client.query(
      `UPDATE custom_invite_stats 
       SET active_joins = active_joins - 1,
           total_leaves = total_leaves + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND guild_id = $2;`,
      [join.inviter_id, guildId]
    );
    await client.query('COMMIT');
    return join;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getCustomInviteStats = async (userId, guildId) => {
  let stats = await getOne('custom_invite_stats', { user_id: userId, guild_id: guildId });
  if (!stats) {
    stats = await insert('custom_invite_stats', {
      user_id: userId,
      guild_id: guildId,
      total_invites: 0,
      total_joins: 0,
      active_joins: 0,
      total_leaves: 0
    });
  }
  return stats;
};

const getCustomInviteLeaderboard = async (guildId, limit = 10) => {
  const result = await query(
    `SELECT user_id, total_joins, active_joins
     FROM custom_invite_stats
     WHERE guild_id = $1
     ORDER BY total_joins DESC
     LIMIT $2;`,
    [guildId, limit]
  );
  return result.rows;
};

const getCustomInvitesByUser = async (userId, guildId) => {
  return await getAll('custom_invites', { inviter_id: userId, guild_id: guildId });
};

// ================ PURCHASE TICKET CHANNEL HELPERS ================

/**
 * Create a purchase ticket channel in Discord
 */
const createPurchaseTicketChannel = async (guild, userId, purchase, item) => {
  // Get or create ticket category
  const config = await getTicketConfig(guild.id);
  const categoryId = config?.purchase_category_id;
  
  const category = categoryId ? guild.channels.cache.get(categoryId) : null;
  
  // Create the channel
  const channel = await guild.channels.create({
    name: `purchase-${purchase.purchase_id}`,
    type: 0, // Text channel
    parent: category ? category.id : null,
    permissionOverwrites: [
      {
        id: guild.id,
        deny: ['ViewChannel']
      },
      {
        id: userId,
        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'AttachFiles', 'EmbedLinks']
      },
      {
        id: guild.client.user.id,
        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageMessages']
      }
    ]
  });
  
  return channel;
};

/**
 * Send initial purchase ticket message
 */
const sendPurchaseTicketMessage = async (channel, purchase, item, user) => {
  const embed = new EmbedBuilder()
    .setColor('#57F287')
    .setTitle('🛒 Purchase Confirmation')
    .setDescription(`Thank you for your purchase, ${user.username}!`)
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: '🎫 Ticket ID', value: `#${purchase.purchase_id}`, inline: true },
      { name: '🛒 Item', value: item.name, inline: true },
      { name: '🔢 Quantity', value: `${purchase.quantity}`, inline: true },
      { name: '💰 Total Cost', value: `${purchase.total_cost} 💎`, inline: true },
      { name: '📦 Remaining Stock', value: item.stock === -1 ? '♾️ Unlimited' : `${item.stock - purchase.quantity}`, inline: true },
      { name: '💎 New Balance', value: `${await getCrystals(user.id, channel.guild.id)} 💎`, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: 'Purchase Ticket' });
  
  await channel.send({ 
    content: `<@${user.id}>`,
    embeds: [embed]
  });
  
  // Send a follow-up message with ticket actions
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`close_purchase_${purchase.purchase_id}`)
        .setLabel('🔒 Close Ticket')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`transcript_purchase_${purchase.purchase_id}`)
        .setLabel('📄 Transcript')
        .setStyle(ButtonStyle.Secondary)
    );
  
  await channel.send({ 
    content: '📋 **Ticket Actions**',
    components: [row]
  });
};

/**
 * Close a purchase ticket
 */
const closePurchaseTicket = async (interaction, ticketId) => {
  const channel = interaction.channel;
  
  // Send closing message
  const embed = new EmbedBuilder()
    .setColor('#ED4245')
    .setTitle('🔒 Ticket Closed')
    .setDescription(`Purchase ticket #${ticketId} has been closed.`)
    .setTimestamp()
    .setFooter({ text: 'Ticket System' });
  
  await channel.send({ embeds: [embed] });
  
  // Delete channel after 5 seconds
  setTimeout(async () => {
    await channel.delete();
  }, 5000);
  
  // Update database
  await update('purchase_tickets', 
    { status: 'closed', processed_at: new Date() }, 
    { ticket_id: ticketId }
  );
};

// ================ SELL TICKET CHANNEL HELPERS ================

/**
 * Create a sell ticket channel in Discord
 */
const createSellTicketChannel = async (guild, userId, sellItem) => {
  // Get or create ticket category
  const config = await getTicketConfig(guild.id);
  const categoryId = config?.sell_category_id;
  
  const category = categoryId ? guild.channels.cache.get(categoryId) : null;
  
  // Create the channel
  const channel = await guild.channels.create({
    name: `sell-${sellItem.sell_id}`,
    type: 0, // Text channel
    parent: category ? category.id : null,
    permissionOverwrites: [
      {
        id: guild.id,
        deny: ['ViewChannel']
      },
      {
        id: userId,
        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'AttachFiles', 'EmbedLinks']
      },
      {
        id: guild.client.user.id,
        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageMessages']
      }
    ]
  });
  
  return channel;
};

/**
 * Send initial sell ticket message
 */
const sendSellTicketMessage = async (channel, sellItem, user, buttonName = '📩 Open Ticket') => {
  const embed = new EmbedBuilder()
    .setColor('#F39C12')
    .setTitle(`💰 ${sellItem.item_name}`)
    .setDescription(sellItem.item_description || 'No description provided.')
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: '🎫 Listing ID', value: `#${sellItem.sell_id}`, inline: true },
      { name: '👤 Seller', value: `<@${user.id}>`, inline: true },
      { name: '🔘 Ticket Button', value: buttonName, inline: true },
      { name: '📊 Status', value: '⏳ Pending Approval', inline: true }
    )
    .setTimestamp()
    .setFooter({ text: 'Sell Ticket' });

  await channel.send({ content: `<@${user.id}>`, embeds: [embed] });

  // Admin action buttons
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`approve_sell_${sellItem.sell_id}`)
        .setLabel('✅ Approve')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`reject_sell_${sellItem.sell_id}`)
        .setLabel('❌ Reject')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`close_sell_${sellItem.sell_id}`)
        .setLabel('🔒 Close')
        .setStyle(ButtonStyle.Secondary)
    );

  await channel.send({ content: '📋 **Ticket Actions** (Admin/Manager only)', components: [row] });
};

/**
 * Post a public sell listing in the sell panel channel so buyers can see it
 */
const sendPublicSellListing = async (channel, sellItem, user, buttonName) => {
  const embed = new EmbedBuilder()
    .setColor('#F39C12')
    .setTitle(`💰 ${sellItem.item_name}`)
    .setDescription(sellItem.item_description || 'No description provided.')
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: '👤 Seller', value: `<@${user.id}>`, inline: true },
      { name: '🎫 Listing ID', value: `#${sellItem.sell_id}`, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: 'Click the button below to open a ticket with this seller' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`open_sell_ticket_${sellItem.sell_id}`)
        .setLabel(buttonName || '📩 Open Ticket')
        .setStyle(ButtonStyle.Primary)
    );

  await channel.send({ embeds: [embed], components: [row] });
};

/**
 * Full sell listing flow: creates item + ticket record + ticket channel + messages
 */
const createSellListing = async (userId, guildId, listingData, interaction) => {
  const { title, description, buttonName } = listingData;
  const guild = interaction.guild;
  const user = interaction.user;

  // Require at least one sell panel to be configured
  const panels = await getSellPanels(guildId);
  if (!panels || panels.length === 0) {
    throw new Error('No sell panels configured. Ask an admin to run `/createsellpanel` first.');
  }
  const panel = panels[0];

  // Create the sell item record
  const sellItem = await createSellItem(panel.panel_id, userId, guildId, {
    name: title,
    description: description,
    price: 0,
    quantity: 1
  });

  // Create the sell ticket record (price=0, uses notes to store button name)
  const ticket = await createSellTicket(sellItem.sell_id, userId, guildId, title, 0, 1);

  // Create the private ticket channel for the seller
  const channel = await createSellTicketChannel(guild, userId, sellItem);

  // Persist channel ID and button name to the ticket record
  await update('sell_tickets', { channel_id: channel.id, notes: buttonName }, { ticket_id: ticket.ticket_id });

  // Send the private ticket message (with admin action buttons)
  await sendSellTicketMessage(channel, sellItem, user, buttonName);

  // Also post a public listing in the panel channel (if configured)
  if (panel.channel_id) {
    try {
      const panelChannel = guild.channels.cache.get(panel.channel_id);
      if (panelChannel) {
        await sendPublicSellListing(panelChannel, sellItem, user, buttonName);
      }
    } catch (err) {
      console.error('Failed to post public sell listing in panel channel:', err);
    }
  }

  return { sellItem, ticket, channel };
};

/**
 * Close a sell ticket
 */
const closeSellTicket = async (interaction, ticketId) => {
  const channel = interaction.channel;
  
  // Send closing message
  const embed = new EmbedBuilder()
    .setColor('#ED4245')
    .setTitle('🔒 Sell Ticket Closed')
    .setDescription(`Sell ticket #${ticketId} has been closed.`)
    .setTimestamp()
    .setFooter({ text: 'Ticket System' });
  
  await channel.send({ embeds: [embed] });
  
  // Delete channel after 5 seconds
  setTimeout(async () => {
    await channel.delete();
  }, 5000);
  
  // Update database
  await update('sell_tickets', 
    { status: 'closed', reviewed_at: new Date() }, 
    { ticket_id: ticketId }
  );
};

/**
 * Approve a sell listing
 */
const approveSellListingWithChannel = async (interaction, sellId) => {
  const channel = interaction.channel;
  
  // Update database
  await update('sell_items', 
    { status: 'approved', approved_by: interaction.user.id, approved_at: new Date() }, 
    { sell_id: sellId }
  );
  
  await update('sell_tickets', 
    { status: 'approved', manager_id: interaction.user.id, reviewed_at: new Date() }, 
    { sell_id: sellId }
  );
  
  const embed = new EmbedBuilder()
    .setColor('#57F287')
    .setTitle('✅ Sell Listing Approved')
    .setDescription(`Sell ticket #${sellId} has been approved!`)
    .setTimestamp()
    .setFooter({ text: 'Sell System' });
  
  await channel.send({ embeds: [embed] });
};

/**
 * Reject a sell listing
 */
const rejectSellListingWithChannel = async (interaction, sellId, reason) => {
  const channel = interaction.channel;
  
  // Update database
  await update('sell_items', 
    { status: 'rejected', rejected_by: interaction.user.id, rejected_at: new Date(), rejection_reason: reason }, 
    { sell_id: sellId }
  );
  
  await update('sell_tickets', 
    { status: 'rejected', manager_id: interaction.user.id, reviewed_at: new Date(), notes: reason }, 
    { sell_id: sellId }
  );
  
  const embed = new EmbedBuilder()
    .setColor('#ED4245')
    .setTitle('❌ Sell Listing Rejected')
    .setDescription(`Sell ticket #${sellId} has been rejected.`)
    .addFields({ name: '📝 Reason', value: reason, inline: false })
    .setTimestamp()
    .setFooter({ text: 'Sell System' });
  
  await channel.send({ embeds: [embed] });
};

// ================ EXPORTS ================
module.exports = {
  // ... existing exports ...
  
  // Custom Invites
  createCustomInvite,
  getCustomInvite,
  incrementInviteUses,
  markInviteJoinInactive,
  getCustomInviteStats,
  getCustomInviteLeaderboard,
  getCustomInvitesByUser,
  
  // Core
  pool,
  initDatabase,
  query,
  getOne,
  getAll,
  insert,
  update,
  upsert,
  remove,
  
  // Economy
  getOrCreateCrystalEntry,
  getCrystals,
  addCrystals,
  removeCrystals,
  getCrystalStats,
  getCrystalLeaderboard,
  getUserCrystalRank,
  
  // Messages
  updateMessageCount,
  checkMessageMilestone,
  getMessageStats,
  getMessageLeaderboard,
  
  // Invites
  trackInvite,
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
  createSellTicket,
  getSellTickets,
  getSellTicketsByUser,
  approveSellItem,
  rejectSellItem,
  
  // Tickets
  getTicketConfig,
  updateTicketConfig,
  createTicket,
  getTicket,
  getTickets,
  claimTicket,
  closeTicket,
  reopenTicket,
  deleteTicket,
  addTicketMessage,
  getTicketMessages,
  createTranscript,
  assignManager,
  getTicketStats,
  
  // Moderation
  addWarning,
  getWarnings,
  getActiveWarningsCount,
  clearWarnings,
  addMute,
  removeMute,
  getActiveMutes,
  isUserMuted,
  logModerationAction,
  getModerationLogs,
  
  // AutoMod
  getAutoModSettings,
  updateAutoModSettings,
  logViolation,
  getBadWords,
  addBadWord,
  
  // Welcome/Leave
  getWelcomeSettings,
  updateWelcomeSettings,
  getLeaveSettings,
  updateLeaveSettings,
  
  // Logging
  getLoggingSettings,
  updateLoggingSettings,
  logAction,
  
  // Guild Members
  trackMemberJoin,
  trackMemberLeave,
  getMemberJoinInfo,
  getInviterForMember,
  upsertInviteStatsJoin,
  upsertInviteStatsLeave,
  
  // Backup
  generateBackupCode,
  createBackupRecord,
  storeBackupData,
  getBackupByCode,
  getBackupData,
  getBackupRecords,
  markBackupRestored,
  logRestore,
  deleteExpiredBackups,
  getBackupStats,
  
  // ... all existing exports ...
  
  // Purchase Ticket Channel Helpers
  createPurchaseTicketChannel,
  sendPurchaseTicketMessage,
  closePurchaseTicket,
  
  // Sell Ticket Channel Helpers
  createSellTicketChannel,
  sendSellTicketMessage,
  sendPublicSellListing,
  closeSellTicket,
  approveSellListingWithChannel,
  rejectSellListingWithChannel,

  // New orchestration function
  createSellListing,

  // Aliases matching what index.js imports
  createSellPanelCommand: createSellPanel,
  editSellPanelCommand: updateSellPanel,
  deleteSellPanelCommand: deleteSellPanel,
  getSellPanelsByGuild: getSellPanels,
  getSellListingsByGuild: getSellItems,
  getUserSellListings: getSellItemsByUser,
  approveSellListing: approveSellItem,
  rejectSellListing: rejectSellItem,
};