import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/templates/PoolFactory/ERC20";
import { ERC20NameBytes } from "../../generated/templates/PoolFactory/ERC20NameBytes";
import { ERC20SymbolBytes } from "../../generated/templates/PoolFactory/ERC20SymbolBytes";
import { ONE_BD, ONE_BI, TEN_BD, ZERO_BI } from "./constants";

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
 * Convert a big decimal to a big int represenation
 * @param input big decimal to convert
 * @returns big int representation
 */
export function bigDecimalToBigInt(input: BigDecimal): BigInt {
    const str = input.truncate(0).toString();
    return BigInt.fromString(str);
}

/**
 * Compute base^exponent
 * @param base base of the computation
 * @param exponent exponent raising base to
 * @return base^exponent
 */
export function powBigDecimal(base: BigDecimal, exponent: i32): BigDecimal {
    let output = ONE_BD;
    for (let i = 0; i < exponent; i++) {
        output = output.times(base);
    }
    return output;
}

/**
 * Parse value to BigDecimal representation with decimals (i.e compute actual value from mantissa)
 *      Ex. value = 123456789, decimal = 8 => 1.23456789
 * @param value value to parse
 * @param decimals number of decimals to parse this value with
 * @return parsed value
 */
export function parseUnits(value: BigInt, decimals: i32): BigDecimal {
    const powerTerm = powBigDecimal(BigDecimal.fromString("10"), decimals);
    return value.toBigDecimal().div(powerTerm);
}

/**
 * Format value to BigInt representation with decimals (i.e compute mantissa)
 *      Ex. value = 1.23456789, decimal = 8 => 123456789
 * @param value
 * @param decimals
 * @return formatted value
 */
export function formatUnits(value: BigDecimal, decimals: i32): BigInt {
    const powerTerm = powBigDecimal(TEN_BD, decimals);
    return bigDecimalToBigInt(value.times(powerTerm));
}

/**
 * Compute the new average given an old average and count, and new value
 * @param oldAvg old average
 * @param oldCount count of entries making up the old average
 * @param newVal new value to add to the average
 * @returns new average including newVal
 */
export function computeNewAverage(oldAvg: BigDecimal, oldCount: BigInt, newVal: BigDecimal): BigDecimal {
    // new_avg = (old_avg * old_count + new_val) / (oldCount + 1)
    return oldAvg
        .times(oldCount.toBigDecimal())
        .plus(newVal)
        .div(oldCount.plus(ONE_BI).toBigDecimal());
}
