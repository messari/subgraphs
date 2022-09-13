import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Token } from "../../generated/schema";
import { YUSD_ADDRESS, BIGINT_ZERO } from "../utils/constants";
import { bigIntToBigDecimal, readValue } from "../utils/numbers";

import { ERC20Contract } from "../../generated/ActivePool/ERC20Contract";
export function getOrCreateToken(address: Address): Token {
  let token = Token.load(address.toHexString());

  if (!token) {
    token = new Token(address.toHexString());

    const contract = ERC20Contract.bind(address);

    token.name = readValue<string>(contract.try_name(), "");
    token.symbol = readValue<string>(contract.try_symbol(), "");
    token.decimals = readValue<BigInt>(
      contract.try_decimals(),
      BIGINT_ZERO
    ).toI32() as u8;

    token.save();
  }

  return token;
}

export function getYUSDToken(): Token {
  const token = new Token(YUSD_ADDRESS);
  token.name = "Yeti USD";
  token.symbol = "YUSD";
  token.decimals = 18;
  token.save();
  return token;
}
