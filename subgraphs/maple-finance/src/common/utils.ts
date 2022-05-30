import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/templates/PoolFactory/ERC20";
import { ERC20NameBytes } from "../../generated/templates/PoolFactory/ERC20NameBytes";
import { ERC20SymbolBytes } from "../../generated/templates/PoolFactory/ERC20SymbolBytes";
import { ONE_BD } from "./constants";

// Functions designed to try...catch erc20 name/symbol/decimals to prevent errors
export function getAssetName(address: Address): string {
    let contract = ERC20.bind(address);
    let nameCall = contract.try_name();
    if (!nameCall.reverted) {
        return nameCall.value;
    }

    let bytesContract = ERC20NameBytes.bind(address);
    let nameBytesCall = bytesContract.try_name();
    if (!nameBytesCall.reverted) {
        return nameBytesCall.value.toString();
    }

    log.error("name() call (string or bytes) reverted for {}", [address.toHex()]);
    return "UNKNOWN";
}

export function getAssetSymbol(address: Address): string {
    let contract = ERC20.bind(address);
    let symbolCall = contract.try_symbol();
    if (!symbolCall.reverted) {
        return symbolCall.value;
    }

    let bytesContract = ERC20SymbolBytes.bind(address);
    let symbolBytesCall = bytesContract.try_symbol();
    if (!symbolBytesCall.reverted) {
        return symbolBytesCall.value.toString();
    }

    log.error("symbol() call (string or bytes) reverted for {}", [address.toHex()]);
    return "UNKNOWN";
}

export function getAssetDecimals(address: Address): i32 {
    let contract = ERC20.bind(address);
    let decimalsCall = contract.try_decimals();
    if (!decimalsCall.reverted) {
        return decimalsCall.value;
    }

    log.error("decimals() call reverted for {}", [address.toHex()]);
    return -1;
}

/**
 * Parse value to BigDecimal representation with decimals
 *      Ex. value = 123456789, decimal = 8 => 1.23456789
 * @param value value to parse
 * @param decimals number of decimals to parse this value with
 * @return parsed value
 */
export function parseUnits(value: BigInt, decimals: i32): BigDecimal {
    let parsedValue = value.toBigDecimal();
    for (let i = 0; i < decimals; i++) {
        parsedValue = parsedValue.times(BigDecimal.fromString("10"));
    }

    return parsedValue;
}

/**
 * Format value to BigInt representation with decimals
 *      Ex. value = 1.23456789, decimal = 8 => 123456789
 * @param value
 * @param decimals
 * @return formatted value
 */
export function formatUnits(value: BigDecimal, decimals: i32): BigInt {
    let formattedValue = value;
    for (let i = 0; i < decimals; i++) {
        formattedValue = formattedValue.div(BigDecimal.fromString("10"));
    }

    return BigInt.fromString(formattedValue.toString());
}
