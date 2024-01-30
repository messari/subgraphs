import { Address, dataSource, log } from "@graphprotocol/graph-ts";
import {
  Token,
  LendingProtocol,
  Market,
  InterestRate,
  LiquidateProxy,
  _ActivityHelper,
} from "../../generated/schema";
import { LogRepay } from "../../generated/templates/Cauldron/Cauldron";
import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from "./tokens";
import {
  BIGDECIMAL_ZERO,
  Network,
  ProtocolType,
  LendingType,
  BIGINT_ONE,
  ETH_NETWORK,
  BENTOBOX_ADDRESS_MAINNET,
  AVALANCHE_NETWORK,
  BENTOBOX_ADDRESS_AVALANCHE,
  BSC_NETWORK,
  BENTOBOX_ADDRESS_BSC,
  ARB_NETWORK,
  BENTOBOX_ADDRESS_ARBITRUM,
  FTM_NETWORK,
  BENTOBOX_ADDRESS_FANTOM,
  MIM_MAINNET,
  MIM_AVALANCHE,
  MIM_ARBITRUM,
  MIM_FANTOM,
  MIM_BSC,
  STAKED_SPELL_MAINNET,
  STAKED_SPELL_AVALANCHE,
  STAKED_SPELL_FANTOM,
  STAKED_SPELL_ARBITRUM,
  InterestRateSide,
  InterestRateType,
  BIGDECIMAL_ONE,
  BIGINT_ZERO,
  DEGENBOX_ADDRESS_MAINNET,
  DEGENBOX_ADDRESS_AVALANCHE,
  DEGENBOX_ADDRESS_ARBITRUM,
  DEGENBOX_ADDRESS_FANTOM,
  DEGENBOX_ADDRESS_BSC,
  RiskType,
  USD_BTC_ETH_ABRA_ADDRESS,
  DEFAULT_DECIMALS,
} from "./constants";
import { Versions } from "../versions";

export function getOrCreateToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString());
  // fetch info if null
  if (!token) {
    token = new Token(tokenAddress.toHexString());
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.name = fetchTokenName(tokenAddress);
    if (tokenAddress == Address.fromString(USD_BTC_ETH_ABRA_ADDRESS)) {
      token.decimals = DEFAULT_DECIMALS;
    } else {
      token.decimals = fetchTokenDecimals(tokenAddress);
    }

    token.lastPriceUSD =
      tokenAddress == Address.fromString(getMIMAddress(dataSource.network()))
        ? BIGDECIMAL_ONE
        : BIGDECIMAL_ZERO;
    token.lastPriceBlockNumber = BIGINT_ZERO;
    token.save();
  }
  return token;
}

////////////////////////////
///// Lending Specific /////
///////////////////////////

export function getOrCreateLendingProtocol(): LendingProtocol {
  let protocol = LendingProtocol.load(getBentoBoxAddress(dataSource.network()));
  if (protocol) {
    return protocol;
  }
  protocol = new LendingProtocol(getBentoBoxAddress(dataSource.network()));
  protocol.name = "Abracadabra Money";
  protocol.slug = "abracadabra";
  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();
  if (dataSource.network() == ARB_NETWORK) {
    protocol.network = Network.ARBITRUM_ONE;
  } else {
    protocol.network = getNetwork(dataSource.network());
  }
  protocol.type = ProtocolType.LENDING;
  protocol.riskType = RiskType.ISOLATED;
  protocol.cumulativeUniqueUsers = 0;
  protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
  protocol.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
  protocol.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
  protocol.lendingType = LendingType.CDP;
  protocol.mintedTokens = [getMIMAddress(dataSource.network())];
  protocol.totalPoolCount = 0;

  protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
  protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
  protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
  protocol.cumulativeDepositUSD = BIGDECIMAL_ZERO;
  protocol.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
  protocol.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
  protocol.cumulativeWithdrawUSD = BIGDECIMAL_ZERO;
  protocol.cumulativeRepayUSD = BIGDECIMAL_ZERO;
  protocol.protocolControlledValueUSD = BIGDECIMAL_ZERO;
  protocol.marketIDList = [];
  protocol.cumulativeUniqueDepositors = 0;
  protocol.cumulativeUniqueBorrowers = 0;
  protocol.cumulativeUniqueLiquidators = 0;
  protocol.cumulativeUniqueLiquidatees = 0;
  protocol.openPositionCount = 0;
  protocol.cumulativePositionCount = 0;
  protocol._lastDailySnapshotTimestamp = BIGINT_ZERO;
  protocol._lastHourlySnapshotTimestamp = BIGINT_ZERO;

  protocol.save();
  return protocol;
}

export function getMarket(marketId: string): Market | null {
  const market = Market.load(marketId);
  if (market) {
    return market;
  }
  log.error("Cannot find market: {}", [marketId]);
  return null;
}

///////////////////////////
///////// Helpers /////////
///////////////////////////

export function getLiquidateEvent(event: LogRepay): LiquidateProxy | null {
  const liquidateEvent = LiquidateProxy.load(
    "liquidate-" +
      event.transaction.hash.toHexString() +
      "-" +
      event.transactionLogIndex.minus(BIGINT_ONE).toString()
  );
  if (liquidateEvent) {
    return liquidateEvent;
  }
  return null;
}

export function getBentoBoxAddress(network: string): string {
  if (network == ETH_NETWORK) {
    return BENTOBOX_ADDRESS_MAINNET;
  } else if (network == AVALANCHE_NETWORK) {
    return BENTOBOX_ADDRESS_AVALANCHE;
  } else if (network == ARB_NETWORK) {
    return BENTOBOX_ADDRESS_ARBITRUM;
  } else if (network == FTM_NETWORK) {
    return BENTOBOX_ADDRESS_FANTOM;
  } else if (network == BSC_NETWORK) {
    return BENTOBOX_ADDRESS_BSC;
  }
  return "";
}

export function getDegenBoxAddress(network: string): string {
  if (network == ETH_NETWORK) {
    return DEGENBOX_ADDRESS_MAINNET;
  } else if (network == AVALANCHE_NETWORK) {
    return DEGENBOX_ADDRESS_AVALANCHE;
  } else if (network == ARB_NETWORK) {
    return DEGENBOX_ADDRESS_ARBITRUM;
  } else if (network == FTM_NETWORK) {
    return DEGENBOX_ADDRESS_FANTOM;
  } else if (network == BSC_NETWORK) {
    return DEGENBOX_ADDRESS_BSC;
  }
  return "";
}

export function getMIMAddress(network: string): string {
  if (network == ETH_NETWORK) {
    return MIM_MAINNET;
  } else if (network == AVALANCHE_NETWORK) {
    return MIM_AVALANCHE;
  } else if (network == ARB_NETWORK) {
    return MIM_ARBITRUM;
  } else if (network == FTM_NETWORK) {
    return MIM_FANTOM;
  } else if (network == BSC_NETWORK) {
    return MIM_BSC;
  }
  return "";
}

export function getStakedSpellAddress(network: string): string {
  if (network == ETH_NETWORK) {
    return STAKED_SPELL_MAINNET;
  } else if (network == AVALANCHE_NETWORK) {
    return STAKED_SPELL_AVALANCHE;
  } else if (network == ARB_NETWORK) {
    return STAKED_SPELL_ARBITRUM;
  } else if (network == FTM_NETWORK) {
    return STAKED_SPELL_FANTOM;
  }
  return "";
}

export function getNetwork(network: string): string {
  if (network == ETH_NETWORK) {
    return Network.MAINNET;
  } else if (network == AVALANCHE_NETWORK) {
    return Network.AVALANCHE;
  } else if (network == ARB_NETWORK) {
    return Network.ARBITRUM_ONE;
  } else if (network == FTM_NETWORK) {
    return Network.FANTOM;
  } else if (network == BSC_NETWORK) {
    return Network.BSC;
  }
  return "";
}

export function getOrCreateInterestRate(marketAddress: string): InterestRate {
  let interestRate = InterestRate.load("BORROWER-" + "STABLE-" + marketAddress);
  if (interestRate) {
    return interestRate;
  }
  interestRate = new InterestRate("BORROWER-" + "STABLE-" + marketAddress);
  interestRate.side = InterestRateSide.BORROW;
  interestRate.type = InterestRateType.STABLE;
  interestRate.rate = BIGDECIMAL_ONE;
  interestRate.save();
  return interestRate;
}

export function getOrCreateActivityHelper(id: string): _ActivityHelper {
  let activity = _ActivityHelper.load(id);

  if (!activity) {
    activity = new _ActivityHelper(id);

    activity.activeUsers = 0;
    activity.activeDepositors = 0;
    activity.activeBorrowers = 0;
    activity.activeLiquidators = 0;
    activity.activeLiquidatees = 0;

    activity.transactionCount = 0;
    activity.depositCount = 0;
    activity.withdrawCount = 0;
    activity.liquidateCount = 0;
    activity.borrowCount = 0;
    activity.repayCount = 0;

    activity.save();
  }

  return activity;
}
