'use client';

import Navbar from './components/Navbar';
import Grid from './components/Grid';
import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from './contract';

export default function App() {
  const [showOwnedPixels, setShowOwnedPixels] = useState(true);
  const [isWarActive, setIsWarActive] = useState<boolean>(true);

  // Read war activity status from the contract
  const { data: warActiveStatus, refetch: refetchWarStatus } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'pixelWarIsActive',
  });

  // Update local state when war status changes
  useEffect(() => {
    if (warActiveStatus !== undefined) {
      setIsWarActive(!!warActiveStatus);
    }
  }, [warActiveStatus]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        showOwnedPixels={showOwnedPixels} 
        setShowOwnedPixels={setShowOwnedPixels} 
        isWarActive={isWarActive}
        refetchWarStatus={refetchWarStatus}
      />
      <main className="pt-20 px-4 max-w-5xl mx-auto">
        <Grid 
          showOwnedPixels={showOwnedPixels} 
          isWarActive={isWarActive} 
        />
      </main>
    </div>
  );
}

App;
