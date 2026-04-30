import { CHAIN_ID_HEX, BNB_TESTNET_PARAMS } from './contract';

/**
 * Prompts the user to connect their MetaMask wallet via the eth_requestAccounts API call.
 * Opens the MetaMask popup if no account is already connected.
 * Throws if MetaMask is not installed or the user rejects the request.
 *
 * @returns {Promise<string>} The connected wallet address (checksummed)
 */
export async function connectWallet() {
  // window.ethereum is injected by MetaMask — it won't exist in non-browser environments
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask is not installed. Please install MetaMask to use NittanyQuest.');
  }
  // eth_requestAccounts triggers the MetaMask popup and returns the list of approved accounts
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  return accounts[0]; // Return the first (primary) connected account
}

/**
 * Silently checks if a wallet is already connected without triggering a MetaMask popup.
 * Uses eth_accounts (no popup) instead of eth_requestAccounts (triggers popup).
 * Returns null if no wallet is connected or MetaMask is not installed.
 */
export async function getConnectedAccount() {
  if (typeof window === 'undefined' || !window.ethereum) return null;
  // eth_accounts returns currently authorized accounts without prompting the user
  const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  return accounts[0] || null;
}

/**
 * Checks the currently active network in MetaMask and switches to BNB Chain Testnet if needed.
 * If the network is not added to MetaMask yet, it adds it automatically using wallet_addEthereumChain.
 * Does nothing if already on the correct network.
 */
export async function checkAndSwitchNetwork() {
  if (typeof window === 'undefined' || !window.ethereum) return;

  // eth_chainId returns the current network's chain ID as a hex string
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });

  // Already on BNB Testnet (chain ID 97 = 0x61) — nothing to do
  if (chainId === CHAIN_ID_HEX) return;

  try {
    // Try to switch to the network if it already exists in MetaMask
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CHAIN_ID_HEX }],
    });
  } catch (err) {
    // Error code 4902 means the network is not in MetaMask's list — add it
    if (err.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [BNB_TESTNET_PARAMS], // Network config defined in contract.js
      });
    }
  }
}

/**
 * Formats a full Ethereum address into a shortened display form (e.g. 0x1234...abcd).
 * Used throughout the UI wherever a full 42-character address would be too long to display.
 */
export function shortenAddress(address) {
  if (!address) return '';
  // Show first 6 characters (0x + 4 hex digits) and last 4 characters
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
