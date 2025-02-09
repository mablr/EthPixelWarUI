import { getDefaultConfig } from 'connectkit';
import type { Metadata } from 'next';
import { createConfig } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum, anvil } from 'wagmi/chains';

export const config = createConfig(
  getDefaultConfig({
    appName: 'ConnectKit Next.js demo',
    chains: [mainnet, polygon, optimism, arbitrum, anvil],
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  })
);

export const metadata: Metadata = {
    title: 'EthPixelWar',
    description: 'Pixel art game on Ethereum',
  };

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}