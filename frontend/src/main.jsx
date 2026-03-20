import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Chat from './pages/Chat'
import Admin from './pages/Admin'
import './styles.css'

function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login/>} />
        <Route path="/register" element={<Register/>} />
        <Route path="/chat" element={<Protected><Chat/></Protected>} />
        <Route path="/admin" element={<Protected adminOnly><Admin/></Protected>} />
        <Route path="/" element={<Navigate to="/chat" />} />
      </Routes>
    </BrowserRouter>
  )
}

function Protected({ children, adminOnly }){
  const user = JSON.parse(localStorage.getItem('ia_bock_user') || 'null');
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/chat" />;
  return children;
}

createRoot(document.getElementById('root')).render(<App />)
