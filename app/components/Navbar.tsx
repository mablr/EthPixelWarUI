'use client';

import { metadata } from '@/config';
import { ConnectKitButton } from 'connectkit';
import Link from 'next/link';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/app/contract';
import { useEffect, useState } from 'react';

/**
 * Interface for Navbar component props
 */
interface NavbarProps {
  /** Whether to highlight pixels owned by the current user */
  showOwnedPixels: boolean;
  /** Function to toggle the display of owned pixels */
  setShowOwnedPixels: (show: boolean) => void;
  /** Whether the pixel war is currently active */
  isWarActive: boolean;
  /** Function to refresh the war status */
  refetchWarStatus: () => void;
}

/**
 * Navigation bar component with wallet connection and user actions
 * 
 * Features:
 * - Wallet connection button
 * - Toggle for showing owned pixels
 * - Withdraw button for pending withdrawals
 * - End War button for contract owner
 */
export default function Navbar({ 
  showOwnedPixels, 
  setShowOwnedPixels, 
  isWarActive,
  refetchWarStatus
}: NavbarProps) {
  // Get user's wallet address
  const { address } = useAccount();
  
  // Transaction state
  const [withdrawHash, setWithdrawHash] = useState<`0x${string}` | undefined>();
  const [endWarHash, setEndWarHash] = useState<`0x${string}` | undefined>();

  // Contract interaction hooks
  const { data: contractOwner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'owner',
  });

  // Read pending withdrawal amount
  const { data: pendingWithdrawal, refetch: refetchPendingWithdrawal } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'pendingWithdrawals',
    args: [address as `0x${string}`],
  });

  // Setup contract write functions
  const { writeContract, data: newWithdrawHash } = useWriteContract();
  const { writeContract: writeEndWar, data: newEndWarHash } = useWriteContract();

  // Track transaction status
  const { isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });
  const { isSuccess: isEndWarSuccess } = useWaitForTransactionReceipt({
    hash: endWarHash,
  });

  // Update transaction hashes when new transactions are initiated
  useEffect(() => {
    if (newWithdrawHash) setWithdrawHash(newWithdrawHash);
  }, [newWithdrawHash]);

  useEffect(() => {
    if (newEndWarHash) setEndWarHash(newEndWarHash);
  }, [newEndWarHash]);

  // Handle successful transactions
  useEffect(() => {
    if (isWithdrawSuccess) {
      refetchPendingWithdrawal();
    }
  }, [isWithdrawSuccess, refetchPendingWithdrawal]);
  
  useEffect(() => {
    if (isEndWarSuccess) {
      refetchWarStatus();
    }
  }, [isEndWarSuccess, refetchWarStatus]);

  // Auto-refresh warStatus and pendingWithdrawal every 10 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      refetchWarStatus();
      refetchPendingWithdrawal();
    }, 10000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [refetchWarStatus, refetchPendingWithdrawal]);


  /**
   * Initiates withdrawal of pending funds
   */
  const handleWithdraw = async () => {
    if (!pendingWithdrawal) return;
    
    await writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'withdraw',
    });
  };

  /**
   * Ends the pixel war (owner only)
   */
  const handleEndWar = async () => {
    await writeEndWar({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'endPixelWar',
    });
  };

  // Check if user is the contract owner
  const isContractOwner = address !== undefined && contractOwner !== undefined && address === contractOwner;
  
  // Check if user has pending withdrawals
  const hasPendingWithdrawal = address !== undefined && 
    pendingWithdrawal !== undefined && 
    pendingWithdrawal > 0;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* App title and war status */}
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xl font-bold">
              {metadata.title?.toString()}
            </Link>
            {!isWarActive && (
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full font-medium">
                Ended
              </span>
            )}
          </div>
          
          {/* Action buttons and wallet connection */}
          <div className="flex items-center gap-4">
            {/* My Pixels toggle button */}
            {address !== undefined && (
              <button
                onClick={() => setShowOwnedPixels(!showOwnedPixels)}
                className={`px-3 py-2 rounded-xl ${
                  showOwnedPixels ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                  } hover:opacity-90`}
              >
                My Pixels
              </button>
            )}
            
            {/* Withdraw button */}
            {hasPendingWithdrawal && (
              <button
                onClick={handleWithdraw}
                className="pr-3 p-2 bg-green-500 text-white rounded-xl hover:bg-green-600 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span>{`${Number(pendingWithdrawal) / 1e18} ETH`}</span>
              </button>
            )}
            
            {/* End War button (owner only) */}
            {isContractOwner && isWarActive && (
              <button
                onClick={handleEndWar}
                className="pr-3 p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>End War</span>
              </button>
            )}
            
            {/* Wallet connection button */}
            <ConnectKitButton />
          </div>
        </div>
      </div>
    </nav>
  );
}