import { Token } from "../../generated/schema";
import * as constants from "../common/constants";
import { DEFAULT_DECIMALS } from "../common/constants";
import { ERC20 as ERC20Contract } from "../../generated/Controller/ERC20";
import { BigDecimal, BigInt, ethereum, Address } from "@graphprotocol/graph-ts";

export function getTimeInMillis(time: BigInt): BigInt {
  return time.times(BigInt.fromI32(1000));
}

export function getTimestampInMillis(block: ethereum.Block): BigInt {
  return block.timestamp.times(BigInt.fromI32(1000));
}

export function normalizedUsdcPrice(usdcPrice: BigInt): BigInt {
  return usdcPrice.div(constants.USDC_DENOMINATOR)
}

export function getOrCreateToken(address: Address): Token {
  let token = Token.load(address.toHexString());
  if (!token) {
    token = new Token(address.toHexString());

    let erc20Contract = ERC20Contract.bind(address);
    let name = erc20Contract.try_name();
    let symbol = erc20Contract.try_symbol();
    let decimals = erc20Contract.try_decimals();

    token.name = name.reverted ? "" : name.value;
    token.symbol = symbol.reverted ? "" : symbol.value;
    token.decimals = decimals.reverted
      ? DEFAULT_DECIMALS
      : decimals.value.toI32();

    token.save();
  }
  return token as Token;
}
