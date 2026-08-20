import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60, // 1 minute
            gcTime: 1000 * 60 * 60 * 24, // 24 hours to keep cached data across app launches
            structuralSharing: true, // Optimizes re-renders
        },
    },
});