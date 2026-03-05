import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { ethers } from 'ethers'; // 或从 viem 导入 verifyMessage
import { useWalletVerification } from '../App.jsx';
import { MOCK_ADDRESS, USE_STATIC_DATA } from '../config/mock.js';

function WalletConnect() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { t } = useTranslation();
  const { isVerified, setIsVerified } = useWalletVerification();
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  
  const { signMessageAsync } = useSignMessage();

  if (USE_STATIC_DATA) {
    return (
      <div className="flex items-center gap-3 bg-primary/10 px-4 py-2 rounded-xl border border-primary/30">
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        <span className="text-sm font-medium" title={MOCK_ADDRESS}>
          {MOCK_ADDRESS.slice(0, 6)}...{MOCK_ADDRESS.slice(-4)}
        </span>
      </div>
    );
  }

  // 1. 为当前会话生成一个唯一的 Nonce（可存储于 localStorage）
  const generateNonce = () => {
    // 简单的示例：时间戳 + 随机数
    return `login-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  };

  // 2. 验证签名的核心函数（完全在前端）
  const verifySignature = async () => {
    if (!address) return;
    
    setIsVerifying(true);
    setVerificationError('');
    
    try {
      // 步骤 1: 生成或获取本次验证的唯一 Nonce
      // 可以从 localStorage 读取，确保同一会话不重复验证
      const sessionKey = `signature_nonce_${address}`;
      let nonce = localStorage.getItem(sessionKey);
      
      if (!nonce) {
        nonce = generateNonce();
        localStorage.setItem(sessionKey, nonce);
      }
      
      // 步骤 2: 构造用户友好的签名消息
      const message = `Welcome to MyDApp!\n\nPlease sign this message to verify your identity.\n\nThis won't cost any gas.\n\nNonce: ${nonce}\nAddress: ${address}\nChain: ${chain?.name || 'Unknown'}`;
      
      // 步骤 3: 请求用户签名
      const signature = await signMessageAsync({ message });
      
      // 步骤 4: 在前端验证签名（关键步骤！）
      // 方法 A: 使用 ethers.js (推荐，兼容性好)
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      // 方法 B: 使用 viem (如果你在用 viem)
      // import { verifyMessage } from 'viem'
      // const recoveredAddress = await verifyMessage({ address, message, signature })
      
      // 步骤 5: 比较恢复出的地址与当前连接地址
      if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
        console.log('前端签名验证成功！');
        setIsVerified(true);
        
        // 将验证状态存储，以便其他组件使用
        localStorage.setItem(`signature_verified_${address}`, 'true');
        localStorage.setItem(`signature_${address}`, signature); // 可选存储签名
        
        // 验证成功后，可以清除 nonce 或标记为已使用
        localStorage.setItem(sessionKey, `verified-${Date.now()}`);
        
      } else {
        console.error('签名验证失败：地址不匹配');
        setVerificationError('签名验证失败，地址不匹配');
        setIsVerified(false);
        // 验证失败时清除 nonce，允许重试
        localStorage.removeItem(sessionKey);
      }
      
    } catch (error) {
      console.error('签名验证过程出错:', error);
      
      // 处理用户拒绝签名的情况
      if (error.code === 4001 || 
          error.message?.includes('reject') || 
          error.message?.includes('denied') ||
          error.name === 'UserRejectedRequestError') {
        setVerificationError('您拒绝了签名请求');
      } else {
        setVerificationError('验证过程中出错，请重试');
      }
      
      setIsVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };

  // 3. 组件挂载时检查本地存储的验证状态
  useEffect(() => {
    if (isConnected && address && !isVerifying) {
      const storedVerified = localStorage.getItem(`signature_verified_${address}`) === 'true';
      
      // 如果本地记录已验证，直接使用；否则发起验证
      if (storedVerified) {
        setIsVerified(true);
      } else if (!storedVerified) {
        // 可设置延迟，避免一连接就立即弹出签名请求
        const timer = setTimeout(() => {
          verifySignature();
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
    
    if (!isConnected) {
      // 断开连接时重置状态（可选保留缓存）
      setIsVerified(false);
      setIsVerifying(false);
      setVerificationError('');
    }
  }, [isConnected, address, isVerifying, setIsVerified]);

  // 4. 渲染逻辑（与之前类似，但移除API相关部分）
  if (isConnected && isVerified && address) {
    return (
      <div className="flex items-center gap-3 bg-primary/10 px-4 py-2 rounded-xl border border-primary/30">
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        <span className="text-sm font-medium" title={address}>
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        {/* <span className="text-xs bg-green-500/20 px-2 py-1 rounded">已签名验证</span> */}
        <button
          onClick={() => {
            disconnect();
            // 可选：清除本地验证状态
            localStorage.removeItem(`signature_verified_${address}`);
            setIsVerified(false);
          }}
          className="text-red-400 hover:text-red-300 transition-colors"
          title="断开连接"
        >
          <Icon icon="mdi:logout" className="text-lg" />
        </button>
      </div>
    );
  }

  // ... 其他状态（正在验证、验证失败等）的渲染逻辑与之前示例类似
  // 为了简洁，这里省略，你可以参考之前的结构

  // 5. 未连接状态
  return (
    <button
      onClick={() => connect({ connector: connectors[0] })}
      disabled={isPending}
      className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-xl border border-primary/30 transition-all font-medium text-sm"
    >
      {isPending ? (
        <span className="flex items-center gap-2">
          <Icon icon="mdi:loading" className="animate-spin" />
          {t('wallet.connecting')}
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <Icon icon="mdi:wallet" />
          {t('wallet.connect')}
        </span>
      )}
    </button>
  );
}

export default WalletConnect;
