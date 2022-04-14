import { Address, ethereum } from "@graphprotocol/graph-ts";
import { DexAmmProtocol, LiquidityPoolFee, _Transfer } from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  INT_ZERO,
  LiquidityPoolFeeType,
  ProtocolType,
} from "./constant";
import { deployedNetwork } from "./networkConfig";

export function getOrCreateProtocol(): DexAmmProtocol {
  let id = Address.fromString(deployedNetwork.factoryAddress).toHexString();
  let protocol = DexAmmProtocol.load(id);
  if (!protocol) {
    protocol = new DexAmmProtocol(id);
    protocol.name = "apeswap finance";
    protocol.slug = "apeswap-finance";
    protocol.network = deployedNetwork.network;
    protocol.schemaVersion = "1.0.1";
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
    tradingFee.feePercentage = deployedNetwork.tradingFee;
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
    protocolFee.feePercentage = deployedNetwork.protocolFee;
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
    supplyFee.feePercentage = deployedNetwork.supplyFee;

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
