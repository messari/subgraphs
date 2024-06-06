import {
  RegisterValidatorCall,
  RegisterEtherFiNodeCall,
  RegisterEtherFiNode1Call as RegisterEtherFiNodeWithOutputCall,
} from "../../generated/NodesManager/NodesManager";
import { EtherFiNode as EtherFiNodeTemplate } from "../../generated/templates";

export function handleRegisterValidator(call: RegisterValidatorCall): void {
  const etherFiNodeAddress = call.inputs._withdrawalSafeAddress;

  EtherFiNodeTemplate.create(etherFiNodeAddress);
}

export function handleRegisterEtherFiNode(call: RegisterEtherFiNodeCall): void {
  const etherFiNodeAddress = call.inputs._address;

  EtherFiNodeTemplate.create(etherFiNodeAddress);
}

export function handleRegisterEtherFiNodeWithOutput(
  call: RegisterEtherFiNodeWithOutputCall
): void {
  const etherFiNodeAddress = call.outputs.value0;

  EtherFiNodeTemplate.create(etherFiNodeAddress);
}
