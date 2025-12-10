// Type declarations for path aliases
// This helps TypeScript resolve @/ imports

declare module '@/lib/web3' {
  export * from './lib/web3';
}

declare module '@/services/contractService' {
  export * from './services/contractService';
}

declare module '@/services/leaderboardService' {
  export * from './services/leaderboardService';
}

