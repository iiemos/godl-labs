import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { useAccount } from 'wagmi';
import useStakeStore from '../stores/stakeStore';
import { useNotification, useWalletVerification } from '../App.jsx';
import { MOCK_ADDRESS, USE_STATIC_DATA } from '../config/mock.js';

function FuelExchangeView({ embedded = false }) {
  const { address: walletAddress, isConnected: walletConnected } = useAccount();
  const address = USE_STATIC_DATA ? MOCK_ADDRESS : walletAddress;
  const isConnected = USE_STATIC_DATA ? true : walletConnected;
  const { isVerified: walletVerified } = useWalletVerification();
  const isVerified = USE_STATIC_DATA ? true : walletVerified;
  const { addNotification } = useNotification();
  const { usdtBalance, loadStakeData } = useStakeStore();

  const [mode, setMode] = useState('buy');
  const [amount, setAmount] = useState('100');

  const godlBalance = 18.5;
  const godlPriceInUsgd = 400;

  useEffect(() => {
    if (isConnected && isVerified) {
      loadStakeData();
    }
  }, [isConnected, isVerified, loadStakeData]);

  const normalizedAmount = useMemo(() => {
    const parsed = Number.parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return parsed;
  }, [amount]);

  const usgdBalance = Number.parseFloat(usdtBalance || '0');
  const isBuy = mode === 'buy';
  const fromToken = isBuy ? 'USGD' : 'GODL';
  const toToken = isBuy ? 'GODL' : 'USGD';
  const fromBalance = isBuy ? usgdBalance : godlBalance;
  const toBalance = isBuy ? godlBalance : usgdBalance;

  const estimatedValue = isBuy
    ? (normalizedAmount / godlPriceInUsgd).toFixed(6)
    : (normalizedAmount * godlPriceInUsgd).toFixed(2);

  const exchangeRateText = isBuy
    ? `1 USGD ≈ ${(1 / godlPriceInUsgd).toFixed(6)} GODL`
    : `1 GODL ≈ ${godlPriceInUsgd} USGD`;

  const handleSwitchMode = () => {
    setMode((prev) => (prev === 'buy' ? 'sell' : 'buy'));
  };

  const setMaxAmount = () => {
    setAmount(String(fromBalance));
  };

  const handleExchange = () => {
    if (!isConnected || !address) {
      addNotification('error', '请先连接钱包');
      return;
    }
    if (!isVerified) {
      addNotification('error', '请先完成钱包签名验证');
      return;
    }
    if (normalizedAmount <= 0) {
      addNotification('error', '请输入有效兑换数量');
      return;
    }
    if (normalizedAmount > fromBalance) {
      addNotification('error', `${fromToken} 余额不足`);
      return;
    }

    addNotification(
      'success',
      `兑换已提交：${normalizedAmount.toFixed(isBuy ? 2 : 6)} ${fromToken} -> ${estimatedValue} ${toToken}`
    );
  };

  const content = (
    <div
      className={`w-full ${
        embedded ? 'flex flex-col items-center py-2' : 'max-w-[1440px] mx-auto px-4 md:px-10 py-10 pt-18 flex flex-col items-center'
      }`}
    >
      <div className="mb-8 text-center">
        <h3 className="text-4xl font-bold tracking-tight mb-2">USGD / GODL 兑换</h3>
        <p className="text-white/50 text-sm">基于 PAXG 流动性价格折算的黄金锚定兑换窗口</p>
      </div>

      <div className="glass-card w-full max-w-[480px] p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute -top-24 -left-24 size-48 bg-primary/20 blur-[60px] rounded-full"></div>
        <div className="absolute -bottom-24 -right-24 size-48 bg-neon-blue/20 blur-[60px] rounded-full"></div>

        <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1 mb-4">
          <button
            type="button"
            onClick={() => setMode('buy')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
              isBuy ? 'bg-primary text-white' : 'text-[#a692c8] hover:text-white'
            }`}
          >
            USGD -&gt; GODL
          </button>
          <button
            type="button"
            onClick={() => setMode('sell')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
              !isBuy ? 'bg-primary text-white' : 'text-[#a692c8] hover:text-white'
            }`}
          >
            GODL -&gt; USGD
          </button>
        </div>

        <div className="bg-background-dark/60 border border-white/5 p-5 rounded-2xl mb-2 hover:border-primary/40 transition-all">
          <div className="flex justify-between items-center mb-3">
            <span className="text-white/50 text-lg font-medium uppercase tracking-wider">从</span>
            <span className="text-white/50 text-lg">余额: <span className="text-white/80">{fromBalance.toFixed(3)} {fromToken}</span></span>
          </div>
          <div className="flex items-center gap-4">
            <input
              className="bg-transparent border-none focus:ring-0 text-3xl font-bold text-white w-full p-0 placeholder:text-white/20 outline-none"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <button
                className="bg-primary/20 hover:bg-primary/40 text-primary text-[10px] font-bold px-2 py-1 rounded-md transition-all"
                onClick={setMaxAmount}
              >
                MAX
              </button>
              <div className="flex items-center gap-2 bg-background-dark border border-white/10 px-3 py-2 rounded-xl">
                <span className="font-bold text-lg">{fromToken}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative h-4 flex justify-center items-center z-20">
          <button
            type="button"
            className="absolute -translate-y-1/2 top-1/2 p-2 bg-background-dark border-4 border-[#1c142b] rounded-xl cursor-pointer shadow-lg hover:shadow-primary/20 transition-all"
            onClick={handleSwitchMode}
          >
            <Icon icon="mdi:swap-vertical" className="text-primary font-bold" />
          </button>
        </div>

        <div className="bg-background-dark/60 border border-white/5 p-5 rounded-2xl mt-2 hover:border-primary/40 transition-all">
          <div className="flex justify-between items-center mb-3">
            <span className="text-white/50 text-lg font-medium uppercase tracking-wider">到</span>
            <span className="text-white/50 text-lg">余额: <span className="text-white/80">{toBalance.toFixed(3)} {toToken}</span></span>
          </div>
          <div className="flex items-center gap-4">
            <input
              className="bg-transparent border-none focus:ring-0 text-3xl font-bold text-white w-full p-0 placeholder:text-white/20 outline-none"
              placeholder="0.00"
              readOnly
              value={estimatedValue}
            />
            <div className="flex items-center gap-2 bg-background-dark border border-white/10 px-3 py-2 rounded-xl">
              <span className="font-bold text-lg">{toToken}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3 px-2">
          <div className="flex justify-between text-lg">
            <span className="text-white/40">兑换汇率</span>
            <span className="text-white/70">{exchangeRateText}</span>
          </div>
          <div className="flex justify-between text-lg">
            <span className="text-white/40">价格参考</span>
            <span className="text-white/70">1 GODL = {godlPriceInUsgd} USGD</span>
          </div>
          <div className="flex justify-between text-lg">
            <span className="text-white/40">兑换手续费</span>
            <span className="text-white/70">暂定</span>
          </div>
        </div>

        <button
          className="mt-8 w-full py-5 bg-gradient-to-r from-primary to-primary/80 text-white font-bold rounded-2xl glow-pulse hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          onClick={handleExchange}
        >
          <Icon icon="mdi:check-circle" />
          <span>{isBuy ? '兑换 GODL' : '兑换 USGD'}</span>
        </button>

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3">
          <Icon icon="mdi:clock-outline" className="text-primary mt-0.5" />
          <p className="text-sm text-[#d4c5f5]">GODL 折算价格来源于 PAXG 流动性池，页面数据为前端估算值。</p>
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="dark:bg-background-dark font-display text-white min-h-screen">
      <div className="fixed inset-0 z-0 bg-grid opacity-50 pointer-events-none"></div>
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,59,237,0.1)_0%,transparent_50%)] pointer-events-none"></div>
      <div className="relative z-10 flex flex-col lg:flex-row">{content}</div>
    </div>
  );
}

export default FuelExchangeView;
