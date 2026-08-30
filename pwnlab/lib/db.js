require('dotenv').config({ path: '.env.local' });
const adminModule = require('./supabase-admin');
const supabaseAdmin = adminModule.supabaseAdmin || adminModule.default || adminModule;
const isSupabaseConfigured = adminModule.isSupabaseConfigured || (() => Boolean(supabaseAdmin));

/**
 * Supabase database adapter with backward-compatible query interface.
 *
 * For simple queries, continues to support:
 *   const result = await query('SELECT * FROM users WHERE id = $1', [1]);
 *   result.rows
 *   result.rowCount
 *
 * For advanced queries, use the Supabase builder directly:
 *   const { data, error } = await supabaseAdmin
 *     .from('users')
 *     .select('*')
 *     .eq('id', userId);
 */
async function query(sql, params = []) {
  if (!supabaseAdmin) {
    return { rows: [], rowCount: 0, error: { message: 'Supabase not configured' } };
  }

  const trimmed = sql.trim().replace(/\s+/g, ' ');
  const upper = trimmed.toUpperCase();

  try {
    // Handle SELECT queries
    if (upper.startsWith('SELECT')) {
      const result = await executeSelect(sql, params);
      return result;
    }

    // Handle INSERT queries
    if (upper.startsWith('INSERT')) {
      const result = await executeInsert(sql, params);
      return result;
    }

    // Handle UPDATE queries
    if (upper.startsWith('UPDATE')) {
      const result = await executeUpdate(sql, params);
      return result;
    }

    // Handle DELETE queries
    if (upper.startsWith('DELETE')) {
      const result = await executeDelete(sql, params);
      return result;
    }

    // For other queries, try raw SQL via rpc
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql, params });
    if (error) throw error;
    return { rows: data || [], rowCount: data?.length || 0 };
  } catch (error) {
    console.error('[DB] Query error:', error.message, 'SQL:', sql);
    return { rows: [], rowCount: 0, error };
  }
}

/**
 * Simple SQL parser for SELECT queries.
 * Supports: SELECT ... FROM table WHERE col = $N AND col = $N ...
 */
async function executeSelect(sql, params) {
  const fromMatch = sql.match(/FROM\s+(\w+)/i);
  if (!fromMatch) {
    throw new Error('Could not parse table from SELECT query');
  }
  const table = fromMatch[1];

  let q = supabaseAdmin.from(table);

  // Extract columns
  const selectMatch = sql.match(/SELECT\s+(.*?)\s+FROM/i);
  let columns = selectMatch ? selectMatch[1].trim() : '*';
  
  // Remove table aliases from column names (e.g., u.id -> id)
  if (columns !== '*') {
    columns = columns.split(',').map(col => {
      const trimmed = col.trim();
      const aliasMatch = trimmed.match(/(?:(\w+)\.)?(\w+)/);
      if (aliasMatch) {
        return aliasMatch[2];
      }
      return trimmed;
    }).join(', ');
  }
  
  if (columns !== '*') {
    q = q.select(columns);
  } else {
    q = q.select('*');
  }

  // Parse WHERE clauses
  const whereMatch = sql.match(/WHERE\s+(.*?)(?:\s+ORDER|\s+LIMIT|\s+GROUP|\s+HAVING|\s*$)/i);
  if (whereMatch) {
    const whereClause = whereMatch[1];
    const paramIndices = [];
    const regex = /\$(\d+)/g;
    let match;
    while ((match = regex.exec(whereClause)) !== null) {
      paramIndices.push(parseInt(match[1]) - 1);
    }

    // Split by AND/OR for simple conditions
    const conditions = whereClause.split(/\s+AND\s+/i);
    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i].trim();
      const eqMatch = condition.match(/(.+?)\s*=\s*\$(\d+)/i);
      if (eqMatch) {
        const col = eqMatch[1].trim();
        const paramIdx = parseInt(eqMatch[2]) - 1;
        if (paramIdx >= 0 && paramIdx < params.length) {
          q = q.eq(col, params[paramIdx]);
        }
      }
    }
  }

  const { data, error } = await q;

  if (error) throw error;
  return { rows: data || [], rowCount: data?.length || 0 };
}

async function executeInsert(sql, params) {
  const intoMatch = sql.match(/INTO\s+([\w.]+)\s*\(([^)]+)\)/i);
  if (!intoMatch) {
    throw new Error('Could not parse INSERT query');
  }
  const table = intoMatch[1];
  const columns = intoMatch[2].split(',').map(c => c.trim());

  const valuesMatch = sql.match(/VALUES\s*\(([^)]+)\)/i);
  if (!valuesMatch) {
    throw new Error('Could not parse INSERT values');
  }

  const row = {};
  const valueRegex = /\$(\d+)/g;
  const valueIndices = [];
  let m;
  while ((m = valueRegex.exec(valuesMatch[1])) !== null) {
    valueIndices.push(parseInt(m[1]) - 1);
  }

  columns.forEach((col, i) => {
    const paramIdx = valueIndices[i];
    if (paramIdx !== undefined && paramIdx >= 0 && paramIdx < params.length) {
      row[col] = params[paramIdx];
    }
  });

  const { data, error } = await supabaseAdmin
    .from(table)
    .insert(row)
    .select();

  if (error) throw error;
  return { rows: data || [], rowCount: data?.length || 0 };
}

async function executeUpdate(sql, params) {
  const tableMatch = sql.match(/UPDATE\s+(\w+)/i);
  if (!tableMatch) {
    throw new Error('Could not parse UPDATE query');
  }
  const table = tableMatch[1];

  const setMatch = sql.match(/SET\s+(.*?)\s+WHERE/i);
  if (!setMatch) {
    throw new Error('Could not parse UPDATE SET clause');
  }

  const updates = {};
  const setParts = setMatch[1].split(',');
  const paramRegex = /\$(\d+)/g;

  for (const part of setParts) {
    const trimmed = part.trim();
    const eqMatch = trimmed.match(/(\w+)\s*=\s*\$(\d+)/i);
    if (eqMatch) {
      const col = eqMatch[1];
      const paramIdx = parseInt(eqMatch[2]) - 1;
      if (paramIdx >= 0 && paramIdx < params.length) {
        updates[col] = params[paramIdx];
      }
    }
  }

  const whereMatch = sql.match(/WHERE\s+(.*?)(?:\s+RETURNING|\s*$)/i);
  let q = supabaseAdmin.from(table).update(updates);

  if (whereMatch) {
    const eqMatch = whereMatch[1].match(/(\w+)\s*=\s*\$(\d+)/i);
    if (eqMatch) {
      const col = eqMatch[1];
      const paramIdx = parseInt(eqMatch[2]) - 1;
      if (paramIdx >= 0 && paramIdx < params.length) {
        q = q.eq(col, params[paramIdx]);
      }
    }
  }

  const { data, error } = await q.select();

  if (error) throw error;
  return { rows: data || [], rowCount: data?.length || 0 };
}

async function executeDelete(sql, params) {
  const tableMatch = sql.match(/FROM\s+(\w+)/i);
  if (!tableMatch) {
    throw new Error('Could not parse DELETE query');
  }
  const table = tableMatch[1];

  const whereMatch = sql.match(/WHERE\s+(.*?)(?:\s+RETURNING|\s*$)/i);
  let q = supabaseAdmin.from(table).delete();

  if (whereMatch) {
    const eqMatch = whereMatch[1].match(/(\w+)\s*=\s*\$(\d+)/i);
    if (eqMatch) {
      const col = eqMatch[1];
      const paramIdx = parseInt(eqMatch[2]) - 1;
      if (paramIdx >= 0 && paramIdx < params.length) {
        q = q.eq(col, params[paramIdx]);
      }
    }
  }

  const { data, error } = await q.select();

  if (error) throw error;
  return { rows: data || [], rowCount: data?.length || 0 };
}

module.exports = { query, supabaseAdmin, isSupabaseConfigured };
