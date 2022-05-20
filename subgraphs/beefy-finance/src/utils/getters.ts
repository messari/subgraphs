import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Deposit, Token, Vault, YieldAggregator } from "../../generated/schema";
import { createVault } from "../mappings/vault";
import {
  fetchTokenDecimals,
  fetchTokenName,
  fetchTokenSymbol,
} from "../mappings/token";
import { Deposit as DepositEvent } from "../../generated/ExampleStrategy/BeefyStrategy";

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
    token.save();
  }
  return token;
}

export function getVaultOrCreate(
  vaultAddress: Address,
  currentBlock: ethereum.Block,
  networkSuffix: string
): Vault {
  const vaultId = vaultAddress.toHexString() + networkSuffix;
  let vault = Vault.load(vaultId);
  if (!vault) {
    vault = createVault(vaultAddress, currentBlock);
  }
  return vault;
}

export function getBeefyFinanceOrCreate(
  networkSuffix: string
): YieldAggregator {
  let beefy = YieldAggregator.load("BeefyFinance" + networkSuffix);
  if (!beefy) {
    beefy = new YieldAggregator("BeefyFinance" + networkSuffix);
    beefy.name = "Beefy Finance";
    beefy.slug = "beefy-finance";
    beefy.schemaVersion = "1.2.1";
    beefy.subgraphVersion = "0.0.2";
    beefy.methodologyVersion = "Abboh";
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
