---
layout: post
title: "Introducing MIA Mianta: A Modern, Secure ERC20 Built with Foundry"
date: 2026-01-17
categories: [blockchain, solidity, open-source]
image: /images/profile.jpg
---

A lot has changed in the Ethereum ecosystem over the last few years. Solidity has matured to `0.8.x`, and the developer toolkit has shifted significantly towards **Foundry** for its sheer speed and Rust-powered reliability.

Today, I'm releasing **[MIA Mianta (MIA)](https://github.com/phon3/simple-erc20)**, a modern implementation of a feature-rich ERC20 token designed for the current era of smart contract development.

## Why a New ERC20 Implementation?

While there are countless ERC20 templates out there, many are either outdated or too minimal. MIA Mianta combines several essential patterns into a single, cohesive, and battle-tested architecture using **OpenZeppelin v5**.

### Key Features:

- **Strict Supply Cap**: Implements `ERC20Capped` to guarantee the 1 Billion (1,000,000,000) maximum supply can never be exceeded.
- **Role-Based Access Control**: Uses AccessControl for fine-grained permissions (`MINTER_ROLE`, `OPERATOR_ROLE`) rather than a simple single-owner bottleneck.
- **ERC1363 Support**: Implements the `transferAndCall` and `approveAndCall` patterns, allowing contracts to react to token movements in a single transaction—no more separate `approve` then `call` steps.
- **Burnable**: Holders can permanently remove tokens from circulation.
- **Administrative Safety**: Features a `finishMinting` one-way toggle and the ability to enable/disable transfers during early launch phases.
- **Token Recovery**: Includes a safeguard to recover any ERC20 tokens accidentally sent to the contract address.

## Built with Foundry

Foundry has changed the game for Solidity developers. This project takes full advantage of it:

1.  **High-Speed Testing**: 33 comprehensive unit and fuzz tests that run in milliseconds.
2.  **Custom Errors**: Uses Solidity 0.8+ custom errors (like `error MintingFinished()`) to save gas on reverts compared to legacy string messages.
3.  **Advanced Scripts**: Includes robust deployment scripts (`DeployMIA.s.sol`) that handle local Anvil runs and real testnet deployments with automatic Etherscan verification.

## The Deployment Workflow

Deploying MIA is simple. If you have Foundry installed:

```bash
# Clone and build
git clone https://github.com/phon3/simple-erc20
forge build

# Deploy to local Anvil
forge script script/DeployMIA.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

For professional deployments to Sepolia or Mainnet, the script supports environment-based keys and auto-verification:

```bash
forge script script/DeployMIA.s.sol --rpc-url $RPC_URL --broadcast --verify
```

## Check it Out

The code is fully open-source and available on GitHub. Whether you're looking for a base for your next project or want to see how to implement ERC1363 in a modern stack, MIA Mianta is a great place to start.

🔗 **GitHub Repository**: [phon3/simple-erc20](https://github.com/phon3/simple-erc20)

Happy coding!
