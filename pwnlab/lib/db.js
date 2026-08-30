import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

import * as adminModule from './supabase-admin.js';

const supabaseAdmin = adminModule.supabaseAdmin || adminModule.default || adminModule;
const isSupabaseConfigured = adminModule.isSupabaseConfigured || (() => Boolean(supabaseAdmin));

export async function query(sql, params = []) {
  if (!supabaseAdmin) {
    return { rows: [], rowCount: 0, error: { message: 'Supabase not configured' } };
  }

  const trimmed = sql.trim().replace(/\s+/g, ' ');
  const upper = trimmed.toUpperCase();

  try {
    if (upper.startsWith('SELECT')) {
      const result = await executeSelect(sql, params);
      return result;
    }

    if (upper.startsWith('INSERT')) {
      const result = await executeInsert(sql, params);
      return result;
    }

    if (upper.startsWith('UPDATE')) {
      const result = await executeUpdate(sql, params);
      return result;
    }

    if (upper.startsWith('DELETE')) {
      const result = await executeDelete(sql, params);
      return result;
    }

    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql, params });
    if (error) throw error;
    return { rows: data || [], rowCount: data?.length || 0 };
  } catch (error) {
    console.error('[DB] Query error:', error.message);
    return { rows: [], rowCount: 0, error };
  }
}

async function executeSelect(sql, params) {
  const fromMatch = sql.match(/FROM\s+(\w+)/i);
  if (!fromMatch) {
    throw new Error('Could not parse table from SELECT query');
  }
  const table = fromMatch[1];

  let q = supabaseAdmin.from(table);

  const selectMatch = sql.match(/SELECT\s+(.*?)\s+FROM/i);
  let columns = selectMatch ? selectMatch[1].trim() : '*';

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

  const whereMatch = sql.match(/WHERE\s+(.*?)(?:\s+ORDER|\s+LIMIT|\s+GROUP|\s+HAVING|\s*$)/i);
  if (whereMatch) {
    const whereClause = whereMatch[1];
    const paramIndices = [];
    const regex = /\$(\d+)/g;
    let match;
    while ((match = regex.exec(whereClause)) !== null) {
      paramIndices.push(parseInt(match[1]) - 1);
    }

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

export { supabaseAdmin, isSupabaseConfigured };
