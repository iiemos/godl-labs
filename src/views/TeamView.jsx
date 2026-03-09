import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useAccount } from "wagmi";
import { useTranslation } from "react-i18next";
import Notification from "../components/Notification.jsx";
import { useWalletVerification } from '../App.jsx';
import { MOCK_ADDRESS, USE_STATIC_DATA } from '../config/mock.js';
import {
  fetchUserInfo,
  fetchTeamHierarchy,
  formatWei,
  formatAddress,
} from "../api/index.js";

const INITIAL_PROPOSALS = [
  {
    id: "P-240301",
    titleKey: "teamPage.initialProposal1Title",
    descriptionKey: "teamPage.initialProposal1Desc",
    title: "Launch GDL/USGD second pool",
    description: "Open the second pool with weight 3 according to whitepaper schedule.",
    proposer: "0xA8B4...D901",
    createdAt: "2026-03-01 10:00",
    endsAt: "2026-03-10 10:00",
    yesVotes: 1240.5,
    noVotes: 128.3,
  },
  {
    id: "P-240227",
    titleKey: "teamPage.initialProposal2Title",
    descriptionKey: "teamPage.initialProposal2Desc",
    title: "USGD/GODL swap fee parameter",
    description: "Set swap fee to 0.3% for GDL buyback and burn.",
    proposer: "0xB172...3F2C",
    createdAt: "2026-02-27 09:30",
    endsAt: "2026-03-05 09:30",
    yesVotes: 965.2,
    noVotes: 401.6,
  },
];

function TeamView() {
  const { address: walletAddress, isConnected: walletConnected } = useAccount();
  const address = USE_STATIC_DATA ? MOCK_ADDRESS : walletAddress;
  const isConnected = USE_STATIC_DATA ? true : walletConnected;
  const { t } = useTranslation();
  const { isVerified: walletVerified } = useWalletVerification();
  const isVerified = USE_STATIC_DATA ? true : walletVerified;
  // const {  isConnected } = useAccount();
  // const address = '0xc4bbfad25740517144361a4215054ecd8b70c148'
  // User info
  const [userInfo, setUserInfo] = useState(null);
  const [userLoading, setUserLoading] = useState(false);

  // Direct referrals list
  const [directUsers, setDirectUsers] = useState([]);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);

  // Governance proposal modal
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [notifications, setNotifications] = useState([]); // 通知数组
  const [proposals, setProposals] = useState(INITIAL_PROPOSALS);
  const [proposalForm, setProposalForm] = useState({
    title: "",
    description: "",
    durationDays: 3,
  });
  const [voteHistory, setVoteHistory] = useState({});
  const [walletGdlBalance, setWalletGdlBalance] = useState(5000);
  const [stakedGdl, setStakedGdl] = useState(1200);
  const [stakeInput, setStakeInput] = useState("100");
  
  // Notification helper functions
  const showNotification = (message, type = 'info') => {
    const notificationId = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id: notificationId, message, type }]);
  };
  
  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Fetch user info
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
      } catch (e) {
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

  // Fetch 获取直接推荐
  useEffect(() => {
    let mounted = true;
    async function loadHierarchy() {
      if (!isConnected || !address || !isVerified) {
        setDirectUsers([]);
        return;
      }
      setHierarchyLoading(true);
      try {
        const res = await fetchTeamHierarchy(address);
        if (mounted && res && res.success) {
          setDirectUsers(res.direct_referrals || []);
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setHierarchyLoading(false);
      }
    }
    loadHierarchy();
    return () => {
      mounted = false;
    };
  }, [address, isConnected, isVerified]);

  // Get level icon based on team level
  const getLevelIcon = (level) => {
    if (level >= 5) return { icon: "mdi:diamond", color: "text-primary" };
    if (level >= 3)
      return { icon: "mdi:military-tech", color: "text-yellow-500" };
    return { icon: "mdi:workspace-premium", color: "text-gray-400" };
  };

  const getProposalStatus = (proposal) => {
    const endAt = new Date(proposal.endsAt).getTime();
    return endAt > Date.now() ? "active" : "closed";
  };

  const votingPower = Math.max(1, Number((stakedGdl / 100).toFixed(2)));
  const activeProposalCount = proposals.filter((item) => getProposalStatus(item) === "active").length;
  const closedProposalCount = proposals.length - activeProposalCount;
  const votedProposalCount = Object.keys(voteHistory).length;
  const totalVotes = proposals.reduce((sum, item) => sum + item.yesVotes + item.noVotes, 0);
  const yesVotes = proposals.reduce((sum, item) => sum + item.yesVotes, 0);
  const supportRate = totalVotes > 0 ? ((yesVotes / totalVotes) * 100).toFixed(1) : "0.0";
  const totalGdl = walletGdlBalance + stakedGdl;
  const governanceStakeRate = totalGdl > 0 ? ((stakedGdl / totalGdl) * 100).toFixed(1) : "0.0";

  const handleVoteProposal = (proposalId, support) => {
    if (!isConnected || !address) {
      showNotification(t('error.connectWallet'), "error");
      return;
    }
    if (!isVerified) {
      showNotification(t('fuelExchange.errorVerifyWallet'), "error");
      return;
    }
    if (voteHistory[proposalId]) {
      showNotification(t('teamPage.errorVoted'), "error");
      return;
    }

    const targetProposal = proposals.find((item) => item.id === proposalId);
    if (!targetProposal || getProposalStatus(targetProposal) !== "active") {
      showNotification(t('teamPage.errorProposalClosed'), "error");
      return;
    }

    setProposals((prev) =>
      prev.map((item) => {
        if (item.id !== proposalId) return item;
        if (support === "yes") {
          return { ...item, yesVotes: Number((item.yesVotes + votingPower).toFixed(2)) };
        }
        return { ...item, noVotes: Number((item.noVotes + votingPower).toFixed(2)) };
      })
    );
    setVoteHistory((prev) => ({ ...prev, [proposalId]: support }));
    showNotification(
      t('teamPage.voteSuccess', {
        action: support === "yes" ? t('teamPage.support') : t('teamPage.oppose'),
        power: votingPower
      }),
      "success"
    );
  };

  const handleCreateProposal = () => {
    if (!isConnected || !address) {
      showNotification(t('error.connectWallet'), "error");
      return;
    }
    if (!isVerified) {
      showNotification(t('fuelExchange.errorVerifyWallet'), "error");
      return;
    }
    const title = proposalForm.title.trim();
    const description = proposalForm.description.trim();
    if (!title || !description) {
      showNotification(t('teamPage.errorIncompleteProposal'), "error");
      return;
    }

    const now = new Date();
    const end = new Date(now.getTime() + Number(proposalForm.durationDays) * 24 * 60 * 60 * 1000);
    const newProposal = {
      id: `P-${Date.now().toString().slice(-6)}`,
      title,
      description,
      proposer: formatAddress(address),
      createdAt: now.toLocaleString(),
      endsAt: end.toLocaleString(),
      yesVotes: 0,
      noVotes: 0,
    };
    setProposals((prev) => [newProposal, ...prev]);
    setProposalForm({ title: "", description: "", durationDays: 3 });
    setShowProposalModal(false);
    showNotification(t('teamPage.proposalPublished'), "success");
  };

  const handleStakeGovernance = (mode) => {
    if (!isConnected || !address) {
      showNotification(t('error.connectWallet'), "error");
      return;
    }
    if (!isVerified) {
      showNotification(t('fuelExchange.errorVerifyWallet'), "error");
      return;
    }
    const amount = Number(stakeInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      showNotification(t('teamPage.errorInvalidGdl'), "error");
      return;
    }

    if (mode === "stake") {
      if (amount > walletGdlBalance) {
        showNotification(t('teamPage.errorInsufficientWalletGdl'), "error");
        return;
      }
      setWalletGdlBalance((prev) => Number((prev - amount).toFixed(2)));
      setStakedGdl((prev) => Number((prev + amount).toFixed(2)));
      showNotification(t('teamPage.successStakeGovernance', { amount }), "success");
      return;
    }

    if (amount > stakedGdl) {
      showNotification(t('teamPage.errorInsufficientStakedGdl'), "error");
      return;
    }
    setStakedGdl((prev) => Number((prev - amount).toFixed(2)));
    setWalletGdlBalance((prev) => Number((prev + amount).toFixed(2)));
    showNotification(t('teamPage.successRedeemGovernance', { amount }), "success");
  };
  return (
    <div className=" dark:bg-background-dark font-display text-white min-h-screen">
      <div className="flex flex-col lg:flex-row h-screen overflow-hidden">
        <div className="flex-1 flex flex-col overflow-y-auto pb-24 lg:pb-0">
          <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-blue/5 rounded-full blur-[120px]"></div>
          </div>

          {/* 通知系统 */}
          <Notification notifications={notifications} onClose={clearNotification} />

          <div className="relative z-10 layout-container flex h-full grow flex-col">
            <main className="max-w-[1440px] mx-auto w-full px-4 md:px-10 py-8 pt-18">
              {/* Page Heading */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="flex flex-col gap-2">
                  <p className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                    {t('team.title')}
                  </p>
                  <p className="text-[#a692c9] text-base font-normal">
                    {t('team.subtitle')}
                  </p>
                </div>
                <button
                  className="flex items-center gap-2 rounded-xl h-12 px-6 bg-white/5 border border-white/10 text-white text-lg font-bold hover:bg-white/10 transition-all"
                  onClick={() => setShowProposalModal(true)}
                >
                  <Icon icon="mdi:person-add" />
                  <span>{t('teamPage.proposeButton')}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                <div className="glass-panel rounded-xl py-3 px-6 lg:p-6  flex flex-col gap-1 lg:gap-2 neon-border-purple border-l-4 border-l-white/20">
                  <p className="text-[#a692c9] text-xs font-semibold uppercase tracking-wider">
                    {t('teamPage.governanceLevel')}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-2xl font-bold leading-tight">
                      {userLoading ? "..." : `S${userInfo?.team_level ?? 0}`}
                    </p>
                    <p className="text-primary text-lg font-medium flex items-center">
                      <Icon icon="mdi:star" className="text-lg mr-1" />
                      {t('teamPage.weightTier')}
                    </p>
                  </div>
                </div>

                <div className="glass-panel rounded-xl py-3 px-6 lg:p-6  flex flex-col gap-1 lg:gap-2 neon-border-purple border-l-4 border-l-primary">
                  <p className="text-[#a692c9] text-xs font-semibold uppercase tracking-wider">
                    {t('teamPage.governanceAddresses')}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-3xl font-bold leading-tight">
                      {hierarchyLoading ? "..." : directUsers.length}
                    </p>
                    <p className="text-accent-blue text-lg font-medium flex items-center">
                      <Icon icon="mdi:account-group" className="text-lg mr-1" />
                      {t('teamPage.address')}
                    </p>
                  </div>
                </div>

                <div className="glass-panel rounded-xl py-3 px-6 lg:p-6  flex flex-col gap-1 lg:gap-2 neon-border-purple border-l-4 border-l-primary">
                  <p className="text-[#a692c9] text-xs font-semibold uppercase tracking-wider">
                    {t('teamPage.activeProposals')}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-3xl font-bold leading-tight">
                      {activeProposalCount}
                    </p>
                    <p className="text-[#0bda6f] text-lg font-medium flex items-center">{t('teamPage.active')}</p>
                  </div>
                </div>

                <div className="glass-panel rounded-xl py-3 px-6 lg:p-6  flex flex-col gap-1 lg:gap-2 neon-border-purple border-l-4 border-l-primary">
                  <p className="text-[#a692c9] text-xs font-semibold uppercase tracking-wider">
                    {t('teamPage.closedProposals')}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-3xl font-bold leading-tight">
                      {closedProposalCount}
                    </p>
                    <p className="text-[#0bda6f] text-lg font-medium flex items-center">{t('teamPage.closed')}</p>
                  </div>
                </div>

              </div>
              <div className="line h-px bg-primary/50 my-8"></div>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">

                <div className="glass-panel rounded-xl py-2 px-6 lg:p-6 flex flex-col gap-1 lg:gap-2 neon-border-purple border-l-4 border-l-accent-blue">
                  <p className="text-[#a692c9] text-xs font-semibold uppercase tracking-wider">
                    {t('teamPage.myVotes')}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-3xl font-bold leading-tight text-accent-blue">
                      {votedProposalCount}
                    </p>
                    <p className="text-[#0bda6f] text-lg font-medium flex items-center">
                      <Icon icon="mdi:check-circle" className="text-lg mr-1" />
                      / {proposals.length}
                    </p>
                  </div>
                </div>

                <div className="glass-panel rounded-xl py-2 px-6 lg:p-6 flex flex-col gap-1 lg:gap-2 neon-border-purple border-l-4 border-l-primary">
                  <p className="text-[#a692c9] text-xs font-semibold uppercase tracking-wider">
                    {t('teamPage.totalVotes')}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-2xl font-bold leading-tight truncate">
                      {totalVotes.toFixed(1)}
                    </p>
                    <p className="text-[#0bda6f] text-lg font-medium flex items-center">
                      {t('teamPage.supportRate')} {supportRate}%
                    </p>
                  </div>
                </div>


                <div className="glass-panel rounded-xl py-2 px-6 lg:p-6  flex flex-col gap-1 lg:gap-2 neon-border-purple border-l-4 border-l-purple-500">
                  <p className="text-[#a692c9] text-xs font-semibold uppercase tracking-wider">
                    {t('teamPage.stakedGdl')}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-3xl font-bold leading-tight text-purple-400">
                      {stakedGdl}
                    </p>
                    <p className="text-purple-400 text-lg font-medium flex items-center">
                      {t('teamPage.weight')} {votingPower}
                    </p>
                  </div>
                </div>

                <div className="glass-panel rounded-xl py-2 px-6 lg:p-6  flex flex-col gap-1 lg:gap-2 neon-border-purple border-l-4 border-l-blue-500">
                  <p className="text-[#a692c9] text-xs font-semibold uppercase tracking-wider">
                    {t('teamPage.availableGdl')}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-3xl font-bold leading-tight text-blue-400">
                      {walletGdlBalance}
                    </p>
                    <p className="text-blue-400 text-lg font-medium flex items-center">
                      {t('teamPage.stakeRate')} {governanceStakeRate}%
                    </p>
                  </div>
                </div>

              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-10">
                <div className="xl:col-span-2 glass-panel p-6 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Icon icon="mdi:vote-outline" className="text-primary" />
                      {t('teamPage.proposalList')}
                    </h3>
                    <p className="text-sm text-white/60">{t('teamPage.myVotingPower', { power: votingPower })}</p>
                  </div>

                  {proposals.length === 0 ? (
                    <div className="text-center text-white/40 py-12">{t('teamPage.noProposal')}</div>
                  ) : (
                    <div className="space-y-4">
                      {proposals.map((proposal) => {
                        const status = getProposalStatus(proposal);
                        const totalVotes = proposal.yesVotes + proposal.noVotes;
                        const yesRate = totalVotes > 0 ? (proposal.yesVotes / totalVotes) * 100 : 0;
                        const hasVoted = !!voteHistory[proposal.id];
                        return (
                          <div key={proposal.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                              <div>
                                <p className="text-white font-bold text-lg">{proposal.titleKey ? t(proposal.titleKey) : proposal.title}</p>
                                <p className="text-white/60 text-sm mt-1">{proposal.descriptionKey ? t(proposal.descriptionKey) : proposal.description}</p>
                              </div>
                              <span
                                className={`px-3 py-1 rounded text-xs font-bold w-fit ${
                                  status === "active" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-300"
                                }`}
                              >
                                {status === "active" ? t('teamPage.statusActive') : t('teamPage.statusClosed')}
                              </span>
                            </div>

                            <div className="text-xs text-white/60 flex flex-wrap gap-4 mb-3">
                              <span>{t('teamPage.proposalId')}: {proposal.id}</span>
                              <span>{t('teamPage.proposer')}: {proposal.proposer}</span>
                              <span>{t('teamPage.deadline')}: {proposal.endsAt}</span>
                            </div>

                            <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-2">
                              <div className="h-full bg-green-500" style={{ width: `${yesRate}%` }} />
                            </div>
                            <div className="flex items-center justify-between text-sm mb-4">
                              <span className="text-green-400">{t('teamPage.support')}: {proposal.yesVotes}</span>
                              <span className="text-red-400">{t('teamPage.oppose')}: {proposal.noVotes}</span>
                            </div>

                            <div className="flex gap-3">
                              <button
                                className={`flex-1 py-2 rounded-lg font-bold ${
                                  status === "active" && !hasVoted
                                    ? "bg-green-500/20 text-green-300 hover:bg-green-500/30"
                                    : "bg-gray-500/20 text-gray-400 cursor-not-allowed"
                                }`}
                                disabled={status !== "active" || hasVoted}
                                onClick={() => handleVoteProposal(proposal.id, "yes")}
                              >
                                {t('teamPage.support')}
                              </button>
                              <button
                                className={`flex-1 py-2 rounded-lg font-bold ${
                                  status === "active" && !hasVoted
                                    ? "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                                    : "bg-gray-500/20 text-gray-400 cursor-not-allowed"
                                }`}
                                disabled={status !== "active" || hasVoted}
                                onClick={() => handleVoteProposal(proposal.id, "no")}
                              >
                                {t('teamPage.oppose')}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="glass-panel p-6 rounded-xl border border-white/10 h-fit">
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-5">
                    <Icon icon="mdi:database-lock-outline" className="text-primary" />
                    {t('teamPage.governanceStake')}
                  </h3>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">{t('teamPage.walletBalance')}</span>
                      <span className="font-bold">{walletGdlBalance} GDL</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">{t('teamPage.stakedGdl')}</span>
                      <span className="font-bold text-primary">{stakedGdl} GDL</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">{t('teamPage.currentWeight')}</span>
                      <span className="font-bold">{votingPower}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={stakeInput}
                      onChange={(e) => setStakeInput(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-primary"
                      placeholder={t('teamPage.inputGdl')}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        className="py-2 rounded-lg font-bold bg-primary/20 text-primary hover:bg-primary/30"
                        onClick={() => handleStakeGovernance("stake")}
                      >
                        {t('teamPage.stake')}
                      </button>
                      <button
                        className="py-2 rounded-lg font-bold bg-white/10 text-white hover:bg-white/20"
                        onClick={() => handleStakeGovernance("unstake")}
                      >
                        {t('teamPage.redeem')}
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                    {t('teamPage.stakeHelp')}
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-xl border border-white/10 mb-20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Icon icon="mdi:account-group-outline" className="text-primary" />
                    {t('teamPage.participants')}
                  </h3>
                  <span className="text-sm text-white/60">{t('teamPage.addressCount', { count: directUsers.length })}</span>
                </div>

                {hierarchyLoading ? (
                  <div className="text-center text-white/40 py-8">{t('team.loadingTeamMembers')}</div>
                ) : directUsers.length === 0 ? (
                  <div className="text-center text-white/40 py-8">
                    {isConnected ? t('teamPage.noMemberData') : t('team.connectWalletToView')}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {directUsers.slice(0, 6).map((user, index) => {
                      const levelInfo = getLevelIcon(user.team_level || 0);
                      return (
                        <div key={user.address || index} className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-mono text-sm">{formatAddress(user.address)}</p>
                            <Icon icon={levelInfo.icon} className={levelInfo.color} />
                          </div>
                          <p className="text-xs text-white/60 mb-1">{t('teamPage.governanceLevelShort', { level: user.team_level || 0 })}</p>
                          <p className="text-xs text-white/60">{t('teamPage.governancePerformance', { value: formatWei(user.team_performance || "0", 0) })}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </main>

            {/* Proposal Modal */}
            {showProposalModal && (
              <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                <div className="glass-panel rounded-xl p-6 w-full max-w-lg">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{t('teamPage.createProposal')}</h2>
                    <button
                      onClick={() => setShowProposalModal(false)}
                      className="text-white/60 hover:text-white transition-colors"
                    >
                      <Icon icon="mdi:close" className="text-xl" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[#a692c9] text-sm mb-2">{t('teamPage.proposalTitle')}</p>
                      <input
                        value={proposalForm.title}
                        onChange={(e) => setProposalForm((prev) => ({ ...prev, title: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary"
                        placeholder={t('teamPage.proposalTitlePlaceholder')}
                      />
                    </div>

                    <div>
                      <p className="text-[#a692c9] text-sm mb-2">{t('teamPage.proposalContent')}</p>
                      <textarea
                        value={proposalForm.description}
                        onChange={(e) => setProposalForm((prev) => ({ ...prev, description: e.target.value }))}
                        className="w-full min-h-28 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary"
                        placeholder={t('teamPage.proposalContentPlaceholder')}
                      />
                    </div>

                    <div>
                      <p className="text-[#a692c9] text-sm mb-2">{t('teamPage.votingPeriod')}</p>
                      <select
                        value={proposalForm.durationDays}
                        onChange={(e) => setProposalForm((prev) => ({ ...prev, durationDays: Number(e.target.value) }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary"
                      >
                        <option value={1}>{t('teamPage.day1')}</option>
                        <option value={3}>{t('teamPage.day3')}</option>
                        <option value={7}>{t('teamPage.day7')}</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={() => setShowProposalModal(false)}
                        className="py-3 rounded-lg border border-white/20 text-white/80 hover:bg-white/10"
                      >
                        {t('teamPage.cancel')}
                      </button>
                      <button
                        onClick={handleCreateProposal}
                        className="py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary/90"
                      >
                        {t('teamPage.publish')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Animated Grid Background */}
      <div className="fixed inset-0 z-0 bg-grid opacity-50 pointer-events-none"></div>
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,59,237,0.1)_0%,transparent_50%)] pointer-events-none"></div>
      
    </div>
  );
}

export default TeamView;
