/**
 * Quest Locations Page (/map)
 *
 * Displays all quests registered on the NittanyQuest smart contract in a
 * responsive card grid. Each card shows the quest number, name, public
 * location hint, and the wallet address of the quest creator (truncated).
 */
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import Navbar from '../../components/Navbar';
import { loadQuestsFromChain } from '../../lib/ethers-contract';
import { shortenAddress } from '../../lib/wallet';

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

const SectionTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.psuBlue};
  margin-bottom: 16px;
`;

const QuestGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
`;

const QuestCard = styled.div`
  background: white;
  border-radius: ${({ theme }) => theme.radius};
  padding: 20px;
  border: 1px solid ${({ theme }) => theme.colors.psuBorder};
`;

// Quest number displayed as a colored pill badge in the top-left of each card
const QuestNum = styled.div`
  font-size: 0.78rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.psuAccent};
  background: ${({ theme }) => theme.colors.psuBlue};
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  margin-bottom: 10px;
`;

const QuestName = styled.div`
  font-weight: 700;
  font-size: 1rem;
  color: #1a1a2e;
  margin-bottom: 6px;
`;

const QuestHint = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.psuGrayDark};
  line-height: 1.5;
  margin-bottom: 10px;
`;

// Displays the creator's wallet address in monospace (shortened for readability)
const CreatorLine = styled.div`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.psuGrayDark};
  font-family: monospace;
`;

const LoadingText = styled.div`
  color: ${({ theme }) => theme.colors.psuGrayDark};
  font-size: 0.9rem;
  padding: 24px 0;
`;

export default function MapPage({ account, onDisconnect, setAccount }) {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load all quests from the contract as soon as the page mounts
    // No wallet needed — uses the public read-only RPC provider
    loadQuestsFromChain()
      .then(setQuests)
      .catch((err) => console.error('Map fetch error:', err))
      .finally(() => setLoading(false));
  }, []); // Empty array — only runs once on mount

  return (
    <Page>
      <Navbar account={account} onDisconnect={onDisconnect} setAccount={setAccount} />
      <Content>
        <PageTitle>Quest Locations</PageTitle>
        <Subtitle>Find these locations around Penn State campus to claim your NFT badges.</Subtitle>

        <SectionTitle>All Quests</SectionTitle>
        {loading ? (
          <LoadingText>Loading quests from blockchain...</LoadingText>
        ) : quests.length === 0 ? (
          <LoadingText>No quests found yet.</LoadingText>
        ) : (
          <QuestGrid>
            {quests.map((quest) => (
              <QuestCard key={quest.questId}>
                {/* Quest number badge in the top-left */}
                <QuestNum>Quest #{quest.questId}</QuestNum>
                <QuestName>{quest.name}</QuestName>
                {/* Public hint that helps players find the physical location */}
                <QuestHint>{quest.locationHint}</QuestHint>
                {/* Show the creator's wallet address if available */}
                {quest.creator && (
                  <CreatorLine>Created by {shortenAddress(quest.creator)}</CreatorLine>
                )}
              </QuestCard>
            ))}
          </QuestGrid>
        )}
      </Content>
    </Page>
  );
}
