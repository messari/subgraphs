import { Transfer as TransferEvent } from "../generated/DUSD/ERC20"
import { Issuer } from "../generated/DUSD/Issuer";
import { Address } from "@graphprotocol/graph-ts";
import { getOrInitHourlySnapshot } from "./initializers";

// Transfer DUSD
export function handleTransfer(event: TransferEvent): void {
  const fromAddress = Address.fromBytes(event.params.from)

  // This is the mint transaction
  if (fromAddress.equals(Address.zero())) {
    // event.transaction.to
    const issuerAddress = Address.fromString('0x55f3e0e786d69c8114eeb53c8cd1f0f65a71d4df')
    const issuerContract = Issuer.bind(issuerAddress);
    // Get the circulating DUSD
    const circulatingDusdAmount = issuerContract.try_circulatingDusd()
    if (!circulatingDusdAmount.reverted) {
      const hourlySnapshot = getOrInitHourlySnapshot(event)
      hourlySnapshot.circulatingDusd = circulatingDusdAmount.value
      hourlySnapshot.save()
    }
  }
}

export function handleTransferByContractCall(event: TransferEvent): void {
  const fromAddress = Address.fromBytes(event.params.from)

  // This is the mint transaction
  if (fromAddress.equals(Address.zero())) {
    // log.info("event.transaction.to: {}", [event.transaction.to!.toHexString()])
    // event.transaction.to
    const issuerAddress = Address.fromString('0x55f3e0e786d69c8114eeb53c8cd1f0f65a71d4df')
    const issuerContract = Issuer.bind(issuerAddress);
    // Get the circulating DUSD
    const circulatingDusdAmount = issuerContract.try_circulatingDusd()
    if (!circulatingDusdAmount.reverted) {
      const hourlySnapshot = getOrInitHourlySnapshot(event)
      hourlySnapshot.circulatingDusd = circulatingDusdAmount.value
      hourlySnapshot.save()
    }
  }
}