import { Address, ethereum } from "@graphprotocol/graph-ts";
import {
  NetworkStakerBalanceCheckpoint,
  Staker,
  StakerBalanceCheckpoint,
  RocketETHTransaction,
  RocketPoolProtocol,
} from "../../generated/schema";
import { TransactionStakers } from "../models/transactionStakers";
import { StakerBalance } from "../models/stakerBalance";
import { BigInt } from "@graphprotocol/graph-ts";
import { rocketPoolEntityFactory } from "../entityFactory";
import { ONE_ETHER_IN_WEI } from "../constants/generalConstants";
import { ZERO_ADDRESS_STRING } from "../constants/contractConstants";
import { generalUtilities } from "./generalUtilities";

class StakerUtilities {
  /**
   * Returns the hexadecimal address representation.
   */
  public extractStakerId(address: Address): string {
    return address.toHexString();
  }

  /**
   * Checks if there is already an indexed network staker balance checkpoint for the given event.
   */
  public hasNetworkStakerBalanceCheckpointHasBeenIndexed(
    protocol: RocketPoolProtocol,
    event: ethereum.Event
  ): boolean {
    // If this specific event has been handled, then return true.
    if (
      NetworkStakerBalanceCheckpoint.load(
        generalUtilities.extractIdForEntity(event)
      ) !== null
    )
      return true;

    // No indexed protocol means there is no latest network staker balance checkpoint.
    if (protocol === null) return false;

    /*
      Retrieve the latest network balance checkpoint.
      If there is none at the moment, return false because this hasnt been handled yet.
    */
    const latestNetworkStakerBalanceCheckpointId =
      protocol.lastNetworkStakerBalanceCheckPoint;
    if (latestNetworkStakerBalanceCheckpointId === null) return false;
    const latestNetworkStakerBalanceCheckpoint =
      NetworkStakerBalanceCheckpoint.load(
        latestNetworkStakerBalanceCheckpointId
      );
    if (
      latestNetworkStakerBalanceCheckpoint === null ||
      latestNetworkStakerBalanceCheckpoint.blockTime == BigInt.fromI32(0)
    )
      return false;

    // Get the date of the network staker balance event candidate and the latest network staker balance checkpoint.
    const dateOfNewNetworkStakerBalanceCheckpoint = new Date(
      event.block.timestamp.toI32() * 1000
    );
    const dateOfLatestNetworkStakerBalanceCheckpoint = new Date(
      latestNetworkStakerBalanceCheckpoint.blockTime.toI32() * 1000
    );

    // If the latest network staker balance checkpoint and the candidate match in terms of day/month/year, then return false.
    return (
      dateOfNewNetworkStakerBalanceCheckpoint.getUTCFullYear() ==
        dateOfLatestNetworkStakerBalanceCheckpoint.getUTCFullYear() &&
      dateOfNewNetworkStakerBalanceCheckpoint.getUTCMonth() ==
        dateOfLatestNetworkStakerBalanceCheckpoint.getUTCMonth() &&
      dateOfNewNetworkStakerBalanceCheckpoint.getUTCDate() ==
        dateOfLatestNetworkStakerBalanceCheckpoint.getUTCDate()
    );
  }

  /**
   * Gets the relevant stakers based on some transaction parameters.
   */
  public getTransactionStakers(
    from: Address,
    to: Address,
    blockNumber: BigInt,
    blockTimeStamp: BigInt
  ): TransactionStakers {
    /*
     * Load or attempt to create the (new) staker from whom the rETH is being transferred.
     */
    const fromId = this.extractStakerId(from);
    let fromStaker: Staker | null = <Staker | null>Staker.load(fromId);
    if (fromStaker === null) {
      fromStaker = <Staker>(
        rocketPoolEntityFactory.createStaker(
          fromId,
          blockNumber,
          blockTimeStamp
        )
      );
    }

    /**
     * Load or attempt to create the (new) staker to whom the rETH is being transferred.
     */
    const toId = this.extractStakerId(to);
    let toStaker: Staker | null = <Staker | null>Staker.load(toId);
    if (toStaker === null) {
      toStaker = <Staker>(
        rocketPoolEntityFactory.createStaker(toId, blockNumber, blockTimeStamp)
      );
    }

    return new TransactionStakers(<Staker>fromStaker, <Staker>toStaker);
  }

  /**
   * Changes the balance for a staker, with the amount and either a minus or a plus operation.
   */
  public changeStakerBalances(
    staker: Staker,
    rEthAmount: BigInt,
    rEthExchangeRate: BigInt,
    increase: boolean
  ): void {
    // Don't store balance for the zero address.
    if (staker === null || staker.id == ZERO_ADDRESS_STRING) return;

    // Set current rETH balance.
    if (increase) staker.rETHBalance = staker.rETHBalance.plus(rEthAmount);
    else {
      if (staker.rETHBalance >= rEthAmount)
        staker.rETHBalance = staker.rETHBalance.minus(rEthAmount);
      else staker.rETHBalance = BigInt.fromI32(0); // Could be zero address.
    }

    // Set current ETH balance.
    if (rEthExchangeRate > BigInt.fromI32(0) && rEthAmount > BigInt.fromI32(0))
      staker.ethBalance = staker.rETHBalance
        .times(rEthExchangeRate)
        .div(ONE_ETHER_IN_WEI);
    else staker.ethBalance = BigInt.fromI32(0);
  }

  /**
   * Returns an object that contains the current and previous rETH/ETH balances.
   */
  public getStakerBalance(
    staker: Staker,
    currentRETHExchangeRate: BigInt
  ): StakerBalance {
    const result = new StakerBalance();

    // Determine current rETH & ETH value balance.
    result.currentRETHBalance = staker.rETHBalance;
    if (result.currentRETHBalance < BigInt.fromI32(0))
      result.currentRETHBalance = BigInt.fromI32(0);
    result.currentETHBalance = result.currentRETHBalance
      .times(currentRETHExchangeRate)
      .div(ONE_ETHER_IN_WEI);
    if (result.currentETHBalance < BigInt.fromI32(0))
      result.currentETHBalance = BigInt.fromI32(0);

    // By default, assume the previous (r)ETH balances are the same as the current ones.
    result.previousRETHBalance = result.currentRETHBalance;
    result.previousETHBalance = result.currentETHBalance;

    // If we had a previous staker balance checkpoint, then use the balances from that link.
    if (staker.lastBalanceCheckpoint !== null) {
      const previousStakerBalanceCheckpoint = StakerBalanceCheckpoint.load(
        <string>staker.lastBalanceCheckpoint
      );

      // Set the previous balances based on the previous staker balance checkpoint.
      if (previousStakerBalanceCheckpoint !== null) {
        result.previousRETHBalance =
          previousStakerBalanceCheckpoint.rETHBalance;
        result.previousETHBalance = previousStakerBalanceCheckpoint.ethBalance;

        // To be safe..
        if (result.previousRETHBalance < BigInt.fromI32(0)) {
          result.previousRETHBalance = BigInt.fromI32(0);
        }
        if (result.previousETHBalance < BigInt.fromI32(0)) {
          result.previousETHBalance = BigInt.fromI32(0);
        }
      }
    }

    return result;
  }

  /**
   * Returns the total ETH rewards for a staker since the previous staker balance checkpoint.
   */
  public getETHRewardsSincePreviousStakerBalanceCheckpoint(
    activeRETHBalance: BigInt,
    activeETHBalance: BigInt,
    previousRETHBalance: BigInt,
    previousETHBalance: BigInt,
    previousCheckPointExchangeRate: BigInt
  ): BigInt {
    // This will indicate how many ETH rewards we have since the previous checkpoint.
    let ethRewardsSincePreviousCheckpoint = BigInt.fromI32(0);

    /**
     * The staker can only have (+/-)rewards when he had an (r)ETH balance last checkpoint
     * and if his ETH balance from last time isn't the same as the current ETH balance.
     */
    if (
      previousRETHBalance > BigInt.fromI32(0) &&
      (activeETHBalance > previousETHBalance ||
        activeETHBalance < previousETHBalance)
    ) {
      // CASE #1: The staker his rETH balance stayed the same since last checkpoint.
      if (activeRETHBalance == previousRETHBalance) {
        ethRewardsSincePreviousCheckpoint =
          activeETHBalance.minus(previousETHBalance);
      }
      // CASE #2: The staker has burned or transferred some of his/her rETH holdings since last checkpoint.
      else if (activeRETHBalance < previousRETHBalance) {
        // How much was the ETH value that was transferred away during this checkpoint.
        const ethTransferredSinceThePreviousCheckpoint = previousRETHBalance
          .minus(activeRETHBalance)
          .times(previousCheckPointExchangeRate)
          .div(ONE_ETHER_IN_WEI);
        ethRewardsSincePreviousCheckpoint = activeETHBalance.minus(
          previousETHBalance.minus(ethTransferredSinceThePreviousCheckpoint)
        );
      }
      // CASE #3: The staker increased his/her rETH holdings since last checkpoint.
      else if (activeRETHBalance > previousRETHBalance) {
        // How much was the ETH value that was received during this checkpoint.
        const ethReceivedSinceThePreviousCheckpointAtPreviousExchangeRate =
          activeRETHBalance
            .minus(previousRETHBalance)
            .times(previousCheckPointExchangeRate)
            .div(ONE_ETHER_IN_WEI);

        // This accounts for everything excluding any rewards we earned OR value we lost on the minted rETH since last checkpoint.
        ethRewardsSincePreviousCheckpoint = activeETHBalance
          .minus(ethReceivedSinceThePreviousCheckpointAtPreviousExchangeRate)
          .minus(previousETHBalance);
      }
    }

    return ethRewardsSincePreviousCheckpoint;
  }

  /**
   * Checks if there is already an indexed transaction for the given event.
   */
  public hasTransactionHasBeenIndexed(event: ethereum.Event): boolean {
    // Is this transaction already logged?
    return (
      RocketETHTransaction.load(generalUtilities.extractIdForEntity(event)) !==
      null
    );
  }

  /**
   * Updates the total ETH rewards of the staker.
   * Keeps track if the staker has ever accrued ETH rewards during its lifecycle.
   * Updates the network checkpoint so the totals are correct.
   */
  public handleEthRewardsSincePreviousCheckpoint(
    ethRewardsSincePreviousCheckpoint: BigInt,
    staker: Staker,
    networkCheckpoint: NetworkStakerBalanceCheckpoint,
    protocol: RocketPoolProtocol
  ): void {
    // Update total rewards based on how much the staker has earned/lost since previous checkpoint.
    staker.totalETHRewards = staker.totalETHRewards.plus(
      ethRewardsSincePreviousCheckpoint
    );

    // If we have rewards (+/-) and we hadn't yet stored that this staker had ever received rewards, then store it.
    if (
      ethRewardsSincePreviousCheckpoint != BigInt.fromI32(0) &&
      staker.hasAccruedETHRewardsDuringLifecycle == false
    ) {
      staker.hasAccruedETHRewardsDuringLifecycle = true;

      // Update the collection that keeps track of how many stakers there are/have been with ETH rewards.
      const stakersWithETHRewards = protocol.stakersWithETHRewards;
      if (stakersWithETHRewards.indexOf(staker.id) == -1)
        stakersWithETHRewards.push(staker.id);
      protocol.stakersWithETHRewards = stakersWithETHRewards;

      // Increment the total counter on the network checkpoint level.
      networkCheckpoint.totalStakersWithETHRewards =
        networkCheckpoint.totalStakersWithETHRewards.plus(BigInt.fromI32(1));
    }

    // Update the total ETH rewards since previous checkpoint and until the current checkpoint.
    this.updateNetworkStakerBalanceCheckpoint(
      networkCheckpoint,
      staker,
      ethRewardsSincePreviousCheckpoint
    );
  }

  /**
   * Updates the given summary based on the rewards since previous checkpoint and the total rewards for a staker.
   */
  public updateNetworkStakerBalanceCheckpoint(
    networkCheckpoint: NetworkStakerBalanceCheckpoint,
    staker: Staker,
    rewardsSincePreviousCheckpoint: BigInt
  ): void {
    if (networkCheckpoint === null) return;

    // If the staker has new rewards since the previous checkpoint..
    if (rewardsSincePreviousCheckpoint > BigInt.fromI32(0)) {
      // Update the total ETH rewards (+/-) up to this checkpoint based on the total rewards.
      networkCheckpoint.totalStakerETHRewards =
        networkCheckpoint.totalStakerETHRewards.plus(
          rewardsSincePreviousCheckpoint
        );
    }

    // Keep track of all stakers that have an RETH balance this network balance checkpoint.
    if (staker.rETHBalance > BigInt.fromI32(0)) {
      networkCheckpoint.stakersWithAnRETHBalance =
        networkCheckpoint.stakersWithAnRETHBalance.plus(BigInt.fromI32(1));
    }
  }

  /**
   * Updates the given summary based on the rewards since previous checkpoint and the total rewards for the previous network staker balance checkpoint.
   */
  public updateNetworkStakerBalanceCheckpointForPreviousCheckpointAndProtocol(
    networkCheckpoint: NetworkStakerBalanceCheckpoint,
    previousCheckpoint: NetworkStakerBalanceCheckpoint | null,
    protocol: RocketPoolProtocol
  ): void {
    if (networkCheckpoint === null) return;

    if (previousCheckpoint !== null) {
      // Update the total ETH rewards (+/-) up to this checkpoint based on the total rewards.
      networkCheckpoint.totalStakerETHRewards =
        networkCheckpoint.totalStakerETHRewards.plus(
          previousCheckpoint.totalStakerETHRewards
        );
    }

    if (protocol !== null) {
      // Increment the total number of stakers with ETH rewards based on what the running total is up to now.
      networkCheckpoint.totalStakersWithETHRewards =
        networkCheckpoint.totalStakersWithETHRewards.plus(
          BigInt.fromI32(protocol.stakersWithETHRewards.length)
        );
    }
  }
}

export const stakerUtilities = new StakerUtilities();
