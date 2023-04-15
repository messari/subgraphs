import { BigDecimal } from "@graphprotocol/graph-ts";
import { Network } from "../../../src/constants";

/////////////////////
///// Addresses /////
/////////////////////

export const REWARD_TOKEN_ADDRESS =
  "0x0c4681e6c0235179ec3d4f4fc4df3d14fdd96017"; // RDNT token
export const RDNT_WETH_Uniswap_Pair =
  "0x24704aff49645d32655a76df6d407e02d146dafc"; // RDNT/WETH
export const RWETH_ADDRESS = "0x15b53d277af860f51c3e6843f8075007026bbb3a";
// This is hardcoded and can not be changed, so it is set as a constant here
// https://arbiscan.io/address/0xab843bec136e848fc47f0eb24902b61f158534d6#code#F1#L99
export const FLASHLOAN_PREMIUM_TOTAL = BigDecimal.fromString("0.0009"); // = 9/10000

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export namespace Protocol {
  export const PROTOCOL = "Radiant Capital";
  export const NAME = "Radiant Capital";
  export const SLUG = "radiant-capital";
  export const PROTOCOL_ADDRESS = "0xe21b295ed46528efd5f3ef66e18bc6ad1c87f003"; // addresses provider
  export const NETWORK = Network.ARBITRUM_ONE;
}

// Number of decimals in which rToken oracle prices are returned.
export const rTOKEN_DECIMALS = 8;
