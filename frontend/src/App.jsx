import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { refreshToken } from './redux/slices/authSlice'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginForm from './components/auth/LoginForm'
import RegisterForm from './components/auth/RegisterForm'
import ChatLayout from './components/chat/ChatLayout'

function App() {
  const dispatch = useDispatch()
  const { isAuthenticated, loading } = useSelector(state => state.auth)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        await dispatch(refreshToken()).unwrap()
      } catch (error) {
        console.log('No valid session found')
      } finally {
        setIsInitializing(false)
      }
    }
    initAuth()
  }, [dispatch])

  // Show loading state while checking authentication
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        <Routes>
          <Route 
            path="/login" 
            element={
              !isAuthenticated ? (
                <LoginForm />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/register" 
            element={
              !isAuthenticated ? (
                <RegisterForm />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/*" 
            element={
              isAuthenticated ? (
                <ChatLayout />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
