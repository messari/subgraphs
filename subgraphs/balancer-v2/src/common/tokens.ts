import { ERC20 } from "../../generated/Vault/ERC20";
import { Address } from "@graphprotocol/graph-ts";

export function fetchTokenSymbol(tokenAddress: Address): string {
    let contract = ERC20.bind(tokenAddress);
    return contract.symbol();
}

export function fetchTokenName(tokenAddress: Address): string {
    let contract = ERC20.bind(tokenAddress);
    return contract.name();
}

export function fetchTokenDecimals(tokenAddress: Address): i32 {
    let contract = ERC20.bind(tokenAddress);
    return contract.decimals();
}