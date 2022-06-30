import { BigDecimal } from "@graphprotocol/graph-ts";

import {
    GlobalsParamSet as GlobalsParamSetEvent,
    SetValidPoolFactoryCall
} from "../../generated/MapleGlobals/MapleGlobals";
import { PoolFactory as PoolFactoryTemplate } from "../../generated/templates";
import { _PoolFactory } from "../../generated/schema";

import { PROTOCOL_GLOBAL_PARAMS_TREASURY_FEE_KEY } from "../common/constants";
import { createEventFromCall } from "../common/utils";
import { getOrCreatePoolFactory, getOrCreateProtocol } from "../common/mappingHelpers/getOrCreate/protocol";

export function handleGlobalsParamSet(event: GlobalsParamSetEvent): void {
    ////
    // Update protocol
    ////
    if (PROTOCOL_GLOBAL_PARAMS_TREASURY_FEE_KEY == event.params.which.toString()) {
        const protocol = getOrCreateProtocol();

        // Convert bips to percentage
        protocol._treasuryFee = event.params.value.toBigDecimal().div(BigDecimal.fromString("10000"));
        protocol.save();
    }
}

export function handleSetValidPoolFactory(call: SetValidPoolFactoryCall): void {
    const poolFactoryAddress = call.inputs.poolFactory;

    // Create pool factory template
    PoolFactoryTemplate.create(poolFactoryAddress);

    // Trigger protocol creation
    getOrCreateProtocol();

    // Create pool factory entity
    const eventFromCall = createEventFromCall(call);
    getOrCreatePoolFactory(eventFromCall, poolFactoryAddress);
}
