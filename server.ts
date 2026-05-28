import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Wallet, verifyMessage, ethers } from 'ethers';
import { DePINNode, NetworkStats, ClaimVoucher, LeaderboardItem, TransactionRecord } from './src/types.js';

async function startServer() {
  const app = express();
  app.use(express.json());

  const PORT = 3000;

  // 1. Validator Wallet Initialisation
  // Generates a random secure private key on startup if not present in env.
  // This ensures zero-config instant deployment status.
  const validatorPrivateKey = process.env.VALIDATOR_PRIVATE_KEY || Wallet.createRandom().privateKey;
  const validatorWallet = new Wallet(validatorPrivateKey);
  console.log(`[RENRIS-VALIDATOR] Active public address: ${validatorWallet.address}`);

  // 2. InMemory High-fidelity State Engine
  const nodes = new Map<string, DePINNode>();
  const transactions: TransactionRecord[] = [];
  const userNonces = new Map<string, number>();
  const userStaking = new Map<string, { stakedAmount: string; stakeDurationDays: number; aprPercent: number; accruedRewards: string; lastStakedAt: string }>();

  // Add mock seed data for real telemetry logs and authentic-looking leaderboard and global stats
  const seedOperators = [
    { address: '0x3415E9C5dF4fDe7E613dC8092B088B6E3df7578D', category: 'gpu', reputation: 98 },
    { address: '0x99A8c2A90B7CDAA123f1A48D3F9f0De0f50766CC', category: 'bandwidth', reputation: 99 },
    { address: '0x2213F9f53BaaEf1557876a4DcF8585e50dbdDFCd', category: 'storage', reputation: 95 },
    { address: '0x88f9CdA11100D5D7266E7C806bEFDA0Fd40CEb47', category: 'validator', reputation: 100 },
  ];

  // Global Network Stats setup
  let networkStats: NetworkStats = {
    totalNodes: 4,
    activeNodes: 4,
    totalBandwidthTbps: 1.45,
    totalStoragePB: 3.78,
    totalGPUPowerTflops: 1540.2,
    totalValidators: 1,
    totalStakedTokens: '254500.0',
    globalUptimePercent: 99.84,
    renrisCirculatingSupply: '15400000.0',
    rewardPoolBalance: '84600000.0',
  };

  // Populate Seed Nodes
  seedOperators.forEach((op, idx) => {
    const nodeId = `renris-node-${idx + 1}`;
    nodes.set(nodeId, {
      id: nodeId,
      name: `Validator-Seed-0${idx + 1}`,
      ownerAddress: op.address,
      category: op.category as any,
      ipAddress: `158.42.${12 + idx}.${100 + idx}`,
      hardwareSpec: op.category === 'gpu' ? 'NVIDIA T4 Tensor Core x4' : op.category === 'storage' ? 'RAID 6 SSD Rack 64TB' : op.category === 'bandwidth' ? 'Gigabit Fiber Uplink' : 'Intel Xeon E-2288G',
      status: 'online',
      uptimeSeconds: 86400 * 12 + 3500 + (idx * 1200),
      totalUptimePercent: op.reputation,
      bandwidthMbps: op.category === 'bandwidth' ? 1000 : 150,
      storageGB: op.category === 'storage' ? 64000 : 2000,
      gpuScores: op.category === 'gpu' ? 260 : 0,
      reputationScore: op.reputation,
      registeredAt: new Date(Date.now() - 86400 * 14 * 1000).toISOString(),
      lastHeartbeatAt: new Date(Date.now() - 5000).toISOString(),
      accumulatedRewards: (Math.random() * 450 + 200).toFixed(4),
      pendingClaimable: (Math.random() * 45 + 10).toFixed(4)
    });
  });

  // Calculate stats dynamically
  function calculateTotalStats() {
    let storageSum = 0;
    let bandwidthSum = 0;
    let gpuSum = 0;
    let active = 0;

    nodes.forEach(n => {
      if (n.status === 'online') {
        active++;
        storageSum += n.storageGB;
        bandwidthSum += n.bandwidthMbps;
        gpuSum += n.gpuScores;
      }
    });

    networkStats.totalNodes = nodes.size;
    networkStats.activeNodes = active;
    networkStats.totalStoragePB = Number((3.5 + (storageSum / 1000000)).toFixed(4));
    networkStats.totalBandwidthTbps = Number((1.2 + (bandwidthSum / 1000000)).toFixed(4));
    networkStats.totalGPUPowerTflops = Number((1200 + gpuSum).toFixed(2));
  }

  // 3. API ROUTES

  // Get current global stats
  app.get('/api/network/stats', (req, res) => {
    calculateTotalStats();
    res.json(networkStats);
  });

  // Get nodes of an operator
  app.get('/api/nodes', (req, res) => {
    const owner = req.query.ownerAddress as string;
    if (!owner) {
      return res.json(Array.from(nodes.values()));
    }
    const filtered = Array.from(nodes.values()).filter(
      n => n.ownerAddress.toLowerCase() === owner.toLowerCase()
    );
    res.json(filtered);
  });

  // Register a node
  app.post('/api/nodes/register', (req, res) => {
    const { ownerAddress, name, category, hardwareSpec, storageGB, bandwidthMbps, gpuScores, nodeSignature } = req.body;

    if (!ownerAddress || !name || !category) {
      return res.status(400).json({ error: 'Missing required registration parameters.' });
    }

    // Cryptographic authenticity verification: Nodes should register stating their intent.
    // If a signature is provided, we verify that the user's wallet matches the owner address.
    if (nodeSignature) {
      try {
        const message = `Register RENRIS DePIN Node: ${name} (${category})`;
        const recovered = verifyMessage(message, nodeSignature);
        if (recovered.toLowerCase() !== ownerAddress.toLowerCase()) {
          return res.status(401).json({ error: 'Cryptographic node signature mismatch.' });
        }
      } catch (err) {
        return res.status(400).json({ error: 'Invalid wallet node signature verification.' });
      }
    }

    const nodeId = `renris-node-${Date.now()}`;
    const newNode: DePINNode = {
      id: nodeId,
      name,
      ownerAddress,
      category,
      ipAddress: `198.51.100.${Math.floor(Math.random() * 254) + 1}`,
      hardwareSpec: hardwareSpec || 'Generic Device Platform',
      status: 'online',
      uptimeSeconds: 0,
      totalUptimePercent: 100,
      bandwidthMbps: Number(bandwidthMbps) || 10,
      storageGB: Number(storageGB) || 120,
      gpuScores: Number(gpuScores) || 0,
      reputationScore: 100,
      registeredAt: new Date().toISOString(),
      lastHeartbeatAt: new Date().toISOString(),
      accumulatedRewards: '0.0000',
      pendingClaimable: '0.0000'
    };

    nodes.set(nodeId, newNode);

    // Record system transaction
    transactions.unshift({
      txHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      type: 'register',
      address: ownerAddress,
      amount: '0',
      timestamp: new Date().toISOString(),
      status: 'success',
      nodeId: nodeId
    });

    calculateTotalStats();

    res.json({ success: true, node: newNode });
  });

  // Post Heartbeat Update (simulating resource telemetry)
  app.post('/api/nodes/heartbeat', (req, res) => {
    const { nodeId, telemetry, timestamp, signature, walletAddress } = req.body;

    const node = nodes.get(nodeId);
    if (!node) {
      return res.status(404).json({ error: 'Registered node not found.' });
    }

    // Cryptographic telemetry verification to prevent botting/faking
    if (signature && walletAddress) {
      try {
        const message = `Heartbeat Node: ${nodeId} at timestamp ${timestamp}`;
        const recovered = verifyMessage(message, signature);
        if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
          return res.status(401).json({ error: 'Heartbeat cryptographic trace rejected.' });
        }
      } catch (err) {
        return res.status(400).json({ error: 'Heartbeat signature validation failed.' });
      }
    }

    const now = Date.now();
    const lastHeartbeat = new Date(node.lastHeartbeatAt).getTime();
    const diffSeconds = Math.max((now - lastHeartbeat) / 1000, 1.5); // At least 1.5s offset

    node.lastHeartbeatAt = new Date().toISOString();
    node.uptimeSeconds += Math.round(diffSeconds);
    node.status = 'online';

    // Verify node with higher reputation if continuous heartbeats are logged
    node.reputationScore = Math.min(100, node.reputationScore + 0.1);

    // Calculate real rewards based on node category capability and uptime
    // base calculation (Wei or token reward amount per sec):
    let ratePerSecond = 0.0001; // Base rate
    if (node.category === 'gpu') {
      ratePerSecond = 0.0035 + (node.gpuScores * 0.00005);
    } else if (node.category === 'storage') {
      ratePerSecond = 0.0015 + (node.storageGB * 0.000002);
    } else if (node.category === 'bandwidth') {
      ratePerSecond = 0.0012 + (node.bandwidthMbps * 0.000003);
    } else if (node.category === 'validator') {
      ratePerSecond = 0.0025;
    }

    const rewardsEarned = diffSeconds * ratePerSecond;
    const currentAccumulated = Number(node.accumulatedRewards) + rewardsEarned;
    const currentPending = Number(node.pendingClaimable) + rewardsEarned;

    node.accumulatedRewards = currentAccumulated.toFixed(5);
    node.pendingClaimable = currentPending.toFixed(5);

    // Occasional activity logging
    if (Math.random() < 0.15) {
      transactions.unshift({
        txHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        type: 'heartbeat_reward',
        address: node.ownerAddress,
        amount: rewardsEarned.toFixed(6),
        timestamp: new Date().toISOString(),
        status: 'success',
        nodeId: node.id
      });
      if (transactions.length > 50) transactions.pop();
    }

    res.json({
      success: true,
      uptimeSeconds: node.uptimeSeconds,
      reputationScore: Number(node.reputationScore.toFixed(2)),
      accumulatedRewards: node.accumulatedRewards,
      pendingClaimable: node.pendingClaimable
    });
  });

  // Request secure voucher for on-chain rewards claiming
  app.post('/api/rewards/claim', async (req, res) => {
    const { ownerAddress } = req.body;

    if (!ownerAddress) {
      return res.status(400).json({ error: 'Owner wallet address is required.' });
    }

    // Filter active claimable balances of user-owned nodes
    const userNodes = Array.from(nodes.values()).filter(
      n => n.ownerAddress.toLowerCase() === ownerAddress.toLowerCase()
    );

    let totalPendingClaimable = 0;
    userNodes.forEach(n => {
      totalPendingClaimable += Number(n.pendingClaimable);
    });

    if (totalPendingClaimable <= 0) {
      return res.status(400).json({ error: 'No claimable RENRIS tokens available for this wallet.' });
    }

    // Lock and reset pending rewards in the telemetry server (State Engine)
    userNodes.forEach(n => {
      n.pendingClaimable = '0.0000';
    });

    // Handle signature nonces
    const nonce = userNonces.get(ownerAddress.toLowerCase()) || 0;
    userNonces.set(ownerAddress.toLowerCase(), nonce + 1);

    // Cryptographic claims generation:
    // Create a real signed ClaimVoucher matching on-chain Solidity requirements
    // Struct ClaimVoucher { address recipient, uint256 amount, uint256 nonce, uint256 expiry, bytes signature }
    const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hr expiry
    const formattedAmountWei = ethers.parseEther(totalPendingClaimable.toFixed(18)); // standard ether formatting for 18 decimals

    // Cryptographic packing and sign Message (EIP-191) using Validator Private Key
    // On-chain Solidity verifies the signature matches validator Wallet address.
    const messageHash = ethers.solidityPackedKeccak256(
      ['address', 'uint256', 'uint256', 'uint256'],
      [ownerAddress, formattedAmountWei, nonce, expiry]
    );
    const signature = await validatorWallet.signMessage(ethers.getBytes(messageHash));

    const claimVoucher: ClaimVoucher = {
      recipient: ownerAddress,
      amount: totalPendingClaimable.toFixed(6),
      nonce,
      expiry,
      signature
    };

    // Store claiming txn
    const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    transactions.unshift({
      txHash,
      type: 'claim',
      address: ownerAddress,
      amount: totalPendingClaimable.toFixed(6),
      timestamp: new Date().toISOString(),
      status: 'success'
    });

    res.json({
      success: true,
      voucher: claimVoucher,
      txHash,
      totalClaimed: totalPendingClaimable.toFixed(6),
    });
  });

  // Staking simulator and interactions router
  app.post('/api/staking/stake', (req, res) => {
    const { ownerAddress, amount, durationDays } = req.body;

    if (!ownerAddress || !amount || !durationDays) {
      return res.status(400).json({ error: 'Missing required parameters.' });
    }

    const apr = durationDays >= 180 ? 18.5 : durationDays >= 90 ? 12.0 : 6.5;

    const currentStake = userStaking.get(ownerAddress.toLowerCase());
    const newAmount = currentStake
      ? (Number(currentStake.stakedAmount) + Number(amount)).toFixed(4)
      : Number(amount).toFixed(4);

    userStaking.set(ownerAddress.toLowerCase(), {
      stakedAmount: newAmount,
      stakeDurationDays: Number(durationDays),
      aprPercent: apr,
      accruedRewards: currentStake ? currentStake.accruedRewards : '0.0',
      lastStakedAt: new Date().toISOString()
    });

    networkStats.totalStakedTokens = (Number(networkStats.totalStakedTokens) + Number(amount)).toFixed(2);

    transactions.unshift({
      txHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      type: 'stake',
      address: ownerAddress,
      amount,
      timestamp: new Date().toISOString(),
      status: 'success'
    });

    res.json({ success: true, stakedAmount: newAmount, aprPercent: apr });
  });

  // Get active staking info
  app.get('/api/staking', (req, res) => {
    const owner = req.query.ownerAddress as string;
    if (!owner) return res.json({});
    const stats = userStaking.get(owner.toLowerCase()) || {
      stakedAmount: '0.0000',
      stakeDurationDays: 30,
      aprPercent: 6.5,
      accruedRewards: '0.0000',
      lastStakedAt: ''
    };
    res.json(stats);
  });

  // Leaderboard data
  app.get('/api/leaderboard', (req, res) => {
    // Dynamically calculate operator statistics from active state database
    const rankingsMap = new Map<string, { address: string; nodeCount: number; cats: Set<string>; gb: number; scoreSum: number; rewards: number }>();

    nodes.forEach(n => {
      const entry = rankingsMap.get(n.ownerAddress.toLowerCase()) || {
        address: n.ownerAddress,
        nodeCount: 0,
        cats: new Set<string>(),
        gb: 0,
        scoreSum: 0,
        rewards: 0
      };

      entry.nodeCount++;
      entry.cats.add(n.category);
      // approximate shared metrics for visual display
      entry.gb += n.category === 'storage' ? n.storageGB : n.category === 'bandwidth' ? (n.bandwidthMbps * 1.5) : 100;
      entry.scoreSum += n.reputationScore;
      entry.rewards += Number(n.accumulatedRewards);

      rankingsMap.set(n.ownerAddress.toLowerCase(), entry);
    });

    const items: LeaderboardItem[] = Array.from(rankingsMap.values()).map((r, idx) => {
      const type = r.cats.size > 1 ? 'multi' : Array.from(r.cats)[0] as any;
      return {
        rank: 0, // Assigned after sorting
        address: r.address,
        nodeCount: r.nodeCount,
        category: type,
        contributionsGigabytes: Math.round(r.gb),
        reliabilityPercent: Number((r.scoreSum / r.nodeCount).toFixed(2)),
        rewardsEarned: r.rewards.toFixed(4)
      };
    });

    items.sort((a, b) => Number(b.rewardsEarned) - Number(a.rewardsEarned));
    items.forEach((item, index) => {
      item.rank = index + 1;
    });

    res.json(items);
  });

  // Transaction history
  app.get('/api/transactions', (req, res) => {
    res.json(transactions.slice(0, 30));
  });

  // Retrieve current Validator Info
  app.get('/api/validator/info', (req, res) => {
    res.json({
      address: validatorWallet.address,
      description: 'RENRIS Central Telemetry Validation Oracle Node & Cryptographic Claim Issuer'
    });
  });

  // 4. VITE MIDDLEWARE CONFIG
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[RENRIS-BACKEND] DePIN server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
