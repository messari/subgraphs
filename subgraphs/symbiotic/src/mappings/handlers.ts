import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import { getUsdPrice, getUsdPricePerToken } from "../prices";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import { ETH_ADDRESS, INT_ZERO } from "../sdk/util/constants";

import { Token } from "../../generated/schema";
import { AddEntity } from "../../generated/Factory/Factory";
import { _ERC20 } from "../../generated/Factory/_ERC20";
import { Collateral as CollateralTemplate } from "../../generated/templates";
import {
  Deposit,
  Withdraw,
} from "../../generated/templates/Collateral/Collateral";

const conf = new ProtocolConfig(
  NetworkConfigs.getProtocolId(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    const pricedToken = Address.fromBytes(token.id);
    return getUsdPricePerToken(pricedToken).usdPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const pricedToken = Address.fromBytes(token.id);
    const _amount = bigIntToBigDecimal(amount, token.decimals);
    return getUsdPrice(pricedToken, _amount);
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

export function handleAddEntity(event: AddEntity): void {
  log.warning("[AddEntity] collateral: {} tx: {}", [
    event.params.entity.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
  CollateralTemplate.create(event.params.entity);
}

export function handleDeposit(event: Deposit): void {
  log.warning(
    "[Deposit] depositor: {} recipient: {} amount: {} tx.from: {} tx: {}",
    [
      event.params.depositor.toHexString(),
      event.params.recipient.toHexString(),
      event.params.amount.toString(),
      event.transaction.from.toHexString(),
      event.transaction.hash.toHexString(),
    ]
  );
}
export function handleWithdraw(event: Withdraw): void {
  log.warning(
    "[Withdraw] withdrawer: {} recipient: {} amount: {} tx.from: {} tx: {}",
    [
      event.params.withdrawer.toHexString(),
      event.params.recipient.toHexString(),
      event.params.amount.toString(),
      event.transaction.from.toHexString(),
      event.transaction.hash.toHexString(),
    ]
  );
}
