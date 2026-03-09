import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useAccount } from 'wagmi'
import WalletConnect from '../components/WalletConnect.jsx';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/index.js';
import { useWalletVerification } from '../App.jsx';
import { MOCK_ADDRESS, USE_STATIC_DATA } from '../config/mock.js';
import { 
  fetchGlobalStakeStats, 
  fetchDateStakeStats,
  fetchUserInfo, 
  formatWei 
} from '../api/index.js'

function HomeView() {
  const { address: walletAddress, isConnected: walletConnected } = useAccount()
  const address = USE_STATIC_DATA ? MOCK_ADDRESS : walletAddress
  const isConnected = USE_STATIC_DATA ? true : walletConnected
  const { t } = useTranslation()
  const { isVerified: walletVerified } = useWalletVerification()
  const isVerified = USE_STATIC_DATA ? true : walletVerified

  const homeCopy = {
    heroTitle: 'GODL LABS',
    heroSubtitle: '由稳定币 USGD、黄金锚定币 GODL 与治理代币 GDL 组成的 RWA 资产平台。',
    networkHint: 'USGD / GODL / GDL 多资产协同网络',
    globalStatsTitle: '全网认购规模',
    userCountTitle: '用户数',
    tvlTitle: '总锁仓量 TVL',
    dailyStakeTitle: '当日认购额',
    performanceTitle: '个人累计认购',
    assetsTitle: '核心资产模型',
    assetsSubtitle: '基金以坦桑尼亚核心矿产资产基地为底层，依托经 Geological and Mineral Resource Consulting Services 勘探鉴证、坦桑尼亚矿业委员会（TMC）备案确认的 100 万盎司（约 31.1035 吨）黄金储备，并完成数字化确权与链上存证，对应 10 亿美金授权开采量。',
    viewModules: '查看认购模块',
    moduleOneTag: 'USGD',
    moduleOneTitle: '稳定币层',
    moduleOneDesc: 'USGD 与 USDT 在流动性池保持 1:1，作为平台认购与结算基础资产。',
    moduleOneMetricA: '锚定关系',
    moduleOneMetricAValue: 'USGD = USDT',
    moduleOneMetricB: '应用场景',
    moduleOneMetricBValue: '入金与基金认购',
    moduleTwoTag: 'GODL',
    moduleTwoTitle: '黄金锚定层',
    moduleTwoDesc: 'GODL 映射黄金基金份额价值，基金收益主要来自合法合规矿权区域的金矿开采，为生态提供长期、稳定的实体收益来源。',
    moduleTwoMetricA: '初始发行',
    moduleTwoMetricAValue: '160,000 GODL',
    moduleTwoMetricB: '锚定价值',
    moduleTwoMetricBValue: '5 亿美金黄金基金',
    ctaTitle: '进入认购',
    ctaSubtitle: '支持 3 / 6 / 12 个月认购周期，收益线性释放，附加 GDL 激励。',
    ctaButton: '立即认购',
    footerBrand: 'Godl.io',
    footerDesc: '以链上透明机制连接稳定资产、黄金锚定资产与治理价值。',
    protocolTitle: '协议模块',
    protocolItem1: 'USDT ↔ USGD 兑换',
    protocolItem2: 'USGD ↔ GODL 兑换',
    protocolItem3: '认购',
    protocolItem4: 'GDL 农场/流动池',
    companyTitle: '联系方式',
    companyItem1: 'X',
    companyItem2: 'Telegram',
    companyItem3: 'Medium',
    newsletterTitle: '项目更新',
    newsletterDesc: '订阅 Godl.io 动态，获取认购、挖矿与治理进展。',
  }

  const partnerLogos = [
    { name: 'Vanuatu', icon: 'flagpack:vu' },
    { name: '印尼AG集团', logo: '/friends/ag.png' },
    { name: 'BitGo', logo: '/friends/bitgo.png' },
    { name: 'Hex Trust', logo: '/friends/hextrust.svg' },
    { name: '币安', logo: '/friends/binance.png' },
    { name: 'Coinbase', logo: '/friends/coinbase.png' },
  ]
  
  // Global staking stats
  const [globalStats, setGlobalStats] = useState({
    currentStake: '0',
    stake30d: '0',
    stake1d: '0',
    loading: true
  })
  
  // Date stake stats
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [dateStats, setDateStats] = useState({
    total_stake: '0',
    stake_1d: '0',
    stake_30d: '0',
    total_unstake: '0',
    unstake_1d: '0',
    unstake_30d: '0',
    loading: true
  })
  
  // User info
  const [userInfo, setUserInfo] = useState(null)
  const [userLoading, setUserLoading] = useState(false)
  
  // Mobile menu toggle
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Language menu toggle
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)
  const languageMenuRef = useRef(null)
  
  // Languages - Only show English and Chinese
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'zh-hant', name: "繁體中文" },
    { code: 'ja', name: "日本語" },
    { code: 'ko', name: "한국어" },
    { code: 'pl', name: "Polski" },
    { code: 'vi', name: "Tiếng Việt" },
    { code: 'th', name: "ไทย" },
  ]
  
  // Handle language change
  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('i18nextLng', lang);
    setIsLanguageMenuOpen(false)
  }
  
  // Handle date change
  const handleDateChange = (e) => {
    const newDate = e.target.value
    setSelectedDate(newDate)
    loadDateStakeStats(newDate)
  }

  // Load date stake stats
  const loadDateStakeStats = async (date) => {
    if (!date || !isVerified) return
    try {
      setDateStats(prev => ({ ...prev, loading: true }))
      const res = await fetchDateStakeStats(date)
      if (res && res.success) {
        setDateStats({
          total_stake: res.stake_data?.total_stake || '0',
          stake_1d: res.stake_data?.stake_1d || '0',
          stake_30d: res.stake_data?.stake_30d || '0',
          total_unstake: res.unstake_data?.total_unstake || '0',
          unstake_1d: res.unstake_data?.unstake_1d || '0',
          unstake_30d: res.unstake_data?.unstake_30d || '0',
          loading: false
        })
      } else {
        setDateStats(prev => ({ ...prev, loading: false }))
      }
    } catch (e) {
      setDateStats(prev => ({ ...prev, loading: false }))
    }
  }

  // Close language menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
        setIsLanguageMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Load date stake stats when date changes
  useEffect(() => {
    if (selectedDate && isVerified) {
      loadDateStakeStats(selectedDate)
    } else if (!isVerified) {
      setDateStats({
        total_stake: '0',
        stake_1d: '0',
        stake_30d: '0',
        total_unstake: '0',
        unstake_1d: '0',
        unstake_30d: '0',
        loading: false
      })
    }
  }, [selectedDate, isVerified])

  // Fetch global stats
  useEffect(() => {
    let mounted = true
    async function loadGlobalStats() {
      if (!isVerified) {
        if (mounted) {
          setGlobalStats({
            currentStake: '0',
            stake30d: '0',
            stake1d: '0',
            loading: false
          })
        }
        return
      }
      try {
        const res = await fetchGlobalStakeStats()
        if (mounted && res && res.success) {
          setGlobalStats({
            currentStake: res.current_stake || '0',
            stake30d: res.stake_30d || '0',
            stake1d: res.stake_1d || '0',
            loading: false
          })
        } else {
          setGlobalStats(prev => ({ ...prev, loading: false }))
        }
      } catch (e) {
        if (mounted) setGlobalStats(prev => ({ ...prev, loading: false }))
      }
    }
    loadGlobalStats()
    return () => { mounted = false }
  }, [isVerified])

  // Fetch user info when wallet connected
  useEffect(() => {
    let mounted = true
    async function loadUserInfo() {
      if (!isConnected || !address || !isVerified) {
        setUserInfo(null)
        return
      }
      setUserLoading(true)
      try {
        const res = await fetchUserInfo(address)
        if (mounted && res && res.success) {
          setUserInfo(res)
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setUserLoading(false)
      }
    }
    loadUserInfo()
    return () => { mounted = false }
  }, [address, isConnected, isVerified])
  

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-drift"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-blue/10 blur-[120px] rounded-full animate-drift" style={{ animationDelay: '-5s' }}></div>
        <div className="absolute inset-0 grid-bg animate-drift opacity-30" style={{ animationDuration: '30s' }}></div>
      </div>
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-header">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          <button
              className="md:hidden text-white " 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Icon icon={isMobileMenuOpen ? "mdi:close" : "mdi:menu"} className="text-3xl" />
          </button>
          <div className="flex items-center gap-2">
            {/* <img src="/img/coin.png" alt="GODL LABS Logo" className="size-12" /> */}
            <h2 className="text-xl font-extrabold tracking-tight text-white">
              Godl.<span className="text-primary">io</span>
            </h2>
          </div>
          

          
          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-10">
            <Link className="text-sm font-medium hover:text-primary transition-colors" to="/">首页</Link>
            <Link className="text-sm font-medium hover:text-primary transition-colors" to="/swap">Swap</Link>
            <Link className="text-sm font-medium hover:text-primary transition-colors" to="/stake">认购</Link>
            <Link className="text-sm font-medium hover:text-primary transition-colors" to="/mine">农场/流动池</Link>
            <Link className="text-sm font-medium hover:text-primary transition-colors" to="/governance-data">治理数据</Link>
            <a className="text-sm font-medium hover:text-primary transition-colors" href="/whitepaper/GODLLABS.pdf" target="_blank" rel="noreferrer">白皮书</a>
          </nav>
          
          {/* Wallet connect */}
          <div className="flex items-center gap-4">
            <WalletConnect />
            <div className="relative" ref={languageMenuRef}>
              <button 
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
              >
                <Icon icon="mdi:earth" className="text-3xl" />
              </button>
              {isLanguageMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 animate-fade-in">
                  <div className="py-2">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        className={`w-full text-left px-4 py-2 hover:bg-white/10 transition-colors ${i18n.language === lang.code ? 'bg-white/10 font-medium' : ''}`}
                        onClick={() => handleLanguageChange(lang.code)}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-background-dark/95 backdrop-blur-lg border-t border-white/5">
            <nav className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-2">
              <Link className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer text-2xl font-medium hover:text-primary" to="/" onClick={() => setIsMobileMenuOpen(false)}>
                <Icon icon="mdi:home-lightning-bolt" />
                <p className="text-xl font-medium">首页</p>
              </Link>
              <Link className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer text-2xl font-medium hover:text-primary" to="/swap" onClick={() => setIsMobileMenuOpen(false)}>
                <Icon icon="mdi:account-balance-wallet" />
                <p className="text-xl font-medium">Swap</p>
              </Link>
              <Link className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer text-2xl font-medium hover:text-primary" to="/stake" onClick={() => setIsMobileMenuOpen(false)}>
                <Icon icon="mdi:gavel" />
                <p className="text-xl font-medium">认购</p>
              </Link>
              <Link className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer text-2xl font-medium hover:text-primary" to="/mine" onClick={() => setIsMobileMenuOpen(false)}>
                <Icon icon="mdi:chart-donut" />
                <p className="text-xl font-medium">农场/流动池</p>
              </Link>
              <Link className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer text-2xl font-medium hover:text-primary" to="/governance-data" onClick={() => setIsMobileMenuOpen(false)}>
                <Icon icon="mdi:database" />
                <p className="text-xl font-medium">治理数据</p>
              </Link>
              <a
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer text-2xl font-medium hover:text-primary"
                href="/whitepaper/GODLLABS.pdf"
                target="_blank"
                rel="noreferrer"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon icon="mdi:file-download" />
                <p className="text-xl font-medium">白皮书</p>
              </a>
            </nav>
          </div>
        )}
      </header>
      
      {/* Hero Section */}
      <main className="pt-20">
        <section className="relative min-h-[85vh] flex items-center justify-center px-6 hero-gradient overflow-hidden">
          <div className="max-w-5xl w-full flex flex-col items-center text-center z-10">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
              {homeCopy.heroTitle}
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mb-10 font-normal leading-relaxed">
              {homeCopy.heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
              <Link className="w-full sm:w-auto px-20 py-4 rounded-xl bg-primary text-white font-bold text-lg shadow-xl shadow-primary/40 hover:translate-y-[-4px] transition-all" to="/stake">
                进入认购
              </Link>
              <a
                className="w-full sm:w-auto px-20 py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 font-bold text-lg transition-all backdrop-blur-sm"
                href="/whitepaper/GODLLABS.pdf"
                target="_blank"
                rel="noreferrer"
              >
                查看白皮书
              </a>
            </div>
            {/* Hero Animation */}
            <div className="relative w-full max-w-3xl aspect-[16/9] rounded-3xl overflow-hidden border border-white/10 bg-slate-900/40 backdrop-blur-md animate-float">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-72 h-72 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-[2px] border-primary/30 animate-rotate-slow"></div>
                  <div className="absolute inset-8 rounded-full border-[1px] border-accent-blue/20 animate-rotate-reverse"></div>
                  <div className="absolute inset-16 rounded-full border-[3px] border-dashed border-primary/10 animate-rotate-slow" style={{ animationDuration: '20s' }}></div>
                  <div className="absolute inset-20 rounded-full bg-gradient-to-br from-primary to-accent-blue opacity-30 blur-3xl animate-breathing"></div>
                  <div className="relative z-10 flex items-center justify-center w-24 h-24 rounded-full bg-slate-900/80 border border-white/10 shadow-2xl">
                    <img src="/img/coin.png" alt="Godl.io Logo" />
                  </div>
                  <div className="absolute top-0 left-1/2 size-2 bg-primary rounded-full blur-[1px] animate-pulse"></div>
                  <div className="absolute bottom-10 right-10 size-3 bg-accent-blue rounded-full blur-[2px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                  <div className="absolute top-20 left-10 size-2 bg-white rounded-full blur-[1px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-between items-end">
                <div className="text-left">
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">{t('common.networkStatus')}</p>
                  <p className="text-sm font-medium text-white">{homeCopy.networkHint}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* API Live Data */}
        <section className="py-6 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-xl border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon icon="mdi:cloud" className="text-primary text-3xl" />
                <span className="font-bold">{homeCopy.globalStatsTitle}</span>
              </div>
              <div className="text-sm text-white/70">
                {globalStats.loading ? t('common.loading') : `${t('common.total')}: ${formatWei(globalStats.currentStake)} USGD`}
              </div>
            </div>
            <div className="glass-panel p-6 rounded-xl border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon icon="mdi:account-group" className="text-primary text-3xl" />
                <span className="font-bold">{homeCopy.userCountTitle}</span>
              </div>
              <span className="text-sm text-white/70">880K</span>
            </div>
          </div>
        </section>
        

        {/* Stats Section */}
        <section className="py-20 px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glow-card p-8 rounded-xl flex flex-col gap-3 animate-breathing">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">{homeCopy.tvlTitle}</p>
                <Icon icon="solar:wallet-bold" className="text-primary text-3xl" />
              </div>
              <p className="text-4xl font-bold tracking-tight">
                {globalStats.loading ? '...' : `$${formatWei(globalStats.currentStake, 0)}`}
              </p>
              <div className="flex items-center gap-2 text-[#0bda6f] text-sm font-bold">
                <Icon icon="mdi:trending-up" className="text-sm size-6" />
              </div>
            </div>
            <div className="glow-card p-8 rounded-xl flex flex-col gap-3 animate-breathing" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">{homeCopy.dailyStakeTitle}</p>
                <Icon icon="lsicon:lightning-filled" className="text-accent-blue text-3xl" />
              </div>
              <p className="text-4xl font-bold tracking-tight">
                {dateStats.loading ? '...' : `$${formatWei(dateStats.total_stake, 0)}`}
              </p>
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                当日认购快照 ({selectedDate})
                {/* <div className="flex items-center gap-4">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-primary focus:ring-0 focus:outline-none transition-all"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div> */}
              </div>
            </div>
            <div className="glow-card p-8 rounded-xl flex flex-col gap-3 animate-breathing" style={{ animationDelay: '1s' }}>
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">{homeCopy.performanceTitle}</p>
                <Icon icon="mdi:chart-line" className="text-purple-400 text-3xl" />
              </div>
              <p className="text-4xl font-bold tracking-tight">
                {!isConnected ? 'N/A' : userLoading ? '...' : `$${formatWei(userInfo?.personal_performance || '0', 0)}`}
              </p>
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                {isConnected ? '仅展示个人数据' : t('common.connectWalletToView')}
              </div>
            </div>
          </div>
        </section>
        
        {/* Assets Section */}
        <section className="py-20 px-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="max-w-xl">
              <h2 className="text-3xl font-bold mb-4">{homeCopy.assetsTitle}</h2>
              <p className="text-slate-400 leading-relaxed">{homeCopy.assetsSubtitle}</p>
            </div>
            <Link className="group flex items-center gap-2 text-primary font-bold transition-all hover:pr-2" to="/stake">
              {homeCopy.viewModules}
              <Icon icon="mdi:arrow-forward" className="group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="token-card p-8 rounded-2xl border border-white/5 flex items-center gap-6 group animate-figure-eight">
              <div className="size-20 rounded-full bg-slate-800 flex items-center justify-center p-4 border border-white/10 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-500">
                <div className="size-full rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg">
                  <img src="/img/usdt.svg" alt="" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-500 text-[20px] font-bold uppercase">{homeCopy.moduleOneTag}</span>
                  <h3 className="text-xl font-bold">{homeCopy.moduleOneTitle}</h3>
              </div>
              <p className="text-slate-400 text-sm mb-4 leading-snug">{homeCopy.moduleOneDesc}</p>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">{homeCopy.moduleOneMetricA}</p>
                  <p className="text-lg font-bold text-white">{homeCopy.moduleOneMetricAValue}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">{homeCopy.moduleOneMetricB}</p>
                  <p className="text-lg font-bold text-white">{homeCopy.moduleOneMetricBValue}</p>
                </div>
              </div>
              </div>
            </div>
            <div className="token-card p-8 rounded-2xl border border-white/5 flex items-center gap-6 group animate-figure-eight" style={{ animationDelay: '-2s' }}>
              <div className="size-20 rounded-full bg-slate-800 flex items-center justify-center p-4 border border-white/10 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(124,59,237,0.3)] transition-all duration-500">
                <div className="size-full rounded-full flex items-center justify-center shadow-lg">
                  <img src="/img/usdt.svg" alt="" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[20px] font-bold uppercase">{homeCopy.moduleTwoTag}</span>
                  <h3 className="text-xl font-bold">{homeCopy.moduleTwoTitle}</h3>
              </div>
              <p className="text-slate-400 text-sm mb-4 leading-snug">{homeCopy.moduleTwoDesc}</p>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">{homeCopy.moduleTwoMetricA}</p>
                  <p className="text-lg font-bold text-white">{homeCopy.moduleTwoMetricAValue}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">{homeCopy.moduleTwoMetricB}</p>
                  <p className="text-lg font-bold text-white">{homeCopy.moduleTwoMetricBValue}</p>
                </div>
              </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto rounded-3xl bg-gradient-to-br from-primary to-accent-blue p-1px">
            <div className="bg-background-dark/90 rounded-[calc(1.5rem-1px)] p-12 md:p-20 text-center relative ">
              <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 blur-[100px] rounded-full animate-drift"></div>
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent-blue/20 blur-[100px] rounded-full animate-drift" style={{ animationDelay: '-3s' }}></div>
              <div className="relative z-10 max-w-2xl mx-auto">
                <h2 className="text-4xl font-bold mb-6">{homeCopy.ctaTitle}</h2>
                <p className="text-slate-400 mb-10 text-lg">{homeCopy.ctaSubtitle}</p>
                <Link className="bg-white text-background-dark font-bold px-10 py-4 rounded-xl text-lg hover:bg-slate-200 hover:scale-105 transition-all shadow-xl" to="/stake">
                  {homeCopy.ctaButton}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 max-w-7xl mx-auto" id="team">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">The Architects of Yield</h2>
            <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed text-lg">A team of seasoned veterans bridging the gap between traditional finance and the decentralized future.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glow-card p-8 rounded-2xl flex flex-col items-center text-center group animate-breathing">
              <div className="size-32 rounded-full mb-6 p-1 bg-gradient-to-tr from-primary to-accent-blue relative">
                <div className="size-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                  <Icon icon="material-symbols:person-rounded" className="text-5xl text-primary/80 group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="absolute -bottom-1 -right-1 size-8 bg-primary rounded-full flex items-center justify-center border-4 border-background-dark">
                  <Icon icon="material-symbols:verified-rounded" className="text-white text-xs" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-1">Ethan Caldwell</h3>
              <p className="text-primary font-bold text-sm uppercase tracking-widest mb-4">Founder &amp; CEO</p>
              <p className="text-slate-400 text-sm leading-relaxed">10+ years of experience in precious metals supply chain and asset management. Managed a $50M+ portfolio in traditional finance markets. Early Bitcoin adopter since 2015; RWA strategic visionary.</p>
            </div>
            <div className="glow-card p-8 rounded-2xl flex flex-col items-center text-center group animate-breathing" style={{ animationDelay: '0.5s' }}>
              <div className="size-32 rounded-full mb-6 p-1 bg-gradient-to-tr from-accent-blue to-primary relative">
                <div className="size-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                  <Icon icon="material-symbols:terminal-rounded" className="text-5xl text-accent-blue/80 group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="absolute -bottom-1 -right-1 size-8 bg-accent-blue rounded-full flex items-center justify-center border-4 border-background-dark">
                  <Icon icon="material-symbols:code-rounded" className="text-white text-xs" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-1">Viktor Kova</h3>
              <p className="text-accent-blue font-bold text-sm uppercase tracking-widest mb-4">CTO / Lead Architect</p>
              <p className="text-slate-400 text-sm leading-relaxed">Full-stack Web3 developer specializing in Solidity and Rust. Former Senior Engineer at Top Tech Co/Protocol. Led the development of secure smart contracts with zero security incidents.</p>
            </div>
            <div className="glow-card p-8 rounded-2xl flex flex-col items-center text-center group animate-breathing" style={{ animationDelay: '1s' }}>
              <div className="size-32 rounded-full mb-6 p-1 bg-gradient-to-tr from-purple-500 to-accent-blue relative">
                <div className="size-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                  <Icon icon="material-symbols:rocket-launch-rounded" className="text-5xl text-purple-400/80 group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="absolute -bottom-1 -right-1 size-8 bg-purple-500 rounded-full flex items-center justify-center border-4 border-background-dark">
                  <Icon icon="material-symbols:trending-up-rounded" className="text-white text-xs" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-1">lNeoJ</h3>
              <p className="text-purple-400 font-bold text-sm uppercase tracking-widest mb-4">Chief Growth Officer (CGO)</p>
              <p className="text-slate-400 text-sm leading-relaxed">Serial entrepreneur in the crypto space with a focus on community building. Proven track record of scaling Web3 communities to 50k+ active members. Expert in DeFi user acquisition.</p>
            </div>
          </div>
        </section>

        <section className="pb-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold">合作伙伴</h2>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {partnerLogos.map((partner) => (
                <div
                  key={partner.name}
                  className="glass-panel rounded-2xl border border-white/10 h-20 md:h-28 px-4 flex items-center justify-center"
                >
                  {partner.logo ? (
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className={`max-w-full object-contain  ${partner.name === '币安' ? 'max-h-30' : 'max-h-20'}`}
                    />
                  ) : partner.icon ? (
                    <Icon icon={partner.icon} className="text-4xl" aria-label={partner.name} />
                  ) : (
                    <span className="text-white/85 font-bold text-center leading-tight">{partner.name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <Icon icon="mdi:deployed-code" className="text-primary" />
              <span className="text-xl font-bold">Godl.<span className="text-primary">io</span></span>
            </div>
            <p className="text-slate-500 text-sm mb-6">{homeCopy.footerDesc}</p>
            <div className="flex items-center gap-4">
              <a className="text-slate-500 hover:text-white transition-colors" href="#">
                <Icon icon="mdi:share" />
              </a>
              <a className="text-slate-500 hover:text-white transition-colors" href="#">
                <Icon icon="mdi:forum" />
              </a>
              <a className="text-slate-500 hover:text-white transition-colors" href="#">
                <Icon icon="mdi:language" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-6">{homeCopy.companyTitle}</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a className="hover:text-primary transition-colors" href="https://x.com/GODLLABS" target="_blank" rel="noreferrer">{homeCopy.companyItem1}</a></li>
              <li><a className="hover:text-primary transition-colors" href="https://t.me/GODL_LABS" target="_blank" rel="noreferrer">{homeCopy.companyItem2}</a></li>
              <li><a className="hover:text-primary transition-colors" href="https://medium.com/@godllabs2026" target="_blank" rel="noreferrer">{homeCopy.companyItem3}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">{homeCopy.protocolTitle}</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a className="hover:text-primary transition-colors" href="#">{homeCopy.protocolItem1}</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">{homeCopy.protocolItem2}</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">{homeCopy.protocolItem3}</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">{homeCopy.protocolItem4}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">{homeCopy.newsletterTitle}</h4>
            <p className="text-sm text-slate-500 mb-4">{homeCopy.newsletterDesc}</p>
            <div className="flex gap-2">
              <input className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm w-full focus:border-primary focus:ring-0 focus:outline-none transition-all" placeholder={t('common.emailAddress')} type="email" />
              <button className="bg-primary p-2 rounded-lg text-white hover:bg-primary/80 transition-colors">
                <Icon icon="mdi:send" />
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-12 border-t border-white/5 text-center text-slate-600 text-xs">
          {t('common.copyright')}
        </div>
      </footer>
    </div>
  )
}

export default HomeView
