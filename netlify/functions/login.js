import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
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
  if (event.httpMethod !== 'POST') return makeResponse(405, 'Method Not Allowed', event);

  try {
    const { email, password } = JSON.parse(event.body || '{}');
    if (!email || !password) return makeResponse(400, { error: 'Missing fields' }, event);

    const { data, error } = await supabase.from('users').select('id, email, password, role').eq('email', email.toLowerCase()).maybeSingle();
    if (error) return makeResponse(500, { error: error.message }, event);
    if (!data) return makeResponse(401, { error: 'Invalid credentials' }, event);

    const match = await bcrypt.compare(password, data.password);
    if (!match) return makeResponse(401, { error: 'Invalid credentials' }, event);

    const token = jwt.sign({ id: data.id, email: data.email, role: data.role }, JWT_SECRET, { expiresIn: '7d' });

    const cookie = `ia_bock_token=${token}; HttpOnly; Path=/;${process.env.NODE_ENV === 'production' ? ' Secure;' : ''} SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`;

    return makeResponse(200, { user: { id: data.id, email: data.email, role: data.role } }, event, { 'Set-Cookie': cookie });
  } catch (err) {
    return makeResponse(500, { error: err.message }, event);
  }
}
