import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// TODO: re-enable for production - Firebase auth
// import { AuthProvider } from './context/AuthContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            {/* TODO: re-enable for production - AuthProvider wrapper */}
            {/* <AuthProvider> */}
                <App />
            {/* </AuthProvider> */}
        </ErrorBoundary>
    </React.StrictMode>,
)
