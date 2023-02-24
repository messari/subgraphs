import { Versions } from "../../../../../../deployment/context/interface";

import { BridgeProtocol as BridgeProtocolSchema } from "../../../../generated/schema";
import { TokenPricer } from "../config";
import { BridgeConfigurer } from "./config";
import { ProtocolSnapshot } from "./protocolSnapshot";
import { AccountWasActive } from "./account";
import * as constants from "../../util/constants";
import { TransactionType } from "./enums";
import {
  dataSource,
  Address,
  Bytes,
  BigDecimal,
  BigInt,
} from "@graphprotocol/graph-ts";
import { chainIDToNetwork, networkToChainID } from "./chainIds";
import { SDK } from ".";
import { CustomEventType } from "../../util/events";

/**
 * Bridge is a wrapper around the BridgeProtocolSchema entity that takes care of
 * safely and conveniently updating the entity. Updating the Bridge entity using this
 * wrapper also takes care of the Financials and Usage snapshots.
 */
export class Bridge {
  protocol: BridgeProtocolSchema;
  event: CustomEventType;
  pricer: TokenPricer;
  snapshoter: ProtocolSnapshot;
  sdk: SDK | null = null;
  /**
   * Creates a new Bridge instance. This should only be called by the Bridge.load
   * @private
   */
  private constructor(
    protocol: BridgeProtocolSchema,
    pricer: TokenPricer,
    event: CustomEventType
  ) {
    this.protocol = protocol;
    this.event = event;
    this.pricer = pricer;
    this.snapshoter = new ProtocolSnapshot(protocol, event);
  }

  /**
   * This is the main function to instantiate a Bridge entity. Most times it is not called directly, but from the SDK initializer.
   *
   * @param conf {BridgeConfigurer} An object that implements the BridgeConfigurer interface, to set some of the protocol's properties
   * @param pricer {TokenPricer} An object that implements the TokenPricer interface, to allow the wrapper to access pricing data
   * @param event {CustomEventType} The event being handled at a time.
   * @returns Bridge
   */
  static load(
    conf: BridgeConfigurer,
    pricer: TokenPricer,
    event: CustomEventType
  ): Bridge {
    const id = Address.fromString(conf.getID());
    let protocol = BridgeProtocolSchema.load(id);
    if (protocol) {
      const proto = new Bridge(protocol, pricer, event);
      proto.setVersions(conf.getVersions());
      return proto;
    }

    protocol = new BridgeProtocolSchema(id);
    protocol.name = conf.getName();
    protocol.slug = conf.getSlug();
    protocol.network = dataSource.network().toUpperCase().replace("-", "_");
    protocol.type = constants.ProtocolType.BRIDGE;
    protocol.permissionType = conf.getPermissionType();
    protocol.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    protocol.totalValueExportedUSD = constants.BIGDECIMAL_ZERO;
    protocol.totalValueImportedUSD = constants.BIGDECIMAL_ZERO;
    protocol.protocolControlledValueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeInUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeOutUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeTotalVolumeUSD = constants.BIGDECIMAL_ZERO;
    protocol.netVolumeUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = 0;
    protocol.cumulativeUniqueTransferSenders = 0;
    protocol.cumulativeUniqueTransferReceivers = 0;
    protocol.cumulativeUniqueLiquidityProviders = 0;
    protocol.cumulativeUniqueMessageSenders = 0;
    protocol.cumulativeTransactionCount = 0;
    protocol.cumulativeTransferOutCount = 0;
    protocol.cumulativeTransferInCount = 0;
    protocol.cumulativeLiquidityDepositCount = 0;
    protocol.cumulativeLiquidityWithdrawCount = 0;
    protocol.cumulativeMessageSentCount = 0;
    protocol.cumulativeMessageReceivedCount = 0;
    protocol.supportedNetworks = [];
    protocol.totalPoolCount = 0;
    protocol.totalPoolRouteCount = 0;
    protocol.totalCanonicalRouteCount = 0;
    protocol.totalWrappedRouteCount = 0;
    protocol.totalSupportedTokenCount = 0;

    const proto = new Bridge(protocol, pricer, event);
    proto.setVersions(conf.getVersions());
    return proto;
  }

  /**
   * Updates the protocol entity versions. This is called on load to make sure we update the version
   * if we've grafted the subgraph.
   *
   * @param versions {Versions} An object that implements the Versions interface, to get the protocol's versions
   */
  private setVersions(versions: Versions): void {
    this.protocol.schemaVersion = versions.getSchemaVersion();
    this.protocol.subgraphVersion = versions.getSubgraphVersion();
    this.protocol.methodologyVersion = versions.getMethodologyVersion();
    this.save();
  }

  /**
   * This will save the entity to storage. If any other action needs to be performed on
   * save, it should be added here.
   * It is meant to be used internally. If you need to save the entity from outside the wrapper
   * you should probably be using some of the setters instead.
   * @private
   */
  private save(): void {
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
   *
   * @returns {i64} The chainID of the network the subgraph is running on.
   */
  getCurrentChainID(): BigInt {
    return networkToChainID(this.protocol.network);
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
   * @param tvl {BigDecimal} The value to add to the protocol's TVL.
   */
  addTotalValueLocked(tvl: BigDecimal): void {
    this.protocol.totalValueLockedUSD =
      this.protocol.totalValueLockedUSD.plus(tvl);
    this.save();
  }

  addTotalValueExportedUSD(tve: BigDecimal): void {
    this.protocol.totalValueExportedUSD =
      this.protocol.totalValueExportedUSD.plus(tve);
    this.save();
  }

  setTotalValueExportedUSD(tve: BigDecimal): void {
    this.protocol.totalValueExportedUSD = tve;
    this.save();
  }

  addTotalValueImportedUSD(tvi: BigDecimal): void {
    this.protocol.totalValueImportedUSD =
      this.protocol.totalValueImportedUSD.plus(tvi);
    this.save();
  }

  setTotalValueImportedUSD(tvi: BigDecimal): void {
    this.protocol.totalValueImportedUSD = tvi;
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
   * Adds a given USD value to the protocol's supplySideRevenue and protocolSideRevenue. It can be a positive or negative amount.
   * Same as for the rest of setters, this is mostly to be called internally by the library.
   * But you can use it if you need to. It will also update the protocol's snapshots.
   * @param protocolSide {BigDecimal} The value to add to the protocol's protocolSideRevenue.
   * @param supplySide {BigDecimal} The value to add to the protocol's supplySideRevenue.
   */
  addRevenueUSD(protocolSide: BigDecimal, supplySide: BigDecimal): void {
    this.addSupplySideRevenueUSD(supplySide);
    this.addProtocolSideRevenueUSD(protocolSide);
  }

  /**
   * Adds a given USD value to the protocol's cumulativeVolumeInUSD. It can be a positive or negative amount.
   * Same as for the rest of setters, this is mostly to be called internally by the library.
   * But you can use it if you need to. It will also update the protocol's snapshots.
   * @param vol {BigDecimal} The value to add to the protocol's cumulativeVolumeInUSD.
   */
  addVolumeInUSD(vol: BigDecimal): void {
    this.protocol.cumulativeVolumeInUSD =
      this.protocol.cumulativeVolumeInUSD.plus(vol);
    this.updateVolumes();
  }

  /**
   * Adds a given USD value to the protocol's cumulativeVolumeOutUSD. It can be a positive or negative amount.
   * Same as for the rest of setters, this is mostly to be called internally by the library.
   * But you can use it if you need to. It will also update the protocol's snapshots.
   * @param vol {BigDecimal} The value to add to the protocol's cumulativeVolumeOutUSD.
   */
  addVolumeOutUSD(vol: BigDecimal): void {
    this.protocol.cumulativeVolumeOutUSD =
      this.protocol.cumulativeVolumeOutUSD.plus(vol);
    this.updateVolumes();
  }

  /**
   * This method will update the values of cumulativeTotalVolumeUSD and netVolumeUSD, since these can
   * be computed from the values of cumulativeVolumeInUSD and cumulativeVolumeOutUSD. It is called automatically
   * when either of those values are changed via the addVolumeInUSD or addVolumeOutUSD methods.
   * @private
   */
  private updateVolumes(): void {
    this.protocol.netVolumeUSD = this.protocol.cumulativeVolumeInUSD.minus(
      this.protocol.cumulativeVolumeOutUSD
    );
    this.protocol.cumulativeTotalVolumeUSD =
      this.protocol.cumulativeVolumeInUSD.plus(
        this.protocol.cumulativeVolumeOutUSD
      );
    this.save();
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
   * Adds some value to the cumulativeUniqueTransferSenders counter. If the value is omitted it will default to 1.
   * If you are loading accounts with the AccountManager you won't need to use this method.
   * @param count {u8} The value to add to the counter.
   */
  addTransferSender(count: u8 = 1): void {
    this.protocol.cumulativeUniqueTransferSenders += count;
    this.save();
  }

  /**
   * Adds some value to the cumulativeUniqueTransferReceivers counter. If the value is omitted it will default to 1.
   * If you are loading accounts with the AccountManager you won't need to use this method.
   * @param count {u8} The value to add to the counter.
   */
  addTransferReceiver(count: u8 = 1): void {
    this.protocol.cumulativeUniqueTransferReceivers += count;
    this.save();
  }

  /**
   * Adds some value to the cumulativeUniqueLiquidityProviders counter. If the value is omitted it will default to 1.
   * If you are loading accounts with the AccountManager you won't need to use this method.
   * @param count {u8} The value to add to the counter.
   */
  addLiquidityProvider(count: u8 = 1): void {
    this.protocol.cumulativeUniqueLiquidityProviders += count;
    this.save();
  }

  /**
   * Adds some value to the cumulativeUniqueMessageSenders counter. If the value is omitted it will default to 1.
   * If you are loading accounts with the AccountManager you won't need to use this method.
   * @param count {u8} The value to add to the counter.
   */
  addMessageSender(count: u8 = 1): void {
    this.protocol.cumulativeUniqueMessageSenders += count;
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
   * Will increase the hourly and daily active transfer senders counters. These will be reflected
   * on the next Usage snapshot whenever it comes up.
   */
  addActiveTransferSender(activity: AccountWasActive): void {
    this.snapshoter.addActiveTransferSender(activity);
  }

  /**
   * Will increase the hourly and daily active transfer receivers counters. These will be reflected
   * on the next Usage snapshot whenever it comes up.
   */
  addActiveTransferReceiver(activity: AccountWasActive): void {
    this.snapshoter.addActiveTransferReceiver(activity);
  }

  /**
   * Will increase the hourly and daily active liquidity providers counters. These will be reflected
   * on the next Usage snapshot whenever it comes up.
   */
  addActiveLiquidityProvider(activity: AccountWasActive): void {
    this.snapshoter.addActiveLiquidityProvider(activity);
  }

  /**
   * Will increase the hourly and daily active message senders counters. These will be reflected
   * on the next Usage snapshot whenever it comes up.
   */
  addActiveMessageSender(activity: AccountWasActive): void {
    this.snapshoter.addActiveMessageSender(activity);
  }

  /**
   * Adds 1 to the cumulativeTransactionCount counter and adds 1 to the counter corresponding the given transaction type.
   * If you are creating transaction entities from the Account class you won't need to use this method.
   * @param type {TransactionType} The type of transaction to add.
   * @see TransactionType
   * @see Account
   */
  addTransaction(type: TransactionType): void {
    if (type == TransactionType.TRANSFER_IN) {
      this.protocol.cumulativeTransferInCount += 1;
    } else if (type == TransactionType.TRANSFER_OUT) {
      this.protocol.cumulativeTransferOutCount += 1;
    } else if (type == TransactionType.LIQUIDITY_DEPOSIT) {
      this.protocol.cumulativeLiquidityDepositCount += 1;
    } else if (type == TransactionType.LIQUIDITY_WITHDRAW) {
      this.protocol.cumulativeLiquidityWithdrawCount += 1;
    } else if (type == TransactionType.MESSAGE_SENT) {
      this.protocol.cumulativeMessageSentCount += 1;
    } else if (type == TransactionType.MESSAGE_RECEIVED) {
      this.protocol.cumulativeMessageReceivedCount += 1;
    }

    this.protocol.cumulativeTransactionCount += 1;
    this.save();
  }

  /**
   * Increases the totalPoolRouteCount and totalCanonicalRouteCount counters by the given value.
   * If you are using the Pool class you won't need to use this method.
   * @param count {u8} The value to add to the counters.
   * @see Pool
   */
  addCanonicalPoolRoute(count: u8 = 1): void {
    this.protocol.totalCanonicalRouteCount += count;
    this.protocol.totalPoolRouteCount += count;
    this.save();
  }

  /**
   * Increases the totalPoolRouteCount and totalWrappedRouteCount counters by the given value.
   * If you are using the Pool class you won't need to use this method.
   * @param count {u8} The value to add to the counters.
   * @see Pool
   */
  addWrappedPoolRoute(count: u8 = 1): void {
    this.protocol.totalWrappedRouteCount += count;
    this.protocol.totalPoolRouteCount += count;
    this.save();
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

  /**
   * Increases the totalSupportedTokenCount counter by the given value.
   * If you are using the Pool class you won't need to use this method.
   * @param count {u8} The value to add to the counter.
   * @see Pool
   */
  addSupportedToken(count: u8 = 1): void {
    this.protocol.totalSupportedTokenCount += count;
    this.save();
  }

  /**
   * Adds the given network to the supportedNetworks array.
   * If you are using the Pool class you won't need to use this method.
   * @param chainID {i32} The chainID of the network to add.
   * @see Pool
   */
  addSupportedNetwork(chainID: BigInt): void {
    const network = chainIDToNetwork(chainID);
    if (this.protocol.supportedNetworks.includes(network)) {
      return;
    }

    this.protocol.supportedNetworks = this.protocol.supportedNetworks.concat([
      network,
    ]);
    this.save();
  }
}
