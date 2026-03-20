import React, { useEffect, useState, useRef } from 'react'

export default function Chat(){
  const [conversations, setConversations] = useState([])
  const [currentConv, setCurrentConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scroller = useRef()

  useEffect(()=>{ fetchConversations() }, [])

  async function fetchConversations(){
    const res = await fetch('/.netlify/functions/conversations', { credentials: 'include' })
    const data = await res.json()
    if (res.ok) setConversations(data.conversations)
  }

  async function openConv(id){
    setCurrentConv(id)
    const res = await fetch(`/.netlify/functions/messages?conversation_id=${id}`, { credentials: 'include' })
    const data = await res.json()
    if (res.ok) setMessages(data.messages)
  }

  async function send(){
    if (!input) return
    setLoading(true)
    // optimistic UI
    setMessages(prev => [...prev, { role:'user', content: input }])
    const body = { conversation_id: currentConv, message: input }
    const res = await fetch('/.netlify/functions/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body), credentials: 'include' })
    const data = await res.json()
    if (res.ok) {
      setMessages(prev => [...prev, { role:'assistant', content: data.reply }])
      setCurrentConv(data.conversation_id)
    } else {
      alert(data.error || 'Erro ao enviar')
    }
    setInput('')
    setLoading(false)
  }

  useEffect(()=>{ if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight }, [messages])

  return (
    <div className="app">
      <div className="sidebar">
        <h3>IA BOCK</h3>
        <button className="btn" onClick={()=>setCurrentConv(null)}>Nova Conversa</button>
        <hr />
        {conversations.map(c=> (
          <div key={c.id} style={{padding:'8px',cursor:'pointer',borderBottom:'1px solid rgba(255,255,255,0.03)'}} onClick={()=>openConv(c.id)}>
            {c.title || 'Sem título'}
          </div>
        ))}
      </div>
      <div className="main">
        <div className="header"><strong>{currentConv? 'Conversação' : 'Nova Conversa'}</strong></div>
        <div className="messages" ref={scroller}>
          {messages.map((m, idx)=> (
            <div key={idx} className={`message ${m.role}`}>
              <div>{m.content}</div>
            </div>
          ))}
          {loading && <div className="message assistant">IA BOCK está digitando...</div>}
        </div>
        <div className="input">
          <textarea value={input} onChange={(e)=>setInput(e.target.value)} rows={2} />
          <button className="btn" onClick={send} disabled={loading}>Enviar</button>
        </div>
      </div>
    </div>
  )
}
