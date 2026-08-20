# NittanyQuest

A blockchain-based location exploration game built for Penn State using Web3 technologies. Players discover campus locations, solve challenges, and mint NFT badges as proof of completion.

## Overview

NittanyQuest combines physical exploration with blockchain verification. Users connect their MetaMask wallet, visit hidden locations around campus, enter secret codes, and earn ERC-721 NFT badges recorded on-chain.

## Live Demo

 **[View Live Application](https://nittany-quest.vercel.app/)**

*Requires MetaMask wallet and tBNB testnet funds to interact with blockchain features.*

## Tech Stack

- **Frontend:** Next.js 15, React 19, styled-components
- **Blockchain:** Solidity (ERC-721), ethers.js v6
- **Network:** BNB Chain Testnet
- **Wallet Integration:** MetaMask

## Key Features

- MetaMask wallet authentication with automatic network switching
- Create geocaching quests with location hints and secret codes
- Claim and mint NFT badges on-chain
- Browse quest collection and view completion status
- IPFS support for badge metadata and images
- Responsive, mobile-friendly UI

## Project Structure

```
src/
├── components/      # Reusable UI components
├── lib/            # Web3 and blockchain utilities
├── pages/          # Next.js pages and routes
├── contracts/      # Solidity smart contract
└── styles/         # Theme and global styles
```

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

Visit `http://localhost:3000` and connect your MetaMask wallet.

## How It Works

1. Connect MetaMask wallet to BNB Chain Testnet
2. Navigate to physical locations around campus
3. Find secret codes at each location
4. Enter quest ID and secret code on the Scanner page
5. Confirm transaction in MetaMask
6. NFT badge is minted to your wallet
7. View collected badges in the Gallery

## Smart Contract Features

- **Create Quests:** Publish new geocaching challenges
- **Mint Badges:** Claim NFTs by submitting correct secret codes
- **View Progress:** Check completed quests and badge count
- **Secure:** Secrets are hashed with keccak256; plaintext never stored on-chain

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/dashboard` | User stats and quest list |
| `/map` | Browse all available quests |
| `/create-quest` | Publish new quest |
| `/scanner` | Claim a badge |
| `/gallery` | View badge collection |


