import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = process.env.NETLIFY_JWT_SECRET || 'change_this_secret';

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

  const cookies = parseCookieHeader(event.headers?.cookie || '');
  const token = cookies['ia_bock_token'];
  if (!token) return makeResponse(401, { error: 'Unauthorized' }, event);
  let user;
  try { user = jwt.verify(token, JWT_SECRET); } catch (e) { return makeResponse(401, { error: 'Invalid token' }, event); }

  if (event.httpMethod === 'GET') {
    // list conversations for user (admin can see all)
    let q = supabase.from('conversations').select('id, title, created_at, user_id');
    if (user.role !== 'admin') q = q.eq('user_id', user.id);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) return makeResponse(500, { error: error.message }, event);
    return makeResponse(200, { conversations: data }, event);
  }

  if (event.httpMethod === 'DELETE') {
    // delete conversation (admin can delete any)
    const { id } = JSON.parse(event.body || '{}');
    if (!id) return makeResponse(400, { error: 'Missing id' }, event);
    // check ownership
    if (user.role !== 'admin') {
      const { data: conv } = await supabase.from('conversations').select('user_id').eq('id', id).maybeSingle();
      if (!conv || conv.user_id !== user.id) return makeResponse(403, { error: 'Forbidden' }, event);
    }
    const { error } = await supabase.from('conversations').delete().eq('id', id);
    if (error) return makeResponse(500, { error: error.message }, event);
    return makeResponse(200, { success: true }, event);
  }

  return makeResponse(405, 'Method Not Allowed', event);
}

function parseCookieHeader(header) {
  const obj = {};
  header.split(';').forEach(pair => {
    const [k,v] = pair.split('=');
    if (!k) return;
    obj[k.trim()] = decodeURIComponent((v||'').trim());
  });
  return obj;
}
