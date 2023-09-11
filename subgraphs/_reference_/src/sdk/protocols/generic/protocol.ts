import { SDK } from ".";
import {
  dataSource,
  Address,
  Bytes,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import { AccountWasActive } from "./account";
import * as constants from "../../util/constants";
import { BIGINT_ZERO } from "../../util/constants";
import { CustomEventType } from "../../util/events";
import { ProtocolSnapshot } from "./protocolSnapshot";
import { ProtocolConfigurer, TokenPricer } from "../config";
import { Protocol as ProtocolSchema } from "../../../../generated/schema";
import { Versions } from "../../../../../../deployment/context/interface";

/**
 * This file contains the ProtocolManager class, which is used to
 * make all of the storage changes that occur in a protocol.
 *
 * Schema Version:  2.1.1
 * SDK Version:     1.0.1
 * Author(s):
 *  - @steegecs
 *  - @shashwatS22
 */

/**
 * ProtocolManager is a wrapper around the ProtocolSchema entity that takes care of
 * safely and conveniently updating the entity. Updating the Protocol entity using this
 * wrapper also takes care of the Financials and Usage snapshots.
 */
export class ProtocolManager {
  protocol: ProtocolSchema;
  event: CustomEventType;
  pricer: TokenPricer;
  snapshoter: ProtocolSnapshot;
  sdk: SDK | null = null;
  /**
   * Creates a new Protocol instance. This should only be called by the Protocol.load
   * @private
   */
  private constructor(
    protocol: ProtocolSchema,
    pricer: TokenPricer,
    event: CustomEventType
  ) {
    this.protocol = protocol;
    this.event = event;
    this.pricer = pricer;
    this.snapshoter = new ProtocolSnapshot(protocol, event);
    this.protocol.lastUpdateTimestamp = event.block.timestamp;
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
  ): ProtocolManager {
    const id = Address.fromString(conf.getID());
    let protocol = ProtocolSchema.load(id);
    if (protocol) {
      const proto = new ProtocolManager(protocol, pricer, event);
      proto.setVersions(conf.getVersions());
      return proto;
    }

    protocol = new ProtocolSchema(id);
    protocol.name = conf.getName();
    protocol.slug = conf.getSlug();
    protocol.network = dataSource.network().toUpperCase().replace("-", "_");
    protocol.type = constants.ProtocolType.GENERIC;
    protocol.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    protocol.protocolControlledValueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;

    protocol.cumulativeTransactionCount = 0;
    protocol.cumulativeUniqueUsers = 0;
    protocol.totalPoolCount = 0;

    protocol.lastSnapshotDayID = 0;
    protocol.lastSnapshotHourID = 0;
    protocol.lastUpdateTimestamp = BIGINT_ZERO;

    protocol.schemaVersion = conf.getVersions().getSchemaVersion();
    protocol.subgraphVersion = conf.getVersions().getSubgraphVersion();
    protocol.methodologyVersion = conf.getVersions().getMethodologyVersion();

    const proto = new ProtocolManager(protocol, pricer, event);
    proto.save();
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
   * Increases the totalPoolCount counter by the given value.
   * If you are using the PoolManager class you won't need to use this method.
   * @param count {u8} The value to add to the counter.
   * @see PoolManager
   */
  addPool(count: u8 = 1): void {
    this.protocol.totalPoolCount += count;
    this.save();
  }

  addTransaction(): void {
    this.protocol.cumulativeTransactionCount += 1;
    this.save();
  }
}
