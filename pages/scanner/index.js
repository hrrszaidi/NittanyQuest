/**
 * Claim Badge Page (/scanner)
 *
 * Allows a connected wallet to claim an NFT badge by entering a Quest ID and
 * the secret code found at the physical campus location. On submission, the
 * page calls mintBadge on the smart contract via MetaMask. The contract hashes
 * the submitted secret and compares it to the stored hash — if they match and
 * the user hasn't already claimed this badge, an ERC-721 token is minted to
 * their wallet.
 *
 * Shows real-time transaction status (pending → minted) and a link to the
 * transaction on BscScan Testnet on success.
 */
import { useState } from 'react';
import styled from 'styled-components';
import Navbar from '../../components/Navbar';
import { getWriteContract, parseContractError } from '../../lib/ethers-contract';

const Page = styled.div`
  min-height: 100vh;
`;

const Content = styled.div`
  max-width: 560px;
  margin: 0 auto;
  padding: 36px 24px;
`;

const PageTitle = styled.h1`
  font-size: 1.8rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.psuBlue};
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.psuGrayDark};
  margin-bottom: 32px;
  font-size: 0.95rem;
`;

const ClaimForm = styled.div`
  background: white;
  border-radius: ${({ theme }) => theme.radius};
  border: 1px solid ${({ theme }) => theme.colors.psuBorder};
  padding: 28px 24px;
`;

const FormTitle = styled.h3`
  font-size: 1rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.psuBlue};
  margin-bottom: 16px;
`;

const FormGroup = styled.div`
  margin-bottom: 14px;
`;

const Label = styled.label`
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid ${({ theme }) => theme.colors.psuBorder};
  border-radius: 6px;
  font-size: 0.95rem;
  outline: none;
  box-sizing: border-box;
  &:focus {
    border-color: ${({ theme }) => theme.colors.psuBlue};
    box-shadow: 0 0 0 3px rgba(30,64,124,0.1);
  }
`;

const SubmitButton = styled.button`
  background: ${({ theme }) => theme.colors.psuBlue};
  color: white;
  padding: 11px 24px;
  border: none;
  border-radius: ${({ theme }) => theme.radius};
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  margin-top: 8px;
  &:hover { background: ${({ theme }) => theme.colors.psuLightBlue}; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

// Alert box changes color based on $type: success (green), info (blue), or error (red)
const Alert = styled.div`
  margin-top: 16px;
  padding: 14px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  background: ${({ $type }) => $type === 'success' ? '#dcfce7' : $type === 'info' ? '#eff6ff' : '#fee2e2'};
  color: ${({ $type }) => $type === 'success' ? '#15803d' : $type === 'info' ? '#1d4ed8' : '#dc2626'};
  border: 1px solid ${({ $type }) => $type === 'success' ? '#bbf7d0' : $type === 'info' ? '#bfdbfe' : '#fca5a5'};
`;

// Link to the transaction on BscScan — shown as soon as the tx is broadcast
const TxLink = styled.a`
  display: block;
  margin-top: 8px;
  font-size: 0.82rem;
  color: #1d4ed8;
  text-decoration: underline;
  word-break: break-all;
`;

export default function Scanner({ account, onDisconnect, setAccount }) {
  const [questId, setQuestId] = useState('');
  const [secret, setSecret] = useState('');
  const [status, setStatus] = useState(null);   // { type: 'info'|'success'|'error', message: string }
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);   // Transaction hash shown in the BscScan link

  /**
   * Handles form submission — validates inputs, sends the mintBadge transaction,
   * then tracks the transaction through broadcast → confirmed states.
   */
  async function handleSubmit(e) {
    e.preventDefault(); // Prevent default HTML form submission / page reload

    // Basic client-side validation before hitting the blockchain
    if (!account) {
      setStatus({ type: 'error', message: 'Please connect your wallet first.' });
      return;
    }
    if (questId === '' || !secret) {
      setStatus({ type: 'error', message: 'Please enter both Quest ID and secret code.' });
      return;
    }

    setLoading(true);
    setStatus({ type: 'info', message: 'Confirm the transaction in MetaMask...' });
    setTxHash(null);

    try {
      // Get a signer-connected contract instance (requires MetaMask approval)
      const contract = await getWriteContract();

      // Send the mintBadge transaction — MetaMask popup appears here
      const tx = await contract.mintBadge(Number(questId), secret);

      // Transaction is now broadcast (in the mempool) but not yet confirmed
      setStatus({ type: 'info', message: 'Minting your badge... please wait.' });
      setTxHash(tx.hash); // Show the BscScan link immediately after broadcast

      // Wait for the transaction to be included in a block (on-chain confirmation)
      await tx.wait();

      setStatus({ type: 'success', message: `Badge minted! Quest #${questId} complete. Check your gallery.` });
      setQuestId(''); // Clear form on success
      setSecret('');
    } catch (err) {
      // Convert raw blockchain error to a user-friendly message
      setStatus({ type: 'error', message: parseContractError(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page>
      <Navbar account={account} onDisconnect={onDisconnect} setAccount={setAccount} />
      <Content>
        <PageTitle>Claim Badge</PageTitle>
        <Subtitle>Enter the Quest ID and secret code found at the campus location to mint your NFT badge.</Subtitle>

        <ClaimForm>
          <FormTitle>Enter Quest Details</FormTitle>
          <form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>Quest ID</Label>
              <Input
                type="number"
                placeholder="e.g. 0"
                value={questId}
                onChange={(e) => setQuestId(e.target.value)}
                min="0"
              />
            </FormGroup>
            <FormGroup>
              <Label>Secret Code</Label>
              <Input
                type="text"
                placeholder="Enter the secret code from the location"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
              />
            </FormGroup>
            <SubmitButton type="submit" disabled={loading}>
              {loading ? 'Minting...' : 'Mint Badge'}
            </SubmitButton>
          </form>

          {/* Show status message (info/success/error) after submission */}
          {status && (
            <Alert $type={status.type}>
              {status.message}
              {/* Show BscScan link as soon as the transaction hash is available */}
              {txHash && (
                <TxLink
                  href={`https://testnet.bscscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on BscScan ↗
                </TxLink>
              )}
            </Alert>
          )}
        </ClaimForm>
      </Content>
    </Page>
  );
}
