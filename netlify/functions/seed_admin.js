import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_SEED_KEY = process.env.ADMIN_SEED_KEY || null; // set this in Netlify to protect the endpoint

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function makeResponse(status, body, event, extraHeaders = {}) {
  const origin = (event && (event.headers?.origin || event.headers?.Origin)) || '*';
  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...extraHeaders
  };
  return { statusCode: status, headers, body: typeof body === 'string' ? body : JSON.stringify(body) };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return makeResponse(200, 'OK', event);
  if (event.httpMethod !== 'POST') return makeResponse(405, 'Method Not Allowed', event);

  try {
    const body = JSON.parse(event.body || '{}');
    const provided = body?.key || event.headers['x-admin-seed-key'];
    if (!ADMIN_SEED_KEY) return makeResponse(400, { error: 'ADMIN_SEED_KEY not configured on server' }, event);
    if (provided !== ADMIN_SEED_KEY) return makeResponse(403, { error: 'Forbidden' }, event);

    const adminEmail = body.email || 'administrador';
    const adminPass = body.password || 'adm2026';

    // check if exists
    const { data: existing } = await supabase.from('users').select('id').eq('email', adminEmail.toLowerCase()).maybeSingle();
    if (existing) return makeResponse(200, { ok: true, message: 'Admin already exists' }, event);

    const hash = await bcrypt.hash(adminPass, 10);
    const { data, error } = await supabase.from('users').insert([{ email: adminEmail.toLowerCase(), password: hash, role: 'admin' }]).select('id, email, role').maybeSingle();
    if (error) return makeResponse(500, { error: error.message }, event);

    return makeResponse(201, { user: data }, event);
  } catch (err) {
    return makeResponse(500, { error: err.message }, event);
  }
}
