import {
  Bytes,
  Address,
  dataSource,
  BigDecimal,
} from "@graphprotocol/graph-ts";

import { SDK } from ".";
import { AccountWasActive } from "./account";
import * as constants from "../../util/constants";
import { CustomEventType } from "../../util/events";
import { ProtocolSnapshot } from "./protocolSnapshot";
import { PositionType, TransactionType } from "./enums";
import { ProtocolConfigurer, TokenPricer } from "../config";

import { DerivPerpProtocol as PerpetualSchema } from "../../../../generated/schema";

/**
 * This file contains the Perpetual class, which is used to
 * make all of the storage changes that occur in a protocol.
 *
 * Schema Version:  1.3.0
 * SDK Version:     1.1.2
 * Author(s):
 *  - @harsh9200
 *  - @dhruv-chauhan
 */

/**
 * ProtocolManager is a wrapper around the ProtocolSchema entity that takes care of
 * safely and conveniently updating the entity. Updating the Protocol entity using this
 * wrapper also takes care of the Financials and Usage snapshots.
 */
export class Perpetual {
  protocol: PerpetualSchema;
  event: CustomEventType;
  pricer: TokenPricer;
  snapshoter: ProtocolSnapshot;
  sdk: SDK | null = null;
  /**
   * Creates a new Protocol instance. This should only be called by the Protocol.load
   * @private
   */
  private constructor(
    protocol: PerpetualSchema,
    pricer: TokenPricer,
    event: CustomEventType
  ) {
    this.protocol = protocol;
    this.event = event;
    this.pricer = pricer;
    this.snapshoter = new ProtocolSnapshot(protocol, event);
  }

  /**
   * This is the main function to instantiate a Protocol entity. Most times it is not called directly, but from the SDK initializer.
   *
   * @param conf {ProtocolConfigurer} An object that implements the ProtocolConfigurer interface, to set some of the protocol's properties
   * @param pricer {TokenPricer} An object that implements the TokenPricer interface, to allow the wrapper to access pricing data
   * @param event {CustomEventType} The event being handled at a time.
   * @returns Protocol
   */
  static load(
    conf: ProtocolConfigurer,
    pricer: TokenPricer,
    event: CustomEventType
  ): Perpetual {
    const protocolId = Address.fromString(conf.getID());
    let protocol = PerpetualSchema.load(protocolId);

    if (!protocol) {
      protocol = new PerpetualSchema(protocolId);
      protocol.name = conf.getName();
      protocol.slug = conf.getSlug();
      protocol.network = dataSource.network().toUpperCase().replace("-", "_");
      protocol.type = constants.ProtocolType.PERPETUAL;

      protocol.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
      protocol.cumulativeVolumeUSD = constants.BIGDECIMAL_ZERO;

      protocol.cumulativeInflowVolumeUSD = constants.BIGDECIMAL_ZERO;
      protocol.cumulativeClosedInflowVolumeUSD = constants.BIGDECIMAL_ZERO;
      protocol.cumulativeOutflowVolumeUSD = constants.BIGDECIMAL_ZERO;

      protocol.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
      protocol.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
      protocol.cumulativeStakeSideRevenueUSD = constants.BIGDECIMAL_ZERO;
      protocol.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;

      protocol.cumulativeEntryPremiumUSD = constants.BIGDECIMAL_ZERO;
      protocol.cumulativeExitPremiumUSD = constants.BIGDECIMAL_ZERO;
      protocol.cumulativeTotalPremiumUSD = constants.BIGDECIMAL_ZERO;

      protocol.cumulativeDepositPremiumUSD = constants.BIGDECIMAL_ZERO;
      protocol.cumulativeWithdrawPremiumUSD = constants.BIGDECIMAL_ZERO;
      protocol.cumulativeTotalLiquidityPremiumUSD = constants.BIGDECIMAL_ZERO;

      protocol.longOpenInterestUSD = constants.BIGDECIMAL_ZERO;
      protocol.shortOpenInterestUSD = constants.BIGDECIMAL_ZERO;
      protocol.totalOpenInterestUSD = constants.BIGDECIMAL_ZERO;

      protocol.cumulativeUniqueUsers = 0;
      protocol.cumulativeUniqueDepositors = 0;
      protocol.cumulativeUniqueBorrowers = 0;
      protocol.cumulativeUniqueLiquidators = 0;
      protocol.cumulativeUniqueLiquidatees = 0;

      protocol.longPositionCount = 0;
      protocol.shortPositionCount = 0;
      protocol.openPositionCount = 0;
      protocol.closedPositionCount = 0;
      protocol.cumulativePositionCount = 0;

      protocol.transactionCount = 0;
      protocol.depositCount = 0;
      protocol.withdrawCount = 0;
      protocol.borrowCount = 0;
      protocol.swapCount = 0;
      protocol.collateralInCount = 0;
      protocol.collateralOutCount = 0;

      protocol.totalPoolCount = 0;

      protocol._lastSnapshotDayID = constants.BIGINT_ZERO;
      protocol._lastSnapshotHourID = constants.BIGINT_ZERO;
    }

    const versions = conf.getVersions();
    protocol.schemaVersion = versions.getSchemaVersion();
    protocol.subgraphVersion = versions.getSubgraphVersion();
    protocol.methodologyVersion = versions.getMethodologyVersion();

    protocol._lastUpdateTimestamp = event.block.timestamp;
    protocol.save();

    return new Perpetual(protocol, pricer, event);
  }

  /**
   * This will save the entity to storage. If any other action needs to be performed on
   * save, it should be added here.
   * It is meant to be used internally. If you need to save the entity from outside the wrapper
   * you should probably be using some of the setters instead.
   * @private
   */
  private save(): void {
    this.protocol._lastUpdateTimestamp = this.event.block.timestamp;
    this.protocol.save();
  }

  /**
   *
   * @returns {string} The ID of the protocol entity.
   */
  getID(): string {
    return this.protocol.id.toHexString();
  }

  /**
   *
   * @returns {Bytes} The ID of the protocol entity, as Bytes.
   */
  getBytesID(): Bytes {
    return this.protocol.id;
  }

  /**
   *
   * @returns {CustomEventType} the event currently being handled.
   */
  getCurrentEvent(): CustomEventType {
    return this.event;
  }

  /**
   *
   * @returns {TokenPricer} The pricer object used by the wrapper.
   * @see TokenPricer
   */
  getTokenPricer(): TokenPricer {
    return this.pricer;
  }

  /**
   * Sets the TVL in USD for the protocol. Most times this will be called internally by
   * other members of the library when TVL changes are made to them. But if the library
   * is not well fitted to a given protocol and you need to set the TVL manually, you can
   * use this method.
   * It will also update the protocol's snapshots.
   * @param tvl {BigDecimal} The new total value locked for the protocol.
   */
  setTotalValueLocked(tvl: BigDecimal): void {
    this.protocol.totalValueLockedUSD = tvl;
    this.save();
  }

  /**
   * Adds a given USD value to the protocol's TVL. It can be a positive or negative amount.
   * Same as for setTotalValueLocked, this is mostly to be called internally by the library.
   * But you can use it if you need to. It will also update the protocol's snapshots.
   * @param amount {BigDecimal} The value to add to the protocol's TVL.
   */
  addTotalValueLocked(amount: BigDecimal): void {
    this.setTotalValueLocked(this.protocol.totalValueLockedUSD.plus(amount));
  }

  /**
   * Adds a given USD value to the protocol's volume. It can be a positive or negative amount.
   * Same as for setTotalValueLocked, this is mostly to be called internally by the library.
   * But you can use it if you need to. It will also update the protocol's snapshots.
   * @param volume {BigDecimal} The value to add to the protocol's volume.
   */
  addVolume(volume: BigDecimal): void {
    this.protocol.cumulativeVolumeUSD =
      this.protocol.cumulativeVolumeUSD.plus(volume);
    this.save();
  }

  /**
   * Adds a given USD value to the protocol InflowVolumeUSD. It can be a positive or negative amount.
   * @param volume {BigDecimal} The value to add to the protocol's InflowVolumeUSD.
   */
  addInflowVolumeUSD(volume: BigDecimal): void {
    this.protocol.cumulativeInflowVolumeUSD =
      this.protocol.cumulativeInflowVolumeUSD.plus(volume);
    this.save();
  }

  /**
   * Adds a given USD value to the protocol ClosedInflowVolumeUSD. It can be a positive or negative amount.
   * @param volume {BigDecimal} The value to add to the protocol's ClosedInflowVolumeUSD.
   */
  addClosedInflowVolumeUSD(volume: BigDecimal): void {
    this.protocol.cumulativeClosedInflowVolumeUSD =
      this.protocol.cumulativeClosedInflowVolumeUSD.plus(volume);
    this.save();
  }

  /**
   * Adds a given USD value to the protocol OutflowVolumeUSD. It can be a positive or negative amount.
   * @param volume {BigDecimal} The value to add to the protocol's OutflowVolumeUSD.
   */
  addOutflowVolumeUSD(volume: BigDecimal): void {
    this.protocol.cumulativeOutflowVolumeUSD =
      this.protocol.cumulativeOutflowVolumeUSD.plus(volume);
    this.save();
  }

  /**
   * Adds a given USD value to the protocol supplySideRevenue. It can be a positive or negative amount.
   * Same as for the rest of setters, this is mostly to be called internally by the library.
   * But you can use it if you need to. It will also update the protocol's snapshots.
   * @param rev {BigDecimal} The value to add to the protocol's supplySideRevenue.
   */
  addSupplySideRevenueUSD(rev: BigDecimal): void {
    this.protocol.cumulativeTotalRevenueUSD =
      this.protocol.cumulativeTotalRevenueUSD.plus(rev);
    this.protocol.cumulativeSupplySideRevenueUSD =
      this.protocol.cumulativeSupplySideRevenueUSD.plus(rev);
    this.save();
  }

  /**
   * Adds a given USD value to the protocol protocolSideRevenue. It can be a positive or negative amount.
   * Same as for the rest of setters, this is mostly to be called internally by the library.
   * But you can use it if you need to. It will also update the protocol's snapshots.
   * @param rev {BigDecimal} The value to add to the protocol's protocolSideRevenue.
   */
  addProtocolSideRevenueUSD(rev: BigDecimal): void {
    this.protocol.cumulativeTotalRevenueUSD =
      this.protocol.cumulativeTotalRevenueUSD.plus(rev);
    this.protocol.cumulativeProtocolSideRevenueUSD =
      this.protocol.cumulativeProtocolSideRevenueUSD.plus(rev);
    this.save();
  }

  /**
   * Adds a given USD value to the protocol StakeSideRevenue. It can be a positive or negative amount.
   * Same as for the rest of setters, this is mostly to be called internally by the library.
   * But you can use it if you need to. It will also update the protocol's snapshots.
   * @param rev {BigDecimal} The value to add to the protocol's StakeSideRevenue.
   */
  addStakeSideRevenueUSD(rev: BigDecimal): void {
    this.protocol.cumulativeTotalRevenueUSD =
      this.protocol.cumulativeTotalRevenueUSD.plus(rev);
    this.protocol.cumulativeStakeSideRevenueUSD =
      this.protocol.cumulativeStakeSideRevenueUSD.plus(rev);
    this.save();
  }

  /**
   * Adds a given USD value to the protocol's supplySideRevenue and protocolSideRevenue. It can be a positive or negative amount.
   * Same as for the rest of setters, this is mostly to be called internally by the library.
   * But you can use it if you need to. It will also update the protocol's snapshots.
   * @param protocolSide {BigDecimal} The value to add to the protocol's protocolSideRevenue.
   * @param supplySide {BigDecimal} The value to add to the protocol's supplySideRevenue.
   * @param stakeSide {BigDecimal} The value to add to the protocol's stakeSideRevenue.
   */
  addRevenueUSD(
    protocolSide: BigDecimal,
    supplySide: BigDecimal,
    stakeSide: BigDecimal
  ): void {
    this.addSupplySideRevenueUSD(supplySide);
    this.addProtocolSideRevenueUSD(protocolSide);
    this.addStakeSideRevenueUSD(stakeSide);
  }

  /**
   * Adds a given USD value to the protocol EntryPremium. It can be a positive or negative amount.
   * Same as for the rest of setters, this is mostly to be called internally by the library.
   * But you can use it if you need to. It will also update the protocol's snapshots.
   * @param premium {BigDecimal} The value to add to the protocol's EntryPremium.
   */
  addEntryPremiumUSD(premium: BigDecimal): void {
    this.protocol.cumulativeTotalPremiumUSD =
      this.protocol.cumulativeTotalPremiumUSD.plus(premium);
    this.protocol.cumulativeEntryPremiumUSD =
      this.protocol.cumulativeEntryPremiumUSD.plus(premium);
    this.save();
  }

  /**
   * Adds a given USD value to the protocol ExitPremium. It can be a positive or negative amount.
   * Same as for the rest of setters, this is mostly to be called internally by the library.
   * But you can use it if you need to. It will also update the protocol's snapshots.
   * @param premium {BigDecimal} The value to add to the protocol's ExitPremium.
   */
  addExitPremiumUSD(premium: BigDecimal): void {
    this.protocol.cumulativeTotalPremiumUSD =
      this.protocol.cumulativeTotalPremiumUSD.plus(premium);
    this.protocol.cumulativeExitPremiumUSD =
      this.protocol.cumulativeExitPremiumUSD.plus(premium);
    this.save();
  }

  /**
   * Adds a given USD value to the protocol depositPremium. It can be a positive or negative amount.
   * Same as for the rest of setters, this is mostly to be called internally by the library.
   * But you can use it if you need to. It will also update the protocol's snapshots.
   * @param premium {BigDecimal} The value to add to the protocol's depositPremium.
   */
  addDepositPremiumUSD(premium: BigDecimal): void {
    this.protocol.cumulativeTotalLiquidityPremiumUSD =
      this.protocol.cumulativeTotalLiquidityPremiumUSD.plus(premium);
    this.protocol.cumulativeDepositPremiumUSD =
      this.protocol.cumulativeDepositPremiumUSD.plus(premium);
    this.save();
  }

  /**
   * Adds a given USD value to the protocol withdrawPremium. It can be a positive or negative amount.
   * Same as for the rest of setters, this is mostly to be called internally by the library.
   * But you can use it if you need to. It will also update the protocol's snapshots.
   * @param premium {BigDecimal} The value to add to the protocol's withdrawPremium.
   */
  addWithdrawPremiumUSD(premium: BigDecimal): void {
    this.protocol.cumulativeTotalLiquidityPremiumUSD =
      this.protocol.cumulativeTotalLiquidityPremiumUSD.plus(premium);
    this.protocol.cumulativeWithdrawPremiumUSD =
      this.protocol.cumulativeWithdrawPremiumUSD.plus(premium);
    this.save();
  }

  /**
   * Adds a given USD value to the protocol's long and total openInterestUSD.
   *
   * @param amountChangeUSD {BigDecimal} The value to add to the protocol's openInterest in USD.
   */
  updateLongOpenInterestUSD(amountChangeUSD: BigDecimal): void {
    this.protocol.totalOpenInterestUSD =
      this.protocol.totalOpenInterestUSD.plus(amountChangeUSD);
    this.protocol.longOpenInterestUSD =
      this.protocol.longOpenInterestUSD.plus(amountChangeUSD);

    this.save();
  }

  /**
   * Adds a given USD value to the protocol's short and total openInterestUSD.
   *
   * @param amountChangeUSD {BigDecimal} The value to add to the protocol's openInterest in USD.
   */
  updateShortOpenInterestUSD(amountChangeUSD: BigDecimal): void {
    this.protocol.totalOpenInterestUSD =
      this.protocol.totalOpenInterestUSD.plus(amountChangeUSD);
    this.protocol.shortOpenInterestUSD =
      this.protocol.shortOpenInterestUSD.plus(amountChangeUSD);

    this.save();
  }

  /**
   * Adds 1 to the cumulativePositionCount counter and adds 1 to the counter corresponding the given position type.
   * If you are creating transaction entities from the Account class you won't need to use this method.
   * @param positionSide {PositionType} The type of transaction to add.
   * @see PositionType
   * @see Account
   */
  openPosition(positionSide: PositionType): void {
    if (positionSide == PositionType.LONG) {
      this.protocol.longPositionCount += 1;
    } else if (positionSide == PositionType.SHORT) {
      this.protocol.shortPositionCount += 1;
    }

    this.protocol.openPositionCount += 1;
    this.protocol.cumulativePositionCount += 1;
    this.save();
  }

  /**
   * Subtracts 1 from the cumulativePositionCount counter and adds 1 to the counter corresponding the given position type.
   * If you are creating transaction entities from the Account class you won't need to use this method.
   * @param positionSide {PositionType} The type of transaction to add.
   * @see PositionType
   * @see Account
   */
  closePosition(positionSide: PositionType): void {
    if (positionSide == PositionType.LONG) {
      this.protocol.longPositionCount -= 1;
    } else if (positionSide == PositionType.SHORT) {
      this.protocol.shortPositionCount -= 1;
    }

    this.protocol.openPositionCount -= 1;
    this.protocol.closedPositionCount += 1;
    this.save();
  }

  /**
   * Adds 1 to the transactionCount counter and adds 1 to the counter corresponding the given transaction type.
   * If you are creating transaction entities from the Account class you won't need to use this method.
   * @param type {TransactionType} The type of transaction to add.
   * @see TransactionType
   * @see Account
   */
  addTransaction(type: TransactionType): void {
    if (type == TransactionType.DEPOSIT) {
      this.protocol.depositCount += 1;
    } else if (type == TransactionType.WITHDRAW) {
      this.protocol.withdrawCount += 1;
    } else if (type == TransactionType.SWAP) {
      this.protocol.swapCount += 1;
    } else if (type == TransactionType.BORROW) {
      this.protocol.borrowCount += 1;
    } else if (type == TransactionType.COLLATERAL_IN) {
      this.protocol.collateralInCount += 1;
    } else if (type == TransactionType.COLLATERAL_OUT) {
      this.protocol.collateralOutCount += 1;
    }

    this.protocol.transactionCount += 1;
    this.save();

    this.snapshoter.addTransaction(type);
  }

  /**
   * Adds some value to the cumulativeUniqueUsers counter. If the value is omitted it will default to 1.
   * If you are loading accounts with the AccountManager you won't need to use this method.
   * @param count {u8} The value to add to the counter.
   */
  addUser(count: u8 = 1): void {
    this.protocol.cumulativeUniqueUsers += count;
    this.save();
  }

  /**
   * Will increase the hourly and daily active users counters. These will be reflected
   * on the next Usage snapshot whenever it comes up.
   */
  addActiveUser(activity: AccountWasActive): void {
    this.snapshoter.addActiveUser(activity);
  }

  /**
   * Adds some value to the cumulativeUniqueBorrowers counter. If the value is omitted it will default to 1.
   * If you are loading accounts with the AccountManager you won't need to use this method.
   * @param count {u8} The value to add to the counter.
   */
  addBorrower(count: u8 = 1): void {
    this.protocol.cumulativeUniqueBorrowers += count;
    this.save();
  }

  /**
   * Will increase the hourly and daily active borrowers counters. These will be reflected
   * on the next Usage snapshot whenever it comes up.
   */
  addActiveBorrower(activity: AccountWasActive): void {
    this.snapshoter.addActiveBorrower(activity);
  }

  /**
   * Adds some value to the cumulativeUniqueDepositors counter. If the value is omitted it will default to 1.
   * If you are loading accounts with the AccountManager you won't need to use this method.
   * @param count {u8} The value to add to the counter.
   */
  addDepositor(count: u8 = 1): void {
    this.protocol.cumulativeUniqueDepositors += count;
    this.save();
  }

  /**
   * Will increase the hourly and daily active depositors counters. These will be reflected
   * on the next Usage snapshot whenever it comes up.
   */
  addActiveDepositor(activity: AccountWasActive): void {
    this.snapshoter.addActiveDepositor(activity);
  }

  /**
   * Adds some value to the cumulativeUniqueLiquidators counter. If the value is omitted it will default to 1.
   * If you are loading accounts with the AccountManager you won't need to use this method.
   * @param count {u8} The value to add to the counter.
   */
  addLiquidator(count: u8 = 1): void {
    this.protocol.cumulativeUniqueLiquidators += count;
    this.save();
  }

  /**
   * Will increase the hourly and daily active liquidators counters. These will be reflected
   * on the next Usage snapshot whenever it comes up.
   */
  addActiveLiquidator(activity: AccountWasActive): void {
    this.snapshoter.addActiveLiquidator(activity);
  }

  /**
   * Adds some value to the cumulativeUniqueLiquidatees counter. If the value is omitted it will default to 1.
   * If you are loading accounts with the AccountManager you won't need to use this method.
   * @param count {u8} The value to add to the counter.
   */
  addLiquidatee(count: u8 = 1): void {
    this.protocol.cumulativeUniqueLiquidatees += count;
    this.save();
  }

  /**
   * Will increase the hourly and daily active liquidatees counters. These will be reflected
   * on the next Usage snapshot whenever it comes up.
   */
  addActiveLiquidatee(activity: AccountWasActive): void {
    this.snapshoter.addActiveLiquidatee(activity);
  }

  /**
   * Increases the totalPoolCount counter by the given value.
   * If you are using the PoolManager class you won't need to use this method.
   * @param count {u8} The value to add to the counter.
   * @see PoolManager
   */
  addPool(count: u8 = 1): void {
    this.protocol.totalPoolCount += count;
    this.save();
  }
}
