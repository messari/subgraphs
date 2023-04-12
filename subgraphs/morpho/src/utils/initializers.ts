import { Address, BigDecimal, Bytes, log } from "@graphprotocol/graph-ts";

import { ERC20 } from "../../generated/MorphoAaveV2/ERC20";
import { LendingPool } from "../../generated/MorphoAaveV2/LendingPool";
import { LendingPoolAddressesProvider } from "../../generated/MorphoAaveV2/LendingPoolAddressesProvider";
import { MorphoAaveV2 } from "../../generated/MorphoAaveV2/MorphoAaveV2";
import { MorphoCompound } from "../../generated/MorphoCompound/MorphoCompound";
import {
  Token,
  LendingProtocol,
  Market,
  _MarketList,
} from "../../generated/schema";
import {
  Comptroller,
  LendingPool as LendingPoolTemplate,
} from "../../generated/templates";
import { LendingPoolConfigurator as LendingPoolConfiguratorTemplate } from "../../generated/templates";
import { MORPHO_AAVE_V2_ADDRESS, MORPHO_COMPOUND_ADDRESS } from "../constants";

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

export const getOrInitLendingProtocol = (
  protocolAddress: Address
): LendingProtocol => {
  let protocol = LendingProtocol.load(protocolAddress);
  if (!protocol) {
    protocol = new LendingProtocol(protocolAddress);

    if (protocolAddress.equals(MORPHO_AAVE_V2_ADDRESS)) {
      const morpho = MorphoAaveV2.bind(protocolAddress);
      const lendingPool = LendingPool.bind(morpho.pool());
      LendingPoolTemplate.create(lendingPool._address);
      const addressesProvider = LendingPoolAddressesProvider.bind(
        morpho.addressesProvider()
      );
      LendingPoolConfiguratorTemplate.create(
        addressesProvider.getLendingPoolConfigurator()
      );
      protocol.name = "Morpho Aave V2";
      protocol.slug = "morpho-aave-v2";
      protocol.schemaVersion = "0.0.5";
      protocol.subgraphVersion = "0.0.5";
      protocol.methodologyVersion = "0.0.5";
      const defaultMaxGas = morpho.defaultMaxGasForMatching();
      protocol.defaultMaxGasForMatchingSupply = defaultMaxGas.getSupply();
      protocol.defaultMaxGasForMatchingBorrow = defaultMaxGas.getBorrow();
      protocol.defaultMaxGasForMatchingWithdraw = defaultMaxGas.getWithdraw();
      protocol.defaultMaxGasForMatchingRepay = defaultMaxGas.getRepay();

      protocol.maxSortedUsers = morpho.maxSortedUsers();

      protocol.owner = morpho.owner();
    } else if (protocolAddress.equals(MORPHO_COMPOUND_ADDRESS)) {
      const morpho = MorphoCompound.bind(protocolAddress);
      Comptroller.create(morpho.comptroller());

      protocol.name = "Morpho Compound";
      protocol.slug = "morpho-compound";
      protocol.schemaVersion = "0.0.5";
      protocol.subgraphVersion = "0.0.5";
      protocol.methodologyVersion = "0.0.5";
      const defaultMaxGas = morpho.defaultMaxGasForMatching();
      protocol.defaultMaxGasForMatchingSupply = defaultMaxGas.getSupply();
      protocol.defaultMaxGasForMatchingBorrow = defaultMaxGas.getBorrow();
      protocol.defaultMaxGasForMatchingWithdraw = defaultMaxGas.getWithdraw();
      protocol.defaultMaxGasForMatchingRepay = defaultMaxGas.getRepay();

      protocol.maxSortedUsers = morpho.maxSortedUsers();

      protocol.owner = morpho.owner();
    } else {
      log.critical("Unknown protocol address: {}", [
        protocolAddress.toHexString(),
      ]);
      return new LendingProtocol(Bytes.fromHexString("0x0"));
    }
    protocol.protocol = "Morpho";
    protocol.network = "MAINNET";
    protocol.type = "LENDING";
    protocol.lendingType = "CDP";
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

    // Morpho specific

    protocol.save();
  }
  return protocol;
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
// ##### Market-Level Metadata #####
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
