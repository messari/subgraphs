import {
  BigInt,
  Address,
  ethereum,
  TypedMap,
  BigDecimal,
  dataSource,
} from "@graphprotocol/graph-ts";
import * as constants from "./constants";
import { Vault } from "../../generated/schema";
import { ERC20 as ERC20Contract } from "../../generated/ETHCallV2/ERC20";

import {
  getOrCreateYieldAggregator,
  getOrCreateVault,
  getOrCreateToken,
} from "./initalizers";
import { RibbonThetaVaultWithSwap as VaultContract } from "../../generated/ETHCallV2/RibbonThetaVaultWithSwap";

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

  const vaultBalance = readValue<BigInt>(
    vaultContract.try_totalBalance(),
    constants.BIGINT_ZERO
  ).divDecimal(constants.BIGINT_TEN.pow(decimals as u8).toBigDecimal());
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

export function getTokenDecimals(tokenAddr: Address): BigDecimal {
  const token = ERC20Contract.bind(tokenAddr);

  const decimals = readValue<number>(
    token.try_decimals(),
    constants.DEFAULT_DECIMALS.toI64()
  );

  return constants.BIGINT_TEN.pow(decimals as u8).toBigDecimal();
}

export function getVaultPricePerShare(vaultAddress: Address): BigDecimal {
  const vaultContract = VaultContract.bind(vaultAddress);
  const vaultDecimals = readValue(vaultContract.try_decimals(), 18);

  const vaultPricePerShare = readValue(
    vaultContract.try_pricePerShare(),
    constants.BIGINT_ZERO
  ).divDecimal(constants.BIGINT_TEN.pow(vaultDecimals as u8).toBigDecimal());

  if (vaultPricePerShare.notEqual(constants.BIGDECIMAL_ZERO))
    return vaultPricePerShare;

  const totalTokensDeposits = readValue(
    vaultContract.try_totalBalance(),
    constants.BIGINT_ZERO
  ).divDecimal(constants.BIGINT_TEN.pow(vaultDecimals as u8).toBigDecimal());

  const totalOptions = readValue(
    vaultContract.try_totalSupply(),
    constants.BIGINT_ZERO
  ).divDecimal(constants.BIGINT_TEN.pow(vaultDecimals as u8).toBigDecimal());

  const pricePerShare = totalTokensDeposits.div(totalOptions);

  return pricePerShare;
}

export function getOptionTokenPriceUSD(
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

  const vaultTotalBalance = readValue(
    vaultContract.try_totalSupply(),
    constants.BIGINT_ZERO
  ).divDecimal(constants.BIGINT_TEN.pow(vaultDecimals as u8).toBigDecimal());

  const vaultTVL = vaultTotalBalance.times(inputToken.lastPriceUSD!);

  const vaultTotalSupply = readValue(
    vaultContract.try_totalSupply(),
    constants.BIGINT_ZERO
  ).divDecimal(constants.BIGINT_TEN.pow(vaultDecimals as u8).toBigDecimal());
  if (vaultTotalSupply.equals(constants.BIGDECIMAL_ZERO))
    return constants.BIGDECIMAL_ZERO;
  const outputTokenPriceUSD = vaultTVL.div(vaultTotalSupply);

  return outputTokenPriceUSD;
}

export function getLiquidityGaugePoolsMap(): TypedMap<string, string> {
  const gaugeMap = new TypedMap<string, string>();

  if (dataSource.network() == "mainnet") {
    // Yearn ETH Put
    gaugeMap.set(
      "0xa8a9699161f266f7e79080ca0b65210820be8732",
      "0xcc323557c71c0d1d20a1861dc69c06c5f3cc9624"
    );
    // AAVE Call
    gaugeMap.set(
      "0x98c371567b8a196518dcb4a4383387a2c7339382",
      "0xe63151a0ed4e5fafdc951d877102cf0977abd365"
    );
    // stETH Call
    gaugeMap.set(
      "0x4e079dca26a4fe2586928c1319b20b1bf9f9be72",
      "0x53773e034d9784153471813dacaff53dbbb78e8c"
    );
    // ETH Call
    gaugeMap.set(
      "0x9038403c3f7c6b5ca361c82448daa48780d7c8bd",
      "0x25751853eab4d0eb3652b5eb6ecb102a2789644b"
    );
    // WBTC Call
    gaugeMap.set(
      "0x8913eab16a302de3e498bba39940e7a55c0b9325",
      "0x65a833afdc250d9d38f8cd9bc2b1e3132db13b2f"
    );
    // RETH Call
    gaugeMap.set(
      "0x4ba4afa8071b0a9fe3097700cdade02dd0e16fd0",
      "0xa1da0580fa96129e753d736a5901c31df5ec5edf"
    );
    // REARN
    gaugeMap.set(
      "0x9674126ff31e5ece36de0cf03a49351a7c814587",
      "0x84c2b16fa6877a8ff4f3271db7ea837233dfd6f0"
    );
  } else if (dataSource.network() == "kovan") {
    // ETH Put
    gaugeMap.set(
      "0xb8a058dd5e4652abfe7b7ad370777fdf800dffd8",
      "0xec1c50724cf7a618c6cda6cfea5c9064afc98e84"
    );
    // ETH Call
    gaugeMap.set(
      "0xac4495454a564731c085a5fcc522da1f0bdd69d4",
      "0xfaef8534a499d1a67cf83b7decbcc27bd49decfd"
    );
    // WBTC Call
    gaugeMap.set(
      "0x25938400ea02bb60432af0dbb7dfb87f7a20183f",
      "0x895d2ea2ef2c9f4a3c458ccd7c588f8f102118e6"
    );
  }

  return gaugeMap;
}

export function searchLiquidityGaugePoolsVaultAddress(
  liquidityGaugeAddress: Address
): Address {
  const addressMap = getLiquidityGaugePoolsMap();

  return Address.fromString(
    addressMap.get(liquidityGaugeAddress.toHexString()) as string
  );
}

export function getOutputTokenSupply(
  vaultAddress: Address,
  block: ethereum.Block
): BigInt {
  const vault = getOrCreateVault(vaultAddress, block);
  if (!vault.outputToken) return constants.BIGINT_ZERO;

  // const outputTokenAddress = Address.fromString(vault.outputToken!);
  // const OTokenContract = Otoken.bind(outputTokenAddress);
  const vaultContract = VaultContract.bind(vaultAddress);

  const outputTokenSupply = readValue<BigInt>(
    vaultContract.try_totalSupply(),
    constants.BIGINT_ZERO
  );

  // if (!outputTokenSupply.equals(constants.BIGINT_ZERO)) return outputTokenSupply;
  // const OptionTokenV1 = OptionsContractV1.bind(outputTokenAddress);
  // outputTokenSupply = readValue<BigInt>(OptionTokenV1.try_totalSupply(), constants.BIGINT_ZERO);

  return outputTokenSupply;
}
