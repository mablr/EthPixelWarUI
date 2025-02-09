'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../contract';

// Individual pixel component that displays color and handles selection
interface PixelProps {
  x: number;
  y: number;
  showOwned: boolean; // Whether to highlight pixels owned by current user
  onSelect: (pixelData: {
    x: number;
    y: number;
    currentBid: bigint;
    owner: string;
    currentColor: { r: number; g: number; b: number };
    refetch: () => void;
  }) => void;
}

export default function Pixel({ x, y, onSelect, showOwned }: PixelProps) {
  const { address } = useAccount();
  const [owner, setOwner] = useState('0x0000000000000000000000000000000000000000');
  const [highestBid, sethighestBid] = useState(BigInt(0));
  const [color, setColor] = useState({r: 200, g: 200, b: 200});

  // Fetch pixel data from smart contract
  const { data: pixelData, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'grid',
    args: [x, y],
  });

  // Update local state when pixel data changes
  useEffect(() => {
    if (pixelData) {
      const [pixelOwner, pixelBid, r, g, b] = pixelData as [string, bigint, number, number, number];
      setOwner(pixelOwner);
      sethighestBid(pixelBid);
      setColor({r, g, b});
    }
  }, [pixelData]);

  const isOwned = owner == address;
  
  return (
    <div
      onClick={() => onSelect({
        x,
        y,
        currentBid: highestBid,
        owner,
        currentColor: color,
        refetch
      })}
      className="aspect-square w-full cursor-pointer border-2 hover:border-green-500 border-transparent"
      style={{
        backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
      }}
    >
      <div className={`aspect-square w-full border-4 rounded-sm ${showOwned && isOwned ? ' border-blue-500' : 'border-transparent'}`}></div>
    </div>
  );
} 