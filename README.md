# Decentralized P2P Lending Platform

A small, beginner-friendly decentralized application on the Ethereum **Sepolia testnet**. Lenders publish loan offers, borrowers request them, and lenders approve or reject the requests. All loan data and statuses are stored on the blockchain through a single smart contract, with no backend and no central intermediary.

> **Note:** This is a learning project. Approving a loan only updates its status on-chain. No ETH is transferred, and there is no repayment, interest, or collateral.

## Technologies Used

- **Blockchain:** Ethereum (Sepolia testnet)
- **Smart contract:** Solidity 0.8.24
- **Development framework:** Hardhat 2
- **Frontend:** React (Vite) with basic CSS
- **Wallet:** MetaMask
- **Blockchain interaction:** Ethers.js v6

## Deployed Contract

- **Network:** Sepolia
- **Address:** `0x941A5DC7E618Db2e2CCE0B4b41aEfE7E054Fa411`
- **Etherscan:** https://sepolia.etherscan.io/address/0x941A5DC7E618Db2e2CCE0B4b41aEfE7E054Fa411

## Project Structure

```
lending-dapp/
├── blockchain/              Hardhat project
│   ├── contracts/           LendingPlatform.sol
│   ├── scripts/             deploy.js
│   ├── test/                LendingPlatform.test.js
│   └── hardhat.config.js
├── frontend/                React app
│   └── src/
│       ├── components/      StatusBadge, Message
│       ├── pages/           Dashboard, LenderDashboard, BorrowerDashboard, LoanHistory
│       ├── contract/        ABI and contract address
│       ├── useWallet.js     MetaMask and contract connection
│       └── utils.js         helper functions
└── screenshots/
```

## Installation

**Requirements:** Node.js 18 or newer, Git, the MetaMask browser extension, and a free Sepolia RPC URL from [Alchemy](https://www.alchemy.com) or [Infura](https://www.infura.io).

```bash
git clone https://github.com/HrishiBanait/LendingDapp
cd lending-dapp

# Smart contract dependencies
cd blockchain
npm install

# Frontend dependencies
cd ../frontend
npm install
```

## Configuration

Create `blockchain/.env` (use `.env.example` as a template):

```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_test_wallet_private_key_without_0x
ETHERSCAN_API_KEY=optional_for_contract_verification
```

Use a **separate test wallet** that holds no real funds. Never commit your `.env` file.

## Smart Contract Deployment

Your test wallet needs some Sepolia ETH for gas (get it from any Sepolia faucet).

```bash
cd blockchain
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.js --network sepolia
```

After deploying a new copy of the contract:

1. Copy the printed address into `frontend/src/contract/config.js` (`CONTRACT_ADDRESS`).
2. Set `DEPLOY_BLOCK` in the same file to the block number of your deployment transaction (shown on Etherscan).
3. Copy the new ABI into the frontend:

```bash
cp blockchain/artifacts/contracts/LendingPlatform.sol/LendingPlatform.json frontend/src/contract/LendingPlatform.json
```

Optional: verify the source code on Etherscan.

```bash
npx hardhat verify --network sepolia YOUR_CONTRACT_ADDRESS
```

## How to Run the Project

```bash
cd frontend
npm run dev
```

Open http://localhost:5173, then:

1. Install MetaMask and switch it to the **Sepolia** network.
2. Click **Connect MetaMask**.
3. Use two accounts to try both roles: one as the lender and one as the borrower.

To run the contract tests: `cd blockchain && npx hardhat test`

## Project Workflow

```
Available → Requested → Approved
                      ↘ Rejected
```

1. **Lender** creates a loan offer by entering an amount. The offer is stored on-chain with a unique ID and the status `Available`.
2. **Borrower** browses available offers and requests one. The borrower's address is stored and the status becomes `Requested`.
3. **Lender** sees the incoming request and approves or rejects it. The status becomes `Approved` or `Rejected`.
4. Every step emits an event (`OfferCreated`, `LoanRequested`, `LoanApproved`, `LoanRejected`).
5. **Loan History** shows all loans with ID, lender, borrower, amount, status, and Etherscan links to the related transactions.

## How the Application Works

The `LendingPlatform` contract keeps a list of loan offers. Each offer records its ID, lender address, borrower address, amount, and status. Users are identified only by their MetaMask wallet addresses, so there is no registration or login.

The React frontend uses Ethers.js to connect to MetaMask. Reads (viewing offers and statuses) come directly from the contract, and writes (create, request, approve, reject) are transactions that the user confirms in MetaMask. Transaction hashes in Loan History are read from the contract's events. The app handles a missing wallet, a disconnected wallet, and the wrong network, and it shows success or failure messages for every transaction.

The contract enforces these rules:

- The amount must be greater than 0.
- A lender cannot request their own offer.
- Only one borrower can request an offer.
- Only the offer's lender can approve or reject a request.

## Screenshots

| Connect | Lender Dashboard |
|---|---|
| ![Connect](screenshots/1-connect.png) | ![Lender](screenshots/2-lender-dashboard.png) |

| Borrower Dashboard | Loan History |
|---|---|
| ![Borrower](screenshots/3-borrower-dashboard.png) | ![History](screenshots/4-loan-history.png) |

**Contract on Sepolia Etherscan**

![Etherscan](screenshots/5-etherscan.png)

## Limitations

- No real cryptocurrency is lent, borrowed, or transferred.
- No repayment, interest, collateral, or credit scoring.
- Rejected loans are final.

## License

MIT