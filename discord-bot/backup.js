// backup.js - Complete Backup & Restore System
const {
  // Database functions
  createBackupRecord,
  storeBackupData,
  getBackupByCode,
  getBackupData,
  getBackupRecords,
  markBackupRestored,
  logRestore,
  deleteExpiredBackups,
  getBackupStats,
  generateBackupCode,
  pool,
  query,
  getOne,
  getAll,
  insert,
  update,
  upsert,
  remove
} = require('./database.js');

const { successEmbed, errorEmbed, infoEmbed, customEmbed } = require('./embeds.js');

// ================ TABLES TO BACKUP ================

const BACKUP_TABLES = [
  'guild_settings',
  'welcome_settings',
  'leave_settings',
  'logging_settings',
  'ticket_config',
  'shop_items',
  'shop_categories',
  'sell_panels',
  'automod_settings',
  'bad_words',
  'whitelisted_links',
  'shop_items',
  'purchase_history',
  'sell_items'
];

const CORE_TABLES = [
  'crystal_economy',
  'economy_transactions',
  'message_counts',
  'message_milestones',
  'invite_tracking',
  'invite_joins',
  'invite_stats',
  'tickets',
  'ticket_messages',
  'ticket_transcripts',
  'ticket_actions',
  'purchase_history',
  'purchase_tickets',
  'sell_items',
  'sell_tickets',
  'warnings',
  'mutes',
  'moderation_logs',
  'automod_violations',
  'automod_user_violations',
  'log_entries',
  'guild_members'
];

// ================ BACKUP FUNCTIONS ================

/**
 * Collect all data from a table
 */
const collectTableData = async (tableName, guildId) => {
  try {
    const result = await query(
      `SELECT * FROM ${tableName} WHERE guild_id = $1;`,
      [guildId]
    );
    return result.rows;
  } catch (error) {
    console.error(`Failed to collect from ${tableName}:`, error.message);
    return [];
  }
};

/**
 * Collect all core data (user-specific)
 */
const collectCoreData = async (guildId) => {
  const data = {};
  
  for (const table of CORE_TABLES) {
    try {
      const result = await query(
        `SELECT * FROM ${table} WHERE guild_id = $1;`,
        [guildId]
      );
      data[table] = result.rows;
    } catch (error) {
      console.error(`Failed to collect from ${table}:`, error.message);
      data[table] = [];
    }
  }
  
  return data;
};

/**
 * Create a full backup
 */
const createFullBackup = async (guildId, userId) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Collect all configuration data
    const backupData = {};
    let totalSize = 0;
    let totalRecords = 0;
    
    for (const table of BACKUP_TABLES) {
      try {
        const result = await client.query(
          `SELECT * FROM ${table} WHERE guild_id = $1;`,
          [guildId]
        );
        backupData[table] = result.rows;
        totalSize += JSON.stringify(result.rows).length;
        totalRecords += result.rows.length;
      } catch (error) {
        console.error(`Failed to backup ${table}:`, error.message);
        backupData[table] = [];
      }
    }
    
    // Collect core data
    const coreData = await collectCoreData(guildId);
    backupData.core = coreData;
    totalSize += JSON.stringify(coreData).length;
    
    // Count core records
    for (const [table, rows] of Object.entries(coreData)) {
      totalRecords += rows.length;
    }
    
    // Add metadata
    backupData.metadata = {
      guildId: guildId,
      backupDate: new Date().toISOString(),
      version: '1.0',
      tables: BACKUP_TABLES.length + Object.keys(coreData).length,
      totalRecords: totalRecords,
      guildName: guildId // Will be updated if guild info available
    };
    
    // Create backup record
    const backup = await createBackupRecord(guildId, userId, totalSize);
    
    // Store backup data
    await storeBackupData(backup.backup_id, 'full_backup', backupData);
    
    await client.query('COMMIT');
    
    return {
      success: true,
      backup: backup,
      backupCode: backup.backup_code,
      totalRecords: totalRecords,
      totalSize: totalSize,
      message: `✅ Backup created successfully! Code: \`${backup.backup_code}\``
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Restore from backup
 */
const restoreFromBackup = async (backupCode, guildId, userId) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get backup record
    const backup = await getBackupByCode(backupCode);
    
    if (!backup) {
      throw new Error('Backup not found. Please check the code and try again.');
    }
    
    if (backup.guild_id !== guildId) {
      throw new Error('This backup belongs to a different server.');
    }
    
    if (backup.is_restored) {
      throw new Error('This backup has already been restored.');
    }
    
    if (new Date(backup.expires_at) < new Date()) {
      throw new Error('This backup has expired. Please create a new backup.');
    }
    
    // Get backup data
    const backupDataRows = await getBackupData(backup.backup_id);
    
    if (backupDataRows.length === 0) {
      throw new Error('Backup data not found.');
    }
    
    const fullBackup = backupDataRows[0].data;
    
    // Restore configuration tables
    let restoredCount = 0;
    const details = {};
    
    for (const table of BACKUP_TABLES) {
      if (fullBackup[table] && fullBackup[table].length > 0) {
        // Delete existing data for this guild
        await client.query(
          `DELETE FROM ${table} WHERE guild_id = $1;`,
          [guildId]
        );
        
        // Insert restored data
        for (const row of fullBackup[table]) {
          const columns = Object.keys(row);
          const values = Object.values(row);
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
          
          await client.query(
            `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders});`,
            values
          );
        }
        
        restoredCount += fullBackup[table].length;
        details[table] = fullBackup[table].length;
      }
    }
    
    // Restore core data (user-specific)
    if (fullBackup.core) {
      for (const [table, data] of Object.entries(fullBackup.core)) {
        if (data && data.length > 0) {
          // Delete existing data for this guild
          await client.query(
            `DELETE FROM ${table} WHERE guild_id = $1;`,
            [guildId]
          );
          
          // Insert restored data
          for (const row of data) {
            const columns = Object.keys(row);
            const values = Object.values(row);
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
            
            await client.query(
              `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders});`,
              values
            );
          }
          
          restoredCount += data.length;
          details[table] = data.length;
        }
      }
    }
    
    // Mark backup as restored
    await markBackupRestored(backup.backup_id, userId);
    
    // Log restore
    await logRestore(backup.backup_id, userId, {
      tablesRestored: Object.keys(details),
      totalRecords: restoredCount,
      timestamp: new Date().toISOString()
    });
    
    await client.query('COMMIT');
    
    return {
      success: true,
      backup: backup,
      restoredCount: restoredCount,
      details: details,
      message: `✅ Backup restored successfully! ${restoredCount} records restored.`
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * List all backups for a guild
 */
const listBackups = async (guildId) => {
  const backups = await getBackupRecords(guildId);
  const stats = await getBackupStats(guildId);
  
  // Format backups for display
  const formattedBackups = backups.map(backup => ({
    code: backup.backup_code,
    createdBy: backup.created_by,
    createdAt: backup.created_at,
    expiresAt: backup.expires_at,
    isRestored: backup.is_restored,
    restoredAt: backup.restored_at,
    restoredBy: backup.restored_by,
    dataSize: backup.data_size,
    version: backup.version,
    isExpired: new Date(backup.expires_at) < new Date(),
    isActive: !backup.is_restored && new Date(backup.expires_at) > new Date()
  }));
  
  return {
    backups: formattedBackups,
    stats: stats || { total_backups: 0, restored_backups: 0, active_backups: 0 },
    total: backups.length
  };
};

/**
 * Clean up expired backups
 */
const cleanupBackups = async () => {
  const deleted = await deleteExpiredBackups();
  return {
    success: true,
    deleted: deleted.length,
    message: `Cleaned up ${deleted.length} expired backups.`
  };
};

/**
 * Validate backup code format
 */
const isValidBackupCode = (code) => {
  const regex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return regex.test(code);
};

/**
 * Get backup details
 */
const getBackupDetails = async (backupCode) => {
  const backup = await getBackupByCode(backupCode);
  
  if (!backup) {
    throw new Error('Backup not found.');
  }
  
  const data = await getBackupData(backup.backup_id);
  const fullData = data[0]?.data || {};
  
  // Count total records
  let totalRecords = 0;
  for (const [key, value] of Object.entries(fullData)) {
    if (Array.isArray(value)) {
      totalRecords += value.length;
    }
  }
  
  return {
    backup: backup,
    data: fullData,
    tableCount: Object.keys(fullData).length,
    totalRecords: totalRecords,
    isExpired: new Date(backup.expires_at) < new Date(),
    isRestored: backup.is_restored
  };
};

/**
 * Get backup statistics for a guild
 */
const getBackupStatistics = async (guildId) => {
  const stats = await getBackupStats(guildId);
  const backups = await getBackupRecords(guildId, 5);
  
  return {
    stats: stats || { total_backups: 0, restored_backups: 0, active_backups: 0 },
    recentBackups: backups.map(b => ({
      code: b.backup_code,
      createdAt: b.created_at,
      isRestored: b.is_restored,
      isExpired: new Date(b.expires_at) < new Date()
    }))
  };
};

/**
 * Delete a specific backup by code
 */
const deleteBackupByCode = async (backupCode, guildId) => {
  const backup = await getBackupByCode(backupCode);
  
  if (!backup) {
    throw new Error('Backup not found.');
  }
  
  if (backup.guild_id !== guildId) {
    throw new Error('This backup belongs to a different server.');
  }
  
  if (backup.is_restored) {
    throw new Error('Cannot delete a backup that has already been restored.');
  }
  
  // Delete the backup record (cascade will delete related data)
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(
      `DELETE FROM backup_records WHERE backup_id = $1;`,
      [backup.backup_id]
    );
    
    await client.query('COMMIT');
    
    return {
      success: true,
      backupCode: backupCode,
      message: `✅ Backup \`${backupCode}\` has been deleted.`
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// ================ EXPORTS ================
module.exports = {
  // Core Functions
  createFullBackup,
  restoreFromBackup,
  listBackups,
  cleanupBackups,
  isValidBackupCode,
  getBackupDetails,
  getBackupStatistics,
  deleteBackupByCode,
  
  // Table Lists
  BACKUP_TABLES,
  CORE_TABLES,
  
  // Helper Functions
  collectTableData,
  collectCoreData
};