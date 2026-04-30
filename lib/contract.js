// Deployed NittanyQuest contract address on BNB Chain Testnet (chain ID 97)
// Update this value whenever the contract is redeployed to a new address
export const CONTRACT_ADDRESS = '0x1e56647A23241Aa5EB26Dc6702D86056A6C06885';

// Numeric chain ID for BNB Testnet — used for validation checks
export const CHAIN_ID = 97;
// Hex-encoded chain ID — required by MetaMask's wallet_switchEthereumChain API
export const CHAIN_ID_HEX = '0x61';

// Public RPC endpoint for BNB Testnet — used for read-only (no-wallet) blockchain calls
export const BNB_TESTNET_RPC_URL = 'https://data-seed-prebsc-1-s1.binance.org:8545/';

// Network configuration object passed to MetaMask when adding BNB Testnet to the user's wallet
export const BNB_TESTNET_PARAMS = {
  chainId: CHAIN_ID_HEX,
  chainName: 'BNB Chain Testnet',
  nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
  rpcUrls: [BNB_TESTNET_RPC_URL],
  blockExplorerUrls: ['https://testnet.bscscan.com'],
};

/**
 * ABI (Application Binary Interface) — describes the functions the smart contract exposes.
 * Each entry tells ethers the function name, parameter types, visibility, and return types.
 */
export const CONTRACT_ABI = [
  // Write functions (cost gas, require MetaMask signature)
  'function createQuest(string name, string locationHint, string badgeURI, string secret) public',   // Create a new quest on-chain
  'function mintBadge(uint256 questId, string secret) public',                                        // Claim a badge by submitting the correct secret code

  // Read functions (free, no gas, no wallet needed)
  'function getQuest(uint256 questId) public view returns (uint256, string, string, string, uint256, address)', // Get all details for a quest by ID
  'function completedQuest(uint256 questId, address user) public view returns (bool)',                 // Check if a specific user completed a specific quest
  'function getCompletedQuestIds(address user) public view returns (uint256[])',                       // Get all quest IDs a user has completed
  'function userBadgeCount(address) public view returns (uint256)',                                    // Total number of badges minted by a wallet
  'function nextQuestId() public view returns (uint256)',                                              // Total number of quests created (next available ID)
  'function getSecretHash(string secret) public pure returns (bytes32)',                               // Utility: returns the keccak256 hash of a secret string

  // Events emitted by the contract (used to parse transaction receipts)
  'event BadgeMinted(address indexed user, uint256 indexed questId, uint256 indexed tokenId)',         // Fired when a badge NFT is successfully minted
  'event QuestCreated(uint256 indexed questId, string name, string locationHint, string badgeURI, address indexed creator)', // Fired when a new quest is created
];
