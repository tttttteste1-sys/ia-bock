import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

    const hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert([{ email: email.toLowerCase(), password: hash }])
      .select('id, email, role')
      .single();

    if (error) return makeResponse(400, { error: error.message }, event);

    return makeResponse(201, { user: data }, event);
  } catch (err) {
    return makeResponse(500, { error: err.message }, event);
  }
}
