import {
  Address,
  BigDecimal,
  dataSource,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  Token,
  Vault,
  VaultFee,
  YieldAggregator,
} from "../../generated/schema";
import { BeefyStrategy } from "../../generated/Standard/BeefyStrategy";
import {
  fetchTokenDecimals,
  fetchTokenName,
  fetchTokenSymbol,
} from "../mappings/token";
import { BIGDECIMAL_ZERO, BIGINT_ZERO } from "../prices/common/constants";
import { getUsdPricePerToken } from "../prices";
import {
  BIGDECIMAL_HUNDRED,
  ProtocolType,
  PROTOCOL_ID,
  PROTOCOL_METHODOLOGY_VERSION,
  PROTOCOL_NAME,
  PROTOCOL_SCHEMA_VERSION,
  PROTOCOL_SLUG,
  PROTOCOL_SUBGRAPH_VERSION,
  VaultFeeType,
} from "./constants";
import { BeefyVault } from "../../generated/Standard/BeefyVault";

export function getOrCreateToken(
  tokenAddress: Address,
  block: ethereum.Block
): Token {
  const tokenId = tokenAddress.toHexString();
  let token = Token.load(tokenId);
  if (!token) {
    token = new Token(tokenId);
    token.name = fetchTokenName(tokenAddress);
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress);
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

export function getOrCreateVault(
  strategyAddress: Address,
  event: ethereum.Event
): Vault | null {
  const strategyContract = BeefyStrategy.bind(strategyAddress);
  const vaultId = strategyContract.vault().toHexString();
  let vault = Vault.load(vaultId);
  if (!vault) {
    const strategyContract = BeefyStrategy.bind(strategyAddress);
    const tryVaultAddress = strategyContract.try_vault();
    if (tryVaultAddress.reverted) {
      log.warning("Failed to get vault address from strategy {}", [
        strategyAddress.toHexString(),
      ]);
      return null;
    }
    const vaultContract = BeefyVault.bind(tryVaultAddress.value);

    // create native token
    const tryNativeToken = strategyContract.try_native();
    if (tryNativeToken.reverted) {
      log.warning("Failed to get native token from strategy {}", [
        strategyAddress.toHexString(),
      ]);
      return null;
    }
    const nativeToken = getOrCreateToken(tryNativeToken.value, event.block);

    // create input token
    const tryInputToken = vaultContract.try_want();
    if (tryInputToken.reverted) {
      log.warning("Failed to get input token from vault {}", [
        tryVaultAddress.value.toHexString(),
      ]);
      return null;
    }
    const inputToken = getOrCreateToken(tryInputToken.value, event.block);

    // create output token
    const outputToken = getOrCreateToken(tryVaultAddress.value, event.block);

    // add vault to yield aggregator
    const yieldAggregator = getOrCreateYieldAggregator();
    let vaults = yieldAggregator._vaults;
    vaults.push(tryVaultAddress.value.toHexString());
    yieldAggregator._vaults = vaults;
    yieldAggregator.save();

    // create vault entity
    const vault = new Vault(tryVaultAddress.value.toHex());
    vault.protocol = yieldAggregator.id;
    vault.name = outputToken.name;
    vault.symbol = outputToken.symbol;
    vault.inputToken = inputToken.id;
    vault.outputToken = outputToken.id;
    vault.fees = getFees(vault.id, strategyContract);
    vault.createdTimestamp = event.block.timestamp;
    vault.createdBlockNumber = event.block.number;
    vault.totalValueLockedUSD = BIGDECIMAL_ZERO;
    vault.inputTokenBalance = BIGINT_ZERO;
    vault.outputTokenSupply = BIGINT_ZERO;
    vault.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    vault.pricePerShare = BIGINT_ZERO;
    vault._strategyAddress = strategyAddress.toHexString();
    vault._nativeToken = nativeToken.id;
    vault.save();
  }

  return vault;
}

// helper function to get the vault fees
export function getFees(
  vaultId: string,
  strategyContract: BeefyStrategy
): string[] {
  let fees: string[] = [];

  // check for withdrawal fee
  // withdrawal fee = withdrawalFee() / WITHDRAWAL_MAX() * 100
  const tryWithdrawalFee = strategyContract.try_withdrawalFee();
  if (!tryWithdrawalFee.reverted) {
    const withdrawalFee = new VaultFee(
      VaultFeeType.WITHDRAWAL_FEE + "-" + vaultId
    );
    const withdrawalMax = strategyContract.try_WITHDRAWAL_MAX();
    if (!withdrawalMax.reverted) {
      withdrawalFee.feePercentage = tryWithdrawalFee.value
        .toBigDecimal()
        .div(withdrawalMax.value.toBigDecimal())
        .times(BIGDECIMAL_HUNDRED);
    } else {
      withdrawalFee.feePercentage = BIGDECIMAL_ZERO;
    }
    withdrawalFee.feeType = VaultFeeType.WITHDRAWAL_FEE;
    withdrawalFee.save();
    fees.push(withdrawalFee.id);
  }

  // Always a 4.5% performance fee (calculated on harvest)
  const perfFee = new VaultFee(VaultFeeType.PERFORMANCE_FEE + "-" + vaultId);
  perfFee.feePercentage = BigDecimal.fromString("4.5");
  perfFee.feeType = VaultFeeType.PERFORMANCE_FEE;
  perfFee.save();
  fees.push(perfFee.id);

  return fees;
}

export function getOrCreateYieldAggregator(): YieldAggregator {
  let yieldAggregator = YieldAggregator.load(PROTOCOL_ID);

  if (!yieldAggregator) {
    yieldAggregator = new YieldAggregator(PROTOCOL_ID);
    yieldAggregator.name = PROTOCOL_NAME;
    yieldAggregator.slug = PROTOCOL_SLUG;
    yieldAggregator.schemaVersion = PROTOCOL_SCHEMA_VERSION;
    yieldAggregator.subgraphVersion = PROTOCOL_SUBGRAPH_VERSION;
    yieldAggregator.methodologyVersion = PROTOCOL_METHODOLOGY_VERSION;
    yieldAggregator.network = dataSource
      .network()
      .toUpperCase()
      .replace("-", "_");
    yieldAggregator.type = ProtocolType.YIELD;
    yieldAggregator.totalValueLockedUSD = BIGDECIMAL_ZERO;
    yieldAggregator.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    yieldAggregator.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    yieldAggregator.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    yieldAggregator.cumulativeUniqueUsers = BIGINT_ZERO;
    yieldAggregator._vaults = [];
    yieldAggregator.save();
  }

  return yieldAggregator;
}
