# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Tenderly Wizard** is a CLI tool for managing Tenderly virtual testnets and deploying Gnosis Safe-based access control systems with Zodiac Roles modules. It supports deploying deterministic Safe addresses across chains, configuring role management contracts, and executing whitelisting permissions.

## Build and Run Commands

```bash
# Install dependencies (requires NPM_TOKEN for @thirdguard packages)
# Token is stored in .claude/settings.local.json (gitignored)
export NPM_TOKEN=$(cat .claude/settings.local.json | grep -o '"NPM_TOKEN": "[^"]*"' | cut -d'"' -f4)
yarn install

# Development - run the wizard
yarn start

# Build TypeScript
yarn build

# Format code
yarn format

# Deploy Safes to virtual testnet
yarn deploy:safes

# Apply whitelisting (all roles)
yarn deploy:whitelist

# Execute single whitelist
yarn execute:whitelist

# Save EVM snapshot
yarn save:vnet-snapshot

# Build and install globally for testing
./build-and-install.sh

# Publish to npm
./publish.sh
```

## Architecture

### Entry Flow
```
bin/cli.js → src/index.ts → src/wizard.ts (wizardStart)
```

### Key Components

| Component | File | Purpose |
|-----------|------|---------|
| Wizard UI | `src/wizard.ts` | Interactive terminal menu system using terminal-kit |
| VirtualTestNet API | `src/scripts/virtual-test-net.ts` | Tenderly REST API client for testnet lifecycle |
| Safe Deployment | `src/scripts/deploy-safe-v1.ts`, `deploy-safe-v2.ts` | Deploy Safe proxies with initialization |
| Roles Deployment | `src/scripts/deploy-roles-v1.ts`, `deploy-roles-v2.ts` | Deploy Zodiac Roles modules |
| Whitelist Base | `src/whitelist/whitelist-class.ts` | Base class for permission whitelisting |
| Constants | `src/utils/constants.ts` | Contract addresses (Roles, Safes, tokens) |
| Chain Config | `src/utils/roles-chain-config.ts` | Chain-specific configurations |

### Dual Version Support

The codebase supports both v1 and v2 of Roles and Safes, controlled by `ROLES_VERSION` env var:
- **Safe v1** uses 1.3.0 contracts
- **Safe v2** uses 1.4.0 contracts
- Separate deployment scripts exist for each version

### External Dependencies

- **access-control-safes repo** - Whitelist class definitions must be in `../access-control-safes/src/whitelist`. The wizard uses ts-morph AST parsing to discover classes extending `Whitelist`.
- **@thirdguard/config** - Centralized environment configuration
- **Tenderly API** - Virtual testnet management (`https://api.tenderly.co/api/v1/account/{ACCOUNT}/project/{PROJECT_ID}/vnets`)

## Key Environment Variables

| Variable | Purpose |
|----------|---------|
| `TENDERLY_ACCESS_TOKEN` | Tenderly API authentication |
| `PROJECT_ID` | Tenderly project ID |
| `ACCOUNT` | Tenderly account name |
| `VIRTUAL_MAINNET_RPC` | Virtual testnet RPC URL |
| `ROLES_VERSION` | v1 or v2 |
| `IS_DEV` | Set to `true` for development mode |
| `INVESTMENT_SAFE_ADDRESS` | Deployed Investment Safe |
| `ACCESS_CONTROL_SAFE_ADDRESS` | Deployed AC Safe |
| `CALLER_PK` / `MANAGER_PK` | Private keys for signers |

## Technical Conventions

- Uses **ethers.js v5.7.2** (not v6) - be careful with API differences
- TypeScript with strict mode
- terminal-kit for CLI UI
- Hardhat for blockchain interaction
- MultiSend pattern for batched transactions
- Deterministic deployment using salt-based address prediction

## Data Flow: Full Setup

```
User: "CREATE TESTNET & SETUP"
         ↓
createVirtualTestNet() → Tenderly API
         ↓
Store RPC URL + UUID in .env
         ↓
deploy:safes script (setGas → deploySafe × 2 → deployRoles × 2)
         ↓
deploy:whitelist script
         ↓
save:vnet-snapshot
         ↓
Testnet ready
```

## Common Modification Tasks

| Task | Files to Modify |
|------|-----------------|
| Add new chain support | `src/utils/roles-chain-config.ts`, `src/utils/constants.ts` |
| Modify wizard flow | `src/wizard.ts` |
| Change deployment logic | `src/scripts/deploy-roles-*.ts` or `deploy-safe-*.ts` |
| Add new contract ABIs | Place JSON files in `src/contracts/` |
| Update Tenderly API calls | `src/scripts/virtual-test-net.ts` |
| Modify whitelist base class | `src/whitelist/whitelist-class.ts` |
