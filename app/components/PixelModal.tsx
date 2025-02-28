'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../contract';

// Modal component for interacting with individual pixels
// Allows bidding on pixels and updating colors for owned pixels
interface PixelModalProps {
  isOpen: boolean;
  onClose: () => void;
  isWarActive: boolean;
  id: number;
  currentBid: bigint;
  owner: string;
  currentColor: { r: number; g: number; b: number };
  refetch: () => void;
}

export default function PixelModal({
  isOpen,
  onClose,
  isWarActive,
  id,
  currentBid,
  owner,
  currentColor,
  refetch,
}: PixelModalProps) {
  const { address } = useAccount();
  const [bidAmount, setBidAmount] = useState(currentBid);
  const [color, setColor] = useState(currentColor);
  
  // Reset these when modal closes
  const [bidHash, setBidHash] = useState<`0x${string}` | undefined>();
  const [colorHash, setColorHash] = useState<`0x${string}` | undefined>();
  
  const { writeContract, isPending: isBidLoading, data: newBidHash } = useWriteContract();
  const { writeContract: writeColorUpdate, isPending: isColorLoading, data: newColorHash } = useWriteContract();

  const { isLoading: isBidConfirming, isSuccess: isBidSuccess } = useWaitForTransactionReceipt({
    hash: bidHash,
  });

  const { isLoading: isColorConfirming, isSuccess: isColorSuccess } = useWaitForTransactionReceipt({
    hash: colorHash,
  });

  // Update hashes when new transactions are initiated
  useEffect(() => {
    if (newBidHash) setBidHash(newBidHash);
  }, [newBidHash]);

  useEffect(() => {
    if (newColorHash) setColorHash(newColorHash);
  }, [newColorHash]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setBidAmount(currentBid);
      setColor(currentColor);
    } else {
      // Reset transaction hashes when modal closes
      setBidHash(undefined);
      setColorHash(undefined);
    }
  }, [isOpen, currentBid, currentColor]);

  // Handle successful transactions
  useEffect(() => {
    if (isBidSuccess || isColorSuccess) {
      refetch(); // Refresh pixel data
      onClose(); // Close modal after successful transaction
    }
  }, [isBidSuccess, isColorSuccess, refetch, onClose]);

  // Submit bid transaction to smart contract
  const placeBid = (params: { id: number, value: bigint }) => writeContract({
    abi: CONTRACT_ABI,
    address: CONTRACT_ADDRESS,
    functionName: 'bid',
    args: [params.id],
    value: params.value,
  });

  const handleBid = () => {
    if (!bidAmount || bidAmount <= currentBid) {
      alert('Bid must be greater than current bid');
      return;
    }
    placeBid({
      id: id,
      value: bidAmount,
    });
  };

  // Submit color update transaction to smart contract
  const updateColor = (params: { id: number, color: { r: number, g: number, b: number } }) => writeColorUpdate({
    abi: CONTRACT_ABI,
    address: CONTRACT_ADDRESS,
    functionName: 'updateColor',
    args: [params.id, params.color.r, params.color.g, params.color.b]
  });

  const handleColorUpdate = () => {
    updateColor({
      id: id,
      color: color,
    });
  };

  const isOwner = address === owner;

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <div className="bg-white p-8 rounded-lg max-w-lg w-full relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 z-[60]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span 
                className="inline-block w-6 h-6 border-2 border-gray-400 rounded-md" 
                style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
              ></span>
              Pixel #{id}
            </h2>
              <div className="mb-4">
                <p className="truncate">Current Bid: {Number(currentBid) / 1e18} ETH</p>
                <p className="truncate">Owner: {owner}</p>
              </div>
          
            {isWarActive && !isOwner && (
              <div className="flex w-full gap-4">
                <input
                  type="number"
                  step="0.01"
                  value={`${Number(bidAmount) / 1e18}`}
                  onChange={(e) => setBidAmount(BigInt(Number(e.target.value) * 1e18))}
                  className="border p-2 rounded flex-grow"
                  disabled={isBidLoading || isBidConfirming}
                />
                <button
                  onClick={handleBid}
                  disabled={isBidLoading || isBidConfirming || bidAmount <= currentBid}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 whitespace-nowrap"
                >
                  {isBidLoading ? 'Bidding...' : isBidConfirming ? 'Confirming...' : 'Place Bid (ETH)'}
                </button>
              </div>
            )}

            {isWarActive && isOwner && (
              <>
                <div className="mb-4 grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-sm text-gray-600">Red</label>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={color.r}
                      onChange={(e) => setColor(prev => ({
                        ...prev,
                        r: Number(e.target.value)
                      }))}
                      className="w-full"
                      disabled={isColorLoading || isColorConfirming}
                    />
                    <div className="text-center text-sm">{color.r}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Green</label>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={color.g}
                      onChange={(e) => setColor(prev => ({
                        ...prev,
                        g: Number(e.target.value)
                      }))}
                      className="w-full"
                      disabled={isColorLoading || isColorConfirming}
                    />
                    <div className="text-center text-sm">{color.g}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Blue</label>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={color.b}
                      onChange={(e) => setColor(prev => ({
                        ...prev,
                        b: Number(e.target.value)
                      }))}
                      className="w-full"
                      disabled={isColorLoading || isColorConfirming}
                    />
                    <div className="text-center text-sm">{color.b}</div>
                  </div>
                </div>
                <button
                  onClick={handleColorUpdate}
                  disabled={isColorLoading || isColorConfirming}
                  className="bg-green-500 w-full text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                >
                  {isColorLoading ? 'Updating...' : isColorConfirming ? 'Confirming...' : 'Update Color'}
                </button>
              </>
            )}


          </div>
        </div>
      )}
    </>
  );
} 