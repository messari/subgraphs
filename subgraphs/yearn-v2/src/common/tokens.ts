import { BigInt, Address, BigDecimal, log } from "@graphprotocol/graph-ts"
import {
  ERC20 as ERC20Contract,
} from "../../generated/Registry/ERC20"
import {
  Token,
} from "../../generated/schema"

import { DEFAULT_DECIMALS } from '../common/constants';

export function getOrCreateToken(address: Address): Token {
  let id = address.toHexString();
  let token = Token.load(id);
  if (!token) {
    token = new Token(id);
    let erc20Contract = ERC20Contract.bind(address);
    let decimals = erc20Contract.try_decimals();
    // Using try_cause some values might be missing
    let name = erc20Contract.try_name();
    let symbol = erc20Contract.try_symbol();
    // TODO: add overrides for name and symbol
    token.decimals = decimals.reverted ? DEFAULT_DECIMALS : decimals.value;
    token.name = name.reverted ? '' : name.value;
    token.symbol = symbol.reverted ? '' : symbol.value;
    token.save();
  }
  return token as Token;
}
