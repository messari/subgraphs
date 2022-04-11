import { Address, dataSource, ethereum } from "@graphprotocol/graph-ts";
import { DexAmmProtocol, LiquidityPoolFee, _Transfer } from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BSC_PROTOCOL_FEE,
  BSC_SUPPLY_FEE,
  FACTORY_ADDRESS,
  INT_ZERO,
  LiquidityPoolFeeType,
  Network,
  POLYGON_NETWORK,
  POLYGON_PROTOCOL_FEE,
  POLYGON_SUPPLY_FEE,
  ProtocolType,
  TRADING_FEE
} from "./constant";

export function getOrCreateProtocol(): DexAmmProtocol {
  let id = Address.fromString(FACTORY_ADDRESS).toHexString();
  let protocol = DexAmmProtocol.load(id);
  if (!protocol) {
    protocol = new DexAmmProtocol(id);
    protocol.name = "apeswap finance";
    protocol.slug = "apeswap-finance";
    if (dataSource.network() == Network.BSC.toLowerCase()) {
      protocol.network = Network.BSC;
    } else if (dataSource.network() == POLYGON_NETWORK) {
      protocol.network = Network.POLYGON;
    }
    protocol.schemaVersion = "1.0.0";
    protocol.subgraphVersion = "1.0.0";
    protocol.type = ProtocolType.EXCHANGE;
    protocol.totalUniqueUsers = INT_ZERO;
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.save();

    return protocol as DexAmmProtocol;
  }
  return protocol as DexAmmProtocol;
}

export function getOrCreateTradingFees(poolAddress: Address): LiquidityPoolFee {
  let id = poolAddress.toHexString().concat("- tradingFee");
  let tradingFee = LiquidityPoolFee.load(id);
  if (tradingFee == null) {
    tradingFee = new LiquidityPoolFee(id);
    tradingFee.feeType = LiquidityPoolFeeType.FIXED_TRADING_FEE;
    tradingFee.feePercentage = TRADING_FEE;
    tradingFee.save();

    return tradingFee as LiquidityPoolFee;
  }
  return tradingFee as LiquidityPoolFee;
}

export function getOrCreateProtocolFeeShare(poolAddress: Address): LiquidityPoolFee {
  let id = poolAddress.toHexString().concat("- protocolFee");
  let protocolFee = LiquidityPoolFee.load(id);
  if (protocolFee == null) {
    protocolFee = new LiquidityPoolFee(id);
    protocolFee.feeType = LiquidityPoolFeeType.FIXED_PROTOCOL_FEE;
    if (dataSource.network() == Network.BSC.toLowerCase()) {
      protocolFee.feePercentage = BSC_PROTOCOL_FEE;
    } else if (dataSource.network() == POLYGON_NETWORK) {
      protocolFee.feePercentage = POLYGON_PROTOCOL_FEE;
    }
    protocolFee.save();

    return protocolFee as LiquidityPoolFee;
  }
  return protocolFee as LiquidityPoolFee;
}

export function getOrCreateSupplyFeeShare(poolAddress: Address): LiquidityPoolFee {
  let id = poolAddress.toHexString().concat("- supplyFee");
  let supplyFee = LiquidityPoolFee.load(id);
  if (supplyFee == null) {
    supplyFee = new LiquidityPoolFee(id);
    supplyFee.feeType = LiquidityPoolFeeType.FIXED_PROTOCOL_FEE;
    if (dataSource.network() == Network.BSC.toLowerCase()) {
      supplyFee.feePercentage = BSC_SUPPLY_FEE;
    } else if (dataSource.network() == POLYGON_NETWORK) {
      supplyFee.feePercentage = POLYGON_SUPPLY_FEE;
    }
    supplyFee.save();

    return supplyFee as LiquidityPoolFee;
  }
  return supplyFee as LiquidityPoolFee;
}

export function getOrCreateTransfer(event: ethereum.Event): _Transfer {
  let transactionHash = event.transaction.hash.toHexString();
  let transfer = _Transfer.load(transactionHash);
  if (!transfer) {
    transfer = new _Transfer(transactionHash);
    transfer._blockNumber = event.block.number;
    transfer._timestamp = event.block.timestamp;
  }
  transfer.save();
  return transfer;
}
