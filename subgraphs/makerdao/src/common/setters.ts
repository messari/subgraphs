import { Address, Bytes, BigInt } from "@graphprotocol/graph-ts";
import { Market, _Ilk } from "../../generated/schema";
import { getOrCreateLendingProtocol, getOrCreateToken } from "./getters";
import { BIGDECIMAL_ZERO, BIGDECIMAL_ONE, BIGINT_ZERO, DAI } from "../common/constants";

export function updateProtocolMarketList(marketAddress: string): void {
  let protocol = getOrCreateLendingProtocol();
  let marketIdList = protocol.marketIdList;
  marketIdList.push(marketAddress);
  protocol.marketIdList = marketIdList;
  protocol.save();
}

function createIlk(ilkBytes: Bytes, marketAddress: Address): void {
  let ilk = new _Ilk(ilkBytes.toString());
  ilk.marketAddress = marketAddress.toHexString();
  ilk.save();
}

export function createMarket(
  ilk: Bytes,
  gemAddress: Address,
  marketAddress: Address,
  blockNumber: BigInt,
  blockTimestamp: BigInt,
): void {
  createIlk(ilk, marketAddress);
  let MarketEntity = new Market(marketAddress.toHexString());
  let inputToken = getOrCreateToken(gemAddress);
  MarketEntity.protocol = getOrCreateLendingProtocol().id;
  MarketEntity.inputTokens = [inputToken.id];
  MarketEntity.totalValueLockedUSD = BIGDECIMAL_ZERO;
  MarketEntity.inputTokenBalances = [BIGINT_ZERO];
  MarketEntity.outputToken = getOrCreateToken(Address.fromString(DAI)).id;
  MarketEntity.outputTokenSupply = BIGINT_ZERO;
  MarketEntity.outputTokenPriceUSD = BIGDECIMAL_ONE;
  MarketEntity.totalBorrowUSD = BIGDECIMAL_ZERO;
  MarketEntity.totalDepositUSD = BIGDECIMAL_ZERO;
  MarketEntity.createdTimestamp = blockTimestamp;
  MarketEntity.createdBlockNumber = blockNumber;
  MarketEntity.name = ilk.toString();
  MarketEntity.isActive = true;
  MarketEntity.canUseAsCollateral = true;
  MarketEntity.canBorrowFrom = true;
  MarketEntity.maximumLTV = BIGDECIMAL_ZERO;
  MarketEntity.liquidationThreshold = BIGDECIMAL_ZERO;
  MarketEntity.liquidationPenalty = BIGDECIMAL_ZERO;
  MarketEntity.stableBorrowRate = BIGDECIMAL_ZERO;
  MarketEntity.depositRate = BIGDECIMAL_ZERO;
  MarketEntity.variableBorrowRate = BIGDECIMAL_ZERO;
  MarketEntity.save();
  updateProtocolMarketList(marketAddress.toHexString());
}
