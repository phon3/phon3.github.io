---
layout: post
title: "Building a Fault-Tolerant, Chain-Agnostic RPC Proxy"
date: 2026-01-12
categories: [blockchain, devops, nodejs]
image: /images/profile.jpg
---

Reliability is the cornerstone of any blockchain application. Whether you are running an indexer, a trading bot, or a simple dApp, your connection to the blockchain—the **RPC endpoint**—is often the single point of failure.

Today, we're releasing a new tool to solve this: **[Chain Agnostic RPC Proxy](https://github.com/phon3/chain-agnostic-rpc-proxy)**.

It's a lightweight, self-hosted proxy that acts as a robust middleman between your application and multiple RPC providers.

## The Problem: RPC Downtime

Public RPCs (like the free tiers of Infura, Alchemy, or public Ankr nodes) are great, but they have rate limits and occasional downtime. If your app relies on a single URL, you go down when they go down.

## The Solution: Auto-Balancing & Failover

Our proxy takes a list of providers for any chain (Ethereum, Arbitrum, Base, etc.) and turns them into a single, reliable endpoint.

### How It Works

1.  **Requests**: You send your JSON-RPC requests to the proxy (e.g., `http://localhost:3000/ethereum/mainnet`).
2.  **Load Balancing**: For *every single request*, the proxy randomly shuffles your list of providers. This ensures traffic is distributed evenly across all your configured nodes.
3.  **Automatic Failover**: The proxy attempts to send your request to the first provider in the shuffled list. If that provider fails (timeout, network error, or sync error), it instantly retries with the next one.

Here is the core logic that makes it happen:

```javascript
// Shuffle providers for simple load balancing
const shuffledProviders = shuffleArray([...providers]);

for (const providerUrl of shuffledProviders) {
    try {
        const result = await proxyRequest(providerUrl, 'POST', req.body);
        return res.json(result);
    } catch (error) {
        // Log error and automatically continue to the next provider
        console.warn(`[${providerUrl}] Failed, trying next...`);
    }
}
```

## Getting Started

It's completely open source and easy to run with Docker.

1.  **Clone the Repo**:
    ```bash
    git clone https://github.com/phon3/chain-agnostic-rpc-proxy
    ```

2.  **Configure Your Chains** (`config.json`):
    ```json
    {
      "chains": {
        "ethereum": {
          "mainnet": [
            "https://rpc.ankr.com/eth",
            "https://eth.llamarpc.com",
            "https://cloudflare-eth.com"
          ]
        }
      }
    }
    ```

3.  **Run**:
    ```bash
    docker-compose up
    ```

Now, just point your app to `http://localhost:3000/ethereum/mainnet`, and you have an auto-balancing, fault-tolerant connection to Ethereum!

Check out the code on [GitHub](https://github.com/phon3/chain-agnostic-rpc-proxy).
