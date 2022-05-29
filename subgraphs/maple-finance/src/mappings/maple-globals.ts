import {
    GlobalsParamSet as GlobalsParamSetEvent,
    SetValidPoolFactoryCall
} from "../../generated/MapleGlobals/MapleGlobals";
import { BigDecimal } from "@graphprotocol/graph-ts";
import { PoolFactory as PoolFactoryTemplate } from "../../generated/templates";
import { _PoolFactory } from "../../generated/schema";
import { PROTOCOL_GLOBAL_PARAMS_TREASURY_FEE_KEY } from "../common/constants";

import { getOrCreatePoolFactory } from "../common/mapping_helpers/poolFactory";
import { getOrCreateProtocol } from "../common/mapping_helpers/protocol";

export function handleGlobalsParamSet(event: GlobalsParamSetEvent): void {
    if (PROTOCOL_GLOBAL_PARAMS_TREASURY_FEE_KEY == event.params.which.toString()) {
        const protocol = getOrCreateProtocol();

        // Convert bips to percentage
        protocol._treasuryFee = event.params.value.toBigDecimal().div(BigDecimal.fromString("1000"));

        protocol.save();
    }
}

export function handleSetValidPoolFactory(call: SetValidPoolFactoryCall): void {
    const poolFactoryAddress = call.inputs.poolFactory;

    // Create pool factory template
    PoolFactoryTemplate.create(poolFactoryAddress);

    // Trigger protocol creation here for convienence
    getOrCreateProtocol();

    // Create pool factory entity
    getOrCreatePoolFactory(poolFactoryAddress, call.block.timestamp, call.block.number);
}
