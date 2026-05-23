import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import './styles/index.css'

const storedTheme = window.localStorage.getItem('fuelwatch-theme')
const initialTheme = storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'dark'
document.documentElement.classList.remove('light', 'dark')
document.documentElement.classList.add(initialTheme)
document.documentElement.style.colorScheme = initialTheme

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
