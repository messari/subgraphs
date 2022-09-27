import { TableCell, TableRow, Typography } from "@mui/material";
import { useState } from "react";
import { NetworkLogo } from "../common/NetworkLogo";
import { SubgraphLogo } from "../common/SubgraphLogo";

interface DeploymentsInDevelopmentRow {
    protocol: any;
    subgraphName: string;
}

function DeploymentsInDevelopmentRow({ protocol, subgraphName }: DeploymentsInDevelopmentRow) {
    const [showDeposDropDown, toggleShowDeposDropDown] = useState<boolean>(false);

    if (showDeposDropDown) {
        const deposOnProtocol = protocol.networks.map((depo: any) => {
            return (
                <TableRow onClick={() => (window.location.href = ("https://thegraph.com/hosted-service/subgraph/messari/" + depo.hostedServiceId))} key={subgraphName + depo.chain + "DepInDevRow"} sx={{ height: "10px", width: "100%", backgroundColor: "rgba(22,24,29,0.9)" }}>
                    <TableCell
                        sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingLeft: "6px", borderLeft: `${depo?.status === "prod" ? "#58BC82" : "#B8301C"} solid 34px`, verticalAlign: "middle", display: "flex" }}
                    >
                        <SubgraphLogo name={subgraphName} size={30} />
                        <span style={{ display: "inline-flex", alignItems: "center", padding: "0px 10px", fontSize: "14px" }}>
                            {depo.chain}
                        </span>
                    </TableCell>
                    <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                    </TableCell>
                    <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0 16px 0 30px", textAlign: "right", display: "flex" }}>
                        <NetworkLogo key={subgraphName + depo.chain + 'Logo'} size={30} network={depo.chain} />
                    </TableCell>
                    <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                        {depo?.status === "prod" ? <img src="https://images.emojiterra.com/twitter/v13.1/512px/2705.png" height="24px" width="24px" /> : <img src="https://github.githubassets.com/images/icons/emoji/unicode/1f6e0.png" height="24px" width="24px" />}
                    </TableCell>
                    <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                        <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                            {depo?.versions?.schema || "N/A"}
                        </Typography>
                    </TableCell>
                    <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                        <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                            {depo?.versions?.subgraph || "N/A"}
                        </Typography>
                    </TableCell>
                    <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                        <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                            {depo?.versions?.methodology || "N/A"}
                        </Typography>
                    </TableCell>
                </TableRow>

            )
        })
        return (<>
            <TableRow onClick={() => {
                if (protocol.networks.length > 1) {
                    toggleShowDeposDropDown(!showDeposDropDown)
                } else {
                    window.location.href = ("https://thegraph.com/hosted-service/subgraph/messari/" + protocol.networks[0].hostedServiceId)
                }
            }} key={subgraphName + "DepInDevRow"} sx={{ cursor: "pointer", height: "10px", width: "100%", backgroundColor: "rgba(22,24,29,0.9)" }}>
                <TableCell
                    sx={{ padding: "0", borderLeft: `${protocol?.status ? "#58BC82" : "#B8301C"} solid 6px`, verticalAlign: "middle", display: "flex" }}
                >
                    <SubgraphLogo name={subgraphName} size={30} />
                    <span style={{ display: "inline-flex", alignItems: "center", padding: "0px 10px", fontSize: "14px" }}>
                        {subgraphName}
                    </span>
                </TableCell>
                <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
                    {protocol.networks.length > 1 ? <img height="24px" width="24px" src="https://cdn2.iconfinder.com/data/icons/50-material-design-round-corner-style/44/Dropdown_2-512.png" /> : null}

                </TableCell>
                <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right", display: "flex" }}>
                    {protocol.networks.map((x: { [x: string]: any }) => <a href={"https://thegraph.com/hosted-service/subgraph/messari/" + x.hostedServiceId} ><NetworkLogo key={subgraphName + x.chain + 'Logo'} size={30} network={x.chain} /></a>)}
                </TableCell>
                <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>

                </TableCell>
                <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>

                </TableCell>
                <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>

                </TableCell>
                <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>

                </TableCell>
            </TableRow>
            {deposOnProtocol}
        </>)
    }

    return (
        <TableRow onClick={() => {
            if (protocol.networks.length > 1) {
                toggleShowDeposDropDown(!showDeposDropDown);
            } else {
                window.location.href = ("https://thegraph.com/hosted-service/subgraph/messari/" + protocol.networks[0].hostedServiceId);
            }
        }} key={subgraphName + "DepInDevRow"} sx={{ cursor: protocol.networks.length > 1 ? "pointer" : "cursor", height: "10px", width: "100%", backgroundColor: "rgba(22,24,29,0.9)" }}>
            <TableCell
                sx={{ padding: "0", borderLeft: `${protocol?.status ? "#58BC82" : "#B8301C"} solid 6px`, verticalAlign: "middle", display: "flex" }}
            >
                <SubgraphLogo name={subgraphName} size={30} />
                <span style={{ display: "inline-flex", alignItems: "center", padding: "0px 10px", fontSize: "14px" }}>
                    {subgraphName}
                </span>
            </TableCell>
            <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
                {protocol.networks.length > 1 ? <img height="24px" width="24px" src="https://cdn2.iconfinder.com/data/icons/50-material-design-round-corner-style/44/Dropdown_2-512.png" /> : null}
            </TableCell>
            <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right", display: "flex" }}>
                {protocol.networks.map((x: { [x: string]: any }) => <a href={"https://thegraph.com/hosted-service/subgraph/messari/" + x.hostedServiceId} ><NetworkLogo key={subgraphName + x.chain + 'Logo'} size={30} network={x.chain} /></a>)}
            </TableCell>
            <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
                {protocol?.status ? <img src="https://images.emojiterra.com/twitter/v13.1/512px/2705.png" height="24px" width="24px" /> : <img src="https://github.githubassets.com/images/icons/emoji/unicode/1f6e0.png" height="24px" width="24px" />}
            </TableCell>
            <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
                <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                    {protocol?.schemaVersions?.length > 0 ? protocol?.schemaVersions.join(", ") : "N/A"}
                </Typography>
            </TableCell>
            <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
                <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                    {protocol?.subgraphVersions?.length > 0 ? protocol?.subgraphVersions.join(", ") : "N/A"}
                </Typography>
            </TableCell>
            <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
                <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                    {protocol?.methodologyVersions?.length > 0 ? protocol?.methodologyVersions.join(", ") : "N/A"}
                </Typography>
            </TableCell>
        </TableRow>
    )
}

export default DeploymentsInDevelopmentRow;