import { Button } from "@mui/material";
import { useSearchParams } from "react-router-dom";

interface ScrollToElementProps {
    poolId: string;
    elementId: string;
    tab: string;
    label: string;
}

// This component is a button that creates a copiable link that autoscrolls to the provided element
function ScrollToElement({ poolId, elementId, tab, label }: ScrollToElementProps) {
    const [searchParams] = useSearchParams();
    const subgraphName = searchParams.get("subgraph");
    let poolIdParam = '';
    if (poolId) {
        poolIdParam = '&poolId=' + poolId
    }
    let tabParam = '&tab=protocol'
    if (tab) {
        tabParam = '&tab=' + tab;
    }
    let viewParam = '';
    if (elementId) {
        viewParam = '&view=' + elementId;
    }
    const queryString = window.location.origin + window.location.pathname + '?subgraph=' + subgraphName + poolIdParam + tabParam + viewParam;
    return (
        <Button onClick={() => navigator.clipboard.writeText(queryString)}>Copy Link To {label}</Button>
    )
}

export default ScrollToElement