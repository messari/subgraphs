# Rewarder Calculator

## Overview

Some masterchef pools have additional rewards on top of the protocol native token rewards. The way these are given is by the addition of so called `Rewarders` to those staking pools which will have bonus rewards.

These rewarders are contracts pre-funded with some arbitrary token that will be given as a reward. These rewards are accrued in the same way as the native masterchef rewards: proportionally based on the user staked LP, accrued per block or per second.

The issue is that they are a bit tricky to calculate, because the only requirement these rewarders need to fulfill is the `IRewarder` interface:

```solidity
interface IRewarder {
    using SafeERC20 for IERC20;

    function onJoeReward(address user, uint256 newLpAmount) external;

    function pendingTokens(address user) external view returns (uint256 pending);

    function rewardToken() external view returns (IERC20);
}
```

Although some of these rewarders implement a method `tokenPerSec` which allows us to fetch the reward rate directly, they are not forced to do so. They might not even give the rewards per second, but per block. Or have some arbitrary way of being accrued. But we can try to infer the rate from the increase of `pendingRewards` on a given account over some period of time.

We need to make some assumptions first:

- Reward rate stays constant most of the time. One off changes every now and then are fine.
- Rewards are distributed proportionally to all stakers, based on their staked amount in proportion to the total staked.
- Rewards are distributed on deposit/withdrawal from the staking pool only.

Assumptions 1 and 2 are safe to make since it's pretty standard on how DeFi gives rewards. Assumption 3 is safe to make too because rewarders are not shown directly from the staking pools page, so a user cannot easily claim accrued rewards. Also from the way the masterchef contract interacts with the rewarder, calling `OnReward`, it is expected to only pay on those events exclusively to the account involved.

## Math

As per the contract:

> $pendingTokens = userLP * tokenPerShare - rewardDebt$

So the delta of pendingTokens in a given interval is:

> $ΔpendingTokens = pendingTokens2 - pendingTokens1 = 
userLP2 * tokenPerShare2 - debt2 - (userLP1 * tokenPerShare1 - debt1)$

or

> $ΔpendingTokens = userLP2 * tokenPerShare2 - debt2 - userLP1 * tokenPerShare1 + debt1$

If we look at an interval in which there are no withdrawals or deposits for an account in the staking pool then `userLP` won't change.

Debt only changes on deposit/withdrawal or harvest. But for rewarders there are no harvests, and we are looking at intervals without deposits/withdrawals. So debt1 = debt2 too.

> $ΔpendingTokens = userLP * tokenPerShare2 - userLP * tokenPerShare1$

so:

> $ΔpendingTokens / userLP = tokenPerShare2 - tokenPerShare1 = ΔtokenPerShare$

Token per share increases with the formula: `timeElapsed * rewardRate / totalLPSupply`. And it is computed every time the supply changes. So, `tokenPerShare` increase between two points in time would be:

> $rewardRate * Σ (timeElapsedI/supplyI)$

If the variations during the interval of `totalLPSupply` are not too big we could assume supply stays constant, so `tokenPerShare` increase would be `rewardRate * timeElapsed / supply`. From here:

> $rate = (ΔpendingTokens * supply) / (timeElapsed * userLP)$

## TLDR

The formula we'll use to calculate the reward is:

> $rate = (ΔpendingTokens * supply) / (timeElapsed * userLP)$

But we can only use it it the total staked supply for a given pool doesn't change (much) during the measuring interval and the user staked LP remains constant too.
