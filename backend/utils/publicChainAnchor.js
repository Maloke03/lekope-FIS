const NETWORKS = {
  sepolia: {
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    explorerTxBaseUrl: 'https://sepolia.etherscan.io/tx/',
  },
  polygon_amoy: {
    name: 'Polygon Amoy',
    chainId: 80002,
    explorerTxBaseUrl: 'https://amoy.polygonscan.com/tx/',
  },
};

const normalizeNetwork = (network = '') => network.toString().trim().toLowerCase();

const getAnchorConfig = () => {
  const networkKey = normalizeNetwork(process.env.BLOCKCHAIN_NETWORK || 'sepolia');
  const network = NETWORKS[networkKey];

  return {
    enabled: process.env.BLOCKCHAIN_ANCHOR_ENABLED === 'true',
    networkKey,
    network,
    rpcUrl: process.env.BLOCKCHAIN_RPC_URL,
    privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY,
    confirmations: Number(process.env.BLOCKCHAIN_ANCHOR_CONFIRMATIONS) || 1,
    explorerTxBaseUrl: process.env.BLOCKCHAIN_EXPLORER_TX_URL || network?.explorerTxBaseUrl,
  };
};

const getAnchorStatus = () => {
  const config = getAnchorConfig();
  const missing = [];

  if (!config.enabled) missing.push('BLOCKCHAIN_ANCHOR_ENABLED=true');
  if (!config.network) missing.push('BLOCKCHAIN_NETWORK=sepolia or polygon_amoy');
  if (!config.rpcUrl) missing.push('BLOCKCHAIN_RPC_URL');
  if (!config.privateKey) missing.push('BLOCKCHAIN_PRIVATE_KEY');

  return {
    ready: missing.length === 0,
    missing,
    network: config.network
      ? { key: config.networkKey, name: config.network.name, chainId: config.network.chainId }
      : null,
  };
};

const anchorProofHash = async ({ proofHash, memo }) => {
  const status = getAnchorStatus();
  if (!status.ready) {
    const error = new Error(`Public blockchain anchoring is not configured: ${status.missing.join(', ')}`);
    error.code = 'ANCHOR_NOT_CONFIGURED';
    throw error;
  }

  let ethers;
  try {
    ethers = require('ethers');
  } catch (error) {
    error.message = 'The ethers package is required for public blockchain anchoring. Run npm install in backend.';
    throw error;
  }

  const config = getAnchorConfig();
  const provider = new ethers.JsonRpcProvider(config.rpcUrl, config.network.chainId);
  const wallet = new ethers.Wallet(config.privateKey, provider);
  const data = ethers.hexlify(ethers.toUtf8Bytes(JSON.stringify({
    app: 'lekope-fis',
    type: 'invoice-ledger-anchor',
    proofHash,
    memo,
  })));

  const tx = await wallet.sendTransaction({
    to: wallet.address,
    value: 0,
    data,
  });

  const receipt = await tx.wait(config.confirmations);

  return {
    status: receipt?.status === 1 ? 'CONFIRMED' : 'SUBMITTED',
    network: config.network.name,
    chainId: config.network.chainId,
    txHash: tx.hash,
    explorerUrl: `${config.explorerTxBaseUrl}${tx.hash}`,
    from: wallet.address,
    anchoredHash: proofHash,
    anchoredAt: new Date(),
  };
};

module.exports = {
  getAnchorStatus,
  anchorProofHash,
};
