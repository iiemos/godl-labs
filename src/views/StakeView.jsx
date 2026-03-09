import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import useStakeStore from '../stores/stakeStore';
import { useWalletIntegration } from '../hooks/useWalletIntegration';
import { useTranslation } from 'react-i18next';
import { fetchGlobalStakeStats, formatWei } from '../api/index.js';
import { useAccount } from 'wagmi';
import { useNotification, useWalletVerification } from '../App.jsx';
import { USE_STATIC_DATA } from '../config/mock.js';
import { TICKET_OPTIONS } from '../config/ticketing.js';

function StakeView() {
  // Initialize wallet integration
  useWalletIntegration();
  
  const { t } = useTranslation();
  const { isConnected: walletConnected } = useAccount();
  const isConnected = USE_STATIC_DATA ? true : walletConnected;
  const { isVerified: walletVerified } = useWalletVerification();
  const isVerified = USE_STATIC_DATA ? true : walletVerified;

  const { addNotification } = useNotification();
  
  // Global staking stats
  const [globalStats, setGlobalStats] = useState({
    currentStake: '0',
    loading: true
  });
  
  const {
    // State
    usdtBalance,
    aigBalance,
    stakeAmount,
    selectedStakeIndex,
    lockOptions,
    stakeList,
    loadingRecords,
    countdown,
    isInCooldown,
    isStakingBusy,
    isProcessing,
    UnstakeLoading,
    stakeAmountError,
    userReinvestTaxObj,
    reinvestTaxCountdown,
    isReinvestTaxValid,
    
    // Actions
    setStakeAmount,
    setSelectedStakeIndex,
    addTicketHoldings,
    onStake,
    onUnstake,
    canUnstake,
    calculateReward,
    getCountdown,
    formatTimestamp,
    transformDay,
    validateStakeAmount
  } = useStakeStore();
  const ticketOptions = TICKET_OPTIONS;
  const getDefaultTicketIndex = () => {
    const matchedIndex = ticketOptions.findIndex(
      (ticket) => ticket.price === Number(stakeAmount) && ticket.stakeIndex === selectedStakeIndex
    );
    if (matchedIndex >= 0) return matchedIndex;
    return 0;
  };
  const [selectedTicketIndex, setSelectedTicketIndex] = useState(getDefaultTicketIndex);
  const getDefaultTicketQuantity = () => {
    const matchedTicket = ticketOptions[getDefaultTicketIndex()] || ticketOptions[0];
    const parsedAmount = Number(stakeAmount) || 0;
    const matchedPrice = matchedTicket?.price || 100;
    const quantity = Math.floor(parsedAmount / matchedPrice);
    return quantity > 0 ? quantity : 1;
  };
  const [ticketQuantity, setTicketQuantity] = useState(getDefaultTicketQuantity);

  const numericStakeAmount = Number(stakeAmount) || 0;
  const selectedLockOption = lockOptions[selectedStakeIndex] || lockOptions[0];
  const subscriptionFeeRate = ((selectedLockOption?.months || 0) / 12) * 0.02;
  const subscriptionFee = numericStakeAmount * subscriptionFeeRate;
  const totalPaymentAmount = numericStakeAmount + subscriptionFee;
  const expectedInterest = numericStakeAmount * ((selectedLockOption?.rate || 0) / 100) * ((selectedLockOption?.days || 0) / 365);
  const gdlBonusEstimate = expectedInterest * (selectedLockOption?.gdlMultiplier || 0);
  const releaseIntervals = Math.max(1, (selectedLockOption?.days || 1) * 24 * 60 * 20);
  const per3sInterest = expectedInterest / releaseIntervals;
  const per3sGdlEquivalent = gdlBonusEstimate / releaseIntervals;

  const formatAmount = (value) => {
    if (!Number.isFinite(value)) return '0';
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  };
  const selectedTicket = ticketOptions[selectedTicketIndex] || ticketOptions[0];

  const handleTicketSelect = (index) => {
    const ticket = ticketOptions[index];
    if (!ticket) return;
    setSelectedTicketIndex(index);
    setSelectedStakeIndex(ticket.stakeIndex);
  };

  const updateTicketQuantity = (value) => {
    const nextQuantity = Number(value);
    if (!Number.isFinite(nextQuantity)) return;
    const normalizedQuantity = Math.max(1, Math.floor(nextQuantity));
    setTicketQuantity(normalizedQuantity);
  };

  useEffect(() => {
    const ticket = ticketOptions[selectedTicketIndex];
    if (!ticket) return;
    const expectedAmount = ticket.price * ticketQuantity;
    if (Number(stakeAmount) !== expectedAmount) {
      setStakeAmount(expectedAmount);
    }
    if (selectedStakeIndex !== ticket.stakeIndex) {
      setSelectedStakeIndex(ticket.stakeIndex);
    }
  }, [selectedTicketIndex, ticketQuantity, selectedStakeIndex, setSelectedStakeIndex, setStakeAmount, stakeAmount]);

  // Load global stake stats
  useEffect(() => {
    let mounted = true;
    async function loadGlobalStats() {
      try {
        setGlobalStats(prev => ({ ...prev, loading: true }));
        if (!isVerified) {
          if (mounted) {
            setGlobalStats({
              currentStake: '0',
              loading: false
            });
          }
          return;
        }
        const res = await fetchGlobalStakeStats();
        if (mounted && res && res.success) {
          setGlobalStats({
            currentStake: res.current_stake || '0',
            loading: false
          });
        } else {
          setGlobalStats(prev => ({ ...prev, loading: false }));
        }
      } catch (e) {
        if (mounted) setGlobalStats(prev => ({ ...prev, loading: false }));
      }
    }
    loadGlobalStats();
    return () => { mounted = false; };
  }, [isVerified]);

  // Initialize timers and data
  useEffect(() => {
    if (isConnected && isVerified) {
      useStakeStore.getState().loadStakeData();
    }
    
    // Setup timers
    const countdownInterval = setInterval(() => {
      useStakeStore.getState().startCountdown();
    }, 1000);
    
    const reinvestTaxInterval = setInterval(() => {
      useStakeStore.getState().updateReinvestTaxCountdown();
    }, 1000);
    
    const rewardUpdateInterval = setInterval(() => {
      // Force re-render for reward updates
      useStakeStore.setState({});
    }, 1000);
    
    return () => {
      clearInterval(countdownInterval);
      clearInterval(reinvestTaxInterval);
      clearInterval(rewardUpdateInterval);
      useStakeStore.getState().cleanup();
    };
  }, [isConnected, isVerified]);

  const handleStake = async () => {
    try {
      if (!isVerified) {
        addNotification('error', t('error.connectWallet'));
        return;
      }
      if (validateStakeAmount()) {
        // 执行质押操作
        await onStake();
        addTicketHoldings(selectedTicketIndex, ticketQuantity);
        addNotification('success', t('success.stakeSuccessful'));
      }
    } catch (err) {
      addNotification('error', t('common.highTrafficPleaseWait') || 'Staking failed');
    }
  };

  const handleUnstake = async (index) => {
    try {
      await onUnstake(index);
      addNotification('success', t('success.unstakeSuccessful'));
    } catch (err) {
      addNotification('error', err.message || 'Unstaking failed');
    }
  };
  
  return (
    <div className="dark:bg-background-dark font-display text-white min-h-screen">

      
      <div className="flex flex-col lg:flex-row">
        {/* Main Content Area */}
        <main className="max-w-[1440px] mx-auto w-full px-4 md:px-10 py-10  pt-18">
          {/* Top Balance Bar */}
          <div className="mb-6">
            <h3 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">{t('stake.title')}</h3>
            <p className="text-[#a692c8] text-sm">{t('stake.subtitle')}</p>
          </div>
          
          {/* Staking Pods Section */}
          <div className="glass-panel neon-border-purple rounded-2xl px-6 lg:px-10 py-4 border-b border-[#312447] bg-background-dark/50 backdrop-blur-md mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex flex-col">
                <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-primary/60 bg-clip-text text-transparent">{ t('mine.assetBalances') }</h2>
              </div>
              
              <div className="lg:flex lg:flex-wrap grid grid-cols-2 gap-6 gap-3 lg:gap-4 -mx-6 px-6 lg:mx-0 lg:px-0">
                <div className="flex flex-col items-center shrink-0 bg-[#1c152a] px-5 py-3 rounded-xl border border-[#312447] min-w-[140px]">
                  <p className="text-[#a692c8] text-[10px] font-bold">USGD BALANCE</p>
                  <p className="text-white font-black text-3xl">${parseFloat(usdtBalance).toLocaleString()}</p>
                </div>
                
                <div className="flex flex-col items-center shrink-0 bg-primary/10 px-5 py-3 rounded-xl border border-primary/30 min-w-[140px]">
                  <p className="text-primary text-[10px] font-bold">GDL BALANCE</p>
                  <p className="text-white font-black text-3xl">{parseFloat(aigBalance).toLocaleString()}</p>
                </div>
              
                
                <div className="hidden lg:flex flex-col items-end px-4 border-l border-[#312447] justify-center">
                  <p className="text-[#a692c8] text-[10px] uppercase font-bold tracking-widest">{t('common.networkStatus')}</p>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-sm font-medium">{t('common.liveOnMainnet')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Plan Selection */}
          <div className="glass-card rounded-2xl p-6 border-[#312447] mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Icon icon="mdi:clock-outline" className="text-primary" />
                认购计划选择
              </h3>
              <button className="text-primary hover:text-primary/80 transition-colors">
                <Icon icon="mdi:information-outline" className="text-2xl" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ticketOptions.map((ticket, i) => (
                <div
                  key={i}
                  className={`bg-primary/10 border-primary/50 rounded-2xl p-6 cursor-pointer border transition-all ${
                    selectedTicketIndex === i
                      ? 'border-primary/200 bg-primary/100 neon-border-purple'
                      : 'border-[#312447] hover:border-primary/50'
                  }`}
                  onClick={() => handleTicketSelect(i)}
                >
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="min-w-0">
                      <h4 className="text-2xl font-black mb-2">{ticket.name}</h4>
                      <p className="text-[#a692c8] text-sm">{ticket.desc}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[#a692c8] text-lg font-bold hidden md:block">认购单价</p>
                      <p className="text-3xl font-black text-[#0bda6f] tabular-nums">{ticket.price} USGD</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#a692c8]">认购周期</span>
                      <span className="text-white font-bold">
                        {(lockOptions.find((item) => item.index === ticket.stakeIndex)?.months || 0)}个月
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8 mt-8">
            {/* Stake Form */}
            <div className="lg:col-span-1 glass-card rounded-2xl p-6 border-[#312447]">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Icon icon="mdi:add-circle" className="text-primary" />
                {t('stake.stakeAssets')}
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[#a692c8] text-[10px] lg:text-lg font-bold uppercase mb-2 block">
                    认购金额
                  </label>
                  <div className={`w-full bg-[#110d1a] border rounded-xl py-4 lg:py-5 px-4 ${stakeAmountError ? 'border-red-500' : 'border-[#312447]'}`}>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[#a692c8] text-xs">已选计划</p>
                        <p className="text-white font-bold text-lg">{selectedTicket.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#a692c8] text-xs">单份金额</p>
                        <p className="text-primary font-black text-2xl">{selectedTicket.price} USGD</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-[#a692c8] text-sm">认购份数</p>
                    <div className="flex items-center bg-[#110d1a] border border-[#312447] rounded-lg overflow-hidden">
                      <button
                        type="button"
                        className="px-3 py-2 text-white hover:bg-white/10 transition-colors"
                        onClick={() => updateTicketQuantity(ticketQuantity - 1)}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        className="w-16 bg-transparent text-center text-white font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={ticketQuantity}
                        onChange={(e) => updateTicketQuantity(e.target.value)}
                      />
                      <button
                        type="button"
                        className="px-3 py-2 text-white hover:bg-white/10 transition-colors"
                        onClick={() => updateTicketQuantity(ticketQuantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {stakeAmountError && (
                    <p className="text-red-500 text-lg mt-2">{stakeAmountError}</p>
                  )}
                </div>
                
                <div>
                  <div className="flex justify-between text-lg font-bold mb-3">
                    <span className="text-[#a692c8] uppercase">{t('stake.stakeAmount')}</span>
                    <span className="text-primary">{stakeAmount}</span>
                  </div>
                  <p className="text-[#a692c8] text-sm">认购总额将按计划单价与份数自动计算。</p>
                </div>
                
                <div className="p-4 bg-background-dark/50 rounded-xl border border-[#312447] text-md">
                  <div className="flex justify-between mb-2">
                    <span className="text-[#a692c8]">认购手续费</span>
                    <span className="text-white font-bold">
                      {formatAmount(subscriptionFee)} USGD ({(subscriptionFeeRate * 100).toFixed(2)}%)
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[#a692c8]">{t('stake.paymentAmount')}</span>
                    <span className="text-white font-bold">
                      {formatAmount(numericStakeAmount)} + {formatAmount(subscriptionFee)} = {formatAmount(totalPaymentAmount)} USGD
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[#a692c8]">预计利息</span>
                    <span className="text-[#0bda6f] font-bold">
                      {formatAmount(expectedInterest)} USGD
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[#a692c8]">预计 GDL 激励</span>
                    <span className="text-white font-bold">{formatAmount(gdlBonusEstimate)} GDL 等值</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[#a692c8]">每3秒释放</span>
                    <span className="text-white font-bold">{per3sInterest.toFixed(6)} USGD + {per3sGdlEquivalent.toFixed(6)} GDL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a692c8]">{t('stake.lockupPeriod')}</span>
                    <span className="text-white font-bold">{selectedLockOption.months} 个月 ({selectedLockOption.rate}% APY)</span>
                  </div>
                </div>
                
                {/* Cooldown Timer */}
                {isInCooldown && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <div className="flex items-center gap-2 text-amber-500 text-sm">
                      <Icon icon="mdi:clock" className="animate-pulse" />
                      <span>{t('stake.cooldown')}: {countdown}s</span>
                    </div>
                  </div>
                )}
              {userReinvestTaxObj.amount && parseFloat(userReinvestTaxObj.amount) > 0 && isReinvestTaxValid && reinvestTaxCountdown !== '00:00:00' && (
                  <div className="flex justify-between items-center shrink-0 bg-amber-500/10 px-5 py-3 rounded-xl border border-amber-500/30 min-w-[140px]">
                    <p className="text-amber-500 text-[10px] font-bold">{t('stake.reinvestBonus')}</p>
                    <p className="text-white font-black text-lg">{userReinvestTaxObj.amount}</p>
                    <p className="text-amber-500 text-lg">{reinvestTaxCountdown}</p>
                  </div>
                )}
                <button
                  className={`w-full py-5 font-black rounded-xl transition-all uppercase tracking-widest text-sm lg:text-base ${
                    isStakingBusy || isInCooldown || !isConnected || stakeAmountError
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-primary text-white glow-primary hover:opacity-90'
                  }`}
                  onClick={handleStake}
                  disabled={isStakingBusy || isInCooldown || !isConnected || !!stakeAmountError}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Icon icon="mdi:loading" className="animate-spin" />
                      {t('stake.processing')}
                    </span>
                  ) : isInCooldown ? (
                    <span>{t('stake.cooldown')} {countdown}s</span>
                  ) : !isConnected ? (
                    t('stake.connectWallet')
                  ) : (
                    t('stake.executeStake')
                  )}
                </button>
              </div>
            </div>
            
            {/* Active Stakes Table */}
            <div className="lg:col-span-2 glass-card rounded-2xl border-[#312447] flex flex-col overflow-hidden">
              <div className="p-6 border-b border-[#312447] flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Icon icon="mdi:dynamic-feed" className="text-primary" />
                  {t('stake.myActiveStakes')}
                </h3>
                <span className="text-lg text-[#a692c8]">{stakeList.length} {t('stake.positions')}</span>
              </div>
              
              {/* Loading Overlay */}
              {UnstakeLoading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                  <div className="flex flex-col items-center gap-3">
                    <Icon icon="mdi:loading" className="text-4xl text-primary animate-spin" />
                    <span className="text-white">{t('stake.processing')}</span>
                  </div>
                </div>
              )}
              
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-[#a692c8] text-[10px] font-bold uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4">{t('stake.time')}</th>
                      <th className="px-6 py-4">{t('stake.amount')}</th>
                      <th className="px-6 py-4">{t('stake.duration')}</th>
                      <th className="px-6 py-4">{t('stake.reward')}</th>
                      <th className="px-6 py-4 text-right">{t('stake.action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#312447]">
                    {loadingRecords ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center">
                          <Icon icon="mdi:loading" className="text-2xl text-primary animate-spin mx-auto mb-2" />
                          <p className="text-[#a692c8]">{t('stake.loadingRecords')}</p>
                        </td>
                      </tr>
                    ) : stakeList.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center">
                          <Icon icon="mdi:inbox-outline" className="text-2xl text-[#a692c8] mx-auto mb-2" />
                          <p className="text-[#a692c8]">{t('stake.noStakingRecords')}</p>
                        </td>
                      </tr>
                    ) : (
                      stakeList.map((record, index) => (
                        <tr key={index} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-5">
                            <span className="text-sm">{formatTimestamp(record.oriStakeTime)}</span>
                          </td>
                          <td className="px-6 py-5 font-bold text-sm">{record.amount} USGD</td>
                          <td className="px-6 py-5">
                            <div>
                              <span className="text-sm font-bold">({transformDay(record.stakeIndex)})</span>
                              {!record.status && record.canEndData && getCountdown(record.canEndData) !== 'Completed' && (
                                <div className="text-lg text-primary mt-1">
                                  {getCountdown(record.canEndData)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-[#0bda6f] font-bold text-sm">
                              {calculateReward(record)} USGD
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <button 
                              className={`font-bold text-lg px-3 py-1 rounded-lg transition-all ${
                                record.status 
                                  ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                                  : canUnstake(record)
                                  ? 'bg-primary text-white hover:brightness-110'
                                  : 'bg-white/5 text-white/30 cursor-not-allowed'
                              }`}
                              onClick={() => handleUnstake(index)}
                              disabled={record.status || !canUnstake(record)}
                            >
                              {record.status ? t('stake.unstaked') : (canUnstake(record) ? t('stake.unstake') : t('stake.locked'))}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Table */}
              <div className="md:hidden divide-y divide-[#312447]">
                {loadingRecords ? (
                  <div className="p-4 text-center">
                    <Icon icon="mdi:loading" className="text-2xl text-primary animate-spin mx-auto mb-2" />
                    <p className="text-[#a692c8]">{t('stake.loadingRecords')}</p>
                  </div>
                ) : stakeList.length === 0 ? (
                  <div className="p-4 text-center">
                    <Icon icon="mdi:inbox-outline" className="text-2xl text-[#a692c8] mx-auto mb-2" />
                    <p className="text-[#a692c8]">{t('stake.noStakingRecords')}</p>
                  </div>
                ) : (
                  stakeList.map((record, index) => (
                    <div key={index} className="p-4 flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xl font-bold">{record.amount} USGD</p>
                          <p className="text-[10px] text-[#a692c8]">{formatTimestamp(record.oriStakeTime)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[#0bda6f] text-2xl font-bold">{calculateReward(record)} USGD</p>
                          <p className="text-[10px] text-[#a692c8]">({transformDay(record.stakeIndex)})</p>
                        </div>
                      </div>
                      {!record.status && record.canEndData && getCountdown(record.canEndData) !== 'Completed' && (
                        <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                          <span className="text-[10px] uppercase font-bold text-[#a692c8]">{t('stake.unlockIn')}</span>
                          <span className="text-lg text-primary font-black">{getCountdown(record.canEndData)}</span>
                        </div>
                      )}
                      <button 
                        className={`w-full py-3 text-sm font-bold rounded-xl transition-all ${
                          record.status 
                            ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                            : canUnstake(record)
                            ? 'bg-primary text-white hover:brightness-110'
                            : 'bg-white/5 text-white/30 cursor-not-allowed'
                        }`}
                        onClick={() => handleUnstake(index)}
                        disabled={record.status || !canUnstake(record)}
                      >
                        {record.status ? t('stake.unstaked') : (canUnstake(record) ? t('stake.unstake') : t('stake.locked'))}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          {/* Stats Footer */}
          <footer className="p-6 lg:p-10 bg-[#110d1a] border-t border-[#312447] mt-8">
            <div className="grid grid-cols-2 lg:grid-cols-2 gap-6 lg:gap-8">
              <div className="flex flex-col gap-1 lg:gap-2">
                <p className="text-[#a692c8] text-[10px] lg:text-lg font-bold uppercase">{t('common.totalStakedAmount')}</p>
                <p className="text-lg lg:text-2xl font-black text-white">
                  {globalStats.loading ? '...' : `$${formatWei(globalStats.currentStake, 0)}`}
                </p>
                <div className="flex items-center gap-2 text-[#0bda6f] text-sm font-bold">
                  <Icon icon="mdi:trending-up" className="text-sm size-6" />
                </div>
              </div>
              <div className="flex flex-col gap-1 lg:gap-2">
                <p className="text-[#a692c8] text-[10px] lg:text-lg font-bold uppercase">{t('common.annualYield360Days')}</p>
                <p className="text-lg lg:text-2xl font-black text-white">30%</p>
                <p className="text-blue-400 text-[10px] font-medium">{t('stake.optimalNetwork')}</p>
              </div>
            </div>
          </footer>
        </main>
      </div>
      
      {/* Animated Grid Background */}
      <div className="fixed inset-0 z-0 bg-grid opacity-50 pointer-events-none"></div>
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,59,237,0.1)_0%,transparent_50%)] pointer-events-none"></div>
      
    </div>
  );
}

export default StakeView;
