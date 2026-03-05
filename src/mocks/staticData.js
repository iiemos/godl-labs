import { MOCK_ADDRESS } from '../config/mock.js';

const now = Math.floor(Date.now() / 1000);

const toWei = (value) => {
  try {
    return (BigInt(Math.floor(Number(value) * 1e6)) * 10n ** 12n).toString();
  } catch {
    return '0';
  }
};

export const staticApiData = {
  globalStakeStats: {
    success: true,
    current_stake: toWei(3289456.78),
    stake_1d: toWei(584321.12),
    stake_30d: toWei(2705135.66),
  },
  dateStakeStats: {
    success: true,
    stake_data: {
      total_stake: toWei(182431.34),
      stake_1d: toWei(53219.21),
      stake_30d: toWei(129212.13),
    },
    unstake_data: {
      total_unstake: toWei(76321.55),
      unstake_1d: toWei(21873.11),
      unstake_30d: toWei(54448.44),
    },
  },
  userInfo: {
    success: true,
    address: MOCK_ADDRESS,
    team_level: 6,
    is_valid_user: true,
    valid_direct_count: 9,
    referrer: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
    personal_performance: toWei(12890.56),
    team_performance: toWei(356790.44),
  },
  teamInfo: {
    success: true,
    team_count: 128,
    direct_count: 16,
    user: {
      direct_performance: toWei(64020.3),
    },
  },
  teamHierarchy: {
    success: true,
    direct_referrals: [
      {
        address: '0x9A676e781A523b5d0C0e43731313A708CB607508',
        team_level: 4,
        is_valid_user: true,
        personal_performance: toWei(4021.55),
        team_performance: toWei(58900.12),
      },
      {
        address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
        team_level: 2,
        is_valid_user: true,
        personal_performance: toWei(1870.2),
        team_performance: toWei(12321.77),
      },
      {
        address: '0x14dc79964da2c08b23698b3d3cc7ca32193d9955',
        team_level: 1,
        is_valid_user: false,
        personal_performance: toWei(220.5),
        team_performance: toWei(1024.6),
      },
    ],
  },
  ancestors: {
    success: true,
    ancestors: [
      '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
      '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835Cb2',
    ],
  },
  allUsers: {
    success: true,
    page: 1,
    page_size: 10,
    total: 3,
    users: [
      {
        address: MOCK_ADDRESS,
        team_level: 6,
      },
      {
        address: '0x9A676e781A523b5d0C0e43731313A708CB607508',
        team_level: 4,
      },
      {
        address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
        team_level: 2,
      },
    ],
  },
  stakeRecords: {
    success: true,
    stakes: [
      {
        id: 'stake-1',
        amount: toWei(800),
        status: false,
        stake_time: String(now - 3600 * 8),
        stake_index: 1,
      },
      {
        id: 'stake-2',
        amount: toWei(200),
        status: false,
        stake_time: String(now - 3600 * 2),
        stake_index: 0,
      },
    ],
  },
  unstakeRecords: {
    success: true,
    data: [
      {
        id: 'unstake-1',
        reward: toWei(36.5),
        unstake_time: String(now - 86400),
      },
      {
        id: 'unstake-2',
        reward: toWei(12.3),
        unstake_time: String(now - 86400 * 2),
      },
    ],
  },
  todayStake: {
    success: true,
    today_personal_stake: toWei(520),
    today_team_stake: toWei(16420),
  },
  performance: {
    success: true,
    small_area_performance: toWei(48620),
    team_performance: toWei(356790.44),
  },
  communityReward: {
    success: true,
    is_eligible: true,
    pending_reward: toWei(188.88),
  },
  rewardSummary: {
    success: true,
    data: [
      { reward_type: 'stake', total_amount: toWei(628.25) },
      { reward_type: 'team', total_amount: toWei(1102.2) },
      { reward_type: 'direct', total_amount: toWei(315.6) },
    ],
  },
  communityRewardSign: {
    success: true,
    level: 6,
    amount: toWei(188.88),
    nonce: '1',
    deadline: String(now + 86400),
    signature: `0x${'11'.repeat(65)}`,
    contract: '0x9d44c9aC514b2C1095B993232f4501780702A048',
  },
  legacy: {
    rates: { success: true, rate: '1.245' },
    balance: { success: true, balance: toWei(12000) },
    allowance: { success: true, allowance: toWei(1000000) },
    userInfo: { success: true, user: { address: MOCK_ADDRESS } },
  },
};

export const staticStakeData = {
  usdtBalance: '12000',
  aigBalance: '1280',
  userTotalStaked: '1000',
  hourlyLimitByType: [50000, 200000],
  remainingHourlyLimitByType: [48120, 172400],
  userReinvestTaxObj: {
    canClaim: true,
    amount: '30.5',
    unstakeAmount: '300',
    unstakeTime: String(now - 3600),
  },
  isStakingStarted: true,
  stakeList: [
    {
      oriStakeTime: now - 3600 * 10,
      amount: '800',
      amountWei: 800,
      status: false,
      stakeIndex: 1,
      reward: '42.20',
      canEndData: now + 3600 * 20,
      bEndData: false,
    },
    {
      oriStakeTime: now - 3600 * 30,
      amount: '200',
      amountWei: 200,
      status: false,
      stakeIndex: 0,
      reward: '6.80',
      canEndData: now - 600,
      bEndData: false,
    },
  ],
};

export const staticSwapData = {
  usdtBalance: '6000',
  mgnBalance: '1520',
  usdtAllowanceForTrading: '1000000',
  usdtAllowance: '1000000',
  mgnAllowance: '1000000',
  userInfo: {
    limit: '5000.000',
    bought: '1200.000',
    remaining: '3800.000',
    hasQuota: true,
  },
  usd1ToMgnRate: '1.245000',
  mgnToUsd1Rate: '0.803213',
  isPaused: false,
};
