import { Address, ethereum } from "@graphprotocol/graph-ts";
import { Token, Vault, YieldAggregator } from "../../generated/schema";
import { createVaultFromStrategy } from "../mappings/vault";
import { BeefyStrategy } from "../../generated/ExampleVault/BeefyStrategy";
import {
  fetchTokenDecimals,
  fetchTokenName,
  fetchTokenSymbol,
} from "../mappings/token";
import { BIGDECIMAL_ZERO } from "../prices/common/constants";

export function getTokenOrCreate(
  tokenAddress: Address,
  networkSuffix: string
): Token {
  const tokenId = tokenAddress.toHexString() + networkSuffix;
  let token = Token.load(tokenId);
  if (!token) {
    token = new Token(tokenId);
    token.name = fetchTokenName(tokenAddress);
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress) as i32;
    token.lastPriceUSD = BIGDECIMAL_ZERO;
    token.save();
  }
  return token;
}

export function getVaultFromStrategyOrCreate(
  strategyAddress: Address,
  currentBlock: ethereum.Block,
  networkSuffix: string
): Vault {
  const strategyContract = BeefyStrategy.bind(strategyAddress);
  const vaultId = strategyContract.vault().toHexString() + networkSuffix;
  let vault = Vault.load(vaultId);
  if (!vault) {
    vault = createVaultFromStrategy(strategyAddress, currentBlock);
  }
  return vault;
}

export function getBeefyFinanceOrCreate(): YieldAggregator {
  let beefy = YieldAggregator.load("BeefyFinance");
  if (!beefy) {
    beefy = new YieldAggregator("BeefyFinance");
    beefy.name = "Beefy Finance";
    beefy.slug = "beefy-finance";
    beefy.schemaVersion = "1.2.1";
    beefy.subgraphVersion = "0.0.2";
    //beefy.methodologyVersion = "Abboh";
    beefy.network = "MATIC";
    beefy.type = "YIELD";
    /* beefy.totalValueLockedUSD = new BigDecimal(new BigInt(0));
    beefy.protocolControlledValueUSD = new BigDecimal(new BigInt(0));
    beefy.cumulativeSupplySideRevenueUSD = new BigDecimal(new BigInt(0));
    beefy.cumulativeProtocolSideRevenueUSD = new BigDecimal(new BigInt(0));
    beefy.cumulativeTotalRevenueUSD = new BigDecimal(new BigInt(0));
    beefy.cumulativeUniqueUsers = 0; */
    beefy.save();
  }

  return beefy;
}
