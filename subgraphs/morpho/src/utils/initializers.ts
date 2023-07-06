import { Address, BigDecimal, Bytes, log } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/Morpho/ERC20";
import {
  Token,
  LendingProtocol,
  Market,
  _MarketList,
  RewardToken,
} from "../../generated/schema";
import { ProtocolType, getProtocolData } from "../constants";
import { Versions } from "../versions";

export const getOrInitToken = (tokenAddress: Bytes): Token => {
  let token = Token.load(tokenAddress);
  if (!token) {
    token = new Token(tokenAddress);
    const erc20 = ERC20.bind(Address.fromBytes(tokenAddress));
    token.name = erc20.name();
    token.symbol = erc20.symbol();
    token.decimals = erc20.decimals();
    token.lastPriceUSD = BigDecimal.zero();
    token.save();
  }
  return token;
};

export function getOrCreateRewardToken(
  tokenAddress: Address,
  side: string
): RewardToken {
  const token = getOrInitToken(tokenAddress);
  const rewardTokenID = token.id.toHexString().concat("-").concat(side);
  let rewardToken = RewardToken.load(rewardTokenID);
  if (!rewardToken) {
    rewardToken = new RewardToken(rewardTokenID);
    rewardToken.token = token.id;
    rewardToken.type = side;
    rewardToken.save();
  }

  return rewardToken;
}

export class MorphoProtocol {
  constructor(
    public readonly protocol: LendingProtocol,
    public readonly isNew: boolean
  ) {}
}

export const getOrInitLendingProtocol = (
  protocolAddress: Address
): MorphoProtocol => {
  let protocol = LendingProtocol.load(protocolAddress);
  let isNew = false;
  if (!protocol) {
    isNew = true;
    protocol = new LendingProtocol(protocolAddress);
    const data = getProtocolData(protocolAddress);

    protocol.name = data.name;
    protocol.slug = data.slug;
    protocol.protocol = data.protocol;
    protocol.network = data.network;
    protocol.type = ProtocolType.LENDING;
    protocol.lendingType = data.lendingType;
    protocol.lenderPermissionType = data.lenderPermissionType;
    protocol.borrowerPermissionType = data.borrowerPermissionType;
    protocol.poolCreatorPermissionType = data.poolCreatorPermissionType;
    protocol.collateralizationType = data.collateralizationType;
    protocol.riskType = data.riskType;

    protocol.cumulativeUniqueUsers = 0 as i32;
    protocol.cumulativeUniqueDepositors = 0 as i32;
    protocol.cumulativeUniqueBorrowers = 0 as i32;
    protocol.cumulativeUniqueLiquidators = 0 as i32;
    protocol.cumulativeUniqueLiquidatees = 0 as i32;

    protocol.totalValueLockedUSD = BigDecimal.zero();

    protocol.cumulativeSupplySideRevenueUSD = BigDecimal.zero();
    protocol.cumulativeProtocolSideRevenueUSD = BigDecimal.zero();
    protocol.cumulativeTotalRevenueUSD = BigDecimal.zero();

    protocol.totalDepositBalanceUSD = BigDecimal.zero();
    protocol.cumulativeDepositUSD = BigDecimal.zero();
    protocol.totalBorrowBalanceUSD = BigDecimal.zero();
    protocol.cumulativeBorrowUSD = BigDecimal.zero();
    protocol.cumulativeLiquidateUSD = BigDecimal.zero();

    protocol.totalPoolCount = 0 as i32;
    protocol.openPositionCount = 0 as i32;
    protocol.cumulativePositionCount = 0 as i32;
    protocol.transactionCount = 0 as i32;
    protocol.depositCount = 0 as i32;
    protocol.withdrawCount = 0 as i32;
    protocol.borrowCount = 0 as i32;
    protocol.repayCount = 0 as i32;
    protocol.liquidationCount = 0 as i32;

    // There is no transfer or flashloan event in Morpho.
    protocol.transferCount = 0 as i32;
    protocol.flashloanCount = 0 as i32;
  }

  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();
  protocol.save();

  return new MorphoProtocol(protocol, isNew);
};

export const getOrInitMarketList = (protocolAddress: Address): _MarketList => {
  let protocol = _MarketList.load(protocolAddress);
  if (!protocol) {
    protocol = new _MarketList(protocolAddress);
    protocol.markets = [];
    protocol.save();
  }
  return protocol;
};

// ###############################
// ##### Market-Level Metadata ###
// ###############################

export const getMarket = (marketAddress: Bytes): Market => {
  const market = Market.load(marketAddress);
  if (!market) {
    // The event "MarketCreated" creates directly the market entity
    log.critical("Market not found: {}", [marketAddress.toHexString()]);
    return new Market(marketAddress);
  }
  return market;
};
