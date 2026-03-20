import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login(){
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const navigate = useNavigate()

  const submit = async (e)=>{
    e.preventDefault()
    const res = await fetch('/.netlify/functions/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }), credentials: 'include' })
    const data = await res.json()
    if (res.ok) {
      // try to read cookie-less token via response body? server sets HttpOnly cookie. For convenience we also store a non-sensitive token in localStorage if returned
      // Some providers won't return token; login function sets cookie. We save basic user to localStorage for client checks.
      localStorage.setItem('ia_bock_user', JSON.stringify(data.user))
      // redirect
      if (data.user.role === 'admin' || email === 'administrador') navigate('/admin')
      else navigate('/chat')
    } else {
      alert(data.error || 'Erro')
    }
  }

  return (
    <div className="form">
      <h2>Entrar - IA BOCK</h2>
      <form onSubmit={submit}>
        <input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input placeholder="Senha" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <button className="btn" type="submit">Entrar</button>
      </form>
      <p style={{color:'#93a3b3'}}>Não tem conta? <span className="link" onClick={()=>navigate('/register')}>Registrar</span></p>
    </div>
  )
}
