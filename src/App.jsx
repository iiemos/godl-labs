import React, { createContext, useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import {  useAccount, WagmiProvider, createConfig, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import CookieConsent from './components/CookieConsent.jsx'
import HomeView from './views/HomeView.jsx'
import StakeView from './views/StakeView.jsx'
import MintView from './views/MintView.jsx'
import SwapView from './views/SwapView.jsx'
import TeamView from './views/TeamView.jsx'
import MineView from './views/MineView.jsx'
import './i18n/index.js'
import { useEffect, useState } from 'react'
import Notification from './components/Notification.jsx'
import { USE_STATIC_DATA, MOCK_ADDRESS } from './config/mock.js'

// Create React Query client
const queryClient = new QueryClient()

// Create Notification Context
export const NotificationContext = createContext()
export const WalletVerificationContext = createContext()

// Custom hook for using notification context
export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}

export const useWalletVerification = () => {
  const context = useContext(WalletVerificationContext)
  if (!context) {
    throw new Error('useWalletVerification must be used within WalletVerificationProvider')
  }
  return context
}

// Mova网络配置 (来自Vue项目App.vue)
const movaChain = {
  id: parseInt(import.meta.env.VITE_MOVA_CHAIN_ID) || 61900,
  name: import.meta.env.VITE_NETWORK_NAME || 'Mova Mainnet',
  network: 'movachain',
  nativeCurrency: {
    name: import.meta.env.VITE_NATIVE_CURRENCY_NAME || 'MOV',
    symbol: import.meta.env.VITE_NATIVE_CURRENCY_SYMBOL || 'MOV',
    decimals: 18
  },
  rpcUrls: {
    public: { http: [import.meta.env.VITE_RPC_URL || 'https://rpc.movachain.com/'] },
    default: { http: [import.meta.env.VITE_RPC_URL || 'https://rpc.movachain.com/'] }
  },
  blockExplorers: {
    default: { name: 'Mova Explorer', url: import.meta.env.VITE_BLOCK_EXPLORER || 'https://explorer.movachain.com/' }
  }
}

// Create Wagmi config with Mova network
const config = createConfig({
  chains: [movaChain],
  connectors: [
    injected(),
  ],
  transports: {
    [movaChain.id]: http(import.meta.env.VITE_RPC_URL || 'https://rpc.movachain.com/'),
  },
})

function AppContent() {
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)
  const { address: walletAddress, isConnected: walletConnected } = useAccount()
  const address = USE_STATIC_DATA ? MOCK_ADDRESS : walletAddress
  const isConnected = USE_STATIC_DATA ? true : walletConnected
  const [isVerified, setIsVerified] = useState(USE_STATIC_DATA)
  const [notifications, setNotifications] = useState([])
  const [notificationId, setNotificationId] = useState(1)

  useEffect(() => {
    if (USE_STATIC_DATA) {
      setIsVerified(true)
      return
    }

    if (isConnected && address) {
      const verified = localStorage.getItem(`signature_verified_${address}`) === 'true'
      setIsVerified(verified)
    } else {
      setIsVerified(false)
    }
  }, [address, isConnected])

  const toggleMenu = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  // Add notification
  const addNotification = (type, message) => {
    const id = notificationId
    setNotificationId(id + 1)
    setNotifications(prev => [...prev, { id, type, message }])
  }

  // Remove notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(note => note.id !== id))
  }

  return (
    <WalletVerificationContext.Provider value={{ isVerified: USE_STATIC_DATA ? true : isVerified, setIsVerified }}>
      <NotificationContext.Provider value={{ addNotification }}>
        <div className="bg-background-light dark:bg-background-dark text-white min-h-screen">
          {/* 在除了首页之外的页面显示 Header */}
          {location.pathname !== '/' && <Header toggleMenu={toggleMenu} />}
          
          <div className="flex flex-col lg:flex-row h-screen overflow-hidden">
            {/* Sidebar Navigation */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            
            {/* Main Content Area */}
            <main className={`flex-1 flex flex-col overflow-y-auto ${location.pathname !== '/' ? 'pt-20 h-[calc(100vh-5rem)]' : ''}`}>
              <Routes>
                <Route path="/" element={<HomeView />} />
                <Route path="/stake" element={<StakeView />} />
                <Route path="/mint" element={<MintView />} />
                <Route path="/fuel-exchange" element={<Navigate to="/swap?tab=godl" replace />} />
                <Route path="/swap" element={<SwapView />} />
                <Route path="/governance-data" element={<TeamView />} />
                <Route path="/mine" element={<MineView />} />
              </Routes>
            </main>
          </div>
          
          {/* Global Cookie Consent Banner */}
          <CookieConsent />
          
          {/* Global Notification Component */}
          <Notification notifications={notifications} onClose={removeNotification} />
        </div>
      </NotificationContext.Provider>
    </WalletVerificationContext.Provider>
  )
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppContent />
        </Router>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
