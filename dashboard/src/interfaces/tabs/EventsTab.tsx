import React, { useEffect } from "react";
import { TableEvents } from "../../common/chartComponents/TableEvents";
import { PoolDropDown } from "../../common/utilComponents/PoolDropDown";

interface EventsTabProps {
    data: any;
    events: string[];
    issues: { message: string, type: string }[];
    poolId: string;
    setPoolId: React.Dispatch<React.SetStateAction<string>>;
    poolNames: string;
    setWarning: React.Dispatch<React.SetStateAction<{ message: string, type: string }[]>>;
}

// This component is for each individual subgraph
function EventsTab({
    data,
    events,
    issues,
    poolId,
    setPoolId,
    setWarning,
    poolNames }:
    EventsTabProps
) {

    useEffect(() => {
        setWarning(issues);
    }, [issues]);

    return (<>
        <PoolDropDown poolId={poolId} setPoolId={(x) => setPoolId(x)} setWarning={(x) => setWarning(x)} markets={data[poolNames]} />
        {events.map((eventName) => {
            if (!poolId && data[eventName].length > 0) {
                const message = 'No pool selected, there should not be "' + eventName + '" events';
                if (issues.filter((x) => x.message === message).length === 0) {
                    issues.push({ message, type: "NOEV" });
                }
            }
            if (poolId && data[eventName].length === 0) {
                const message = "No " + eventName + " on pool " + poolId;
                if (issues.filter((x) => x.message === message).length === 0) {
                    issues.push({ message, type: "EVENT" });
                }
            }
            return <React.Fragment>{TableEvents(eventName, data, eventName, poolId)}</React.Fragment>;
        })}
    </>);
};

export default EventsTab;