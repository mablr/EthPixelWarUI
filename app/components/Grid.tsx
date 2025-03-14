'use client';

import { useAccount, useReadContract } from 'wagmi';
import { useState, useEffect } from 'react';
import PixelModal from './PixelModal';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../contract';

// Type definition for a pixel in the grid
type Pixel = {
  owner: string;
  highestBid: bigint;
  r: number;
  g: number;
  b: number;
};

// Type for pixel with ID (used when passing to PixelModal)
type PixelWithId = Pixel & {
  id: number;
};

// Default empty pixel for fallback cases
const DEFAULT_PIXEL: PixelWithId = {
  id: 0,
  highestBid: BigInt(0),
  owner: '',
  r: 0,
  g: 0,
  b: 0
};

/**
 * Grid Component - Displays the pixel canvas for EthPixelWar
 * 
 * This component renders the main interactive grid where users can:
 * - View all pixels in the current state
 * - See highlighted pixels they own (when showOwnedPixels is true)
 * - Click on pixels to open a modal for bidding or changing colors
 * 
 * @param showOwnedPixels - Whether to highlight pixels owned by the current user
 * @param isWarActive - Whether the pixel war is currently active (affects bidding)
 */
export default function Grid({ 
  showOwnedPixels, 
  isWarActive 
}: { 
  showOwnedPixels: boolean;
  isWarActive: boolean;
}) {
  // State for grid configuration and pixel data
  const [gridDimensions, setGridDimensions] = useState<{ dimX: number, dimY: number }>({ dimX: 0, dimY: 0 });
  const [selectedPixel, setSelectedPixel] = useState<number | null>(null);
  const [pixels, setPixels] = useState<Pixel[]>([]);
  
  // Get user's wallet address
  const { address } = useAccount();

  // Fetch grid dimensions from smart contract
  const { data: dimX } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'dimX',
  });

  const { data: dimY } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'dimY',
  });

  // Fetch all pixels data in a single call
  const { data: gridData, refetch: refetchGrid } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getGrid',
  });

  // Auto-refresh grid data every 10 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      refetchGrid();
    }, 10000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [refetchGrid]);

  // Update local state when grid data is fetched
  useEffect(() => {
    if (gridData) {
      setPixels(gridData as Pixel[]);
    }
  }, [gridData]);

  // Calculate and update grid dimensions when nbPixels changes
  useEffect(() => {
    if (dimX && dimY) {
      // Grid is square, so dimension is square root of total pixels
      setGridDimensions({ dimX: Number(dimX), dimY: Number(dimY) });
    }
  }, [dimX, dimY]);

  // Handle pixel selection and modal closing
  const handlePixelClick = (index: number) => setSelectedPixel(index);
  const handleModalClose = () => {
    refetchGrid();
    setSelectedPixel(null);
  };

  // Render welcome message if wallet not connected or grid not loaded
  if (!address || gridDimensions.dimX === 0 || gridDimensions.dimY === 0) {
    return (
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
    );
  }

  return (
    <>
      {/* Render grid of pixels with dynamic dimensions */}
      <div
        className="grid w-full mx-auto border-4 border-grey-800 rounded-xl overflow-hidden shadow-md" 
        style={{
          gridTemplateColumns: `repeat(${gridDimensions.dimX}, minmax(0, 1fr))`
        }}
      >
        {/* Generate grid cells based on dimensions */}
        {Array.from({ length: gridDimensions.dimX * gridDimensions.dimY }).map((_, index) => {
          const pixel = pixels[index];
          if (!pixel) return null;
          
          return (
            <div
              key={index}
              onClick={() => handlePixelClick(index)}
              className="aspect-square w-full cursor-pointer border-2 hover:border-green-500 border-transparent"
              style={{
                backgroundColor: `rgb(${pixel.r}, ${pixel.g}, ${pixel.b})`,
              }}
            >
              {/* Highlight pixels owned by the current user when showOwnedPixels is true */}
              <div 
                className={`aspect-square w-full border-4 rounded-sm ${
                  showOwnedPixels && pixel.owner === address 
                    ? 'border-blue-500' 
                    : 'border-transparent'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Modal for pixel interaction (bidding/coloring) */}
      <PixelModal
        isOpen={selectedPixel !== null}
        onClose={handleModalClose}
        isWarActive={isWarActive}
        {...(selectedPixel !== null 
          ? { 
              id: selectedPixel, 
              ...pixels[selectedPixel] 
            } 
          : DEFAULT_PIXEL
        )}
      />
    </>
  );
} 