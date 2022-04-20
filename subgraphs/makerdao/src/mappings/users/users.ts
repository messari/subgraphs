import { Created } from '../../../generated/DSProxyFactory/DSProxyFactory'
import { updateUsageMetrics } from '../../common/metrics'
import { LogNote } from '../../../generated/templates/DSProxy/DSProxy'
import { DSProxy } from '../../../generated/templates'


export function handleCreated(event: Created): void {
    // Register new user proxy
    DSProxy.create(event.params.proxy)
    updateUsageMetrics(event,event.params.owner)
}

export function handleExecute(event: LogNote): void {
    updateUsageMetrics(event,event.params.guy)
}