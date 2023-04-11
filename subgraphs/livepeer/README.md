# Livepeer Subgraph

## Networks

- Arbitrum

## Calculation Methodology v1.0.0

**TVL, revenues, and usage metrics will be calculated by the activity of 2 type of users:**

- Transcoders
- Delegators

**5 Contracts used:**

- BondingManager
- TicketBroker
- Minter
- RoundsManager
- UniswapV3Pool

### Total Value Locked (TVL) USD

- It is the total amount of LPT staked on the platform.

**Transcoders/Orchestrators:**

- Transcoders or Orchestrators participate by running software that allows you to contribute your computer's resources (CPU, GPU, and bandwidth) in service of transcoding and distributing video for paying broadcasters and developers.

**Delegators:**

- Delegators are Livepeer tokenholders who participate in the network by staking their tokens towards orchestrators who they believe are doing good and honest work. You can think about staking like putting a deposit down. When you stake, your tokens become locked up for a period of time and then you can take them back or stake them to a different Orchestrator. Doing this helps ensure that the network is more secure.

### Total Revenue USD

**Inflation:**

- The current rate of inflation as of today's round is 0.02355%. In livepeer the inflation rate gets adjusted after every round according to the ratio of LPT staked in round / total LPT supply, this is known as participation rate.

- Livepeer presupposes that a target rate of 50% is a healthy trade-off between network security and token liquidity, so in order to hit this target, the protocol incentivizes participation by increasing the inflation rate by 0.00005% for every round the participation rate is below 50% and decreasing it 0.00005% for every round the participation rate is above 50%

### Supply-Side Revenue USD

- All redeemed tickets are supply-side revenue.

### Protocol-Side Revenue USD

- There is no protocol side revenue.

### Total Unique Users

**Count of Unique Addresses which have interacted with the protocol via any transaction:**

- This includes:
  - Transcoder and delegator bonding, unbonding and rebonding.
  - Transcoder and delegator bond transfer.
  - Delegator stake and fees withdraw.
  - Transcoder rewards.
  - Updating of the transcoder parameters.
  - Transcoder activation and deactivation.
  - Earnings claimed by delegator and transcoder.

### Reward Token Emissions Amount

- After every round new LPT tokens are minted which are split amongst Delegators and transcoders in proportion to their total stake relative to others in the network.

### Protocol Controlled Value

- Not Applicable for this subgraph.

### Useful Links

- Primer(Short notes on explaining livepeer working): https://livepeer.org/primer
- Docs: https://docs.livepeer.org/
- Livepeer explorer(Analytics and user dashboard): https://explorer.livepeer.org/
- Contract Addresses: https://docs.livepeer.org/reference/deployed-contract-addresses
