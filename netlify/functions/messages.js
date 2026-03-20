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
    const convId = event.queryStringParameters?.conversation_id;
    if (!convId) return makeResponse(400, { error: 'Missing conversation_id' }, event);

    // check ownership unless admin
    if (user.role !== 'admin') {
      const { data: conv } = await supabase.from('conversations').select('user_id').eq('id', convId).maybeSingle();
      if (!conv || conv.user_id !== user.id) return makeResponse(403, { error: 'Forbidden' }, event);
    }

    const { data, error } = await supabase.from('messages').select('id, role, content, created_at').eq('conversation_id', convId).order('created_at', { ascending: true });
    if (error) return makeResponse(500, { error: error.message }, event);
    return makeResponse(200, { messages: data }, event);
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
