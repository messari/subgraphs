import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import { getUsdPrice, getUsdPricePerToken } from "../prices";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigDecimalToBigInt, bigIntToBigDecimal } from "../sdk/util/numbers";
import { ETH_ADDRESS, INT_ZERO } from "../sdk/util/constants";

import { Token } from "../../generated/schema";
import { _ERC20 } from "../../generated/CoreProxy/_ERC20";
import {
  Deposited,
  Withdrawn,
  CollateralConfigured,
  Liquidation,
  MarketRegistered,
  PoolCreated,
} from "../../generated/CoreProxy/CoreProxy";
// import { OrderSettled } from "../../generated/SpotMarketProxy/SpotMarketProxy";

const conf = new ProtocolConfig(
  NetworkConfigs.getProtocolId(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    return getUsdPricePerToken(Address.fromBytes(token.id)).usdPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const _amount = bigIntToBigDecimal(amount, token.decimals);
    return getUsdPrice(Address.fromBytes(token.id), _amount);
  }
}

class TokenInit implements TokenInitializer {
  getTokenParams(address: Address): TokenParams {
    const erc20 = _ERC20.bind(address);
    let name = "unknown";
    let symbol = "UNKNOWN";
    let decimals = INT_ZERO as i32;

    if (address == Address.fromString(ETH_ADDRESS)) {
      name = "eth";
      symbol = "ETH";
      decimals = 18 as i32;
    } else {
      const nameCall = erc20.try_name();
      if (!nameCall.reverted) {
        name = nameCall.value;
      } else {
        log.debug("[getTokenParams] nameCall reverted for {}", [
          address.toHexString(),
        ]);
      }
      const symbolCall = erc20.try_symbol();
      if (!symbolCall.reverted) {
        symbol = symbolCall.value;
      } else {
        log.debug("[getTokenParams] symbolCall reverted for {}", [
          address.toHexString(),
        ]);
      }
      const decimalsCall = erc20.try_decimals();
      if (!decimalsCall.reverted) {
        decimals = decimalsCall.value.toI32();
      } else {
        log.debug("[getTokenParams] decimalsCall reverted for {}", [
          address.toHexString(),
        ]);
      }
    }
    const tokenParams = new TokenParams(name, symbol, decimals);

    return tokenParams;
  }
}

export function handleMarketRegistered(event: MarketRegistered): void {
  log.warning("[MarketRegistered] marketId: {} market: {} sender: {} tx: {}", [
    event.params.marketId.toString(),
    event.params.market.toHexString(),
    event.params.sender.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
}

export function handlePoolCreated(event: PoolCreated): void {
  log.warning("[PoolCreated] poolId: {} owner: {} sender: {} tx: {}", [
    event.params.poolId.toString(),
    event.params.owner.toHexString(),
    event.params.sender.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
}

export function handleDeposited(event: Deposited): void {
  log.warning(
    "[Deposited] accountId: {} collateralType: {} sender: {} tokenAmount: {} tx: {}",
    [
      event.params.accountId.toString(),
      event.params.collateralType.toHexString(),
      event.params.sender.toHexString(),
      event.params.tokenAmount.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleWithdrawn(event: Withdrawn): void {
  log.warning(
    "[Withdrawn] accountId: {} collateralType: {} sender: {} tokenAmount: {} tx: {}",
    [
      event.params.accountId.toString(),
      event.params.collateralType.toHexString(),
      event.params.sender.toHexString(),
      event.params.tokenAmount.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleCollateralConfigured(event: CollateralConfigured): void {
  log.warning(
    "[CollateralConfigured] collateralType: {} tokenAddress: {} tx: {}",
    [
      event.params.collateralType.toHexString(),
      event.params.config[5].toAddress().toHexString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleLiquidation(event: Liquidation): void {
  log.warning(
    "[Liquidation] accountId: {} collateralType: {} sender: {} poolId: {} tx: {}",
    [
      event.params.accountId.toString(),
      event.params.collateralType.toHexString(),
      event.params.sender.toHexString(),
      event.params.poolId.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

// export function handleOrderSettled(event: OrderSettled): void {
//   log.warning("[OrderSettled] marketId: {} orderType: {} settler: {} tx: {}", [
//     event.params.marketId.toString(),
//     event.params.orderType.toString(),
//     event.params.settler.toHexString(),
//     event.transaction.hash.toHexString(),
//   ]);
// }
