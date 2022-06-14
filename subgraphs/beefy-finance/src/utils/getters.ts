import { Address, dataSource, ethereum } from "@graphprotocol/graph-ts";
import { Token, Vault, YieldAggregator } from "../../generated/schema";
import { createVaultFromStrategy } from "../mappings/vault";
import { BeefyStrategy } from "../../generated/ExampleVault/BeefyStrategy";
import {
  fetchTokenDecimals,
  fetchTokenName,
  fetchTokenSymbol,
} from "../mappings/token";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  PROTOCOL_ID,
} from "../prices/common/constants";
import { getUsdPricePerToken } from "../prices";

export function getTokenOrCreate(
  tokenAddress: Address,
  block: ethereum.Block
): Token {
  const tokenId = tokenAddress.toHexString();
  let token = Token.load(tokenId);
  if (!token) {
    token = new Token(tokenId);
    token.name = fetchTokenName(tokenAddress);
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress) as i32;
  }
  const price = getUsdPricePerToken(tokenAddress);
  if (price.reverted) {
    token.lastPriceUSD = BIGDECIMAL_ZERO;
  } else {
    token.lastPriceUSD = price.usdPrice.div(price.decimalsBaseTen);
  }
  token.lastPriceBlockNumber = block.number;
  token.save();
  return token;
}

export function getVaultFromStrategyOrCreate(
  strategyAddress: Address,
  event: ethereum.Event
): Vault {
  const strategyContract = BeefyStrategy.bind(strategyAddress);
  const vaultId = strategyContract.vault().toHexString();
  let vault = Vault.load(vaultId);
  if (!vault) {
    vault = createVaultFromStrategy(strategyAddress, event);
  }
  return vault;
}

export function getBeefyFinanceOrCreate(vaultId: string): YieldAggregator {
  let beefy = YieldAggregator.load(PROTOCOL_ID);
  if (!beefy) {
    beefy = new YieldAggregator(PROTOCOL_ID);
    beefy.name = "Beefy Finance";
    beefy.slug = "beefy-finance";
    beefy.schemaVersion = "1.2.1";
    beefy.subgraphVersion = "1.0.2";
    beefy.methodologyVersion = "1.1.0";
    beefy.network = dataSource
      .network()
      .toUpperCase()
      .replace("-", "_");
    beefy.type = "YIELD";
    beefy.totalValueLockedUSD = BIGDECIMAL_ZERO;
    beefy.protocolControlledValueUSD = BIGDECIMAL_ZERO;
    beefy.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    beefy.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    beefy.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    beefy.cumulativeUniqueUsers = BIGINT_ZERO;
    beefy.vaults = [vaultId];
    beefy.save();
  }
  return beefy;
}
