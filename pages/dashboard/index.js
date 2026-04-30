/**
 * Dashboard Page (/dashboard)
 *
 * The main hub for a connected wallet. Shows two live statistics pulled
 * from the smart contract: total badges earned by the connected wallet
 * and total quests on-chain. Below the stats, a full list of all quests
 * is displayed with their name and location hint.
 *
 * If no wallet is connected, a prompt is shown instead of the dashboard content.
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import Navbar from '../../components/Navbar';
import { shortenAddress } from '../../lib/wallet';
import { getReadContract, loadQuestsFromChain } from '../../lib/ethers-contract';

const Page = styled.div`
  min-height: 100vh;
`;

const Content = styled.div`
  max-width: 900px;
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

// Responsive row of stat cards — auto-fills columns based on available width
const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  margin-bottom: 40px;
`;

const StatCard = styled.div`
  background: white;
  border-radius: ${({ theme }) => theme.radius};
  padding: 20px 24px;
  border: 1px solid ${({ theme }) => theme.colors.psuBorder};
  text-align: center;
`;

// Large bold number displayed prominently in each stat card
const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.psuBlue};
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.psuGrayDark};
  margin-top: 4px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const SectionTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.psuBlue};
  margin-bottom: 16px;
`;

const QuestList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const QuestCard = styled.div`
  background: white;
  border-radius: ${({ theme }) => theme.radius};
  border: 1px solid ${({ theme }) => theme.colors.psuBorder};
  padding: 16px 20px;
`;

const QuestName = styled.div`
  font-weight: 700;
  font-size: 0.95rem;
  color: #1a1a2e;
`;

const QuestHint = styled.div`
  font-size: 0.82rem;
  color: ${({ theme }) => theme.colors.psuGrayDark};
  margin-top: 2px;
`;

const ConnectPrompt = styled.div`
  text-align: center;
  padding: 60px 24px;
`;

const ConnectLink = styled(Link)`
  display: inline-block;
  background: ${({ theme }) => theme.colors.psuBlue};
  color: white;
  padding: 12px 28px;
  border-radius: ${({ theme }) => theme.radius};
  font-weight: 700;
  margin-top: 16px;
  cursor: pointer;
  text-decoration: none;
  &:hover { opacity: 0.9; }
`;

const LoadingText = styled.div`
  color: ${({ theme }) => theme.colors.psuGrayDark};
  font-size: 0.9rem;
  padding: 24px 0;
`;

export default function Dashboard({ account, onDisconnect, setAccount }) {
  const [quests, setQuests] = useState([]);
  const [badgeCount, setBadgeCount] = useState(0); // Number of badges earned by this wallet
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Don't fetch anything if no wallet is connected
    if (!account) { setLoading(false); return; }

    async function fetchData() {
      try {
        const contract = getReadContract();

        // Fetch badge count and all quests in parallel to minimize load time
        const [count, loadedQuests] = await Promise.all([
          contract.userBadgeCount(account),  // How many badges this wallet has minted
          loadQuestsFromChain(),              // All quests from the contract
        ]);

        setBadgeCount(Number(count)); // Convert BigInt to JS number
        setQuests(loadedQuests);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [account]); // Re-fetch when the connected account changes

  // Show a connect prompt if no wallet is connected
  if (!account) {
    return (
      <Page>
        <Navbar account={account} onDisconnect={onDisconnect} setAccount={setAccount} />
        <Content>
          <ConnectPrompt>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🔒</div>
            <PageTitle>Connect Your Wallet</PageTitle>
            <Subtitle>You need to connect your wallet to view your dashboard.</Subtitle>
            <ConnectLink href="/">Connect Wallet</ConnectLink>
          </ConnectPrompt>
        </Content>
      </Page>
    );
  }

  return (
    <Page>
      <Navbar account={account} onDisconnect={onDisconnect} setAccount={setAccount} />
      <Content>
        <PageTitle>Dashboard</PageTitle>
        {/* Show shortened wallet address in the welcome subtitle */}
        <Subtitle>Welcome back, {shortenAddress(account)}</Subtitle>

        {/* Stats row — shows live counts from the blockchain */}
        <StatsRow>
          <StatCard>
            <StatValue>{loading ? '—' : badgeCount}</StatValue>
            <StatLabel>Badges Earned</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{loading ? '—' : quests.length}</StatValue>
            <StatLabel>Total Quests</StatLabel>
          </StatCard>
        </StatsRow>

        {/* Full quest list below the stats */}
        <SectionTitle>All Quests</SectionTitle>
        {loading ? (
          <LoadingText>Loading quests from blockchain...</LoadingText>
        ) : quests.length === 0 ? (
          <LoadingText>No quests found on chain yet.</LoadingText>
        ) : (
          <QuestList>
            {quests.map((quest) => (
              <QuestCard key={quest.questId}>
                <QuestName>{quest.name}</QuestName>
                <QuestHint>{quest.locationHint}</QuestHint>
              </QuestCard>
            ))}
          </QuestList>
        )}
      </Content>
    </Page>
  );
}
