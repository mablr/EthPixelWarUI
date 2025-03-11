'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../contract';

/**
 * Props for the PixelModal component
 */
interface PixelModalProps {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Function to call when the modal is closed */
  onClose: () => void;
  /** Whether the pixel war is currently active */
  isWarActive: boolean;
  /** ID of the pixel being interacted with */
  id: number;
  /** Current highest bid on the pixel */
  highestBid: bigint;
  /** Current owner of the pixel */
  owner: string;
  /** Red color component (0-255) */
  r: number;
  /** Green color component (0-255) */
  g: number;
  /** Blue color component (0-255) */
  b: number;
}

/**
 * Type for RGB color values
 */
interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Modal component for interacting with individual pixels
 * 
 * Features:
 * - Displays pixel information (ID, owner, highest bid)
 * - Allows bidding on pixels if not owned by the current user
 * - Allows changing pixel color if owned by the current user
 * - Shows transaction status (loading, confirming, success)
 */
export default function PixelModal({
  isOpen,
  onClose,
  isWarActive,
  id,
  highestBid,
  owner,
  r,
  g,
  b,
}: PixelModalProps) {
  // Get user's wallet address
  const { address } = useAccount();
  
  // Check if current user is the owner of this pixel
  const isOwner = address === owner;
  
  // State for user inputs
  const [bidAmount, setBidAmount] = useState(highestBid);
  const [newColor, setNewColor] = useState<RGBColor>({ r, g, b });
  
  // Transaction state
  const [bidHash, setBidHash] = useState<`0x${string}` | undefined>();
  const [colorHash, setColorHash] = useState<`0x${string}` | undefined>();
  
  // Contract write functions
  const { 
    writeContract, 
    isPending: isBidLoading, 
    data: newBidHash 
  } = useWriteContract();
  
  const { 
    writeContract: writeColorUpdate, 
    isPending: isColorLoading, 
    data: newColorHash 
  } = useWriteContract();

  // Transaction status tracking
  const { 
    isLoading: isBidConfirming, 
    isSuccess: isBidSuccess 
  } = useWaitForTransactionReceipt({
    hash: bidHash,
  });

  const { 
    isLoading: isColorConfirming, 
    isSuccess: isColorSuccess 
  } = useWaitForTransactionReceipt({
    hash: colorHash,
  });

  // Update transaction hashes when new transactions are initiated
  useEffect(() => {
    if (newBidHash) setBidHash(newBidHash);
  }, [newBidHash]);

  useEffect(() => {
    if (newColorHash) setColorHash(newColorHash);
  }, [newColorHash]);

  // Reset state when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      // Initialize with current values when modal opens
      setBidAmount(highestBid);
      setNewColor({ r, g, b });
    } else {
      // Reset transaction hashes when modal closes
      setBidHash(undefined);
      setColorHash(undefined);
    }
  }, [isOpen, highestBid, r, g, b]);

  // Close modal after successful transaction
  useEffect(() => {
    if (isBidSuccess || isColorSuccess) {
      onClose();
    }
  }, [isBidSuccess, isColorSuccess, onClose]);

  /**
   * Submit bid transaction to smart contract
   * @param id - ID of the pixel to bid on
   * @param value - Bid amount in wei
   */
  const placeBid = (id: number, value: bigint) => writeContract({
    abi: CONTRACT_ABI,
    address: CONTRACT_ADDRESS,
    functionName: 'bid',
    args: [id],
    value: value,
  });

  /**
   * Submit color update transaction to smart contract
   * @param id - ID of the pixel to update
   * @param color - New RGB color values
   */
  const updateColor = (id: number, color: RGBColor) => writeColorUpdate({
    abi: CONTRACT_ABI,
    address: CONTRACT_ADDRESS,
    functionName: 'updateColor',
    args: [id, color.r, color.g, color.b]
  });

  // Helper to convert wei to ETH for display
  const weiToEth = (wei: bigint) => Number(wei) / 1e18;

  // Don't render anything if modal is closed
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white p-8 rounded-lg max-w-lg w-full relative">
        {/* Pixel header with color preview */}
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span 
            className="inline-block w-6 h-6 border-2 border-gray-400 rounded-md" 
            style={{ backgroundColor: `rgb(${newColor.r}, ${newColor.g}, ${newColor.b})` }}
          />
          Pixel #{id}
        </h2>

        {/* Pixel information */}
        <div className="mb-4">
          <p className="truncate">Highest Bid: {weiToEth(highestBid)} ETH</p>
          <p className="truncate">Owner: {owner}</p>
        </div>
      
        {/* Bidding interface (for non-owners during active war) */}
        {isWarActive && !isOwner && (
          <div className="flex w-full gap-4">
            <input
              type="number"
              step="0.01"
              value={`${weiToEth(bidAmount)}`}
              onChange={(e) => setBidAmount(BigInt(Number(e.target.value) * 1e18))}
              className="border p-2 rounded flex-grow"
              disabled={isBidLoading || isBidConfirming}
            />
            <button
              onClick={() => placeBid(id, bidAmount)}
              disabled={isBidLoading || isBidConfirming || bidAmount <= highestBid}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 whitespace-nowrap"
            >
              {isBidLoading ? 'Bidding...' : isBidConfirming ? 'Confirming...' : 'Place Bid (ETH)'}
            </button>
          </div>
        )}

        {/* Color picker interface (for owners during active war) */}
        {isWarActive && isOwner && (
          <>
            <div className="mb-4 grid grid-cols-3 gap-2">
              {/* Red color slider */}
              <div>
                <label className="text-sm text-gray-600">Red</label>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={newColor.r}
                  onChange={(e) => setNewColor(prev => ({
                    ...prev,
                    r: Number(e.target.value)
                  }))}
                  className="w-full"
                  disabled={isColorLoading || isColorConfirming}
                />
                <div className="text-center text-sm">{newColor.r}</div>
              </div>
              
              {/* Green color slider */}
              <div>
                <label className="text-sm text-gray-600">Green</label>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={newColor.g}
                  onChange={(e) => setNewColor(prev => ({
                    ...prev,
                    g: Number(e.target.value)
                  }))}
                  className="w-full"
                  disabled={isColorLoading || isColorConfirming}
                />
                <div className="text-center text-sm">{newColor.g}</div>
              </div>
              
              {/* Blue color slider */}
              <div>
                <label className="text-sm text-gray-600">Blue</label>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={newColor.b}
                  onChange={(e) => setNewColor(prev => ({
                    ...prev,
                    b: Number(e.target.value)
                  }))}
                  className="w-full"
                  disabled={isColorLoading || isColorConfirming}
                />
                <div className="text-center text-sm">{newColor.b}</div>
              </div>
            </div>
            
            {/* Update color button */}
            <button
              onClick={() => updateColor(id, newColor)}
              disabled={isColorLoading || isColorConfirming}
              className="bg-green-500 w-full text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {isColorLoading ? 'Updating...' : isColorConfirming ? 'Confirming...' : 'Update Color'}
            </button>
          </>
        )}
      </div>
    </div>
  );
} 