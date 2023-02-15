import {
  getOrCreateYieldAggregator,
  getOrCreateVault,
  getOrCreateToken,
} from "./initializers";
import * as constants from "./constants";
import { Vault } from "../../generated/schema";
import { BigInt, Address, ethereum, BigDecimal } from "@graphprotocol/graph-ts";
import { RibbonThetaVaultWithSwap as VaultContract } from "../../generated/templates/LiquidityGauge/RibbonThetaVaultWithSwap";

export function equalsIgnoreCase(a: string, b: string): boolean {
  return a.replace("-", "_").toLowerCase() == b.replace("-", "_").toLowerCase();
}

export function enumToPrefix(snake: string): string {
  return snake.toLowerCase().replace("_", "-") + "-";
}

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function getVaultBalance(
  vaultAddress: Address,
  decimals: number
): BigDecimal {
  const vaultContract = VaultContract.bind(vaultAddress);

  const vaultBalance = bigIntToBigDecimal(
    readValue<BigInt>(vaultContract.try_totalBalance(), constants.BIGINT_ZERO),
    decimals
  );

  return vaultBalance;
}

export function updateProtocolAfterNewVault(vaultAddress: Address): void {
  const protocol = getOrCreateYieldAggregator();
  const vaultIds = protocol._vaultIds;
  vaultIds!.push(vaultAddress.toHexString());
  protocol._vaultIds = vaultIds;
  protocol.totalPoolCount += 1;
  protocol.save();
}

export function updateProtocolTotalValueLockedUSD(): void {
  const protocol = getOrCreateYieldAggregator();

  const vaultIds = protocol._vaultIds!;
  let totalValueLockedUSD = constants.BIGDECIMAL_ZERO;

  for (let vaultIdx = 0; vaultIdx < vaultIds.length; vaultIdx++) {
    const vault = Vault.load(vaultIds[vaultIdx]);

    if (!vault) continue;

    totalValueLockedUSD = totalValueLockedUSD.plus(vault.totalValueLockedUSD);
  }
  protocol.totalValueLockedUSD = totalValueLockedUSD;
  protocol.save();
}

export function getVaultPricePerShare(vaultAddress: Address): BigDecimal {
  const vaultContract = VaultContract.bind(vaultAddress);
  const vaultDecimals = readValue(vaultContract.try_decimals(), 18);

  const vaultPricePerShare = readValue(
    vaultContract.try_pricePerShare(),
    constants.BIGINT_ZERO
  ).toBigDecimal();

  if (vaultPricePerShare.notEqual(constants.BIGDECIMAL_ZERO))
    return vaultPricePerShare;

  const totalTokensDeposits = bigIntToBigDecimal(
    readValue(vaultContract.try_totalBalance(), constants.BIGINT_ZERO),
    vaultDecimals
  );

  const totalSupply = bigIntToBigDecimal(
    readValue(vaultContract.try_totalSupply(), constants.BIGINT_ZERO),
    vaultDecimals
  );

  const pricePerShare = totalTokensDeposits
    .times(constants.BIGINT_TEN.pow(vaultDecimals as u8).toBigDecimal())
    .div(totalSupply);

  return pricePerShare;
}

export function getOutputTokenPriceUSD(
  vaultAddress: Address,
  block: ethereum.Block
): BigDecimal {
  const vaultContract = VaultContract.bind(vaultAddress);

  const vaultDecimals = readValue(vaultContract.try_decimals(), 18);
  let asset = readValue<Address>(
    vaultContract.try_asset(),
    constants.NULL.TYPE_ADDRESS
  );
  if (asset.equals(constants.NULL.TYPE_ADDRESS)) {
    const vaultParams = vaultContract.try_vaultParams();
    if (!vaultParams.reverted) {
      asset = vaultParams.value.getAsset();
    }
    if (asset.equals(constants.NULL.TYPE_ADDRESS)) {
      const vaultParamsEarnVault = vaultContract.try_vaultParams1();
      if (!vaultParamsEarnVault.reverted) {
        asset = vaultParamsEarnVault.value.getAsset();
      }
    }
  }
  const inputToken = getOrCreateToken(asset, block, vaultAddress);

  const vaultTotalBalance = bigIntToBigDecimal(
    readValue(vaultContract.try_totalBalance(), constants.BIGINT_ZERO),
    vaultDecimals
  );

  const vaultTVL = vaultTotalBalance.times(inputToken.lastPriceUSD!);

  const vaultTotalSupply = bigIntToBigDecimal(
    readValue(vaultContract.try_totalSupply(), constants.BIGINT_ZERO),
    vaultDecimals
  );
  if (vaultTotalSupply.equals(constants.BIGDECIMAL_ZERO))
    return constants.BIGDECIMAL_ZERO;
  const outputTokenPriceUSD = vaultTVL.div(vaultTotalSupply);

  return outputTokenPriceUSD;
}

export function getOutputTokenSupply(
  vaultAddress: Address,
  block: ethereum.Block
): BigInt {
  const vault = getOrCreateVault(vaultAddress, block);
  if (!vault.outputToken) return constants.BIGINT_ZERO;

  const vaultContract = VaultContract.bind(vaultAddress);

  const outputTokenSupply = readValue<BigInt>(
    vaultContract.try_totalSupply(),
    constants.BIGINT_ZERO
  );

  return outputTokenSupply;
}

export function bigIntToBigDecimal(
  bigInt: BigInt,
  decimals: number
): BigDecimal {
  return bigInt.divDecimal(
    constants.BIGINT_TEN.pow(decimals as u8).toBigDecimal()
  );
}
