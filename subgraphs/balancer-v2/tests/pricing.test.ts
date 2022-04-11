import { test, assert,  } from 'matchstick-as'
import { createNewPool } from "./helpers";
import { handlePoolRegister} from "../src/mappings/handlers";
import {Address} from "@graphprotocol/graph-ts";


test('Create and register pool', () => {
    let registerPoolEvent = createNewPool("0x1234", Address.fromString("0x4"))
    handlePoolRegister(registerPoolEvent)
    assert.fieldEquals("LiquidityPool", "0x1234", "outputToken", "0x41")
})