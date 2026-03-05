import React, { useEffect, useState } from 'react'
import { Icon } from "@iconify/react";
import { ethers } from 'ethers'
import TEAMLEVEL_ABI from '../abis/TeamLevel.json'
import { useTranslation } from "react-i18next";
import { useNotification } from '../App.jsx';
import { MOCK_ADDRESS, USE_STATIC_DATA } from '../config/mock.js';

// Global Referrer Dialog
// Checks if the current address has a referrer bound; if not, allows user to bind one.
// This component does not assume a specific UI framework beyond simple modal structure.

function ReferrerDialog({ visible, onClose, autoCloseIfBound = true }) {
  
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const [address, setAddress] = useState('')
  const [binding, setBinding] = useState({ status: '', tx: '' })
  const [checking, setChecking] = useState(false)
  const [isBound, setIsBound] = useState(false)
  const TEAMLEVEL_ADDRESS = import.meta.env.VITE_TEAM_LEVEL_ADDRESS || '0x1' // fallback
  
  // 只在弹窗首次打开时检查一次绑定状态，不依赖 onClose 避免重复检查
  useEffect(() => {
    if (!visible) return
    let mounted = true
    async function check() {
      if (USE_STATIC_DATA) {
        const bound = localStorage.getItem('mock_referrer_bound') === 'true';
        if (mounted) setIsBound(bound);
        if (mounted && bound && autoCloseIfBound) onClose();
        return;
      }

      try {
        setChecking(true)
        if (mounted) setIsBound(false)
        if (typeof window === 'undefined' || !window.ethereum) {
          setChecking(false)
          return
        }
        const provider = new ethers.BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        const me = await signer.getAddress()
        const contract = new ethers.Contract(TEAMLEVEL_ADDRESS, TEAMLEVEL_ABI, signer)
        const res = await contract.isBindReferral(me)
        // If bound, close dialog automatically
        if (mounted && res) {
          setIsBound(true)
          if (autoCloseIfBound) onClose()
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setChecking(false)
      }
    }
    check()
    return () => { mounted = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  // 从URL中获取邀请码并设置到输入框
  useEffect(() => {
    if (!visible) return
    try {
      if (typeof window === 'undefined' || !window.location) return
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      if (code) {
        setAddress(code)
      }
    } catch (error) {
      console.error('Error getting referral code from URL:', error)
    }
  }, [visible])

  async function bind() {
    try {
      if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
        addNotification('error', '请提供有效的邀请人地址')
        return
      }

      if (USE_STATIC_DATA) {
        if (address.toLowerCase() === MOCK_ADDRESS.toLowerCase()) {
          addNotification('error', '邀请人地址不能是自己')
          return
        }
        if (address === '0x0000000000000000000000000000000000000000') {
          addNotification('error', '邀请人地址不能是零地址')
          return
        }
        setBinding({ status: 'loading', tx: '' })
        localStorage.setItem('mock_referrer_bound', 'true')
        localStorage.setItem('mock_referrer_address', address)
        setIsBound(true)
        setBinding({ status: 'success', tx: 'mock-tx-hash' })
        addNotification('success', t('common.referrerBindSuccess'))
        setTimeout(() => onClose(), 800)
        return
      }

      if (typeof window === 'undefined' || !window.ethereum) {
        addNotification('error', '未检测到以太坊钱包')
        return
      }
      setBinding({ status: 'loading', tx: '' })
      
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const userAddress = await signer.getAddress()
      
      // 检查邀请人地址不能是自己
      if (address.toLowerCase() === userAddress.toLowerCase()) {
        addNotification('error', '邀请人地址不能是自己')
        setBinding({ status: '', tx: '' })
        return
      }
      
      // 检查邀请人地址不能是零地址
      if (address === '0x0000000000000000000000000000000000000000') {
        addNotification('error', '邀请人地址不能是零地址')
        setBinding({ status: '', tx: '' })
        return
      }
      
      const contract = new ethers.Contract(TEAMLEVEL_ADDRESS, TEAMLEVEL_ABI, signer)
      
      // 调用合约 bindReferral 方法：bindReferral(inviter, user)
      // 参考老项目: teamLevelContract.bindReferral(this.referrerInput, userAddress)
      const tx = await contract.bindReferral(address, userAddress)
      await tx.wait()
      
      setBinding({ status: 'success', tx: tx.hash })
      addNotification('success', t('common.referrerBindSuccess'))
      // Close on success after a short delay
      setTimeout(() => onClose(), 1500)
    } catch (err) {
      console.error('绑定邀请人失败:', err)
      setBinding({ status: 'error', tx: '' })
      // 解析错误信息
      let errorMsg = '绑定失败'
      if (err.code === 4001 || err?.message?.includes('rejected')) {
        errorMsg = '用户取消了交易'
      } else if (err?.message?.includes('CALL_EXCEPTION')) {
        errorMsg = '合约调用失败，邀请人地址可能无效'
      } else if (err?.message) {
        errorMsg = `绑定失败: ${err.message}`
      }
      addNotification('error', errorMsg)
    }
  }

  if (!visible) return null
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="glass-panel rounded-xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{t('referrer.title')}</h2>
          <button
            onClick={() => {onClose()}}
            className="text-white/60 hover:text-white transition-colors"
          >
            <Icon icon="mdi:close" className="text-xl" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-[#a692c9] text-lg mb-2">
              {t('referrer.subtitle')}
            </p>
            {isBound && (
              <div className="mb-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                {t('referrer.alreadyBound')}
              </div>
            )}
            <input
              placeholder="0xAbC123..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={isBound}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono"
            />
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <p className="text-[#a692c9] text-lg font-medium mb-2">
              {t('referrer.howToPperate')}
            </p>
            <ul className="text-lg space-y-2 text-white/80">
              <li className="flex items-start gap-2">
                <Icon
                  icon="mdi:arrow-right"
                  className="text-primary mt-1 flex-shrink-0"
                />
                <span>
                  {t('referrer.inputReferrerTips')}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Icon
                  icon="mdi:arrow-right"
                  className="text-primary mt-1 flex-shrink-0"
                />
                <span>
                  {t('referrer.clickBind')}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Icon
                  icon="mdi:arrow-right"
                  className="text-primary mt-1 flex-shrink-0"
                />
                <span>
                  {t('referrer.confirmBind')}
                </span>
              </li>
            </ul>
          </div>

          <div className="pt-4">
            <button 
              onClick={bind} 
                disabled={binding.status === 'loading' || isBound}
              className={`w-full px-4 py-3 rounded-lg text-white font-bold transition-colors flex items-center justify-center gap-2 ${binding.status === 'loading' || isBound ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'}`}
            >
              {binding.status === 'loading' ? (
                <>
                  <Icon icon="mdi:loading" className="animate-spin" />
                  {t('stake.processing')}
                </>
              ) : isBound ? (
                <>
                  <Icon icon="mdi:check-circle" />
                  {t('referrer.alreadyBound')}
                </>
              ) : (
                <>
                  <Icon icon="mdi:link" />
                  {t('referrer.title')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReferrerDialog
