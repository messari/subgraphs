import { updateProtocolFees } from "../../../src/common/entities/pool";
import { SetFeeProtocol } from "../../../generated/templates/Pool/Pool";

// Update the fees colected by the protocol.
export function handleSetFeeProtocol(event: SetFeeProtocol): void {
  // Check if event.params.feeProtocol0New is different an i32
  updateProtocolFees(event.address, event.params.feeProtocol0New);
}
