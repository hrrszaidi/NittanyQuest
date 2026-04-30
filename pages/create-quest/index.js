/**
 * Create Quest Page (/create-quest)
 *
 * Allows any connected wallet to publish a new geocaching quest on-chain.
 * The form collects a quest name, public location hint, badge URI, 
 * and a plaintext secret code. 
 * On submission, the secret is sent to the smart contract which hashes it internally with
 * keccak256 — only the hash is stored on-chain.
 *
 * On success, the page displays the newly assigned Quest ID so the creator
 * knows which number to share with players. If no wallet is connected, a
 * Connect Wallet button is shown that triggers MetaMask directly.
 */
import { useState } from 'react';
import styled from 'styled-components';
import Navbar from '../../components/Navbar';
import { createQuest, parseContractError } from '../../lib/ethers-contract';
import { connectWallet, checkAndSwitchNetwork } from '../../lib/wallet';

const Page = styled.div`
  min-height: 100vh;
`;

const Content = styled.div`
  max-width: 600px;
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

const Card = styled.div`
  background: white;
  border-radius: ${({ theme }) => theme.radius};
  border: 1px solid ${({ theme }) => theme.colors.psuBorder};
  padding: 28px 32px;
`;

const Field = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 0.88rem;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  padding: 9px 12px;
  border: 1px solid ${({ theme }) => theme.colors.psuBorder};
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
  &:focus { border-color: ${({ theme }) => theme.colors.psuBlue}; }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 9px 12px;
  border: 1px solid ${({ theme }) => theme.colors.psuBorder};
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  box-sizing: border-box;
  resize: vertical;
  min-height: 72px;
  transition: border-color 0.15s;
  font-family: inherit;
  &:focus { border-color: ${({ theme }) => theme.colors.psuBlue}; }
`;

// Small helper text shown below form fields to guide the user
const HintText = styled.p`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.psuGrayDark};
  margin-top: 4px;
`;

const SubmitButton = styled.button`
  width: 100%;
  background: ${({ theme }) => theme.colors.psuBlue};
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
  &:hover:not(:disabled) { opacity: 0.88; }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
`;

// Status message box — green for success, red for errors
const StatusMessage = styled.div`
  margin-top: 16px;
  padding: 14px 16px;
  border-radius: 8px;
  font-size: 0.88rem;
  background: ${({ $error }) => $error ? '#fef2f2' : '#f0fdf4'};
  color: ${({ $error }) => $error ? '#dc2626' : '#16a34a'};
  border: 1px solid ${({ $error }) => $error ? '#fecaca' : '#bbf7d0'};
`;

// Displays the newly assigned Quest ID prominently after a successful creation
const SuccessQuestId = styled.div`
  font-size: 1.4rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.psuBlue};
  margin: 8px 0 4px;
`;

const ConnectPrompt = styled.div`
  text-align: center;
  padding: 60px 24px;
`;

const ConnectButton = styled.button`
  display: inline-block;
  background: ${({ theme }) => theme.colors.psuBlue};
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: ${({ theme }) => theme.radius};
  font-weight: 700;
  margin-top: 16px;
  cursor: pointer;
  font-size: 0.95rem;
  &:hover { opacity: 0.9; }
`;

export default function CreateQuestPage({ account, onDisconnect, setAccount }) {
  // Controlled form state — one piece of state per form field
  const [name, setName] = useState('');
  const [locationHint, setLocationHint] = useState('');
  const [badgeURI, setBadgeURI] = useState('');
  const [secret, setSecret] = useState('');
  const [pending, setPending] = useState(false);   // True while the MetaMask tx is in flight
  const [result, setResult] = useState(null);      // { txHash, questId } on success
  const [error, setError] = useState('');          // Human-readable error message

  /**
   * Triggered when the user clicks "Connect Wallet" on the gated prompt.
   * Connects MetaMask and switches to BNB Testnet without leaving the page.
   */
  async function handleConnectWallet() {
    try {
      const addr = await connectWallet();       // Prompts MetaMask popup
      await checkAndSwitchNetwork();            // Switch to BNB Testnet if needed
      if (setAccount) setAccount(addr);         // Update global wallet state
    } catch (e) {
      alert(e.message);
    }
  }

  // If no wallet is connected, show a gated connect prompt instead of the form
  if (!account) {
    return (
      <Page>
        <Navbar account={account} onDisconnect={onDisconnect} setAccount={setAccount} />
        <Content>
          <ConnectPrompt>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🔒</div>
            <PageTitle>Connect Your Wallet</PageTitle>
            <Subtitle>You need to connect your wallet to create a quest.</Subtitle>
            <ConnectButton onClick={handleConnectWallet}>Connect Wallet</ConnectButton>
          </ConnectPrompt>
        </Content>
      </Page>
    );
  }

  /**
   * Handles form submission — validates inputs, calls the createQuest contract function,
   * and displays the resulting Quest ID on success.
   */
  async function handleSubmit(e) {
    e.preventDefault(); // Prevent page reload from default form submission

    // Client-side validation before sending any transaction
    if (!name.trim()) { setError('Quest name is required.'); return; }
    if (!badgeURI.trim()) { setError('Badge URI is required.'); return; }
    if (!secret.trim()) { setError('Secret code is required.'); return; }

    setPending(true);
    setError('');
    setResult(null);

    try {
      // Send the createQuest transaction — MetaMask popup appears here
      // The contract hashes the secret internally; only the hash is stored on-chain
      const { txHash, questId } = await createQuest(
        name.trim(),
        locationHint.trim(),
        badgeURI.trim(),
        secret.trim()
      );

      setResult({ txHash, questId }); // Store result to display success UI

      // Clear form fields after successful creation
      setName('');
      setLocationHint('');
      setBadgeURI('');
      setSecret('');
    } catch (err) {
      // Map raw blockchain errors to user-friendly messages
      setError(parseContractError(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Page>
      <Navbar account={account} onDisconnect={onDisconnect} setAccount={setAccount} />
      <Content>
        <PageTitle>Create a Quest</PageTitle>
        <Subtitle>Hide a secret code at a campus location and mint NFT badges for everyone who finds it.</Subtitle>

        <Card>
          <form onSubmit={handleSubmit}>
            {/* Quest Name — required, shown publicly on all quest list pages */}
            <Field>
              <Label htmlFor="quest-name">Quest Name *</Label>
              <Input
                id="quest-name"
                type="text"
                placeholder="e.g. Old Main Steps"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={pending}
              />
            </Field>

            {/* Location Hint — optional, shown publicly to guide players to the spot */}
            <Field>
              <Label htmlFor="location-hint">Location Hint</Label>
              <Textarea
                id="location-hint"
                placeholder="A public clue to help players find the location…"
                value={locationHint}
                onChange={(e) => setLocationHint(e.target.value)}
                disabled={pending}
              />
              <HintText>This is shown publicly on the Quest Locations page.</HintText>
            </Field>

            {/* Badge URI — IPFS link or regular URL for the NFT image awarded on completion */}
            <Field>
              <Label htmlFor="badge-uri">Badge URI *</Label>
              <Input
                id="badge-uri"
                type="text"
                placeholder="ipfs://Qm..."
                value={badgeURI}
                onChange={(e) => setBadgeURI(e.target.value)}
                disabled={pending}
              />
              <HintText>IPFS URI for the NFT badge image awarded to players who complete this quest.</HintText>
            </Field>

            {/* Secret Code — placed physically at the location; hashed on-chain by the contract */}
            <Field>
              <Label htmlFor="secret">Secret Code *</Label>
              <Input
                id="secret"
                type="text"
                placeholder="e.g. OLDMAIN-NQ-2025"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                disabled={pending}
              />
            </Field>

            <SubmitButton type="submit" disabled={pending}>
              {pending ? 'Creating Quest…' : 'Create Quest'}
            </SubmitButton>
          </form>

          {/* Success state — show the new Quest ID prominently so the creator can share it */}
          {result && (
            <StatusMessage>
              Quest created successfully!
              {result.questId != null && (
                <SuccessQuestId>Quest #{result.questId}</SuccessQuestId>
              )}
              Players can now claim this badge by entering your secret code on the Claim Badge page.
            </StatusMessage>
          )}

          {/* Error state — shown if the transaction fails or MetaMask rejects */}
          {error && (
            <StatusMessage $error>{error}</StatusMessage>
          )}
        </Card>
      </Content>
    </Page>
  );
}
