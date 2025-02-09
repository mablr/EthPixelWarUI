# EthPixelWar

A Next.js UI for EthPixelWar.

## Getting Started

Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

The main components of this application include:

- `app/page.tsx` - The main page component containing the chat grid
- `app/components/Grid.tsx` - The grid component that displays the pixels
- `app/components/Navbar.tsx` - Navigation bar component
- `app/contract.ts` - Type definitions and contracts
- `app/providers.tsx` - Application providers setup
- `config.ts` - Configuration settings for ConnectKit

## Features

- Bid on pixels to own them
- Choose the color of the pixels you own
- Outline the pixels you own
- Withdraw the amount of lost bids 
- The owner can end the war at any time and send back the bids to the users

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - For styling
- [ConnectKit](https://connectkit.com/) - For wallet connection
- [Wagmi](https://wagmi.sh/) - For contract interaction

## Deployment

The application can be deployed using [Vercel](https://vercel.com) or your preferred hosting platform.
