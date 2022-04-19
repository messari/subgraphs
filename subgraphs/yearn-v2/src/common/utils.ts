import * as constants from "../common/constants";
import { Vault as VaultStore } from "../../generated/schema";
import { ERC20 as ERC20Contract } from "../../generated/Registry_v1/ERC20";
import { BigInt, Address, ethereum, BigDecimal } from "@graphprotocol/graph-ts";
import {
  FinancialsDailySnapshot,
  Token,
  VaultFee,
  YieldAggregator,
} from "../../generated/schema";

export function getTimestampInMillis(block: ethereum.Block): BigInt {
  return block.timestamp.times(BigInt.fromI32(1000));
}

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function getTokenDecimals(tokenAddr: Address): BigInt {
  const token = ERC20Contract.bind(tokenAddr);

  let decimals = readValue<BigInt>(
    token.try_decimals(),
    constants.DEFAULT_DECIMALS
  );

  return decimals;
}

export function getOrCreateYieldAggregator(id: string): YieldAggregator {
  let protocol = YieldAggregator.load(id);

  if (!protocol) {
    protocol = new YieldAggregator(constants.ETHEREUM_PROTOCOL_ID);
    protocol.name = "Yearn v2";
    protocol.slug = "yearn-v2";
    protocol.schemaVersion = "1.0.0";
    protocol.subgraphVersion = "1.0.0";
    protocol.network = constants.Network.ETHEREUM;
    protocol.type = constants.ProtocolType.YIELD;
    protocol._vaultIds = [];
  }

  return protocol;
}

export function getOrCreateToken(address: Address): Token {
  let token = Token.load(address.toHexString());
  if (!token) {
    token = new Token(address.toHexString());

    let erc20Contract = ERC20Contract.bind(address);
    let name = readValue<string>(erc20Contract.try_name(), "");
    let symbol = readValue<string>(erc20Contract.try_symbol(), "");
    let decimals = erc20Contract.try_decimals();

    token.name = name;
    token.symbol = symbol;

    token.decimals = decimals.reverted
      ? (constants.DEFAULT_DECIMALS.toI32() as u8)
      : (decimals.value.toI32() as u8);

    token.save();
  }
  return token as Token;
}

export function createFeeType(
  feeId: string,
  feeType: string,
  feePercentage: BigInt
): void {
  const fees = new VaultFee(feeId);

  fees.feeType = feeType;
  fees.feePercentage = feePercentage
    .toBigDecimal()
    .div(BigDecimal.fromString("100"));

  fees.save();
}

export function getOrCreateFinancialSnapshots(
  financialSnapshotId: string
): FinancialsDailySnapshot {
  let financialMetrics = FinancialsDailySnapshot.load(financialSnapshotId);

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(financialSnapshotId);
    financialMetrics.protocol = constants.ETHEREUM_PROTOCOL_ID;

    financialMetrics.totalRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.totalVolumeUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.supplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.protocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
  }

  return financialMetrics;
}

export function getFeePercentage(
  vaultAddress: string,
  feeType: string
): BigDecimal {
  let feesPercentage: BigDecimal = BigDecimal.fromString("0");
  const vault = VaultStore.load(vaultAddress);

  for (let i = 0; i < vault!.fees.length; i++) {
    const vaultFee = VaultFee.load(vault!.fees[i]);

    if (vaultFee!.feeType == feeType) {
      feesPercentage = vaultFee!.feePercentage;
    }
  }

  return feesPercentage;
}
