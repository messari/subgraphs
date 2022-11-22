# Methodology

## Overview

Overview of the protocol. Should be a couple of sentences in a single paragraph. What does the protocol do, what chain it is on and other relevant information.

## Useful links

- Protocol links
- Developer/user docs
- Contract addresses
- Additional links: Deep dives, reviews and metrics

## Usage Metrics

Active users, total unique users, daily transaction count and other usage metrics such as LP.

## Financial metrics

### Total Value Locked USD

`Total Value Locked (TVL) = Sum of All Pool deposits in protocol`

- It can also include “staking” if the staking is critical to the function of the protocol and is not double counted, such as stability pools (liquity) or trading pairs (bancor)

### Total Revenue USD

`Total revenue=sum of all fees collected in protocol`

- this could be trading fees in AMMs or interest collected by lending

### Supply-Side Revenue USD

`Supply-Side Revenue = Total Revenue USD - Admin Fee USD`
Admin fees are fees taken by the protocol

### Protocol Revenue USD

`Protocol Revenue USD= Total Revenue USD-Supply-Side Revenue USD or Admin Fee USD`

- This is the fee going to the user.

### Protocol Controlled Value USD

`Protocol controlled value (PCV)=sum of assets in pools owned by protocol for buybacks`

- This excludes treasury balance and non protocol owned assets.

## Pool-Level Metrics

### Pool Total Value Locked USD

`Pool Total Value Locked USD=total deposits in specific pool or pair`

- In AMMs this includes both sides of pool

### Reward Tokens

`Reward tokens= Total reward tokens set to be emitted`

`APR= (Total reward tokens emitted/Pool TVL USD) per year`

- Reward tokens are used to attract liquidity (often called liquidity mining tokens). These are not included in revenue.
