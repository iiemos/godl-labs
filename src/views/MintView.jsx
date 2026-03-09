import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useTranslation } from 'react-i18next';
import useStakeStore from '../stores/stakeStore';
import { useWalletIntegration } from '../hooks/useWalletIntegration';
import { useNotification, useWalletVerification } from '../App.jsx';
import { MOCK_ADDRESS, USE_STATIC_DATA } from '../config/mock.js';
import { DEFAULT_MINT_AMOUNT, MINT_FUEL_FEE_GDL, TICKET_OPTIONS } from '../config/ticketing.js';

function MintView() {
  useWalletIntegration();

  const { address: walletAddress, isConnected: walletConnected } = useAccount();
  const address = USE_STATIC_DATA ? MOCK_ADDRESS : walletAddress;
  const isConnected = USE_STATIC_DATA ? true : walletConnected;
  const { isVerified: walletVerified } = useWalletVerification();
  const isVerified = USE_STATIC_DATA ? true : walletVerified;
  const { addNotification } = useNotification();
  const { t } = useTranslation();

  const {
    usdtBalance,
    loadingRecords,
    stakeList,
    ticketHoldings,
    ticketHoldingsInitialized,
    mintedTotalCount,
    mintedTodayCount,
    mintDayKey,
    dailyMintLimit,
    loadStakeData,
    initializeTicketHoldingsFromStakeList,
    consumeTicketHoldings,
    refreshMintCounterDay,
    increaseMintCount
  } = useStakeStore();

  const [selectedTicketIndex, setSelectedTicketIndex] = useState(0);
  const [mintAmount, setMintAmount] = useState(DEFAULT_MINT_AMOUNT);

  const normalizeMintAmount = (value) => {
    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue)) return;
    setMintAmount(Math.max(1, Math.floor(parsedValue)));
  };

  useEffect(() => {
    refreshMintCounterDay();
  }, [refreshMintCounterDay]);

  useEffect(() => {
    if (isConnected && isVerified) {
      loadStakeData();
    }
  }, [isConnected, isVerified, loadStakeData]);

  useEffect(() => {
    if (ticketHoldingsInitialized || loadingRecords) return;
    if (isConnected && isVerified && stakeList.length === 0) return;
    initializeTicketHoldingsFromStakeList(stakeList);
  }, [initializeTicketHoldingsFromStakeList, isConnected, isVerified, loadingRecords, stakeList, ticketHoldingsInitialized]);

  const effectiveMintedTodayCount = mintDayKey === new Date().toDateString() ? mintedTodayCount : 0;
  const totalMintableCount = ticketHoldings.reduce((sum, count) => sum + count, 0);
  const todayRemainingMintCount = Math.max(0, Math.min(totalMintableCount, dailyMintLimit - effectiveMintedTodayCount));
  const selectedTicket = TICKET_OPTIONS[selectedTicketIndex] || TICKET_OPTIONS[0];
  const selectedTicketHoldingCount = ticketHoldings[selectedTicketIndex] || 0;
  const getTicketName = (ticket) => t(ticket?.nameKey || '', { defaultValue: ticket?.name || '' });
  const getTicketDesc = (ticket) => t(ticket?.descKey || '', { defaultValue: ticket?.desc || '' });
  const selectedTicketName = getTicketName(selectedTicket);

  const handleMint = () => {
    refreshMintCounterDay();

    if (!isConnected || !address) {
      addNotification('error', t('error.connectWallet'));
      return;
    }

    if (!isVerified) {
      addNotification('error', t('fuelExchange.errorVerifyWallet'));
      return;
    }

    if (selectedTicketHoldingCount < 1) {
      addNotification('error', t('mintPage.errorNoQuota'));
      return;
    }

    if (todayRemainingMintCount < 1) {
      addNotification('error', t('mintPage.errorNoToday'));
      return;
    }

    if (mintAmount < 1) {
      addNotification('error', t('mintPage.errorInvalidAmount'));
      return;
    }

    if (Number(usdtBalance || 0) < mintAmount) {
      addNotification('error', t('error.aigBalance'));
      return;
    }

    const consumed = consumeTicketHoldings(selectedTicketIndex, 1);
    if (!consumed) {
      addNotification('error', t('mintPage.errorDeductFail'));
      return;
    }

    increaseMintCount(1);
    addNotification('success', t('mintPage.submitSuccess', { name: selectedTicketName }));
  };

  return (
    <div className="dark:bg-background-dark font-display text-white min-h-screen">
      {/* 背景/网格保持原样 */}
      <div className="fixed inset-0 z-0 bg-grid opacity-50 pointer-events-none"></div>
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,59,237,0.1)_0%,transparent_50%)] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col lg:flex-row">
        <main className="max-w-[1440px] mx-auto w-full px-4 md:px-10 py-10 pt-18">
          <div className="mb-6">
            <h3 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">{t('mintPage.title')}</h3>
            <p className="text-[#a692c8] text-sm">{t('mintPage.subtitle')}</p>
          </div>

          <div className="glass-panel neon-border-purple rounded-2xl px-6 lg:px-10 py-4 border-b border-[#312447] bg-background-dark/50 backdrop-blur-md mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex flex-col">
                <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-primary/60 bg-clip-text text-transparent">{t('mintPage.myQuota')}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-col items-center shrink-0 bg-primary/10 px-5 py-3 rounded-xl border border-primary/30 min-w-[140px]">
                  <p className="text-primary text-[10px] font-bold">{t('mintPage.availableCount')}</p>
                  <p className="text-white font-black text-3xl">{totalMintableCount}</p>
                </div>
                <div className="flex flex-col items-center shrink-0 bg-[#1c152a] px-5 py-3 rounded-xl border border-[#312447] min-w-[140px]">
                  <p className="text-[#a692c8] text-[10px] font-bold">{t('mintPage.todayRemainingCount')}</p>
                  <p className="text-white font-black text-3xl">{todayRemainingMintCount}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:grid lg:grid-cols-3 gap-8 items-start">
            <div className="glass-card rounded-2xl p-6 border-[#312447] mb-8 lg:mb-0">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Icon icon="mdi:ticket-outline" className="text-primary" />
                  {t('mintPage.selectPlan')}
                </h3>
              </div>
              <div className="flex flex-col gap-4">
                {TICKET_OPTIONS.map((ticket, index) => (
                  <button
                    key={`${ticket.stakeIndex}-${ticket.price}`}
                    type="button"
                    onClick={() => setSelectedTicketIndex(index)}
                    className={`text-left bg-primary/10 rounded-2xl p-5 border transition-all ${
                      selectedTicketIndex === index
                        ? 'border-primary/200 bg-primary/100 neon-border-purple'
                        : 'border-[#312447] hover:border-primary/50'
                    }`}
                  >
                    <p className="text-xl font-black mb-1">{getTicketName(ticket)}</p>
                    <p className="text-[#a692c8] text-sm mb-3">{getTicketDesc(ticket)}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#a692c8]">{t('mintPage.holdings')}</span>
                      <span className={`font-bold ${selectedTicketIndex === index ? 'text-white' : 'text-primary'}`}>
                        {ticketHoldings[index] || 0} {t('mintPage.ticketUnit')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 border-[#312447] mb-8 lg:mb-0 lg:col-span-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Icon icon="mdi:anvil" className="text-primary" />
                  {t('mintPage.governanceStakeModule')}
                </h3>
                <p className="text-[#a692c8] text-sm">
                  {t('mintPage.currentPlan', { name: selectedTicketName, count: selectedTicketHoldingCount })}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-[#110d1a] border border-[#312447] rounded-xl p-4">
                    <p className="text-[#a692c8] text-xs uppercase mb-3">{t('mintPage.myPlanList')}</p>
                    <div className="space-y-2">
                      {TICKET_OPTIONS.map((ticket, index) => (
                        <div key={`${ticket.stakeIndex}-${ticket.price}`} className="flex items-center justify-between text-sm">
                          <span className="text-white font-medium">{getTicketName(ticket)}</span>
                          <span className="text-primary font-bold">{ticketHoldings[index] || 0} {t('mintPage.ticketUnit')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#110d1a] border border-[#312447] rounded-xl p-4">
                    <p className="text-[#a692c8] text-xs uppercase mb-3">{t('mintPage.countHint')}</p>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-[#a692c8]">{t('mintPage.availableCount')}</span>
                      <span className="text-white font-bold">{totalMintableCount} {t('mintPage.countUnit')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#a692c8]">{t('mintPage.todayRemainingCount')}</span>
                      <span className="text-white font-bold">{todayRemainingMintCount} / {dailyMintLimit} {t('mintPage.countUnit')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-[#a692c8]">{t('mintPage.mintedTotal')}</span>
                      <span className="text-white font-bold">{mintedTotalCount} {t('mintPage.countUnit')}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-[#110d1a] border border-[#312447] rounded-xl p-4">
                    <p className="text-[#a692c8] text-xs uppercase mb-3">{t('mintPage.stakeAmount')}</p>
                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={mintAmount}
                        onChange={(e) => normalizeMintAmount(e.target.value)}
                        className="w-full bg-background-dark/50 border border-[#312447] rounded-lg px-3 py-2 text-white font-bold outline-none focus:border-primary"
                      />
                      <span className="text-white font-bold whitespace-nowrap">GDL</span>
                    </div>
                    <p className="text-[#a692c8] text-sm mt-2">
                      {t('mintPage.balance', { amount: parseFloat(usdtBalance || 0).toLocaleString() })}
                    </p>
                  </div>

                  <div className="bg-[#110d1a] border border-[#312447] rounded-xl p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[#a692c8] text-xs uppercase">{t('mintPage.governanceFee')}</p>
                        <p className="text-white font-bold mt-1">{MINT_FUEL_FEE_GDL} GDL</p>
                      </div>
                      <Link
                        to="/swap?tab=godl"
                        className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors text-sm font-bold"
                      >
                        {t('mintPage.goSwap')}
                      </Link>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleMint}
                    disabled={!isConnected || selectedTicketHoldingCount < 1 || todayRemainingMintCount < 1}
                    className={`w-full py-4 font-black rounded-xl transition-all uppercase tracking-widest text-sm ${
                      !isConnected || selectedTicketHoldingCount < 1 || todayRemainingMintCount < 1
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-primary text-white glow-primary hover:opacity-90'
                    }`}
                  >
                    {t('mintPage.submit')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default MintView;
