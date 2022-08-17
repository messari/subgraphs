import { log } from "@graphprotocol/graph-ts";
import { TokenRegistry } from "./registry/registry";

export function getRegistryIpfsHash(year: i32): string {
  switch (year) {
    case 2017: {
      return TokenRegistry.TOKENS_2017;
    }
    case 2018: {
      return TokenRegistry.TOKENS_2018;
    }
    case 2019: {
      return TokenRegistry.TOKENS_2019;
    }
    case 2020: {
      return TokenRegistry.TOKENS_2020;
    }
    case 2021: {
      return TokenRegistry.TOKENS_2021;
    }
    case 2022: {
      return TokenRegistry.TOKENS_2022;
    }
    default: {
      log.critical("No token registry found for deployment year", []);
      return TokenRegistry.TOKENS_DEFAULT;
    }
  }
}
