import Link from 'next/link';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import { connectWallet, checkAndSwitchNetwork } from '../lib/wallet';

// Styled components for the navigation bar layout and elements
const Nav = styled.nav`
  background: ${({ theme }) => theme.colors.psuBlue};
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
`;

const Logo = styled(Link)`
  color: white;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-decoration: none;
  span {
    color: ${({ theme }) => theme.colors.psuAccent}; /* "Quest" portion in accent color */
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 4px;
`;

// NavLink uses the $active transient prop to highlight the current page
const NavLink = styled(Link)`
  color: ${({ $active, theme }) => $active ? theme.colors.psuAccent : 'rgba(255,255,255,0.8)'};
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: ${({ $active }) => $active ? '600' : '400'};
  background: ${({ $active }) => $active ? 'rgba(255,255,255,0.12)' : 'transparent'};
  transition: background 0.15s, color 0.15s;
  text-decoration: none;
  &:hover {
    background: rgba(255,255,255,0.1);
    color: white;
  }
`;

const RightArea = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

// Displays the shortened wallet address as a pill badge in the navbar
const WalletBadge = styled.div`
  background: rgba(255,255,255,0.15);
  color: white;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 500;
  border: 1px solid rgba(255,255,255,0.25);
`;

const DisconnectButton = styled.button`
  background: transparent;
  color: rgba(255,255,255,0.85);
  border: 1px solid rgba(255,255,255,0.25);
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  &:hover {
    background: rgba(255,255,255,0.12);
    color: white;
  }
`;

// Shown on the landing page only — white button to stand out against the blue navbar
const LandingConnectButton = styled.button`
  background: white;
  color: ${({ theme }) => theme.colors.psuBlue};
  border: none;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
  &:hover { opacity: 0.9; }
`;

// Navigation links shown to all users once connected
const connectedLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/map', label: 'Quest Locations' },
  { href: '/create-quest', label: 'Create Quest' },
  { href: '/scanner', label: 'Claim Badge' },
  { href: '/gallery', label: 'Gallery' },
];

/**
 * Global navigation bar rendered on every page.
 * On the landing page with no wallet connected, shows a minimal bar with just a Connect button.
 * On all other pages, shows the full nav links, the connected wallet address, and a Disconnect button.
 */
export default function Navbar({ account, onDisconnect, setAccount }) {
  const router = useRouter();
  // Detect if we're on the landing page to render the simplified variant
  const isLanding = router.pathname === '/';

  /**
   * Handles the Connect Wallet button click.
   * Prompts MetaMask, switches to BNB Testnet, updates global state, and redirects to dashboard.
   */
  async function handleConnect() {
    try {
      const addr = await connectWallet();        // Opens MetaMask popup
      await checkAndSwitchNetwork();             // Ensures BNB Testnet is active
      if (setAccount) setAccount(addr);          // Updates global wallet state in _app.js
      router.push('/dashboard');                 // Redirect to dashboard after connect
    } catch (e) {
      alert(e.message); // Show MetaMask error (e.g. user rejected, not installed)
    }
  }

  // Simplified landing-page navbar — only logo and connect button
  if (isLanding && !account) {
    return (
      <Nav>
        <Logo href="/">Nittany<span>Quest</span></Logo>
        <RightArea>
          <LandingConnectButton onClick={handleConnect}>Connect Wallet</LandingConnectButton>
        </RightArea>
      </Nav>
    );
  }

  // Full navbar — shown on all pages once wallet is connected (or on non-landing pages)
  return (
    <Nav>
      <Logo href="/">Nittany<span>Quest</span></Logo>
      <NavLinks>
        {/* Render each nav link; $active highlights the link matching the current route */}
        {connectedLinks.map(({ href, label }) => (
          <NavLink key={href} href={href} $active={router.pathname === href}>
            {label}
          </NavLink>
        ))}
      </NavLinks>
      {/* Only show wallet badge and disconnect button when a wallet is connected */}
      {account && (
        <RightArea>
          {/* Show shortened address (e.g. 0x1234...abcd); full address visible on hover */}
          <WalletBadge title={account}>
            {account.slice(0, 6)}...{account.slice(-4)}
          </WalletBadge>
          <DisconnectButton onClick={onDisconnect}>Disconnect</DisconnectButton>
        </RightArea>
      )}
    </Nav>
  );
}
