export type NodeCategory = 'bandwidth' | 'storage' | 'gpu' | 'validator';

export interface DePINNode {
  id: string;
  name: string;
  ownerAddress: string;
  category: NodeCategory;
  ipAddress: string;
  hardwareSpec: string;
  status: 'online' | 'offline' | 'registering';
  uptimeSeconds: number;
  totalUptimePercent: number;
  bandwidthMbps: number;
  storageGB: number;
  gpuScores: number; // TFLOPS if category === 'gpu'
  reputationScore: number; // 0 to 100
  registeredAt: string;
  lastHeartbeatAt: string;
  accumulatedRewards: string; // in RENRIS wei or formatted
  pendingClaimable: string;  // in RENRIS formatted
}

export interface NodeMetricsUpdate {
  nodeId: string;
  timestamp: string;
  signature: string;
  cpuUsage: number;
  memoryUsage: number;
  networkInMbps: number;
  networkOutMbps: number;
  storageUsedGB: number;
  gpuLoadProgress?: number;
}

export interface NetworkStats {
  totalNodes: number;
  activeNodes: number;
  totalBandwidthTbps: number;
  totalStoragePB: number;
  totalGPUPowerTflops: number;
  totalValidators: number;
  totalStakedTokens: string;
  globalUptimePercent: number;
  renrisCirculatingSupply: string;
  rewardPoolBalance: string;
}

export interface ClaimVoucher {
  recipient: string;
  amount: string;     // format units
  nonce: number;
  signature: string;  // Web3 signature from RENRIS server validator
  expiry: number;
}

export interface StakingStats {
  stakedAmount: string;
  stakeDurationDays: number;
  aprPercent: number;
  accruedRewards: string;
  unlockTime: number;
}

export interface LeaderboardItem {
  rank: number;
  address: string;
  nodeCount: number;
  category: NodeCategory | 'multi';
  contributionsGigabytes: number;
  reliabilityPercent: number;
  rewardsEarned: string;
}

export interface TransactionRecord {
  txHash: string;
  type: 'register' | 'heartbeat_reward' | 'claim' | 'stake' | 'unstake';
  address: string;
  amount: string;
  timestamp: string;
  status: 'success' | 'pending' | 'failed';
  nodeId?: string;
}
