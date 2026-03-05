import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import useStakeStore from '../stores/stakeStore';
import { MOCK_ADDRESS, USE_STATIC_DATA } from '../config/mock.js';

export const useWalletIntegration = () => {
  const { address: walletAddress, isConnected: walletConnected } = useAccount();
  const address = USE_STATIC_DATA ? MOCK_ADDRESS : walletAddress;
  const isConnected = USE_STATIC_DATA ? true : walletConnected;
  
  const { 
    setConnection,
    setReferrer
  } = useStakeStore();

  // Update connection state in store when wallet state changes
  useEffect(() => {
    setConnection(isConnected, address, null, null);
  }, [isConnected, address, setConnection]);

  // Extract referrer from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    // 支持两种参数名: code (与老项目一致) 和 ref
    const referrer = urlParams.get('code') || urlParams.get('ref');
    if (referrer) {
      setReferrer(referrer);
      // Store in localStorage for persistence
      localStorage.setItem('referrer', referrer);
    } else {
      // Try to get from localStorage
      const storedReferrer = localStorage.getItem('referrer');
      if (storedReferrer) {
        setReferrer(storedReferrer);
      }
    }
  }, [setReferrer]);

  return {
    isConnected,
    address
  };
};
