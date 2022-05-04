import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";

export function hexToNumberString(hex: string): string {
  let hexNumber = BigInt.fromI32(0);

  if (hex.startsWith("0x")) {
    hex = hex.slice(2);
  }

  for (let i = 0; i < hex.length; i += 1) {
    let character = hex.substr(hex.length - 1 - i, 1);
    let digit = parseInt(character, 16) as u8;
    if (digit) {
      hexNumber = hexNumber.plus(BigInt.fromI32(digit).times(BigInt.fromI32(16).pow(i as u8)));
    }
  }

  return hexNumber.toString();
}

export function hexToAscii(hex: string): string {
  let output = "";
  for (let i = 0; i < hex.length; i += 2) {
    let charCode = parseInt(hex.substr(i, 2), 16) as u8;

    if (charCode) {
      output += String.fromCharCode(charCode);
    }

    // catch cases with charCode outside 32...126,
    // in which case it's probably a number...
    if (charCode && (charCode < 32 || charCode > 126)) {
      return hexToNumberString(hex);
    }
  }

  return output;
}

// Converts upper snake case to lower kebab case and appends a hyphen.
// (e.g. "TRADING_FEE" to "trading-fee-"), mainly used to create entity IDs
export function enumToPrefix(snake: string): string {
  return snake.toLowerCase().replace("_", "-") + "-";
}

export function createEntityID(event: ethereum.Event): string {
  return event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
}
