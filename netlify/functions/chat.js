import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = process.env.NETLIFY_JWT_SECRET || 'change_this_secret';
const GLM_API_KEY = process.env.GLM_API_KEY;

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
    const cookies = parseCookieHeader(event.headers?.cookie || '');
    const token = cookies['ia_bock_token'];
    if (!token) return makeResponse(401, { error: 'Unauthorized' }, event);
    let user;
    try { user = jwt.verify(token, JWT_SECRET); } catch (e) { return makeResponse(401, { error: 'Invalid token' }, event); }

    const { conversation_id, message } = JSON.parse(event.body || '{}');
    if (!message) return makeResponse(400, { error: 'Missing message' }, event);

    // save user message
    let convId = conversation_id;
    if (!convId) {
      const { data: conv, error: convErr } = await supabase.from('conversations').insert([{ user_id: user.id || null, title: null }]).select('id').maybeSingle();
      if (convErr) return makeResponse(500, { error: convErr.message }, event);
      convId = conv.id;
    }

    await supabase.from('messages').insert([{ conversation_id: convId, role: 'user', content: message }]);

    // fetch recent messages for context
    const { data: messages } = await supabase.from('messages').select('role, content, created_at').eq('conversation_id', convId).order('created_at', { ascending: true }).limit(20);

    // build payload for GLM
    const promptMessages = messages.map(m => ({ role: m.role, content: m.content }));

    // call GLM API — replace endpoint with the real GLM provider URL in production
    const glmResponse = await fetch('https://api.glm.example/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GLM_API_KEY}`
      },
      body: JSON.stringify({
        model: 'glm-1',
        messages: [{ role: 'system', content: 'Você é IA BOCK, assistente útil e profissional.' }, ...promptMessages],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!glmResponse.ok) {
      const txt = await glmResponse.text();
      return makeResponse(502, { error: 'AI provider error', details: txt }, event);
    }

    const glmData = await glmResponse.json();
    // assume response structure
    const reply = glmData?.choices?.[0]?.message?.content || glmData?.result || 'Desculpe, sem resposta.';

    // save assistant message
    await supabase.from('messages').insert([{ conversation_id: convId, role: 'assistant', content: reply }]);

    return makeResponse(200, { conversation_id: convId, reply }, event);
  } catch (err) {
    return makeResponse(500, { error: err.message }, event);
  }
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
