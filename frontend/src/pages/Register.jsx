import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Register(){
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const navigate = useNavigate()

  const submit = async (e)=>{
    e.preventDefault()
    const res = await fetch('/.netlify/functions/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) })
    const data = await res.json()
    if (res.ok) {
      alert('Registrado com sucesso')
      navigate('/login')
    } else {
      alert(data.error || 'Erro')
    }
  }

  return (
    <div className="form">
      <h2>Registrar - IA BOCK</h2>
      <form onSubmit={submit}>
        <input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input placeholder="Senha" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <button className="btn" type="submit">Criar conta</button>
      </form>
      <p style={{color:'#93a3b3'}}>Já tem conta? <span className="link" onClick={()=>navigate('/login')}>Entrar</span></p>
    </div>
  )
}
