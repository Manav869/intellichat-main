import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './redux/store'
import App from './App'
import './index.css'

// Add this line to see if the app is mounting
console.log('App is mounting');

// Note: React.StrictMode causes components to mount twice in development
// This helps detect side effects but may cause duplicate socket connections
// Consider removing StrictMode if you see multiple socket connections
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
)
