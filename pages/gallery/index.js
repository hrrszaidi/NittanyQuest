/**
 * Badge Gallery Page (/gallery)
 *
 * Shows the connected wallet's badge collection alongside all available quests.
 * Each quest is displayed as a badge card — unlocked badges (quests the user
 * has completed) are shown at full opacity with a "Minted" label, while locked
 * badges are dimmed with a lock overlay. A summary at the top shows how many
 * badges the user has collected out of the total available.
 *
 * If no wallet is connected, a prompt is shown instead of the gallery.
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import Navbar from '../../components/Navbar';
import { getReadContract, loadQuestsFromChain } from '../../lib/ethers-contract';

function getBadgeGradient(questId) {
  const hue = (questId * 137.508) % 360;  // Golden angle ensures max spread between consecutive IDs
  const hue2 = (hue + 30) % 360;          // Second color is 30° offset for a two-tone gradient
  return `linear-gradient(135deg, hsl(${hue.toFixed(1)}, 60%, 32%) 0%, hsl(${hue2.toFixed(1)}, 65%, 48%) 100%)`;
}

/**
 * Converts a badge URI into a browser-loadable image URL.
 * - IPFS URIs (ipfs://...) are routed through a public IPFS gateway
 * - Regular HTTP/HTTPS URLs are passed through unchanged
 * - Any other format (empty, unknown scheme) returns null
 *
 * @param {string} uri - The raw badgeURI string from the contract
 * @returns {string|null} A loadable URL, or null if the URI is unresolvable
 */
function resolveImageUrl(uri) {
  if (!uri) return null;
  // Convert IPFS URI to a public gateway URL that browsers can fetch
  if (uri.startsWith('ipfs://')) return `https://ipfs.io/ipfs/${uri.slice(7)}`;
  // Regular web URLs work as-is
  if (uri.startsWith('http://') || uri.startsWith('https://')) return uri;
  return null;
}

// Renders the badge's actual image — covers the full container and crops with object-fit
const BadgeImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

// Fallback rendered when the image fails to load — fills with the quest's unique gradient
const BadgeFallback = styled.div`
  width: 100%;
  height: 100%;
  background: ${({ $gradient }) => $gradient};
`;

/**
 * Smart badge image component that tries to load the quest's badgeURI as an image first.
 * If the URI is unreachable, broken, or a placeholder, it falls back to a unique gradient.
 * The imgFailed state resets whenever badgeURI changes so a corrected URI will retry.
 */
function BadgeMedia({ quest }) {
  const [imgFailed, setImgFailed] = useState(false);
  const url = resolveImageUrl(quest.badgeURI);

  // Reset failure flag if the quest's badge URI changes (e.g. after metadata refresh)
  useEffect(() => { setImgFailed(false); }, [quest.badgeURI]);

  const showImage = url && !imgFailed;

  if (showImage) {
    return (
      <BadgeImg
        src={url}
        alt={quest.name}
        onError={() => setImgFailed(true)} // On load failure, fall back to gradient
      />
    );
  }
  // Show a unique gradient when no valid image is available
  return <BadgeFallback $gradient={getBadgeGradient(quest.questId)} />;
}

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

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
`;

// Locked badges (not yet claimed) are dimmed to 45% opacity
const BadgeCard = styled.div`
  background: white;
  border-radius: ${({ theme }) => theme.radius};
  border: 1px solid ${({ theme }) => theme.colors.psuBorder};
  overflow: hidden;
  opacity: ${({ $unlocked }) => $unlocked ? 1 : 0.45};
  transition: box-shadow 0.15s;
  &:hover { box-shadow: 0 4px 16px rgba(30,64,124,0.1); }
`;

// Container for the badge image area — position: relative so the lock overlay can sit on top
const BadgeImageContainer = styled.div`
  height: 140px;
  position: relative;
  overflow: hidden;
`;

// Semi-transparent dark overlay with a lock icon shown on unclaimed badges
const LockedOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
`;

const BadgeInfo = styled.div`
  padding: 14px 16px;
`;

const BadgeName = styled.div`
  font-weight: 700;
  font-size: 0.95rem;
  color: #1a1a2e;
  margin-bottom: 4px;
`;

const BadgeMeta = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.psuGrayDark};
`;

const EmptyState = styled.div`
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

export default function Gallery({ account, onDisconnect, setAccount }) {
  const [quests, setQuests] = useState([]);
  const [unlockedIds, setUnlockedIds] = useState([]); // Quest IDs the connected wallet has completed
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Skip data fetching if no wallet is connected
    if (!account) { setLoading(false); return; }

    async function fetchData() {
      try {
        const contract = getReadContract();

        // Fetch all quests and this wallet's completed quest IDs in parallel
        const [loadedQuests, completedRaw] = await Promise.all([
          loadQuestsFromChain(),                        // All quests from the contract
          contract.getCompletedQuestIds(account),       // IDs completed by this wallet
        ]);

        setQuests(loadedQuests);
        // Convert BigInt values from the contract to plain JS numbers
        setUnlockedIds(completedRaw.map(id => Number(id)));
      } catch (err) {
        console.error('Gallery fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [account]); // Re-fetch whenever the connected account changes

  // Show a connect prompt if no wallet is connected
  if (!account) {
    return (
      <Page>
        <Navbar account={account} onDisconnect={onDisconnect} setAccount={setAccount} />
        <Content>
          <EmptyState>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🔒</div>
            <PageTitle>Connect to View Gallery</PageTitle>
            <Subtitle>Connect your wallet to see your collected badges.</Subtitle>
            <ConnectLink href="/">Connect Wallet</ConnectLink>
          </EmptyState>
        </Content>
      </Page>
    );
  }

  return (
    <Page>
      <Navbar account={account} onDisconnect={onDisconnect} setAccount={setAccount} />
      <Content>
        <PageTitle>Badge Gallery</PageTitle>
        <Subtitle>
          {loading
            ? 'Loading your badges...'
            : `You have collected ${unlockedIds.length} of ${quests.length} badges.`}
        </Subtitle>
        {loading ? (
          <LoadingText>Loading from blockchain...</LoadingText>
        ) : quests.length === 0 ? (
          <LoadingText>No quests found yet.</LoadingText>
        ) : (
          <Grid>
            {quests.map((quest) => {
              // Check if this quest's ID is in the list of completed quests for this wallet
              const unlocked = unlockedIds.includes(quest.questId);
              return (
                <BadgeCard key={quest.questId} $unlocked={unlocked}>
                  <BadgeImageContainer>
                    {/* Try to show the badge image; falls back to a unique gradient if unavailable */}
                    <BadgeMedia quest={quest} />
                    {/* Show lock overlay on quests the user hasn't completed yet */}
                    {!unlocked && <LockedOverlay>🔒</LockedOverlay>}
                  </BadgeImageContainer>
                  <BadgeInfo>
                    <BadgeName>{quest.name}</BadgeName>
                    <BadgeMeta>
                      {unlocked ? `Quest #${quest.questId} · Minted` : 'Not yet found'}
                    </BadgeMeta>
                  </BadgeInfo>
                </BadgeCard>
              );
            })}
          </Grid>
        )}
      </Content>
    </Page>
  );
}
