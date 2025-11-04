# Real-Time Stock Trading Dashboard

This is a React Native (Expo) application that features a real-time stock watchlist and portfolio, all powered by Server-Sent Events (SSE) and TanStack Query for sophisticated caching.

## 🚀 Tech Stack

* **React Native (Expo)**
* **TypeScript**
* **TanStack Query v5 (React Query)**: For all data fetching, caching, and state management.
* **Zustand**: For minimal, global state (like SSE connection status).
* **@shopify/flash-list**: For high-performance, virtualized lists.
* **Server-Sent Events (SSE)**: For the real-time data stream.

## ✨ Features

* **Real-Time Data Stream:** A custom `useMarketData` hook manages a persistent SSE connection to the backend. It includes automatic reconnection logic with exponential backoff.
* **Intelligent Caching:** Uses TanStack Query for all data fetching.
    * Live SSE updates are fed directly into the query cache (`setQueryData`).
    * Related queries (like historical data or portfolios) are automatically invalidated (`invalidateQueries`) to trigger a fresh, non-blocking refetch (stale-while-revalidate).
* **Live-Updating UI:** The main watchlist updates in real-time with color-coded gain/loss indicators.
* **Optimized Performance:**
    * Uses `@shopify/flash-list` to ensure the watchlist can scale to thousands of items with no performance loss.
    * Employs `React.memo` on list items (`StockRow`) to prevent unnecessary re-renders.
    * Configured `gcTime` (cache time) and `staleTime` for efficient memory management.

## 🏁 How to Run

This project requires two separate terminals to run the backend server and the frontend app.

### 1. Backend Server

In your first terminal, navigate to the backend folder and start the server.

```bash
# From the project's root directory
cd ../stock-backend

# Start the server
node server.js

# Server will be running at http://localhost:8080

```

### 2. Frontend(App) 

In your second terminal, navigate to the app's folder and start the Expo server.

```bash
# (In the StockDashboard folder)

# Install all packages
npm install

# Start the app and clear the cache
npx expo start -c

# Scan the QR code with the Expo Go app

```