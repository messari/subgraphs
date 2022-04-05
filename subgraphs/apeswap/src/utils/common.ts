import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { DexAmmProtocol, LiquidityPool, LiquidityPoolFee } from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  FACTORY_ADDRESS,
  LiquidityPoolFeeType,
  Network,
  ProtocolType,
  toPercentage,
} from "./constant";

export function getOrCreateProtocol(): DexAmmProtocol {
  let id = Address.fromString(FACTORY_ADDRESS).toHexString();
  let protocol = DexAmmProtocol.load(id);
  if (!protocol) {
    protocol = new DexAmmProtocol(id);
    protocol.name = "apeswap finance";
    protocol.slug = "apeswap-finance";
    protocol.network = Network.BSC;
    protocol.schemaVersion = "1.0.0";
    protocol.subgraphVersion = "1.0.0";
    protocol.type = ProtocolType.EXCHANGE;
    protocol.totalUniqueUsers = 0;
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;

    protocol.save();

    return protocol as DexAmmProtocol;
  }
  return protocol as DexAmmProtocol;
}

export function getOrcreateTradingFees(poolAddress: Address): LiquidityPoolFee {
  let id = poolAddress.toHexString().concat("- tradingFee")
  let tradingFee = LiquidityPoolFee.load(id)
  if(tradingFee == null) {
    tradingFee = new LiquidityPoolFee(id)
    tradingFee.feeType = LiquidityPoolFeeType.TRADING_FEE
    tradingFee.feePercentage = toPercentage(BigDecimal.fromString("0.3"))
    tradingFee.save()

    return tradingFee as LiquidityPoolFee 
  }
  return tradingFee as LiquidityPoolFee

}

export function getOrCreateProtocolFee(poolAddress: Address): LiquidityPoolFee {
  let id = poolAddress.toHexString().concat("- protocolFee")
  let protocolFee = LiquidityPoolFee.load(id)
  if(protocolFee == null) {
    protocolFee = new LiquidityPoolFee(id)
    protocolFee.feeType = LiquidityPoolFeeType.PROTOCOL_FEE
    protocolFee.feePercentage = toPercentage(BigDecimal.fromString("0"))
    protocolFee.save()

    return protocolFee as LiquidityPoolFee
  }
  return protocolFee as LiquidityPoolFee
}