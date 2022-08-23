import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
  ethereum,
} from "@graphprotocol/graph-ts";
import {
  BeefyStrategy,
  ChargedFees,
  Withdraw,
} from "../../generated/aave-aave-eol/BeefyStrategy";
import { User, Vault, VaultFee, YieldAggregator } from "../../generated/schema";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ZERO,
  BIGINT_ONE,
  BIGINT_TEN,
  BIGINT_ZERO,
  WHITELIST_TOKENS_MAP,
} from "../prices/common/constants";
import { getBeefyFinanceOrCreate, getTokenOrCreate } from "../utils/getters";
import {
  updateDailyFinancialSnapshot,
  updateUsageMetricsDailySnapshot,
  updateUsageMetricsHourlySnapshot,
} from "../utils/metrics";
import { getFees } from "./vault";

export function updateProtocolUsage(
  event: ethereum.Event,
  vault: Vault,
  deposit: boolean,
  withdraw: boolean
): void {
  const protocol = getBeefyFinanceOrCreate(vault.id);
  protocol.totalValueLockedUSD = getTvlUsd(protocol);
  protocol.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers.plus(
    isNewUser(event.transaction.from)
  );
  protocol.save();

  updateUsageMetricsDailySnapshot(event, protocol, deposit, withdraw);
  updateUsageMetricsHourlySnapshot(event, protocol, deposit, withdraw);
}

export function updateProtocolRevenueFromHarvest(
  event: ethereum.Event,
  amountHarvested: BigInt,
  vault: Vault
): void {
  updateProtocolUsage(event, vault, false, false);
  const protocol = getBeefyFinanceOrCreate(vault.id);
  const token = getTokenOrCreate(
    Address.fromString(vault.inputToken.split("x")[1]),
    event.block
  );
  const transactionRevenue = amountHarvested
    .toBigDecimal()
    .times(token.lastPriceUSD)
    .div(BIGINT_TEN.pow(token.decimals as u8).toBigDecimal());
  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(
    transactionRevenue
  );
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(
    transactionRevenue
  );
  protocol.save();

  vault.fees = getFees(
    vault.id,
    BeefyStrategy.bind(Address.fromString(vault.strategy.split("x")[1]))
  );
  vault.save();

  updateDailyFinancialSnapshot(event.block, protocol);
}

export function updateProtocolRevenueFromChargedFees(
  event: ChargedFees,
  vault: Vault
): void {
  updateProtocolUsage(event, vault, false, false);
  const protocol = getBeefyFinanceOrCreate(vault.id);
  const tokensMap = WHITELIST_TOKENS_MAP.get(dataSource.network());
  const native = tokensMap!.get("WETH")!;
  const token = getTokenOrCreate(native, event.block);
  vault.fees = getFees(
    vault.id,
    BeefyStrategy.bind(Address.fromString(vault.strategy.split("x")[1]))
  );
  vault.save();
  const transactionRevenue = event.params.beefyFees
    .plus(event.params.strategistFees)
    .plus(event.params.callFees)
    .toBigDecimal()
    .times(token.lastPriceUSD)
    .div(BIGINT_TEN.pow(token.decimals as u8).toBigDecimal());
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(
    transactionRevenue
  );
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(
    transactionRevenue
  );
  protocol.save();

  updateDailyFinancialSnapshot(event.block, protocol);
}

export function updateProtocolRevenueFromWithdraw(
  event: Withdraw,
  vault: Vault,
  withdrawnAmount: BigInt
): void {
  updateProtocolUsage(event, vault, false, true);
  const protocol = getBeefyFinanceOrCreate(vault.id);
  const token = getTokenOrCreate(
    Address.fromString(vault.inputToken.split("x")[1]),
    event.block
  );
  const fees = getFees(
    vault.id,
    BeefyStrategy.bind(Address.fromString(vault.strategy.split("x")[1]))
  );
  vault.fees = fees;
  vault.save();
  let fee: VaultFee | null;
  for (let i = 0; i < fees.length; i++) {
    fee = VaultFee.load(fees[i]);
    if (fee && fee.feeType == "WITHDRAWAL_FEE") {
      const revenue = withdrawnAmount
        .toBigDecimal()
        .times(fee.feePercentage)
        .div(BIGDECIMAL_HUNDRED)
        .times(token.lastPriceUSD)
        .div(BIGINT_TEN.pow(token.decimals as u8).toBigDecimal());
      protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(
        revenue
      );
      protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(
        revenue
      );
      protocol.save();
      break;
    }
  }
  updateDailyFinancialSnapshot(event.block, protocol);
}

export function getTvlUsd(protocol: YieldAggregator): BigDecimal {
  let tvlUsd = BIGDECIMAL_ZERO;
  if (protocol.vaults) {
    for (let i = 0; i < protocol.vaults.length; i++) {
      const vault = Vault.load(protocol.vaults[i]);
      if (vault) {
        tvlUsd = tvlUsd.plus(vault.totalValueLockedUSD);
      }
    }
  }
  return tvlUsd;
}

function isNewUser(user: Address): BigInt {
  let userEntity = User.load(user.toHexString());
  if (userEntity) {
    return BIGINT_ZERO;
  } else userEntity = new User(user.toHexString());
  userEntity.save();
  return BIGINT_ONE;
}
