'use client';

import { useAccount, useReadContract } from 'wagmi';
import { useState, useEffect } from 'react';
import Pixel from './Pixel';
import PixelModal from './PixelModal';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../contract';

// Main grid component that displays the pixel canvas
// Shows a welcome message if wallet is not connected or grid is not available
export default function Grid({ 
  showOwnedPixels, 
  isWarActive 
}: { 
  showOwnedPixels: boolean;
  isWarActive: boolean;
}) {
  const [gridDimension, setGridDimension] = useState<number>(0);
  const { address } = useAccount();
  const [selectedPixel, setSelectedPixel] = useState<{
    id: number;
    currentBid: bigint;
    owner: string;
    currentColor: { r: number; g: number; b: number };
    refetch: () => void;
  } | null>(null);

  // Fetch grid dimensions from smart contract
  const { data: nbPixels } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'nbPixels',
  });

  // Update local state when grid size is fetched
  useEffect(() => {
    if (nbPixels) {
      setGridDimension(Math.sqrt(Number(nbPixels)));
    }
  }, [nbPixels]);

  return (
    <>
      {/* Show welcome message if wallet not connected or grid not loaded */}
      {!address || gridDimension === 0 ? (
        <div className="w-full max-w-3xl mx-auto p-8">
          <div className="bg-gray-100 rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-semibold mb-3">No Grid Available</h2>
            <p className="text-gray-600">
              Please make sure you have:
              <br />
              1. Connected your wallet
              <br />
              2. Connected to the correct network where EthPixelWar is deployed
            </p>
          </div>
        </div>
      ) : (
        // Render grid of pixels with dynamic dimensions
        <div
          key={gridDimension}
          className="grid w-full max-w-3xl mx-auto border-4 border-grey-800 rounded-xl overflow-hidden shadow-md" 
          style={{
            gridTemplateColumns: `repeat(${gridDimension}, minmax(0, 1fr))`
          }}
        >
          {/* Generate grid cells based on dimensions */}
          {Array.from({ length: gridDimension * gridDimension }).map((_, index) => {
            return (
              <Pixel 
                key={index} 
                id={index}
                onSelect={setSelectedPixel}
                showOwned={showOwnedPixels}
              />
            );
          })}
        </div>
      )}

      <PixelModal
        isOpen={selectedPixel !== null}
        onClose={() => {
          if (selectedPixel?.refetch) {
            selectedPixel.refetch();
          }
          setSelectedPixel(null);
        }}
        isWarActive={isWarActive}
        {...selectedPixel || {
          id: 0,
          currentBid: BigInt(0),
          owner: '',
          currentColor: { r: 0, g: 0, b: 0 },
          refetch: () => {}
        }}
      />
    </>
  );
} 