import { Address, BigDecimal, dataSource, ethereum } from '@graphprotocol/graph-ts';
import { LendingProtocol, Market } from '../../generated/schema';
import {
  PROTOCOL_ID,
  PROTOCOL_LENDING_TYPE,
  PROTOCOL_NAME,
  PROTOCOL_RISK_TYPE,
  PROTOCOL_SLUG,
  PROTOCOL_TYPE,
} from '../constant';

export function getOrCreateMarket(id: Address, block: ethereum.Block): Market {
  let market = Market.load(id.toHex());

  if (market) {
    return market;
  }

  market = new Market(id.toHex());

  market.protocol = '';
  market.inputTokens = [];
  market.outputToken = '';
  market.rewardTokens = [];
  market.totalValueLockedUSD = BigDecimal.zero();
  market.totalVolumeUSD = BigDecimal.zero();
  market.inputTokenBalances = [];
  market.outputTokenSupply = BigDecimal.zero();
  market.outputTokenPriceUSD = BigDecimal.zero();
  market.createdTimestamp = block.timestamp;
  market.createdBlockNumber = block.number;
  market.snapshots = [];
  market.name = '';
  market.isActive = false;
  market.canUseAsCollateral = false;
  market.canBorrowFrom = false;
  market.maximumLTV = BigDecimal.zero();
  market.liquidationThreshold = BigDecimal.zero();
  market.liquidationPenalty = BigDecimal.zero();
  market.depositRate = BigDecimal.zero();
  market.stableBorrowRate = BigDecimal.zero();
  market.variableBorrowRate = BigDecimal.zero();
  market.deposits = [];
  market.withdraws = [];
  market.borrows = [];
  market.repays = [];
  market.liquidations = [];
  market.save();

  return market;
}

export function getOrCreateProtocol(): LendingProtocol {
  const id = PROTOCOL_ID.toHex();
  let protocol = LendingProtocol.load(id);

  if (protocol) {
    return protocol;
  }

  protocol = new LendingProtocol(id);

  // TODO: values to verify
  protocol.name = PROTOCOL_NAME;
  protocol.slug = PROTOCOL_SLUG;
  protocol.network = dataSource.network().toUpperCase();
  protocol.type = PROTOCOL_TYPE;
  protocol.usageMetrics = [];
  protocol.financialMetrics = [];
  protocol.markets = [];
  protocol.lendingType = PROTOCOL_LENDING_TYPE;
  protocol.riskType = PROTOCOL_RISK_TYPE;

  return protocol;
}
