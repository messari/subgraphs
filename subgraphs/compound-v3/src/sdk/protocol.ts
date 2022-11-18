import { LendingProtocol } from "../../generated/schema";
import { ProtocolData } from "./market";

export class ProtocolData {
  constructor(
    public readonly protocolID: Bytes,
    public readonly protocol: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly network: string,
    public readonly lendingType: string,
    public readonly lenderPermissionType: string | null,
    public readonly borrowerPermissionType: string | null,
    public readonly collateralizationType: string | null,
    public readonly riskType: string | null
  ) {}
}

export class ProtocolClass {
  private protocol: LendingProtocol;

  constructor(protocolData: ProtocolData);
}
