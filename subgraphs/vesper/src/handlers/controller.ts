import { Deposit } from "../../generated/schema";
import { OwnershipTransferred as OTC } from "../../generated/controller/Controller";
import { OwnershipTransferred as OTCM } from "../../generated/collateralManager/Controller";

export function handleOwnershipTransferred(event: OTC | OTCM) {}
