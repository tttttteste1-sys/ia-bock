import React, { useEffect, useState } from 'react'

export default function Admin(){
  const [users, setUsers] = useState([])
  const [convs, setConvs] = useState([])

  useEffect(()=>{ fetchAll() }, [])

  async function fetchAll(){
    const res1 = await fetch('/.netlify/functions/conversations', { credentials: 'include' })
    const d1 = await res1.json()
    if (res1.ok) setConvs(d1.conversations)

    // fetch users via Supabase directly is not available in client; ideally there is a function to list users. For now admin can see convs and messages.
  }

  async function viewMessages(id){
    const res = await fetch(`/.netlify/functions/messages?conversation_id=${id}`)
    const d = await res.json()
    if (res.ok) alert(JSON.stringify(d.messages, null, 2))
  }

  async function deleteConv(id){
    if (!confirm('Confirmar exclusão?')) return
    const res = await fetch('/.netlify/functions/conversations', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) })
    const d = await res.json()
    if (res.ok) fetchAll(); else alert(d.error)
  }

  return (
    <div style={{padding:20}}>
      <h2>Painel Admin - IA BOCK</h2>
      <h3>Conversas</h3>
      <table style={{width:'100%',background:'#071017'}}>
        <thead><tr><th>ID</th><th>User</th><th>Data</th><th>Ações</th></tr></thead>
        <tbody>
        {convs.map(c=> (
          <tr key={c.id} style={{borderTop:'1px solid rgba(255,255,255,0.03)'}}>
            <td>{c.id}</td>
            <td>{c.user_id}</td>
            <td>{new Date(c.created_at).toLocaleString()}</td>
            <td>
              <button className="btn" onClick={()=>viewMessages(c.id)}>Ver mensagens</button>
              <button style={{marginLeft:8}} onClick={()=>deleteConv(c.id)}>Excluir</button>
            </td>
          </tr>
        ))}
        </tbody>
      </table>
    </div>
  )
}
