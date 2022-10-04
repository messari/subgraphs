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
} from "../../generated/Standard/BeefyStrategy";
import { User, Vault, VaultFee, YieldAggregator } from "../../generated/schema";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ZERO,
  BIGINT_ONE,
  BIGINT_TEN,
  BIGINT_ZERO,
  WHITELIST_TOKENS_MAP,
} from "../prices/common/constants";
import {
  getOrCreateYieldAggregator,
  getOrCreateToken,
  getFees,
} from "../utils/getters";
import {
  updateDailyFinancialSnapshot,
  updateFinancialSnapshotRevenue,
  updateUsageMetricsDailySnapshot,
  updateUsageMetricsHourlySnapshot,
} from "../utils/metrics";

export function updateProtocolRevenue(
  newProtocolSideRevenueUSD: BigDecimal,
  newSupplySideRevenueUSD: BigDecimal,
  newTotalRevenueUSD: BigDecimal,
  event: ethereum.Event
): void {
  const protocol = getOrCreateYieldAggregator();
  protocol.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD.plus(newProtocolSideRevenueUSD);
  protocol.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD.plus(newSupplySideRevenueUSD);
  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(newTotalRevenueUSD);
  protocol.save();

  updateFinancialSnapshotRevenue(
    newProtocolSideRevenueUSD,
    newSupplySideRevenueUSD,
    newTotalRevenueUSD,
    event
  );
}

export function updateProtocolUsage(
  event: ethereum.Event,
  deposit: boolean,
  withdraw: boolean
): void {
  const protocol = getOrCreateYieldAggregator();
  protocol.totalValueLockedUSD = getTvlUsd(protocol);
  protocol.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers.plus(
    isNewUser(event.transaction.from)
  );
  protocol.save();

  updateUsageMetricsDailySnapshot(event, protocol, deposit, withdraw);
  updateUsageMetricsHourlySnapshot(event, protocol, deposit, withdraw);
}

export function updateProtocolRevenueFromWithdraw(
  event: Withdraw,
  vault: Vault,
  withdrawnAmount: BigInt
): void {
  updateProtocolUsage(event, false, true);
  const protocol = getOrCreateYieldAggregator();
  const token = getOrCreateToken(
    Address.fromString(vault.inputToken),
    event.block
  );
  const fees = getFees(
    vault.id,
    BeefyStrategy.bind(Address.fromString(vault._strategyAddress))
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
      protocol.cumulativeProtocolSideRevenueUSD =
        protocol.cumulativeProtocolSideRevenueUSD.plus(revenue);
      protocol.cumulativeTotalRevenueUSD =
        protocol.cumulativeTotalRevenueUSD.plus(revenue);
      protocol.save();
      break;
    }
  }
  updateDailyFinancialSnapshot(event.block, protocol);
}

export function getTvlUsd(protocol: YieldAggregator): BigDecimal {
  let tvlUsd = BIGDECIMAL_ZERO;
  if (protocol._vaults) {
    for (let i = 0; i < protocol._vaults.length; i++) {
      const vault = Vault.load(protocol._vaults[i]);
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
