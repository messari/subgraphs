import { Token } from "../../generated/schema";
import { ETH_ADDRESS, LUSD_ADDRESS } from "../utils/constants";

export function getETHToken(): Token {
  const token = new Token(ETH_ADDRESS);
  token.name = "Ethereum";
  token.symbol = "ETH";
  token.decimals = 18;
  token.save();
  return token;
}

export function getLUSDToken(): Token {
  const token = new Token(LUSD_ADDRESS);
  token.name = "Liquity USD";
  token.symbol = "LUSD";
  token.decimals = 18;
  token.save();
  return token;
}
