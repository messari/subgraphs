

# Euler Finance - Metrics Methodology v1.0.0


## Useful Links



* Protocol
    * [https://www.euler.finance/](https://www.euler.finance/) 
* Docs
    * [https://docs.euler.finance/](https://docs.euler.finance/) 
* Smart contracts
    * [https://docs.euler.finance/protocol/addresses](https://docs.euler.finance/protocol/addresses) 
* Parameters
    * [https://docs.euler.finance/protocol/eulers-default-parameters](https://docs.euler.finance/protocol/eulers-default-parameters)  
* ROI Calculation
    * - 
* Social
    * [Newsletter](https://newsletter.euler.finance/)
    * [Blog](https://blog.euler.finance/)
    * [Twitter](https://twitter.com/eulerfinance)
    * [Discord](https://t.co/yqSIrrJfWi?amp=1)
    * [Telegram](https://t.me/eulerfinance_official)
    * [Telegram Announcements](https://t.me/eulerfinance)
    * [LinkedIn](https://www.linkedin.com/company/euler-xyz/)
    * [YouTube](https://www.youtube.com/channel/UCoeP9dvbKoL17nqkNnUJBkg)
* Dashboards
    * [DefiLlama](https://defillama.com/protocol/euler)
    * [DeBank](https://debank.com/projects/euler)


## Intro

Lending protocols are the life-blood of Decentralized Finance (DeFi) and provide an essential “money lego” to replicate banks in TradFi. Therefore, it’s no surprise that AAVE — a lending protocol — ranks at #2 on DefiLlama TVL rankings for protocols. 

Euler follows in the footsteps of lending protocols like AAVE and Compound but focuses on the permissionless aspect i.e. it allows users to create their own markets for any Ethereum ERC20 token. This blog from the Euler team provides much more detailed info on the benefits provided by Euler — [https://blog.euler.finance/introducing-euler-8f4422f13848](https://blog.euler.finance/introducing-euler-8f4422f13848). 


## Usage Metrics

**Active Users, Total Unique Users & Daily Transaction Count**

Transactions of interest on Euler include all these “Quick Actions”:

Deposit, Withdraw, Borrow, Repay, Mint, Burn, Transfer, Swap, Short, Wrap, Activate

Any address which conducts one of the transactions above should be considered a User. In addition, the users should be split into these different transaction types.

**Number of Lenders and Borrowers**

Can be seen on Euler’s website

**Number of Active Assets and Active Assets per Asset Tier**

Can be seen on Euler’s website

Euler is a permissionless listing protocol. Permissionless listing is much riskier on decentralized lending protocols than on other DeFi protocols, like decentralized exchanges, because of the potential for risk to spill over from one pool to another in quick succession. For example, if a collateral asset suddenly decreases in price, and subsequent liquidations fail to repay borrowers' debts sufficiently, then the pools of multiple different types of assets can be left with bad debts.


## Financial Metrics

**Total Value Locked USD**

The Total Value Locked (TVL) on Euler can be calculated by summing the supplied TVL across the vaults and subtracting borrowed amounts. The formula is as follows:



* TVL = Supplied - Borrowed

**Protocol Controlled Value USD**

**Note**: the treasury does not yet exist. This will be updated when governance goes live.  

The Euler Treasury comprises undistributed EUL tokens, assets accumulated as reserves from the Euler Protocol, and assets received in the course of other DAO-DAO operations. The treasury is managed by EUL token holders.

Reserves are protocol-owned liquidity deposited on Euler to provide a backstop against a 'run on the bank' scenario. Reserves build up over time as borrowers pay interest on their loans. The reserves are ultimately controlled by EulerDAO Governance.

**Total Revenue USD**

Total Revenue generated on Euler is a combination of



1. Yield generated for lenders and borrowers
2. Reserves generated

As a calculation, this could be described as:

Total Revenue = Yield for lenders + Yield from borrowers + Reserves generated


## Pool-Level Metrics

**Pool Total Value Locked USD**

The pool TVL can be deduced with the same formulas as above i.e.



* TVL = Supplied - Borrowed

**Reward Tokens & Reward Token Emissions Amount**

The total supply of EUL is 27,182,818 (in homage to Euler’s number,[ e](https://en.wikipedia.org/wiki/E_(mathematical_constant))). The initial four-year allocation of the EUL total supply is as follows:



* 25% (6,795,704 EUL) to users who borrow on community-selected markets on Euler over 4 years (see Distribution).
* 1% (271,828 EUL) to all users who deposited or borrowed assets on Euler during its soft launch (see Distribution).
* 2.5% (679,570 EUL) to users staking EUL to a safety staking pool over 4 years (see Safety Module).
* 20.54% (5,585,389 EUL) to an ecosystem treasury, unlocked (see Treasury).
* 26.2% (7,122,577 EUL) to investors in Euler XYZ Ltd, with an 18 month linear vesting schedule.
* 20.75% (5,640,434 EUL) to employees, advisors and consultants of Euler XYZ Ltd or the Euler Foundation, with a 48 month linear vesting schedule.
* 4% (1,087,312 EUL) to future employees, advisors & consultants of Euler XYZ Ltd or the Euler Foundation, with a non-linear 48 month vesting schedule.

Here is the breakdown:

**Note** that the initial allocations may be subject to change as the ecosystem evolves. As EUL is distributed to users of the protocol they may see fit to vote to alter the EUL Distribution or allocations to the Safety Module, for example.

References: 



* [https://docs.euler.finance/governance/eul](https://docs.euler.finance/governance/eul)
