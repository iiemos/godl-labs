import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useAccount } from "wagmi";
import { useTranslation } from "react-i18next";
import Notification from "../components/Notification.jsx";
import ReferrerDialog from "../components/ReferrerDialog.jsx";
import { useWalletVerification } from '../App.jsx';
import { MOCK_ADDRESS, USE_STATIC_DATA } from '../config/mock.js';
import {
  fetchUserInfo,
  fetchTeamInfo,
  fetchTeamHierarchy,
  fetchTodayStake,
  fetchPerformance,
  formatWei,
  formatAddress,
} from "../api/index.js";

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

  // Team info
  const [teamInfo, setTeamInfo] = useState(null);
  const [teamLoading, setTeamLoading] = useState(false);

  // Today stake data
  const [todayStake, setTodayStake] = useState(null);
  const [todayStakeLoading, setTodayStakeLoading] = useState(false);

  // Performance data
  const [performance, setPerformance] = useState(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);

  // Direct referrals list
  const [directUsers, setDirectUsers] = useState([]);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);

  // Invite functionality
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showReferrerDialog, setShowReferrerDialog] = useState(false);
  const [notifications, setNotifications] = useState([]); // 通知数组
  
  // Notification helper functions
  const showNotification = (message, type = 'info') => {
    const notificationId = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id: notificationId, message, type }]);
  };
  
  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // 用户业绩详情 fetchPerformance
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

  // Fetch team info
  useEffect(() => {
    let mounted = true;
    async function loadTeamInfo() {
      if (!isConnected || !address || !isVerified) {
        setTeamInfo(null);
        return;
      }
      setTeamLoading(true);
      try {
        const res = await fetchTeamInfo(address);
        console.log('我的团队信息',res);
        if (mounted && res && res.success) {
          setTeamInfo(res);
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setTeamLoading(false);
      }
    }
    loadTeamInfo();
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

  // Fetch 获取今日质押数据
  useEffect(() => {
    let mounted = true;
    async function loadTodayStake() {
      if (!isConnected || !address || !isVerified) {
        setTodayStake(null);
        return;
      }
      setTodayStakeLoading(true);
      try {
        const res = await fetchTodayStake(address);
        if (mounted && res && res.success) {
          setTodayStake(res);
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setTodayStakeLoading(false);
      }
    }
    loadTodayStake();
    return () => {
      mounted = false;
    };
  }, [address, isConnected, isVerified]);

  // Fetch 获取奖励数据
  useEffect(() => {
    let mounted = true;
    async function loadPerformance() {
      if (!isConnected || !address || !isVerified) {
        setPerformance(null);
        return;
      }
      setPerformanceLoading(true);
      try {
        const res = await fetchPerformance(address);
        if (mounted && res && res.success) {
          
          setPerformance(res);
        }
      } catch (e) {
        console.log('eeeee',e);
        // ignore
      } finally {
        if (mounted) setPerformanceLoading(false);
      }
    }
    loadPerformance();
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

  // Generate invite link
  const inviteLink =
    isConnected && address ? `${window.location.origin}?code=${address}` : "";

  // Copy invite link to clipboard
  const copyInviteLink = async () => {
    if (!inviteLink) return;

    try {
      // 方法1：尝试使用 navigator.clipboard.writeText
      // if (navigator.clipboard && window.isSecureContext) {
      //   await navigator.clipboard.writeText(inviteLink);
      //   showNotification(t('team.linkCopied'), 'success');
      //   return;
      // }
      
      // 方法2：使用 document.execCommand('copy') with textarea
      const textArea = document.createElement('textarea');
      textArea.value = inviteLink;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      textArea.style.pointerEvents = 'none';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      
      // 处理不同浏览器的select行为
      textArea.select();
      textArea.setSelectionRange(0, textArea.value.length);
      
      try {
        const success = document.execCommand('copy');
        if (success) {
          showNotification(t('team.linkCopied'), 'success');
          return;
        }
      } catch (execError) {
        console.warn('execCommand copy failed:', execError);
      } finally {
        document.body.removeChild(textArea);
      }
      
      // 方法3：提示用户手动复制
      showNotification(t('team.linkCopied'), 'success');
    } catch (error) {
      console.error("Failed to copy invite link:", error);
      // 即使出错也显示复制成功，让用户手动复制
      showNotification(t('team.linkCopied'), 'success');
    }
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
                  onClick={() => setShowInviteModal(true)}
                >
                  <Icon icon="mdi:person-add" />
                  <span>{t('team.inviteNewMember')}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                <div className="glass-panel rounded-xl py-3 px-6 lg:p-6  flex flex-col gap-1 lg:gap-2 neon-border-purple border-l-4 border-l-white/20">
                  <p className="text-[#a692c9] text-xs font-semibold uppercase tracking-wider">
                    {t('team.yourLevel')}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-2xl font-bold leading-tight">
                      {userLoading ? "..." : 'S'+userInfo?.team_level || 'S0'}
                    </p>
                    <p className="text-primary text-lg font-medium flex items-center">
                      <Icon icon="mdi:star" className="text-lg mr-1" />
                      {t('team.level')} {userInfo?.team_level || 0}
                    </p>
                  </div>
                </div>

                <div className="glass-panel rounded-xl py-3 px-6 lg:p-6  flex flex-col gap-1 lg:gap-2 neon-border-purple border-l-4 border-l-primary">
                  <p className="text-[#a692c9] text-xs font-semibold uppercase tracking-wider">
                    {t('common.teamSize')}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-3xl font-bold leading-tight">
                      {teamLoading ? "..." : teamInfo?.team_count || 0}
                    </p>
                    <p className="text-accent-blue text-lg font-medium flex items-center">
                      <Icon icon="mdi:account-group" className="text-lg mr-1" />
                      {t('team.members')}
                    </p>
                  </div>
                </div>

                <div className="glass-panel rounded-xl py-3 px-6 lg:p-6  flex flex-col gap-1 lg:gap-2 neon-border-purple border-l-4 border-l-primary">
                  <p className="text-[#a692c9] text-xs font-semibold uppercase tracking-wider">
                    {t('common.directPerformance')}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-3xl font-bold leading-tight">
                      ${teamLoading ? "..." : formatWei(teamInfo?.user?.direct_performance || 0)}
                    </p>
                    <p className="text-[#0bda6f] text-lg font-medium flex items-center">
                      USDT
                    </p>
                  </div>
                </div>

                <div className="glass-panel rounded-xl py-3 px-6 lg:p-6  flex flex-col gap-1 lg:gap-2 neon-border-purple border-l-4 border-l-primary">
                  <p className="text-[#a692c9] text-xs font-semibold uppercase tracking-wider">
                    {t('common.teamTodayNewPerformance')}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-3xl font-bold leading-tight">
                      ${todayStakeLoading ? "..." : formatWei(todayStake?.today_team_stake || 0)}
                    </p>
                    <p className="text-[#0bda6f] text-lg font-medium flex items-center">
                      USDT
                    </p>
                  </div>
                </div>

              </div>
              <div className="line h-px bg-primary/50 my-8"></div>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">

                <div className="glass-panel rounded-xl py-2 px-6 lg:p-6 flex flex-col gap-1 lg:gap-2 neon-border-purple border-l-4 border-l-accent-blue">
                  <p className="text-[#a692c9] text-xs font-semibold uppercase tracking-wider">
                    {t('common.directReferrals')}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-3xl font-bold leading-tight text-accent-blue">
                      {teamLoading ? "..." : teamInfo?.direct_count || 0}
                    </p>
                    <p className="text-[#0bda6f] text-lg font-medium flex items-center">
                      <Icon icon="mdi:check-circle" className="text-lg mr-1" />
                      {t('team.valid')}: {userInfo?.valid_direct_count || 0}
                    </p>
                  </div>
                </div>

                <div className="glass-panel rounded-xl py-2 px-6 lg:p-6 flex flex-col gap-1 lg:gap-2 neon-border-purple border-l-4 border-l-primary">
                  <p className="text-[#a692c9] text-xs font-semibold uppercase tracking-wider">
                    {t('common.yourPerformance')}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-2xl font-bold leading-tight truncate">
                      {/* ${formatWei(userInfo?.team_performance || "0", 0)} */}
                      ${formatWei(userInfo?.personal_performance || "0", 0)}
                    </p>
                    <p className="text-[#0bda6f] text-lg font-medium flex items-center">
                      USDT
                    </p>
                  </div>
                </div>


                <div className="glass-panel rounded-xl py-2 px-6 lg:p-6  flex flex-col gap-1 lg:gap-2 neon-border-purple border-l-4 border-l-purple-500">
                  <p className="text-[#a692c9] text-xs font-semibold uppercase tracking-wider">
                    {t('common.smallAreaPerformance')}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-3xl font-bold leading-tight text-purple-400">
                      {performanceLoading ? "..." : performance?.small_area_performance ? `$${formatWei(performance.small_area_performance, 0)}` : "0"}
                    </p>
                    <p className="text-purple-400 text-lg font-medium flex items-center">
                      USDT
                    </p>
                  </div>
                </div>

                <div className="glass-panel rounded-xl py-2 px-6 lg:p-6  flex flex-col gap-1 lg:gap-2 neon-border-purple border-l-4 border-l-blue-500">
                  <p className="text-[#a692c9] text-xs font-semibold uppercase tracking-wider">
                    {t('common.allPerformance')}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-3xl font-bold leading-tight text-blue-400">
                      {performanceLoading ? "..." : performance?.team_performance ? `$${formatWei(performance.team_performance, 0)}` : "0"}
                    </p>
                    <p className="text-blue-400 text-lg font-medium flex items-center">
                      USDT
                    </p>
                  </div>
                </div>

              </div>

              <div className="glass-panel p-6 rounded-xl border border-white/10 mb-10">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Icon
                      icon="mdi:account-supervisor"
                      className="text-primary"
                    />
                    {t('team.yourReferrer')} & {t('team.yourInvitationLink')}
                  </h3>

                  <div className="grid lg:grid-cols-2 gap-4">
                    {/* Referrer Info */}

                    {isConnected && (
                      <div className="">
                        <p className="text-[#a692c9] text-lg mb-2">
                          {t('team.yourReferrer')}
                        </p>
                        {userInfo?.referrer && userInfo.referrer !== "0x0000000000000000000000000000000000000000" ? (
                          <div className="glass-panel p-4 rounded-lg border border-white/10 mb-4 flex items-center ">
                            <span className="text-sm text-white font-mono break-all">
                              {formatAddress(userInfo.referrer)}
                            </span>
                          </div>
                        ) : (
                          
                          <div className="">
                            <div className="glass-panel p-4 rounded-lg border border-white/10 mb-4 flex flex-col items-center gap-4">
                              <span className="text-sm text-white/60">
                                {t('team.notBound')}
                              </span>
                            </div>
                            <button
                              className="px-4 py-3 mt-4 w-full bg-primary hover:bg-primary/90 rounded-lg text-white font-bold transition-colors flex items-center justify-center gap-2"
                              onClick={() => setShowReferrerDialog(true)}
                            >
                              <Icon icon="mdi:link" />
                              {t('team.bindSuperior')}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <div>
                      <p className="text-[#a692c9] text-lg mb-2">
                        {t('team.yourInvitationLink')}
                      </p>
                      <div className=" gap-3">
                        <div className="glass-panel flex-1 bg-white/5 border border-white/10 rounded-lg p-4 text-sm font-mono break-all">
                          {inviteLink}
                        </div>
                        <button
                          onClick={copyInviteLink}
                          className="px-4 py-3 mt-4 w-full bg-primary hover:bg-primary/90 rounded-lg text-white font-bold transition-colors flex items-center justify-center gap-2"
                        >
                          <Icon icon="mdi:content-copy" />
                          <span>{t('team.copy')}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <p className="text-[#a692c9] text-lg font-medium mb-2">
                      {t('team.howItWorks')}
                    </p>
                    <ul className="text-lg space-y-2 text-white/80">
                      <li className="flex items-start gap-2">
                        <Icon
                          icon="mdi:arrow-right"
                          className="text-primary mt-1 flex-shrink-0"
                        />
                        <span>
                          {t('team.shareInviteLink')}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon
                          icon="mdi:arrow-right"
                          className="text-primary mt-1 flex-shrink-0"
                        />
                        <span>
                          {t('team.whenSomeoneJoins')}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon
                          icon="mdi:arrow-right"
                          className="text-primary mt-1 flex-shrink-0"
                        />
                        <span>
                          {t('team.earnRewards')}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Member List Header */}
              <div className="flex items-center justify-between mb-6 px-2">
                <h2 className="text-2xl font-bold leading-tight">
                  {t('team.directReferrals')}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-white/60 text-lg">
                    {directUsers.length} {t('team.members')}
                  </span>
                </div>
              </div>

              {/* Member List Grid */}
              {hierarchyLoading ? (
                <div className="text-center text-white/40 py-12">
                  {t('team.loadingTeamMembers')}
                </div>
              ) : directUsers.length === 0 ? (
                <div className="text-center text-white/40 py-12">
                  {isConnected
                    ? t('team.noDirectReferrals')
                    : t('team.connectWalletToView')}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {directUsers.map((user, index) => {
                    const levelInfo = getLevelIcon(user.team_level || 0);
                    return (
                      <div
                        key={user.address || index}
                        className="glass-panel member-card rounded-xl p-5 border border-white/5 transition-all"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <p className="font-bold text-white text-base">
                                {formatAddress(user.address)}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${
                              user.is_valid_user
                                ? "bg-[#0bda6f]/20 text-[#0bda6f] border-[#0bda6f]/30"
                                : "bg-red-500/20 text-red-500 border-red-500/30"
                            }`}
                          >
                            {user.is_valid_user ? t('team.active') : t('team.inactive')}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                          <div className="flex flex-col gap-1">
                            <p className="text-[#a692c9] text-[10px] uppercase font-bold">
                              {t('team.level')}
                            </p>
                            <p className="text-white text-lg font-semibold flex items-center gap-1">
                              <Icon
                                icon={levelInfo.icon}
                                className={`${levelInfo.color} text-base`}
                              />
                              {String('S'+user.team_level)}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <p className="text-[#a692c9] text-[10px] uppercase font-bold">
                              {t('team.performance')}
                            </p>
                            <p className="text-white text-lg font-semibold">
                              ${formatWei(user.personal_performance || "0", 0)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <p className="text-[#a692c9] text-xs">
                            {t('team.team')}: ${formatWei(user.team_performance || "0", 0)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Load More Section - only show if there are members */}
              {directUsers.length > 0 && (
                <div className="flex justify-center mt-12 mb-20">
                  <button className="px-8 py-3 rounded-xl border border-primary/40 text-primary font-bold hover:bg-primary/10 transition-all">
                    {t('team.viewAllMembers')}
                  </button>
                </div>
              )}
            </main>

            {/* Invite Modal */}
            {showInviteModal && (
              <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                <div className="glass-panel rounded-xl p-6 w-full max-w-lg">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{t('team.inviteNewMember')}</h2>
                    <button
                      onClick={() => setShowInviteModal(false)}
                      className="text-white/60 hover:text-white transition-colors"
                    >
                      <Icon icon="mdi:close" className="text-xl" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[#a692c9] text-lg mb-2">
                        {t('team.yourInvitationLink')}
                      </p>
                      <div className=" gap-3">
                        <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm font-mono">
                          {inviteLink}
                        </div>
                        <button
                          onClick={copyInviteLink}
                          className="px-4 py-3 mt-4 w-full bg-primary hover:bg-primary/90 rounded-lg text-white font-bold transition-colors flex items-center justify-center gap-2"
                        >
                          <Icon icon="mdi:content-copy" />
                          {t('team.copy')}
                        </button>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <p className="text-[#a692c9] text-lg font-medium mb-2">
                        How it works:
                      </p>
                      <ul className="text-lg space-y-2 text-white/80">
                        <li className="flex items-start gap-2">
                          <Icon
                            icon="mdi:arrow-right"
                            className="text-primary mt-1 flex-shrink-0"
                          />
                          <span>
                            Share your unique invitation link with friends
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Icon
                            icon="mdi:arrow-right"
                            className="text-primary mt-1 flex-shrink-0"
                          />
                          <span>
                            When someone joins using your link, they become your
                            direct referral
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Icon
                            icon="mdi:arrow-right"
                            className="text-primary mt-1 flex-shrink-0"
                          />
                          <span>
                            Earn rewards based on your team's performance
                          </span>
                        </li>
                      </ul>
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
      
      {/* Referrer Dialog */}
      <ReferrerDialog visible={showReferrerDialog} onClose={() => setShowReferrerDialog(false)} autoCloseIfBound={false} />
    </div>
  );
}

export default TeamView;
