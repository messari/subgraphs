import { Address } from '@graphprotocol/graph-ts'
import { getMarketFromIlk } from '../../common/getters'
import { bigIntToBigDecimal } from "../../common/utils/numbers"
import { BIGDECIMAL_ONE_HUNDRED, BIGDECIMAL_ONE, MCD_CAT_ADDRESS } from "../../common/constants";
import { LogNote } from './../../../generated/Cat/Cat'
import { Cat } from "../../../generated/templates/Cat/Cat";
import { LogNote as LogNoteV2 } from '../../../generated/Cat_v2/Cat';
import { DEFAULT_DECIMALS } from '@protofire/subgraph-toolkit';

export function handleFile(event: LogNote): void {
  let ilk = event.params.arg1
  let what = event.params.arg2.toString()
  let signature = event.params.sig.toHexString()
  if (signature == '0x1a0b287e') {
    if (what == 'chop') {
        let market = getMarketFromIlk(ilk)
        let catContract = Cat.bind(Address.fromString(MCD_CAT_ADDRESS));
        market.liquidationPenalty = (bigIntToBigDecimal(catContract.ilks(ilk).value1,27).minus(BIGDECIMAL_ONE)).times(BIGDECIMAL_ONE_HUNDRED)
        market.save()
    }
  }
}

export function handleFileV2(event: LogNoteV2): void {
  let ilk = event.params.arg1
  let what = event.params.arg2.toString()
  if (what == 'chop') {
      let market = getMarketFromIlk(ilk)
      let catContract = Cat.bind(Address.fromString(MCD_CAT_ADDRESS));
      market.liquidationPenalty = (bigIntToBigDecimal(catContract.ilks(ilk).value1,DEFAULT_DECIMALS).minus(BIGDECIMAL_ONE)).times(BIGDECIMAL_ONE_HUNDRED)
      market.save()
  }
}
