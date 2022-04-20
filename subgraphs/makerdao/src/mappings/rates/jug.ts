import { Address} from '@graphprotocol/graph-ts';
import { LogNote } from "../../../generated/Jug/Jug";
import { getMarketFromIlk } from "../../common/getters"
import { bigIntToBigDecimal, round } from "./../../common/utils/numbers";
import { BIGDECIMAL_ONE, BIGDECIMAL_ONE_HUNDRED, MCD_JUG_ADDRESS, SECONDS_PER_YEAR_BIGDECIMAL } from "../../common/constants";
import { Jug } from "../../../generated/templates/Jug/Jug"


// Updates the stable borrow rate for the market
export function handleFile(event: LogNote): void {
    let signature = event.params.sig.toHexString()
    if (signature == '0x1a0b287e') {
        let ilk = event.params.arg1
        let what = event.params.arg2.toString()
        if (what == 'duty') {
            let jugContract = Jug.bind(Address.fromString(MCD_JUG_ADDRESS));
            let market = getMarketFromIlk(ilk);            
            market.stableBorrowRate = round((bigIntToBigDecimal(jugContract.ilks(ilk).value0,27).minus(BIGDECIMAL_ONE)).times(SECONDS_PER_YEAR_BIGDECIMAL).times(BIGDECIMAL_ONE_HUNDRED))
            market.save()
        }
    }
}

