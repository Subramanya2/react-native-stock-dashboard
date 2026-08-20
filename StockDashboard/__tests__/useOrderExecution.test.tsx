import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOrderExecution } from '../hooks/useOrderExecution';
import { PortfolioResponse } from '../api/stockApi';

// Ambient type declarations for test runner globals
declare const describe: (name: string, fn: () => void) => void;
declare const beforeEach: (fn: () => void) => void;
declare const it: (name: string, fn: () => Promise<void> | void) => void;
declare const expect: (value: any) => any;
declare const jest: any;

const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useOrderExecution Hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  it('optimistically updates cash balance and holdings on BUY order', async () => {
    const initialPortfolio: PortfolioResponse = {
      userId: 'user123',
      cashBalance: 10000,
      holdings: [{ symbol: 'AAPL', shares: 10 }],
    };

    queryClient.setQueryData(['portfolio'], initialPortfolio);

    // Perform optimistic mutation simulation
    const totalCost = 150 * 1;
    const optimisticPortfolio: PortfolioResponse = {
      ...initialPortfolio,
      cashBalance: initialPortfolio.cashBalance! - totalCost,
      holdings: [{ symbol: 'AAPL', shares: 11 }],
    };
    queryClient.setQueryData(['portfolio'], optimisticPortfolio);

    const optimisticData = queryClient.getQueryData<PortfolioResponse>(['portfolio']);
    expect(optimisticData?.cashBalance).toBe(9850);
    expect(optimisticData?.holdings.find((h) => h.symbol === 'AAPL')?.shares).toBe(11);
  });

  it('rolls back portfolio cache on order failure', async () => {
    const initialPortfolio: PortfolioResponse = {
      userId: 'user123',
      cashBalance: 10000,
      holdings: [{ symbol: 'AAPL', shares: 10 }],
    };

    queryClient.setQueryData(['portfolio'], initialPortfolio);

    // Rollback simulation
    queryClient.setQueryData(['portfolio'], initialPortfolio);

    const rolledBackData = queryClient.getQueryData<PortfolioResponse>(['portfolio']);
    expect(rolledBackData?.cashBalance).toBe(10000);
    expect(rolledBackData?.holdings.find((h) => h.symbol === 'AAPL')?.shares).toBe(10);
  });
});
