import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import {
  fetchUserInfo,
  fetchUnstakeRecords,
  fetchCommunityReward,
  fetchRewardSummary,
  requestCommunityRewardSignature,
  formatWei,
  formatAddress,
  formatTimestamp,
} from '../api/index.js';
import CommunityRewardABI from '../abis/CommunityReward.json';
import NodeRewardDistributorABI from '../abis/NodeRewardDistributor.json';
import { useNotification, useWalletVerification } from '../App.jsx';
import { MOCK_ADDRESS, USE_STATIC_DATA } from '../config/mock.js';

const EMISSION_CONFIG = {
  total: 240000000,
  firstDay: 465575,
  dailyDecrease: 400,
  cycleDays: 1095,
};

const MINING_POOLS = [
  {
    id: 'pool1',
    name: 'USGD / USDT',
    weight: 1,
    status: 'active',
    statusText: '已开放',
    note: '第一矿池',
    apy: '动态',
    desc: '当前可参与，按权重参与 GDL 爆块奖励分配。',
  },
  {
    id: 'pool2',
    name: 'GDL / USGD',
    weight: 3,
    status: 'upcoming',
    statusText: '延后开放',
    note: '第二矿池',
    apy: '待开放',
    desc: '矿池开放后按权重 3 参与奖励分配。',
  },
];

function MineView() {
  const { address: walletAddress, isConnected: walletConnected } = useAccount();
  const address = USE_STATIC_DATA ? MOCK_ADDRESS : walletAddress;
  const isConnected = USE_STATIC_DATA ? true : walletConnected;
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { addNotification } = useNotification();
  const { isVerified: walletVerified } = useWalletVerification();
  const isVerified = USE_STATIC_DATA ? true : walletVerified;
  const CHAIN_ID = parseInt(import.meta.env.VITE_MOVA_CHAIN_ID || '61900', 10);

  const CONTRACTS = {
    COMMUNITY_REWARD: import.meta.env.VITE_COMMUNITY_REWARD_ADDRESS || '0x9d44c9aC514b2C1095B993232f4501780702A048',
    NODE_REWARD_DISTRIBUTOR: import.meta.env.VITE_NODE_REWARD_DISTRIBUTOR_ADDRESS || '0x3e9E49C8eE7aA505A4d9E89fC22154F9dc53a41B',
  };

  const [selectedPool, setSelectedPool] = useState('pool1');

  const [userInfo, setUserInfo] = useState(null);
  const [userLoading, setUserLoading] = useState(false);

  const [unstakeRecords, setUnstakeRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  const [communityReward, setCommunityReward] = useState(null);
  const [rewardLoading, setRewardLoading] = useState(false);
  const [communityRewardClaiming, setCommunityRewardClaiming] = useState(false);

  const [nodeReward, setNodeReward] = useState(null);
  const [nodeRewardLoading, setNodeRewardLoading] = useState(false);
  const [nodeRewardClaiming, setNodeRewardClaiming] = useState(false);
  const [isNode, setIsNode] = useState(false);

  const [rewardSummary, setRewardSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadUserInfo() {
      if (!isConnected || !address || !isVerified) {
        setUserInfo(null);
        return;
      }
      setUserLoading(true);
      try {
        const res = await fetchUserInfo(address);
        if (mounted && res && res.success) {
          setUserInfo(res);
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setUserLoading(false);
      }
    }
    loadUserInfo();
    return () => {
      mounted = false;
    };
  }, [address, isConnected, isVerified]);

  useEffect(() => {
    let mounted = true;
    async function loadUnstakeRecords() {
      if (!isConnected || !address || !isVerified) {
        setUnstakeRecords([]);
        return;
      }
      setRecordsLoading(true);
      try {
        const res = await fetchUnstakeRecords(address);
        if (mounted && res && res.success) {
          setUnstakeRecords(res.data || []);
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setRecordsLoading(false);
      }
    }
    loadUnstakeRecords();
    return () => {
      mounted = false;
    };
  }, [address, isConnected, isVerified]);

  useEffect(() => {
    let mounted = true;
    async function loadCommunityReward() {
      if (!isConnected || !address || !isVerified) {
        setCommunityReward(null);
        return;
      }
      setRewardLoading(true);
      try {
        const res = await fetchCommunityReward(address);
        if (mounted && res && res.success) {
          setCommunityReward(res);
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setRewardLoading(false);
      }
    }
    loadCommunityReward();
    return () => {
      mounted = false;
    };
  }, [address, isConnected, isVerified]);

  useEffect(() => {
    let mounted = true;
    async function loadNodeReward() {
      if (!isConnected || !address || !isVerified) {
        setNodeReward(null);
        setIsNode(false);
        return;
      }

      if (USE_STATIC_DATA) {
        setIsNode(true);
        setNodeReward({
          success: true,
          pending_reward: '88200000000000000000',
          is_eligible: true,
        });
        setNodeRewardLoading(false);
        return;
      }

      setNodeRewardLoading(true);
      try {
        const isNodeMember = await publicClient.readContract({
          address: CONTRACTS.NODE_REWARD_DISTRIBUTOR,
          abi: NodeRewardDistributorABI,
          functionName: 'isMember',
          args: [address],
        });

        if (!mounted) return;
        setIsNode(isNodeMember);

        if (!isNodeMember) {
          setNodeReward(null);
          return;
        }

        const pendingReward = await publicClient.readContract({
          address: CONTRACTS.NODE_REWARD_DISTRIBUTOR,
          abi: NodeRewardDistributorABI,
          functionName: 'pendingReward',
          args: [address],
        });

        if (mounted) {
          setNodeReward({
            success: true,
            pending_reward: pendingReward.toString(),
            is_eligible: true,
          });
        }
      } catch {
        if (mounted) {
          setNodeReward(null);
          setIsNode(false);
        }
      } finally {
        if (mounted) setNodeRewardLoading(false);
      }
    }

    if (!publicClient && !USE_STATIC_DATA) return;
    loadNodeReward();

    return () => {
      mounted = false;
    };
  }, [address, isConnected, isVerified, publicClient]);

  useEffect(() => {
    let mounted = true;
    async function loadRewardSummary() {
      if (!isConnected || !address || !isVerified) {
        setRewardSummary(null);
        return;
      }
      setSummaryLoading(true);
      try {
        const res = await fetchRewardSummary(address);
        if (mounted && res && res.success) {
          setRewardSummary(res);
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setSummaryLoading(false);
      }
    }
    loadRewardSummary();
    return () => {
      mounted = false;
    };
  }, [address, isConnected, isVerified]);

  const claimCommunityReward = async () => {
    if (USE_STATIC_DATA) {
      if (!communityReward?.is_eligible || communityRewardClaiming) return;
      setCommunityRewardClaiming(true);
      setCommunityReward({
        success: true,
        is_eligible: false,
        pending_reward: '0',
      });
      addNotification('success', '矿池收益领取成功');
      setCommunityRewardClaiming(false);
      return;
    }

    if (!isVerified || !isConnected || !address || !communityReward?.is_eligible || !walletClient || communityRewardClaiming) return;

    try {
      setCommunityRewardClaiming(true);

      const timestamp = Math.floor(Date.now() / 1000);
      const message = `CommunityReward Claim Request\n\nAddress: ${address}\nTimestamp: ${timestamp}\nChain: ${CHAIN_ID}`;
      const userSignature = await walletClient.signMessage({ message });

      const signRes = await requestCommunityRewardSignature({
        user: address,
        amount: null,
        user_signature: userSignature,
        message,
      });

      if (!signRes || !signRes.success) {
        throw new Error(signRes?.error || 'Failed to request signature');
      }

      const contractAddress = signRes.contract || CONTRACTS.COMMUNITY_REWARD;

      const tx = await walletClient.writeContract({
        address: contractAddress,
        abi: CommunityRewardABI,
        functionName: 'claimWithSignature',
        args: [signRes.level, signRes.amount, signRes.nonce, signRes.deadline, signRes.signature],
      });

      await publicClient.waitForTransactionReceipt({ hash: tx });

      const res = await fetchCommunityReward(address);
      if (res && res.success) {
        setCommunityReward(res);
      }

      addNotification('success', '矿池收益领取成功');
    } catch (error) {
      addNotification('error', `领取失败: ${error.message}`);
    } finally {
      setCommunityRewardClaiming(false);
    }
  };

  const claimNodeReward = async () => {
    if (USE_STATIC_DATA) {
      if (!nodeReward?.is_eligible || nodeRewardClaiming) return;
      setNodeRewardClaiming(true);
      setNodeReward({
        success: true,
        pending_reward: '0',
        is_eligible: false,
      });
      addNotification('success', '节点奖励领取成功');
      setNodeRewardClaiming(false);
      return;
    }

    if (!isVerified || !isConnected || !address || !nodeReward?.is_eligible || !walletClient || nodeRewardClaiming) return;

    try {
      setNodeRewardClaiming(true);
      const tx = await walletClient.writeContract({
        address: CONTRACTS.NODE_REWARD_DISTRIBUTOR,
        abi: NodeRewardDistributorABI,
        functionName: 'claim',
        args: [],
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });

      const latest = await publicClient.readContract({
        address: CONTRACTS.NODE_REWARD_DISTRIBUTOR,
        abi: NodeRewardDistributorABI,
        functionName: 'pendingReward',
        args: [address],
      });

      setNodeReward({
        success: true,
        pending_reward: latest.toString(),
        is_eligible: true,
      });

      addNotification('success', '节点奖励领取成功');
    } catch (error) {
      addNotification('error', `领取失败: ${error.message}`);
    } finally {
      setNodeRewardClaiming(false);
    }
  };

  const getRewardAmountByTypes = (types) => {
    if (!rewardSummary || !Array.isArray(rewardSummary.data)) return '0';
    const reward = rewardSummary.data.find((item) => types.includes(item.reward_type));
    return reward?.total_amount || '0';
  };

  const getStakeReward = () => getRewardAmountByTypes(['stake', 'staking', 'stake_profit']);
  const getTeamReward = () => getRewardAmountByTypes(['level', 'team', 'team_level_reward']);
  const getDirectReward = () => getRewardAmountByTypes(['direct_referral', 'direct', 'invite']);

  const getAllReward = () => {
    try {
      const total = BigInt(getStakeReward()) + BigInt(getTeamReward()) + BigInt(getDirectReward());
      return total.toString();
    } catch {
      return '0';
    }
  };

  const selectedPoolData = MINING_POOLS.find((pool) => pool.id === selectedPool) || MINING_POOLS[0];

  const pool1PendingWei = communityReward?.pending_reward || '0';
  const nodePendingWei = nodeReward?.pending_reward || '0';
  const selectedPoolPendingWei = selectedPool === 'pool1' ? pool1PendingWei : '0';
  const totalPendingWei = useMemo(() => {
    try {
      return (BigInt(pool1PendingWei || '0') + BigInt(nodePendingWei || '0')).toString();
    } catch {
      return '0';
    }
  }, [pool1PendingWei, nodePendingWei]);

  const handleClaimSelectedPool = () => {
    if (selectedPool === 'pool2') {
      addNotification('info', '第二矿池延后开放，暂不可领取');
      return;
    }
    claimCommunityReward();
  };

  return (
    <div className="dark:bg-background-dark text-white min-h-screen">
      <div className="flex flex-col lg:flex-row h-screen overflow-hidden">
        <div className="flex-1 flex flex-col overflow-y-auto pb-24 lg:pb-0">
          <div className="layout-container flex flex-col min-h-screen">
            <main className="flex-1 w-full max-w-[1440px] mx-auto px-6 py-20 space-y-8">
              <section className="glass-panel rounded-xl p-6 flex flex-col gap-3 neon-border-purple border-l-4 border-l-white/20">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">农场/流动池</h1>
                    <p className="text-white/60 mt-2">矿池选择、权重分配、GDL 爆块产出与收益领取</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white/50">当前地址</p>
                    <p className="font-mono text-sm">{isConnected ? formatAddress(address) : '未连接钱包'}</p>
                    <p className="text-sm text-primary mt-1">{userLoading ? '...' : `S${userInfo?.team_level ?? 0}`}</p>
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel rounded-xl py-3 px-6 lg:p-6 flex flex-col gap-1 lg:gap-2 border-l-4 border-l-primary">
                  <p className="text-[#a692c9] text-xs font-semibold uppercase tracking-wider">总产出</p>
                  <p className="text-2xl font-bold">{EMISSION_CONFIG.total.toLocaleString()}</p>
                  <p className="text-[#0bda6f] text-sm">GDL</p>
                </div>
                <div className="glass-panel rounded-xl py-3 px-6 lg:p-6 flex flex-col gap-1 lg:gap-2 border-l-4 border-l-accent-blue">
                  <p className="text-[#a692c9] text-xs font-semibold uppercase tracking-wider">首日产出</p>
                  <p className="text-2xl font-bold">{EMISSION_CONFIG.firstDay.toLocaleString()}</p>
                  <p className="text-[#0bda6f] text-sm">GDL / 日</p>
                </div>
                <div className="glass-panel rounded-xl py-3 px-6 lg:p-6 flex flex-col gap-1 lg:gap-2 border-l-4 border-l-purple-500">
                  <p className="text-[#a692c9] text-xs font-semibold uppercase tracking-wider">日递减</p>
                  <p className="text-2xl font-bold">{EMISSION_CONFIG.dailyDecrease}</p>
                  <p className="text-[#0bda6f] text-sm">GDL / 日</p>
                </div>
                <div className="glass-panel rounded-xl py-3 px-6 lg:p-6 flex flex-col gap-1 lg:gap-2 border-l-4 border-l-blue-500">
                  <p className="text-[#a692c9] text-xs font-semibold uppercase tracking-wider">产出周期</p>
                  <p className="text-2xl font-bold">3 年</p>
                  <p className="text-[#0bda6f] text-sm">{EMISSION_CONFIG.cycleDays} 天</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <section className="xl:col-span-2 glass-panel p-6 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Icon icon="mdi:database-outline" className="text-primary" />
                      矿池选择
                    </h3>
                    <p className="text-sm text-white/60">按权重分配 GDL 爆块奖励</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {MINING_POOLS.map((pool) => (
                      <button
                        key={pool.id}
                        type="button"
                        onClick={() => setSelectedPool(pool.id)}
                        className={`text-left rounded-xl border p-4 transition-all ${
                          selectedPool === pool.id
                            ? 'border-primary bg-primary/10'
                            : 'border-white/10 bg-white/5 hover:border-white/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-bold text-lg">{pool.name}</p>
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              pool.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {pool.statusText}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-white/70">
                          <p>{pool.note}</p>
                          <p>权重: {pool.weight}</p>
                          <p>APY: {pool.apy}</p>
                          <p>{pool.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-bold">当前矿池: {selectedPoolData.name}</p>
                      <p className="text-sm text-white/60">权重 {selectedPoolData.weight}</p>
                    </div>
                    <p className="text-sm text-white/70">白皮书规则：第一矿池权重 1，第二矿池（延后开放）权重 3。</p>
                  </div>
                </section>

                <aside className="glass-panel p-6 rounded-xl border border-white/10 h-fit">
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-5">
                    <Icon icon="mdi:cash-check" className="text-primary" />
                    收益领取
                  </h3>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">当前矿池待领取</span>
                      <span className="font-bold">{rewardLoading ? '...' : formatWei(selectedPoolPendingWei, 4)} GDL</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">总待领取</span>
                      <span className="font-bold text-primary">{(rewardLoading || nodeRewardLoading) ? '...' : formatWei(totalPendingWei, 4)} GDL</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">累计已领取</span>
                      <span className="font-bold">{summaryLoading ? '...' : formatWei(getAllReward(), 4)} USGD</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <button
                      className={`py-2 rounded-lg font-bold transition-all ${
                        selectedPool === 'pool1' && communityReward?.is_eligible && !communityRewardClaiming
                          ? 'bg-primary text-white hover:opacity-90'
                          : 'bg-border-dark/50 cursor-not-allowed text-white/30'
                      }`}
                      onClick={handleClaimSelectedPool}
                      disabled={selectedPool !== 'pool1' || !communityReward?.is_eligible || communityRewardClaiming}
                    >
                      {communityRewardClaiming ? '领取中...' : '领取当前矿池收益'}
                    </button>

                    <button
                      className={`py-2 rounded-lg font-bold transition-all ${
                        isNode && nodeReward?.is_eligible && !nodeRewardClaiming
                          ? 'bg-primary/20 text-primary hover:bg-primary/30'
                          : 'bg-border-dark/50 cursor-not-allowed text-white/30'
                      }`}
                      onClick={claimNodeReward}
                      disabled={!isNode || !nodeReward?.is_eligible || nodeRewardClaiming}
                    >
                      {nodeRewardClaiming ? '领取中...' : '领取节点附加奖励'}
                    </button>
                  </div>
                </aside>
              </div>

              <section className="glass-panel p-6 rounded-xl border border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Icon icon="mdi:history" className="text-primary" />
                    收益领取记录
                  </h3>
                  <span className="text-white/40 text-sm">{unstakeRecords.length} 条</span>
                </div>

                {recordsLoading ? (
                  <div className="text-center text-white/40 py-8">加载中...</div>
                ) : unstakeRecords.length === 0 ? (
                  <div className="text-center text-white/40 py-8">暂无领取记录</div>
                ) : (
                  <div className="space-y-3">
                    {unstakeRecords.slice(0, 8).map((record, index) => (
                      <div key={record.id || index} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <div>
                          <p className="font-medium">收益: ${formatWei(record.reward, 4)} USGD</p>
                          <p className="text-xs text-white/40 mt-1">{formatTimestamp(record.unstake_time)}</p>
                        </div>
                        <span className="px-2 py-1 rounded text-xs font-bold bg-green-500/20 text-green-400">已完成</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </main>
          </div>
        </div>
      </div>

      <div className="fixed inset-0 z-0 bg-grid opacity-50 pointer-events-none"></div>
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,59,237,0.1)_0%,transparent_50%)] pointer-events-none"></div>
    </div>
  );
}

export default MineView;
