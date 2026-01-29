// Lightweight API adapter for Morgan New UI data integration
// API Base URL: http://35.78.236.133/mova
// All amount fields are in Wei format (string), need conversion: 1 ether = 10^18 wei

// const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://35.78.236.133/mova'
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://tokyoapi.morganprotocol.io/mova'

async function safeJson(response) {
  if (!response) return null
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function get(path) {
  const url = `${API_BASE}${path}`
  try {
    const res = await fetch(url, { credentials: 'omit' })
    if (!res.ok) return null
    return await safeJson(res)
  } catch {
    return null
  }
}

// ==================== Utility Functions ====================

// Wei -> Ether conversion (string to number)
export function formatWei(weiString, decimals = 4) {
  if (!weiString || weiString === '0') return '0'
  try {
    const wei = BigInt(weiString)
    const ether = Number(wei) / 1e18
    return ether.toLocaleString('en-US', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals 
    })
  } catch {
    return '0'
  }
}

// Format address to short form
export function formatAddress(address) {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Format timestamp to date string
export function formatTimestamp(timestamp) {
  if (!timestamp) return ''
  return new Date(parseInt(timestamp) * 1000).toLocaleString()
}

// 处理质押列表的时间
export function transformDay(index) {
  if (index == '0') return '1D'
  if (index == '1') return '15D'
  if (index == '2') return '30D'
}
// ==================== Home Page APIs ====================

// Get global staking statistics
export async function fetchGlobalStakeStats() {
  return await get('/api/stats/stake')
}

// Get stake statistics for specific date
export async function fetchDateStakeStats(date) {
  if (!date) return null
  return await get(`/api/stats/stake/date/${date}`)
}

// Get user complete info
export async function fetchUserInfo(address) {
  if (!address) return null
  return await get(`/api/user/${address}`)
}

// ==================== Team Page APIs ====================

// Get user team/network info
export async function fetchTeamInfo(address) {
  if (!address) return null
  return await get(`/api/team/${address}`)
}

// Get team hierarchy (including direct referrals)
export async function fetchTeamHierarchy(address) {
  if (!address) return null
  return await get(`/api/team/${address}/hierarchy`)
}

// Get user's ancestor chain
export async function fetchAncestors(address) {
  if (!address) return null
  return await get(`/api/team/${address}/ancestors`)
}

// Get all members list (paginated)
export async function fetchAllUsers(page = 1, pageSize = 10) {
  return await get(`/api/users?page=${page}&page_size=${pageSize}`)
}

// ==================== Mine Page APIs ====================

// Get user stake records
export async function fetchStakeRecords(address) {
  if (!address) return null
  return await get(`/api/stakes/${address}`)
}

// Get user unstake records
export async function fetchUnstakeRecords(address) {
  if (!address) return null
  return await get(`/api/unstakes/${address}`)
}

// Get user today's stake
export async function fetchTodayStake(address) {
  if (!address) return null
  return await get(`/api/user/${address}/today`)
}

// Get user performance details
export async function fetchPerformance(address) {
  if (!address) return null
  return await get(`/api/performance/${address}`)
}

// 查询用户社区奖励信息
export async function fetchCommunityReward(address) {
  if (!address) return null
  return await get(`/api/reward/community/${address}`)
}

// 获取用户奖励汇总
export async function fetchRewardSummary(address) {
  if (!address) return null
  return await get(`/api/rewards/${address}/summary`)
}

// ==================== Legacy APIs (for compatibility) ====================

export async function fetchApiRates({ fromToken, toToken, amountIn } = {}) {
  const path = `/rates?from=${fromToken}&to=${toToken}&amount=${amountIn ?? ''}`
  return await get(path)
}

export async function fetchApiBalance({ address, token } = {}) {
  const path = `/balances?address=${address ?? ''}&token=${token ?? ''}`
  return await get(path)
}

export async function fetchApiAllowance({ owner, token, spender } = {}) {
  const path = `/allowance?owner=${owner ?? ''}&token=${token ?? ''}&spender=${spender ?? ''}`
  return await get(path)
}

export async function fetchApiUserInfo({ address } = {}) {
  const path = `/userInfo?address=${address ?? ''}`
  return await get(path)
}

export default {
  // Utility
  formatWei,
  formatAddress,
  transformDay,
  formatTimestamp,
  // Home APIs
  fetchGlobalStakeStats,
  fetchDateStakeStats,
  fetchUserInfo,
  // Team APIs
  fetchTeamInfo,
  fetchTeamHierarchy,
  fetchAncestors,
  fetchAllUsers,
  // Mine APIs
  fetchStakeRecords,
  fetchUnstakeRecords,
  fetchTodayStake,
  fetchPerformance,
  fetchCommunityReward,
  fetchRewardSummary,
  // Legacy APIs
  fetchApiRates,
  fetchApiBalance,
  fetchApiAllowance,
  fetchApiUserInfo
}
