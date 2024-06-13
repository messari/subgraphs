# Frax Ether Staking Subgraph

## Methodology v1.0.0

Solo ETH staking requires the technical knowledge and initial setup associated with running a validator node, and also that deposits be made 32 ETH at a time. By opting to use a liquid ETH staking derivative instead of staking ETH in another form, staking yield can be accrued much more simply, abstracting the need to run validators, allowing yield to be earned on any amount of ETH, allowing withdrawals at any time and of any size, and allowing far greater composability throughout DeFi.

Frax Ether is a liquid ETH staking derivative and stablecoin system designed to uniquely leverage the Frax Finance ecosystem to maximize staking yield and smoothen the Ethereum staking process for a simplified, secure, and DeFi-native way to earn interest on ETH.

The Frax Ether system comprises three primary components, Frax Ether (frxETH), Staked Frax Ether (sfrxETH), and the Frax ETH Minter:

1. frxETH acts as a stablecoin loosely pegged to ETH, leveraging Frax's winning playbook on stablecoins and onboarding ETH into the Frax ecosystem. The frxETH peg is defined as 1% of the exchange rate on each side 1.01 to .9900.
2. sfrxETH is the version of frxETH which accrues staking yield. All profit generated from Frax Ether validators is distributed to sfrxETH holders. By exchanging frxETH for sfrxETH, one become's eligible for staking yield, which is redeemed upon converting sfrxETH back to frxETH.
3. Frax ETH Minter (frxETHMinter) allows the exchange of ETH for frxETH, bringing ETH into the Frax ecosystem, spinning up new validator nodes when able, and minting new frxETH equal to the amount of ETH sent.

sfrxETH is a ERC-4626 vault designed to accrue the staking yield of the Frax ETH validators. At any time, frxETH can be exchanged for sfrxETH by depositing it into the sfrxETH vault, which allows users to earn staking yield on their frxETH. Over time, as validators accrue staking yield, an equivalent amount of frxETH is minted and added to the vault, allowing users to redeem their sfrxETH for a greater amount of frxETH than they deposited.

## Metrics

### Usage and Transactions

- Deposit frxETH to the sfrxETH vault.
- Withdraw frxETH from the sfrxETH vault.

### TVL

TVL is the total value of frxETH deposited to the sfrxETH vault.

### Fees

Protocol currently applies a 10% fee on a user’s staking rewards (2% insurance, 8% protocol fee).

### Revenue

Staking rewards on the total staked ETH make up the total revenue.
Of this 10% is kept by the protocol as fees (protocol side revenue), rest 90% is passed on to the stakers (supply side revenue).

## Useful Links

- Landing Page: https://frax.finance/
- Staking App: https://app.frax.finance/frxeth/stake
- Docs: https://docs.frax.finance/frax-ether/overview
- Contracts: https://docs.frax.finance/smart-contracts/frxeth-and-sfrxeth-contract-addresses
