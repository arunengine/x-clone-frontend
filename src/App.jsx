import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Signup from './pages/auth/Signup'
import Login from './pages/auth/Login'
import Home from './pages/home/Home'
import Profile from './pages/profile/Profile'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/profile/:username' element={<Profile />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='/login' element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
