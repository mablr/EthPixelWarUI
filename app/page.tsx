'use client';

import Navbar from './components/Navbar';
import Grid from './components/Grid';
import { useState } from 'react';

export default function App() {
  const [showOwnedPixels, setShowOwnedPixels] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar showOwnedPixels={showOwnedPixels} setShowOwnedPixels={setShowOwnedPixels} />
      <main className="pt-20 px-4 max-w-7xl mx-auto my-auto">
        <Grid showOwnedPixels={showOwnedPixels} />
      </main>
    </div>
  );
}

App;
