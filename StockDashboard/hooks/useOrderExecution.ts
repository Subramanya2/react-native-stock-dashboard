import { useMutation, useQueryClient } from '@tanstack/react-query';
import { executeOrder, OrderRequest, PortfolioResponse } from '../api/stockApi';

export const useOrderExecution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (order: OrderRequest) => executeOrder(order),
    onMutate: async (newOrder) => {
      // 1. Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['portfolio'] });

      // 2. Snapshot the previous value
      const previousPortfolio = queryClient.getQueryData<PortfolioResponse>(['portfolio']);

      // 3. Optimistically update to the new value
      if (previousPortfolio) {
        const totalCost = newOrder.price * newOrder.shares;
        const currentBalance = previousPortfolio.cashBalance ?? 10000;
        const newBalance = newOrder.type === 'BUY'
          ? currentBalance - totalCost
          : currentBalance + totalCost;

        let updatedHoldings = [...(previousPortfolio.holdings || [])];
        const existingIndex = updatedHoldings.findIndex(h => h.symbol === newOrder.symbol);

        if (newOrder.type === 'BUY') {
          if (existingIndex >= 0) {
            updatedHoldings[existingIndex] = {
              ...updatedHoldings[existingIndex],
              shares: updatedHoldings[existingIndex].shares + newOrder.shares,
            };
          } else {
            updatedHoldings.push({ symbol: newOrder.symbol, shares: newOrder.shares });
          }
        } else if (newOrder.type === 'SELL') {
          if (existingIndex >= 0) {
            const newShares = updatedHoldings[existingIndex].shares - newOrder.shares;
            if (newShares <= 0) {
              updatedHoldings = updatedHoldings.filter(h => h.symbol !== newOrder.symbol);
            } else {
              updatedHoldings[existingIndex] = {
                ...updatedHoldings[existingIndex],
                shares: newShares,
              };
            }
          }
        }

        const optimisticPortfolio: PortfolioResponse = {
          ...previousPortfolio,
          cashBalance: newBalance,
          holdings: updatedHoldings,
        };

        queryClient.setQueryData(['portfolio'], optimisticPortfolio);
      }

      // 4. Return context containing the snapshot
      return { previousPortfolio };
    },
    onError: (err, newOrder, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousPortfolio) {
        queryClient.setQueryData(['portfolio'], context.previousPortfolio);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server state sync
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
};
