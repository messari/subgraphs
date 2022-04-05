import { Address } from "@graphprotocol/graph-ts";
import { ERC20 } from "../generated/BancorNetwork/ERC20";
import { DexAmmProtocol, FinancialsDailySnapshot, PoolDailySnapshot, Token, UsageMetricsDailySnapshot } from "../generated/schema";
import { DEFAULT_DECIMALS, FACTORY_ADDRESS, Network, ProtocolType } from "./constants";

export function getOrCreateToken(tokenAddress: Address): Token {
    let token = Token.load(tokenAddress.toHexString());

    if (!token) {
      token = new Token(tokenAddress.toHexString());
      let contract = ERC20.bind(tokenAddress)
      let symbolResult = contract.try_symbol()
      token.symbol = symbolResult.reverted ? "unknown" : symbolResult.value
      let nameResult = contract.try_name()
      token.name = nameResult.reverted ? "unknown" : nameResult.value
      let decimalsResult = contract.try_decimals()
      token.decimals = decimalsResult.reverted ? DEFAULT_DECIMALS : decimalsResult.value
      token.save();
    }
    return token;
  }

export function getOrCreateDexAmm(): DexAmmProtocol {
    let protocol = DexAmmProtocol.load(FACTORY_ADDRESS);
  
    if (!protocol) {
      protocol = new DexAmmProtocol(FACTORY_ADDRESS);
      protocol.name = "Bancor v2";
      protocol.slug = "bancor-v2";
      protocol.schemaVersion = "1.0.0";
      protocol.subgraphVersion = "1.0.0";
      protocol.network = Network.ETHEREUM;
      protocol.type = ProtocolType.EXCHANGE;
  
      protocol.save();
    }
    return protocol;
  }

  export function getOrCreateUsageSnapshot(epochDays: i64, protocol: string): UsageMetricsDailySnapshot {
    let id = epochDays.toString();
    let usageSnapshot = UsageMetricsDailySnapshot.load(id);
    if (!usageSnapshot) {
        usageSnapshot = new UsageMetricsDailySnapshot(id);
        usageSnapshot.protocol = protocol;
        usageSnapshot.save();
    }
    return usageSnapshot
  }

  export function getOrCreatePoolSnapshot(epochDays: i64, pool: string, protocol: string): PoolDailySnapshot {
    let id = epochDays.toString() + "-" + pool;
    let poolSnapshot = PoolDailySnapshot.load(id);
    if (!poolSnapshot) {
        poolSnapshot = new PoolDailySnapshot(id);
        poolSnapshot.pool = pool
        poolSnapshot.protocol = protocol
        poolSnapshot.save();
    }
    return poolSnapshot
  }

  export function getOrCreateFinancialSnapshot(epochDays: i64, protocol: string): FinancialsDailySnapshot {
    let id = epochDays.toString()
    let financialSnapshot = FinancialsDailySnapshot.load(id);
    if (!financialSnapshot) {
      financialSnapshot = new FinancialsDailySnapshot(id);
      financialSnapshot.protocol = protocol
      financialSnapshot.save()
    }
    return financialSnapshot
  }
