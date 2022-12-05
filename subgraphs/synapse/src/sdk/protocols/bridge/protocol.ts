import { Versions } from "../../../../../../deployment/context/interface";

import { BridgeProtocol as BridgeProtocolSchema } from "../../../../generated/schema";
import { TokenPricer } from "../config";
import { BridgeConfigurer } from "./config";
import * as constants from "../../util/constants";
import { TransactionType } from "./constants";
import {
  ethereum,
  dataSource,
  Address,
  Bytes,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import { chainIDToNetwork } from "./tokens";

interface ProtocolSnapshot {
  // todo
}

export class Bridge {
  protocol: BridgeProtocolSchema;
  event: ethereum.Event;
  pricer: TokenPricer;
  snapshoter: ProtocolSnapshot | null;

  private constructor(
    protocol: BridgeProtocolSchema,
    pricer: TokenPricer,
    event: ethereum.Event
  ) {
    this.protocol = protocol;
    this.event = event;
    this.pricer = pricer;
    this.snapshoter = null; // todo
  }

  static load(
    conf: BridgeConfigurer,
    pricer: TokenPricer,
    event: ethereum.Event
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
    protocol.network = dataSource.network().toUpperCase();
    protocol.type = constants.ProtocolType.BRIDGE;
    protocol.permissionType = conf.getPermissionType();
    protocol.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
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

  private setVersions(versions: Versions): void {
    this.protocol.schemaVersion = versions.getSchemaVersion();
    this.protocol.subgraphVersion = versions.getSubgraphVersion();
    this.protocol.methodologyVersion = versions.getMethodologyVersion();
    this.save();
  }

  private save(): void {
    this.updateSnapshots();
    this.protocol.save();
  }

  private updateSnapshots(): void {
    // this.snapshoter.takeSnapshots();
  }

  getID(): string {
    return this.protocol.id.toHexString();
  }

  getBytesID(): Bytes {
    return this.protocol.id;
  }

  getCurrentEvent(): ethereum.Event {
    return this.event;
  }

  getTokenPricer(): TokenPricer {
    return this.pricer;
  }

  getCurrentChainID(): i32 {
    return 1; // todo
  }

  setTotalValueLocked(tvl: BigDecimal): void {
    this.protocol.totalValueLockedUSD = tvl;
    this.save();
  }

  addTotalValueLocked(tvl: BigDecimal): void {
    this.protocol.totalValueLockedUSD =
      this.protocol.totalValueLockedUSD.plus(tvl);
    this.save();
  }

  addSupplySideRevenueUSD(rev: BigDecimal): void {
    this.protocol.cumulativeTotalRevenueUSD =
      this.protocol.cumulativeTotalRevenueUSD.plus(rev);
    this.protocol.cumulativeSupplySideRevenueUSD =
      this.protocol.cumulativeSupplySideRevenueUSD.plus(rev);
    this.save();
  }

  addProtocolSideRevenueUSD(rev: BigDecimal): void {
    this.protocol.cumulativeTotalRevenueUSD =
      this.protocol.cumulativeTotalRevenueUSD.plus(rev);
    this.protocol.cumulativeProtocolSideRevenueUSD =
      this.protocol.cumulativeProtocolSideRevenueUSD.plus(rev);
    this.save();
  }

  addRevenueUSD(protocolSide: BigDecimal, supplySide: BigDecimal): void {
    this.addSupplySideRevenueUSD(supplySide);
    this.addProtocolSideRevenueUSD(protocolSide);
  }

  addVolumeInUSD(vol: BigDecimal): void {
    this.protocol.cumulativeVolumeInUSD =
      this.protocol.cumulativeVolumeInUSD.plus(vol);
    this.updateVolumes();
  }

  addVolumeOutUSD(vol: BigDecimal): void {
    this.protocol.cumulativeVolumeOutUSD =
      this.protocol.cumulativeVolumeOutUSD.plus(vol);
    this.updateVolumes();
  }

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

  addUser(count: u8 = 1): void {
    this.protocol.cumulativeUniqueUsers += count;
    this.save();
  }

  addTransferSender(count: u8 = 1): void {
    this.protocol.cumulativeUniqueTransferSenders += count;
    this.save();
  }

  addTransferReceiver(count: u8 = 1): void {
    this.protocol.cumulativeUniqueTransferReceivers += count;
    this.save();
  }

  addLiquidityProvider(count: u8 = 1): void {
    this.protocol.cumulativeUniqueLiquidityProviders += count;
    this.save();
  }

  addMessageSender(count: u8 = 1): void {
    this.protocol.cumulativeUniqueMessageSenders += count;
    this.save();
  }

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

  addCanonicalPoolRoute(count: u8 = 1): void {
    this.protocol.totalCanonicalRouteCount += count;
    this.protocol.totalPoolRouteCount += count;
    this.save();
  }

  addWrappedPoolRoute(count: u8 = 1): void {
    this.protocol.totalWrappedRouteCount += count;
    this.protocol.totalPoolRouteCount += count;
    this.save();
  }

  addPool(count: u8 = 1): void {
    this.protocol.totalPoolCount += count;
    this.save();
  }

  addSupportedToken(count: u8 = 1): void {
    this.protocol.totalSupportedTokenCount += count;
    this.save();
  }

  addSupportedNetwork(chainID: i32): void {
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

namespace UserType {
  export const TRANSFER_SENDER = "TRANSFER_SENDER";
  export const TRANSFER_RECEIVER = "TRANSFER_RECEIVER";
  export const LIQUIDITY_PROVIDER = "LIQUIDITY_PROVIDER";
  export const MESSAGE_SENDER = "MESSAGE_SENDER";
  export const OTHER = "OTHER";
}
type UserType = string;
