import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, BNB_TESTNET_RPC_URL } from './contract';

/**
 * Returns a read-only contract instance connected via a public JSON-RPC provider.
 * Use for free view calls that don't require a wallet or gas (e.g. getQuest, nextQuestId).
 * The provider talks directly to the BNB Testnet node — no MetaMask needed.
 */
export function getReadContract() {
  // JsonRpcProvider connects to the blockchain using a public RPC endpoint
  const provider = new ethers.JsonRpcProvider(BNB_TESTNET_RPC_URL);
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

/**
 * Returns a write-enabled contract instance connected via the user's MetaMask wallet.
 * Use for state-changing calls (e.g. mintBadge, createQuest) that cost gas.
 * Throws if MetaMask is not installed or the user has no accounts.
 */
export async function getWriteContract() {
  // Guard: MetaMask injects window.ethereum into the browser
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask is not installed.');
  }
  // BrowserProvider wraps MetaMask so ethers can use it
  const provider = new ethers.BrowserProvider(window.ethereum);
  // getSigner() retrieves the currently connected wallet account
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

/**
 * Fetches all quests stored on the smart contract and returns them as an array of objects.
 * Reads nextQuestId to know how many quests exist, then calls getQuest() for each one.
 * Returns an empty array if no quests have been created yet.
 */
export async function loadQuestsFromChain() {
  const contract = getReadContract();

  // nextQuestId is a counter — it equals the total number of quests created so far
  const total = Number(await contract.nextQuestId());

  const quests = [];

  // Loop through every quest ID from 0 up to (but not including) total
  for (let i = 0; i < total; i++) {
    // getQuest returns a tuple; destructure all 6 return values
    const [questId, name, locationHint, badgeURI, totalMinted, creator] = await contract.getQuest(i);

    quests.push({
      questId: Number(questId),   // Convert BigInt to JS number
      name,
      locationHint,
      badgeURI,
      totalMinted: Number(totalMinted),
      creator,
    });
  }

  return quests;
}

/**
 * Calls createQuest on the smart contract, waits for the transaction to be mined,
 * then parses the QuestCreated event from the receipt to extract the new quest's ID.
 */
export async function createQuest(name, locationHint, badgeURI, secret) {
  const contract = await getWriteContract();

  // Send the transaction — MetaMask will prompt the user to confirm
  const tx = await contract.createQuest(name, locationHint, badgeURI, secret);

  // Wait until the transaction is included in a block (confirmed on-chain)
  const receipt = await tx.wait();

  // Parse every log in the receipt to find the QuestCreated event
  const event = receipt.logs
    ?.map((log) => { try { return contract.interface.parseLog(log); } catch { return null; } })
    ?.find((e) => e?.name === 'QuestCreated');

  // Extract the new questId from the event args (null if parsing failed)
  const newQuestId = event ? Number(event.args.questId) : null;

  return { txHash: tx.hash, questId: newQuestId };
}

/**
 * Converts a raw blockchain error into a human-readable message for display in the UI.
 * Checks for known contract revert reasons first, then handles MetaMask cancellation,
 * and falls back to a generic message for anything unexpected.
 */
export function parseContractError(err) {
  // err.reason contains the revert string from the smart contract (ethers v6)
  const msg = err?.reason || err?.message || '';

  // Match against known revert strings from the NittanyQuest contract
  if (msg.includes('Invalid secret code')) return 'Wrong secret code. Try again.';
  if (msg.includes('Already completed')) return 'You have already claimed this badge.';
  if (msg.includes('Quest does not exist')) return 'Quest ID not found.';
  if (msg.includes('Quest name required')) return 'Quest name is required.';
  if (msg.includes('Badge URI required')) return 'Badge URI is required.';
  if (msg.includes('Secret required')) return 'Secret code is required.';

  // Code 4001 means the user rejected the MetaMask popup
  if (err?.code === 4001 || msg.includes('user rejected') || msg.includes('ACTION_REJECTED')) {
    return 'Transaction cancelled.';
  }

  return 'Something went wrong. Please try again.';
}
