import React from 'react';

interface StockInfoProps {
  quantityAvailable: number; // Quantity available as a prop
  threshold: number;
}
export default function StockInfo({
  quantityAvailable,
  threshold,
}: StockInfoProps) {
  const inventory = quantityAvailable || 0; // Default to 0 if quantityAvailable is not provided

  let stockMessage: React.ReactNode = null;

  if (inventory === 0) {
    stockMessage = '';
  } else if (inventory <= 10) {
    // If inventory is 10 or less, show "Only X left!" message
    stockMessage = `Only ${inventory} left!`;
  } else if (inventory <= 15) {
    // If inventory is between 11-15, show "Only A Few Left!" message
    stockMessage = 'Only A Few Left!';
  }

  return (
    stockMessage && (
      <div className="inline-block">
        <span className="text-xs font-bold uppercase capitalize text-red">
          {stockMessage}
        </span>
      </div>
    )
  );
}
