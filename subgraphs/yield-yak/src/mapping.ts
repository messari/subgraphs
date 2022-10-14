import { BigInt } from "@graphprotocol/graph-ts"
import {
    AddReward,
    AllowDepositor,
    Approval,
    Deposit,
    DepositsEnabled,
    OwnershipTransferred,
    Recovered,
    Reinvest,
    RemoveDepositor,
    RemoveReward,
    Transfer,
    UpdateAdminFee,
    UpdateDevAddr,
    UpdateDevFee,
    UpdateMaxTokensToDepositWithoutReinvest,
    UpdateMinTokensToReinvest,
    UpdateReinvestReward,
    Withdraw,
    YakStrategyV2
} from "../generated/AaveV3StrategyAvaxV1/YakStrategyV2"
import { YieldAggregator } from '../generated/schema'

export function handleDeposit(event: Deposit): void {
    let transactionHash = event.transaction.hash;
    let logIndex = event.logIndex;

    let deposit = Deposit.call(transactionHash.toHexString().concat("-").concat(logIndex.toHexString()))

    if (deposit == null) {
        deposit = // create new Deposit
    }

    deposit.hash = event.transaction.hash.toHexString();
    deposit.logIndex = event.logIndex;
    deposit.to = event.transaction.to?.toHexString();
    deposit.from = event.transaction.from.toHexString();
    deposit.blockNumber = event.block.number;
    deposit.timestamp = event.block.timestamp;
    deposit.amount = event.params.amount;
}

export function handleAddReward(event: AddReward): void {

}

export function handleAllowDepositor(event: AllowDepositor): void { }

export function handleApproval(event: Approval): void { }

export function handleDepositsEnabled(event: DepositsEnabled): void { }

export function handleOwnershipTransferred(event: OwnershipTransferred): void { }

export function handleRecovered(event: Recovered): void { }

export function handleReinvest(event: Reinvest): void { }

export function handleRemoveDepositor(event: RemoveDepositor): void { }

export function handleRemoveReward(event: RemoveReward): void { }

export function handleTransfer(event: Transfer): void { }

export function handleUpdateAdminFee(event: UpdateAdminFee): void { }

export function handleUpdateDevAddr(event: UpdateDevAddr): void { }

export function handleUpdateDevFee(event: UpdateDevFee): void { }

export function handleUpdateMaxTokensToDepositWithoutReinvest(
    event: UpdateMaxTokensToDepositWithoutReinvest
): void { }

export function handleUpdateMinTokensToReinvest(
    event: UpdateMinTokensToReinvest
): void { }

export function handleUpdateReinvestReward(event: UpdateReinvestReward): void { }

export function handleWithdraw(event: Withdraw): void { }


function defineProtocol(ownerAddress: Address): YieldAggregator {
    let protocol = YieldAggregator.load(ownerAddress.toHexString())
    if (protocol == null) {
        protocol = new YieldAggregator(ownerAddress.toHexString())
    }

    protocol.name = "Yield Yak"
    protocol.slug = "yak"
    protocol.schemaVersion = "1.0.0"
    protocol.subgraphVersion = "1.0.0"
    protocol.methodologyVersion = "1.0.0"
    protocol.network = "AVALANCHE"
    protocol.type = "YIELD"

    protocol.save()

    return protocol
}