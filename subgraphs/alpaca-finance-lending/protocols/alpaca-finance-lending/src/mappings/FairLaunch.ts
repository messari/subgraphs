import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import { Deposit, Withdraw, FairLaunch, OwnershipTransferred } from "../../../../generated/FairLaunch/FairLaunch";
import { Market } from "../../../../generated/schema";
import { Shield, Vault } from "../../../../generated/templates";
import { Transfer } from "../../../../generated/templates/Vault/Vault";
import { createDeposit, createWithdraw } from "../entities/events";
import { createMarket, getMarket, updateOutputTokenSupply } from "../entities/market";
import { Vault as VaultContract } from "../../../../generated/FairLaunch/Vault";
import { IERC20Detailed } from "../../../../generated/FairLaunch/IERC20Detailed";
import { BIGINT_ZERO } from "../../../../src/utils/constants";
import { bytesToUnsignedBigInt } from "../../../../src/utils/numbers";


export function handleOwnershipTransfered(
    event: OwnershipTransferred
): void {
    Shield.create(event.params.newOwner)
}

export function handleShieldOwnershipTransfered(
    event: OwnershipTransferred
): void {
    log.info('handleShieldOwnershipTransfered ' + event.params.newOwner.toHexString(), [])
}

export function handleDeposit(
    event: Deposit
): void {
    const poolId = event.params.pid;
    const fairLaunch = FairLaunch.bind(event.address)
    const poolInfo = fairLaunch.try_poolInfo(poolId)
    const poolAddress = poolInfo.value.value0;
    // get market
    const vaultInstance = VaultContract.bind(poolAddress);
    const underlyingToken = vaultInstance.try_token();
    if (underlyingToken.reverted) {
        return;
    }
    let market = getMarket(poolInfo.value.value0);
    // if !market
    if (!market) {
        // initiate market entity
        market = createMarket(event, poolAddress, underlyingToken.value)
        // create vault template instance
        Vault.create(poolInfo.value.value0)
    }

    createDeposit(event, poolAddress, underlyingToken.value, event.params.user, event.params.amount, vaultInstance)
}

export function handleWithdraw(
    event: Withdraw
): void {
    const poolId = event.params.pid;
    const fairLaunch = FairLaunch.bind(event.address)
    const poolInfo = fairLaunch.try_poolInfo(poolId)
    const poolAddress = poolInfo.value.value0;
    // get market
    const vaultInstance = VaultContract.bind(poolAddress);
    const underlyingToken = vaultInstance.try_token();
    if (underlyingToken.reverted) {
        return;
    }
    let market = getMarket(poolAddress);
    // if !market
    if (!market) {
        // initiate market entity
        market = createMarket(event, poolAddress, underlyingToken.value)
        // create vault template instance
        Vault.create(poolInfo.value.value0)
    }

    const inputBytesStr = event.transaction.input.toHexString();
    const tokenAmtHexStr = inputBytesStr.slice((inputBytesStr.length - 64), (inputBytesStr.length));
    const tokenAmt = bytesToUnsignedBigInt(Bytes.fromHexString(tokenAmtHexStr));
    createWithdraw(event, poolAddress, underlyingToken.value, event.params.user, tokenAmt, vaultInstance);

}

export function handleOutputTokenTransfer(
    event: Transfer
): void {
    const outputToken = IERC20Detailed.bind(event.address);
    updateOutputTokenSupply(event, event.address.toHexString(), outputToken.try_totalSupply().value || BIGINT_ZERO)
}
