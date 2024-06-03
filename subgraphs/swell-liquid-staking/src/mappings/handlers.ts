import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  log,
} from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import { getUsdPrice, getUsdPricePerToken } from "../prices";
import { getOrCreateFeePercentage } from "./helpers";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigDecimalToBigInt, bigIntToBigDecimal } from "../sdk/util/numbers";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_TEN,
  BIGDECIMAL_TEN_TO_EIGHTEENTH,
  BIGINT_MINUS_ONE,
  ETH_ADDRESS,
  INT_ZERO,
} from "../sdk/util/constants";

import { ETHReceived } from "../../generated/DepositManager/DepositManager";
import {
  WithdrawRequestCreated,
  WithdrawalClaimed,
} from "../../generated/SWEXIT/SWEXIT";
import {
  Reprice,
  NodeOperatorRewardPercentageUpdate,
  SwellTreasuryRewardPercentageUpdate,
  SWETH,
} from "../../generated/SWETH/SWETH";
import { _ERC20 } from "../../generated/SWETH/_ERC20";
import { Token, _UnstakeRequest } from "../../generated/schema";

const conf = new ProtocolConfig(
  NetworkConfigs.getLSTAddress().toHexString(),
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
        log.warning("[getTokenParams] nameCall reverted for {}", [
          address.toHexString(),
        ]);
      }
      const symbolCall = erc20.try_symbol();
      if (!symbolCall.reverted) {
        symbol = symbolCall.value;
      } else {
        log.warning("[getTokenParams] symbolCall reverted for {}", [
          address.toHexString(),
        ]);
      }
      const decimalsCall = erc20.try_decimals();
      if (!decimalsCall.reverted) {
        decimals = decimalsCall.value.toI32();
      } else {
        log.warning("[getTokenParams] decimalsCall reverted for {}", [
          address.toHexString(),
        ]);
      }
    }
    const tokenParams = new TokenParams(name, symbol, decimals);

    return tokenParams;
  }
}

export function handleETHReceived(event: ETHReceived): void {
  const staker = event.params.from;
  const amount = event.params.amount;

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const lst = sdk.Tokens.getOrCreateToken(NetworkConfigs.getLSTAddress());

  const pool = sdk.Pools.loadPool(lst.id);
  if (!pool.isInitialized) {
    pool.initialize(lst.name, lst.symbol, [token.id], lst, true);
  }
  pool.addInputTokenBalances([amount], true);

  const swETH = SWETH.bind(Address.fromBytes(lst.id));
  const supply = swETH.totalSupply();
  pool.setOutputTokenSupply(lst, supply);

  const account = sdk.Accounts.loadAccount(staker);
  account.trackActivity();
}

export function handleWithdrawRequestCreated(
  event: WithdrawRequestCreated
): void {
  const staker = event.params.owner;
  const nonce = event.params.tokenId;

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const account = sdk.Accounts.loadAccount(staker);
  account.trackActivity();

  const requestId = Bytes.fromUTF8(nonce.toString());
  const unstakeRequest = new _UnstakeRequest(requestId);
  unstakeRequest.account = staker;
  unstakeRequest.nonce = nonce;
  unstakeRequest.claimed = false;
  unstakeRequest.save();
}

export function handleWithdrawalClaimed(event: WithdrawalClaimed): void {
  const staker = event.params.owner;
  const nonce = event.params.tokenId;
  const amount = event.params.exitClaimedETH;

  const requestId = Bytes.fromUTF8(nonce.toString());
  const unstakeRequest = _UnstakeRequest.load(requestId);
  if (!unstakeRequest) {
    log.warning(
      "[WithdrawalClaimed] no unstake request found for staker: {} nonce: {}",
      [staker.toHexString(), nonce.toString()]
    );
    return;
  }
  unstakeRequest.claimed = true;
  unstakeRequest.save();

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const lst = sdk.Tokens.getOrCreateToken(NetworkConfigs.getLSTAddress());

  const pool = sdk.Pools.loadPool(lst.id);
  if (!pool.isInitialized) {
    pool.initialize(lst.name, lst.symbol, [token.id], lst, true);
  }
  pool.addInputTokenBalances([amount.times(BIGINT_MINUS_ONE)], true);

  const swETH = SWETH.bind(Address.fromBytes(lst.id));
  const supply = swETH.totalSupply();
  pool.setOutputTokenSupply(lst, supply);
}

export function handleNodeOperatorRewardPercentageUpdate(
  event: NodeOperatorRewardPercentageUpdate
): void {
  const feePercentage = getOrCreateFeePercentage();
  feePercentage.nodeOperator = event.params.newPercentage;
  feePercentage.save();
}

export function handleSwellTreasuryRewardPercentageUpdate(
  event: SwellTreasuryRewardPercentageUpdate
): void {
  const feePercentage = getOrCreateFeePercentage();
  feePercentage.treasury = event.params.newPercentage;
  feePercentage.save();
}

export function handleReprice(event: Reprice): void {
  const swellTreasuryRewards = event.params.swellTreasuryRewards;
  const nodeOperatorRewards = event.params.nodeOperatorRewards;
  const protocolSideAmount = nodeOperatorRewards.plus(swellTreasuryRewards);

  const feePercentage = getOrCreateFeePercentage();
  const totalFeePercentage = feePercentage.nodeOperator.plus(
    feePercentage.treasury
  );
  const supplySideMultiple = bigDecimalToBigInt(
    BIGDECIMAL_ONE.minus(
      totalFeePercentage.toBigDecimal().div(BIGDECIMAL_TEN_TO_EIGHTEENTH)
    ).times(BIGDECIMAL_TEN)
  );
  const supplySideAmount = protocolSideAmount.times(supplySideMultiple);

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const lst = sdk.Tokens.getOrCreateToken(NetworkConfigs.getLSTAddress());

  const pool = sdk.Pools.loadPool(lst.id);
  if (!pool.isInitialized) {
    pool.initialize(lst.name, lst.symbol, [token.id], lst, true);
  }
  pool.addRevenueNative(token, protocolSideAmount, supplySideAmount);
}
