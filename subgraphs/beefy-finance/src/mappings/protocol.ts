import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { User, Vault } from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ONE,
  BIGINT_ZERO,
} from "../prices/common/constants";
import {
  getOrCreateYieldAggregator,
  getOrCreateFinancials,
} from "../utils/getters";

export function updateProtocolRevenue(
  newProtocolSideRevenueUSD: BigDecimal,
  newSupplySideRevenueUSD: BigDecimal,
  newTotalRevenueUSD: BigDecimal,
  event: ethereum.Event
): void {
  // update protocol cumulatives
  const protocol = getOrCreateYieldAggregator();
  protocol.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD.plus(newProtocolSideRevenueUSD);
  protocol.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD.plus(newSupplySideRevenueUSD);
  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(newTotalRevenueUSD);
  protocol.save();

  // update snapshot cumulatives and dailys
  const financialDailySnapshot = getOrCreateFinancials(event);

  financialDailySnapshot.dailyProtocolSideRevenueUSD =
    financialDailySnapshot.dailyProtocolSideRevenueUSD.plus(
      newProtocolSideRevenueUSD
    );
  financialDailySnapshot.dailySupplySideRevenueUSD =
    financialDailySnapshot.dailySupplySideRevenueUSD.plus(
      newSupplySideRevenueUSD
    );
  financialDailySnapshot.dailyTotalRevenueUSD =
    financialDailySnapshot.dailyTotalRevenueUSD.plus(newTotalRevenueUSD);

  financialDailySnapshot.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialDailySnapshot.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialDailySnapshot.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;
  financialDailySnapshot.save();
}

export function updateProtocolUsage(event: ethereum.Event): void {
  const protocol = getOrCreateYieldAggregator();
  protocol.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers.plus(
    isNewUser(event.transaction.from)
  );
  protocol.save();
}

// updates the protocol tvl after a vault's tvl has been updated
export function updateProtocolTVL(): BigDecimal {
  const protocol = getOrCreateYieldAggregator();

  let tvlUsd = BIGDECIMAL_ZERO;
  if (protocol._vaults) {
    for (let i = 0; i < protocol._vaults.length; i++) {
      const vault = Vault.load(protocol._vaults[i]);
      if (vault) {
        tvlUsd = tvlUsd.plus(vault.totalValueLockedUSD);
      }
    }
  }

  protocol.totalValueLockedUSD = tvlUsd;
  protocol.save();

  return tvlUsd;
}

/////////////////
//// Helpers ////
/////////////////

function isNewUser(user: Address): BigInt {
  let userEntity = User.load(user.toHexString());
  if (userEntity) {
    return BIGINT_ZERO;
  } else userEntity = new User(user.toHexString());
  userEntity.save();
  return BIGINT_ONE;
}
