import Link from 'next/link';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import Navbar from '../components/Navbar';
import { connectWallet, checkAndSwitchNetwork } from '../lib/wallet';

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Hero = styled.section`
  background: linear-gradient(rgba(0, 20, 60, 0.62), rgba(0, 30, 90, 0.58)),
    url('/old-main.jpg') center / cover no-repeat;
  color: white;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
`;

const HeroTitle = styled.h1`
  font-size: 2.8rem;
  font-weight: 800;
  margin-bottom: 16px;
  span {
    color: ${({ theme }) => theme.colors.psuAccent};
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.15rem;
  opacity: 0.9;
  max-width: 560px;
  margin: 0 auto 36px;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
`;

const PrimaryButton = styled.button`
  background: white;
  color: ${({ theme }) => theme.colors.psuBlue};
  padding: 12px 28px;
  border: none;
  border-radius: ${({ theme }) => theme.radius};
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
  &:hover { opacity: 0.9; }
`;


export default function Home({ account, setAccount, onDisconnect }) {
  const router = useRouter();

  async function handleConnect() {
    try {
      const addr = await connectWallet();
      await checkAndSwitchNetwork();
      setAccount(addr);
      router.push('/dashboard');
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <Page>
      <Navbar account={account} onDisconnect={onDisconnect} setAccount={setAccount} />
      <Hero>
        <HeroTitle>Nittany<span>Quest</span></HeroTitle>
        <HeroSubtitle>
          A decentralized geocaching scavenger hunt at Penn State. Find locations, mint NFT badges, and prove your exploration on the blockchain.
        </HeroSubtitle>
        <ButtonRow>
          {account ? (
            <PrimaryButton as={Link} href="/dashboard">Go to Dashboard</PrimaryButton>
          ) : (
            <PrimaryButton onClick={handleConnect}>Connect Wallet</PrimaryButton>
          )}
        </ButtonRow>
      </Hero>
    </Page>
  );
}
