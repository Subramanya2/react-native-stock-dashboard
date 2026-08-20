import { useQuery } from '@tanstack/react-query';
import { fetchPortfolio, PortfolioHolding } from '../api/stockApi';
import { getStockPriceQueryKey, StockUpdate } from './useMarketData';
import { DEFAULT_AVG_COST } from '../constants/mockData';

export interface EvaluatedHolding extends PortfolioHolding {
  avgCost: number;
  totalSpent: number;
  currentPrice: number;
  currentValue: number;
  pnlDollar: number;
  pnlPercent: number;
}

export const usePortfolioValuation = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['portfolio'],
    queryFn: fetchPortfolio,
    refetchInterval: 60000,
  });

  // Subscribe to live SSE prices for all holdings
  const aaplQuery = useQuery<StockUpdate>({ queryKey: getStockPriceQueryKey('AAPL'), queryFn: () => null as any, staleTime: Infinity });
  const googlQuery = useQuery<StockUpdate>({ queryKey: getStockPriceQueryKey('GOOGL'), queryFn: () => null as any, staleTime: Infinity });
  const tslaQuery = useQuery<StockUpdate>({ queryKey: getStockPriceQueryKey('TSLA'), queryFn: () => null as any, staleTime: Infinity });
  const msftQuery = useQuery<StockUpdate>({ queryKey: getStockPriceQueryKey('MSFT'), queryFn: () => null as any, staleTime: Infinity });

  const livePrices: Record<string, number> = {
    AAPL: aaplQuery.data?.price ?? 150.0,
    GOOGL: googlQuery.data?.price ?? 2800.0,
    TSLA: tslaQuery.data?.price ?? 700.0,
    MSFT: msftQuery.data?.price ?? 300.0,
  };

  const cashBalance = data?.cashBalance ?? 10000;
  const holdings: PortfolioHolding[] = data?.holdings || [];

  let totalHoldingsValue = 0;
  let totalCostBasis = 0;

  const holdingValuations: EvaluatedHolding[] = holdings.map((h: PortfolioHolding) => {
    const currentPrice = livePrices[h.symbol] || DEFAULT_AVG_COST[h.symbol] || 100;
    const avgCost = h.avgCost ?? DEFAULT_AVG_COST[h.symbol] ?? currentPrice;
    const totalSpent = h.shares * avgCost;
    const currentValue = h.shares * currentPrice;
    const pnlDollar = currentValue - totalSpent;
    const pnlPercent = totalSpent > 0 ? (pnlDollar / totalSpent) * 100 : 0;

    totalHoldingsValue += currentValue;
    totalCostBasis += totalSpent;

    return {
      ...h,
      avgCost,
      totalSpent,
      currentPrice,
      currentValue,
      pnlDollar,
      pnlPercent,
    };
  });

  const totalNetWorth = cashBalance + totalHoldingsValue;
  const totalPnlDollar = totalHoldingsValue - totalCostBasis;
  const totalPnlPercent = totalCostBasis > 0 ? (totalPnlDollar / totalCostBasis) * 100 : 0;

  return {
    isLoading,
    error,
    cashBalance,
    holdings,
    holdingValuations,
    totalNetWorth,
    totalCostBasis,
    totalPnlDollar,
    totalPnlPercent,
  };
};
