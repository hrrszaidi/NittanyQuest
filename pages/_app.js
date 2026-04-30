import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ThemeProvider } from 'styled-components';
import { GlobalStyle, theme } from '../styles/globals';
import { getConnectedAccount, checkAndSwitchNetwork } from '../lib/wallet';

export default function App({ Component, pageProps }) {
  // `account` holds the connected wallet address, or null if not connected
  const [account, setAccount] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // On first load, silently check if a wallet is already connected (no MetaMask popup)
    getConnectedAccount().then((acc) => {
      setAccount(acc);
      // If already connected, ensure we're on BNB Testnet
      if (acc) checkAndSwitchNetwork();
    });

    // Skip attaching MetaMask listeners if we're server-side or MetaMask isn't installed
    if (typeof window === 'undefined' || !window.ethereum) return;

    // Fires when the user switches accounts in MetaMask
    function handleAccountsChanged(accounts) {
      const acc = accounts[0] || null; // accounts[0] is the newly selected account
      setAccount(acc);
      if (acc) checkAndSwitchNetwork();
    }

    // Fires when the user switches networks in MetaMask
    function handleChainChanged() {
      // Re-run network check to switch back to BNB Testnet if needed
      checkAndSwitchNetwork();
    }

    // Attach MetaMask event listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Cleanup: remove listeners when the component unmounts to prevent memory leaks
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []); // Empty dependency array — only runs once on mount

  /**
   * Called by child components after a successful wallet connection.
   * Updates global account state and ensures the correct network is active.
   */
  async function connectAccount(addr) {
    setAccount(addr);
    if (addr) checkAndSwitchNetwork();
  }

  /**
   * Clears the wallet connection and redirects the user to the landing page.
   * Note: this only clears app state — MetaMask itself stays connected.
   */
  function disconnect() {
    setAccount(null);
    router.push('/');
  }

  return (
    // ThemeProvider makes the Penn State color palette and radius available to all styled components
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      {/* Render the current page and pass wallet state as props */}
      <Component
        {...pageProps}
        account={account}
        setAccount={connectAccount}
        onDisconnect={disconnect}
      />
    </ThemeProvider>
  );
}
