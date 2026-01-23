/**
 * Mock data for the Pool Dashboard
 */

export const MOCK_POOLS = [
  { id: "solo-usdv", name: "SOLO / USDV", token: "SOLO", base: "USDV", price: 1.25 },
  { id: "solo-sol", name: "SOLO / SOL", token: "SOLO", base: "SOL", price: 0.0068 },
  { id: "usdv-usdc", name: "USDV / USDC", token: "USDV", base: "USDC", price: 1.00 },
  { id: "sol-usdc", name: "SOL / USDC", token: "SOL", base: "USDC", price: 185.42 },
  { id: "bonk-sol", name: "BONK / SOL", token: "BONK", base: "SOL", price: 0.000024 },
];

export const generateMockBins = (basePrice: number) => {
  const bins = [];
  const binWidth = 0.5; // 0.5% price range per bin
  const numBins = 40;
  const centerBin = Math.floor(numBins / 2);
  
  for (let i = 0; i < numBins; i++) {
    const distFromCenter = Math.abs(i - centerBin);
    const priceMin = basePrice * (1 + (i - centerBin - 0.5) * binWidth / 100);
    const priceMax = basePrice * (1 + (i - centerBin + 0.5) * binWidth / 100);
    
    // Liquidity follows a normal-ish distribution centered on current price
    const baseLiquidity = Math.max(0, 50000 - distFromCenter * distFromCenter * 200);
    const randomVariance = Math.random() * 10000;
    const liquidity = Math.floor(baseLiquidity + randomVariance);
    
    bins.push({
      id: i,
      priceMin: basePrice > 1 ? Math.round(priceMin * 100) / 100 : Number(priceMin.toFixed(6)),
      priceMax: basePrice > 1 ? Math.round(priceMax * 100) / 100 : Number(priceMax.toFixed(6)),
      liquidity,
      isCurrentPrice: i === centerBin,
      userLiquidity: i >= centerBin - 3 && i <= centerBin + 3 ? Math.floor(liquidity * 0.15) : undefined,
    });
  }
  
  return bins;
};

export const MOCK_STATS = {
  tvl: 2450000,
  volume24h: 1250000,
  apr: 42.5,
  activePositions: 3,
  userTVL: 12500,
  fees24h: 45.32,
};
