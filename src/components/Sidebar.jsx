import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Icon } from '@iconify/react'

function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  
  // 在首页不显示侧边栏
  if (location.pathname === '/') {
    return null
  }
  
  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-72 flex-col bg-[#110d1a] border-r border-[#312447] p-6 justify-between top-16 lg:top-16 transform transition-transform duration-300 ease-in-out lg:pt-24 lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between flex-col h-full">
        <nav className="flex flex-col gap-2 w-full size-6">
          <Link
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${
              location.pathname === '/' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-[#a692c8] hover:text-white'
            }`}
            to="/"
            onClick={onClose}
          >
            <Icon icon="mdi:home-lightning-bolt" className='text-2xl' />
            <p className="text-xl font-bold">首页</p>
          </Link>
          <Link
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${
              location.pathname === '/swap' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-[#a692c8] hover:text-white'
            }`}
            to="/swap"
            onClick={onClose}
          >
            <Icon icon="mdi:account-balance-wallet" className='text-2xl' />
            <p className="text-xl font-medium">Swap</p>
          </Link>
          <Link
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${
              location.pathname === '/stake' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-[#a692c8] hover:text-white'
            }`}
            to="/stake"
            onClick={onClose}
          >
            <Icon icon="mdi:gavel" className='text-2xl' />
            <p className="text-xl font-medium">认购</p>
          </Link>
          <Link
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${
              location.pathname === '/mine' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-[#a692c8] hover:text-white'
            }`}
            to="/mine"
            onClick={onClose}
          >
            <Icon icon="mdi:chart-donut" className='text-2xl' />
            <p className="text-xl font-medium">农场/流动池</p>
          </Link>
          <Link
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${
              location.pathname === '/mint' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-[#a692c8] hover:text-white'
            }`}
            to="/mint"
            onClick={onClose}
          >
            <Icon icon="mdi:anvil" className='text-2xl' />
            <p className="text-xl font-medium">治理中心</p>
          </Link>
          <Link
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${
              location.pathname === '/governance-data' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-[#a692c8] hover:text-white'
            }`}
            to="/governance-data"
            onClick={onClose}
          >
            <Icon icon="mdi:database" className='text-2xl' />
            <p className="text-xl font-medium">治理数据</p>
          </Link>
          <a
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer text-[#a692c8] hover:text-white"
            href="/whitepaper/GODLLABS.pdf"
            target="_blank"
            rel="noreferrer"
            onClick={onClose}
          >
            <Icon icon="mdi:file-download" className='text-2xl' />
            <p className="text-xl font-medium">白皮书</p>
          </a>
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar
