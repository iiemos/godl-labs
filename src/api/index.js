import { USE_STATIC_DATA, MOCK_ADDRESS } from '../config/mock.js';
import { staticApiData } from '../mocks/staticData.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://tokyoapi.morganprotocol.io/mova';

function clone(data) {
  if (data == null) return data;
  return JSON.parse(JSON.stringify(data));
}

async function safeJson(response) {
  if (!response) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function get(path) {
  const url = `${API_BASE}${path}`;
  try {
    const res = await fetch(url, { credentials: 'omit' });
    if (!res.ok) return null;
    return await safeJson(res);
  } catch {
    return null;
  }
}

async function post(path, body) {
  const url = `${API_BASE}${path}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      body: JSON.stringify(body ?? {}),
    });
    if (!res.ok) return null;
    return await safeJson(res);
  } catch {
    return null;
  }
}

function getStaticUserInfo(address) {
  const data = clone(staticApiData.userInfo);
  data.address = address || MOCK_ADDRESS;
  return data;
}

export function formatWei(weiString, decimals = 4) {
  if (!weiString || weiString === '0') return '0';
  try {
    const wei = BigInt(weiString);
    const ether = Number(wei) / 1e18;
    return ether.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
  } catch {
    return '0';
  }
}

export function formatAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  return new Date(parseInt(timestamp, 10) * 1000).toLocaleString();
}

export function transformDay(index) {
  if (index == '0') return '1D';
  if (index == '1') return '15D';
  if (index == '2') return '30D';
  return '';
}

export async function fetchGlobalStakeStats() {
  if (USE_STATIC_DATA) return clone(staticApiData.globalStakeStats);
  return await get('/api/stats/stake');
}

export async function fetchDateStakeStats(date) {
  if (!date) return null;
  if (USE_STATIC_DATA) return clone(staticApiData.dateStakeStats);
  return await get(`/api/stats/stake/date/${date}`);
}

export async function fetchUserInfo(address) {
  if (USE_STATIC_DATA) return getStaticUserInfo(address);
  if (!address) return null;
  return await get(`/api/user/${address}`);
}

export async function fetchTeamInfo(address) {
  if (USE_STATIC_DATA) return clone(staticApiData.teamInfo);
  if (!address) return null;
  return await get(`/api/team/${address}`);
}

export async function fetchTeamHierarchy(address) {
  if (USE_STATIC_DATA) return clone(staticApiData.teamHierarchy);
  if (!address) return null;
  return await get(`/api/team/${address}/hierarchy`);
}

export async function fetchAncestors(address) {
  if (USE_STATIC_DATA) return clone(staticApiData.ancestors);
  if (!address) return null;
  return await get(`/api/team/${address}/ancestors`);
}

export async function fetchAllUsers(page = 1, pageSize = 10) {
  if (USE_STATIC_DATA) {
    const data = clone(staticApiData.allUsers);
    data.page = page;
    data.page_size = pageSize;
    return data;
  }
  return await get(`/api/users?page=${page}&page_size=${pageSize}`);
}

export async function fetchStakeRecords(address) {
  if (USE_STATIC_DATA) return clone(staticApiData.stakeRecords);
  if (!address) return null;
  return await get(`/api/stakes/${address}`);
}

export async function fetchUnstakeRecords(address) {
  if (USE_STATIC_DATA) return clone(staticApiData.unstakeRecords);
  if (!address) return null;
  return await get(`/api/unstakes/${address}`);
}

export async function fetchTodayStake(address) {
  if (USE_STATIC_DATA) return clone(staticApiData.todayStake);
  if (!address) return null;
  return await get(`/api/user/${address}/today`);
}

export async function fetchPerformance(address) {
  if (USE_STATIC_DATA) return clone(staticApiData.performance);
  if (!address) return null;
  return await get(`/api/performance/${address}`);
}

export async function fetchCommunityReward(address) {
  if (USE_STATIC_DATA) return clone(staticApiData.communityReward);
  if (!address) return null;
  return await get(`/api/reward/community/${address}/snapshot`);
}

export async function requestCommunityRewardSignature({ user, amount, user_signature, message, contract } = {}) {
  if (USE_STATIC_DATA) {
    const data = clone(staticApiData.communityRewardSign);
    if (amount != null) data.amount = amount;
    if (contract) data.contract = contract;
    if (user) data.user = user;
    if (user_signature) data.user_signature = user_signature;
    if (message) data.message = message;
    return data;
  }

  if (!user || !user_signature || !message) return null;
  const payload = {
    user,
    amount: amount ?? null,
    user_signature,
    message,
  };
  if (contract) payload.contract = contract;
  return await post('/api/reward/community/sign', payload);
}

export async function fetchRewardSummary(address) {
  if (USE_STATIC_DATA) return clone(staticApiData.rewardSummary);
  if (!address) return null;
  return await get(`/api/rewards/${address}/summary`);
}

export async function fetchApiRates({ fromToken, toToken, amountIn } = {}) {
  if (USE_STATIC_DATA) return clone(staticApiData.legacy.rates);
  const path = `/rates?from=${fromToken}&to=${toToken}&amount=${amountIn ?? ''}`;
  return await get(path);
}

export async function fetchApiBalance({ address, token } = {}) {
  if (USE_STATIC_DATA) return clone(staticApiData.legacy.balance);
  const path = `/balances?address=${address ?? ''}&token=${token ?? ''}`;
  return await get(path);
}

export async function fetchApiAllowance({ owner, token, spender } = {}) {
  if (USE_STATIC_DATA) return clone(staticApiData.legacy.allowance);
  const path = `/allowance?owner=${owner ?? ''}&token=${token ?? ''}&spender=${spender ?? ''}`;
  return await get(path);
}

export async function fetchApiUserInfo({ address } = {}) {
  if (USE_STATIC_DATA) return clone(staticApiData.legacy.userInfo);
  const path = `/userInfo?address=${address ?? ''}`;
  return await get(path);
}

export default {
  formatWei,
  formatAddress,
  transformDay,
  formatTimestamp,
  fetchGlobalStakeStats,
  fetchDateStakeStats,
  fetchUserInfo,
  fetchTeamInfo,
  fetchTeamHierarchy,
  fetchAncestors,
  fetchAllUsers,
  fetchStakeRecords,
  fetchUnstakeRecords,
  fetchTodayStake,
  fetchPerformance,
  fetchCommunityReward,
  requestCommunityRewardSignature,
  fetchRewardSummary,
  fetchApiRates,
  fetchApiBalance,
  fetchApiAllowance,
  fetchApiUserInfo,
};
