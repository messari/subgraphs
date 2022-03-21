import { Address, BigDecimal, BigInt, dataSource } from '@graphprotocol/graph-ts';
import { LendingProtocol, Market } from '../../generated/schema';

export function getOrCreateMarket(id: Address, timestamp: BigInt, block: BigInt): Market {
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
  market.createdTimestamp = timestamp;
  market.createdBlockNumber = block;
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

export function getOrCreateProtocol(id: Address): LendingProtocol {
  let protocol = LendingProtocol.load(id.toHex());

  if (protocol) {
    return protocol;
  }

  protocol = new LendingProtocol(id.toHex());

  // TODO: values to verify
  protocol.name = 'Badger';
  protocol.slug = 'badger';
  protocol.network = dataSource.network().toUpperCase();
  protocol.type = 'LENDING';
  protocol.usageMetrics = [];
  protocol.financialMetrics = [];
  protocol.markets = [];
  protocol.lendingType = 'POOLED';
  protocol.riskType = 'GLOBAL';

  return protocol;
}
