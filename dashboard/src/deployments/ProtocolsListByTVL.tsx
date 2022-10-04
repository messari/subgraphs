import { useEffect, useState } from "react";
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { formatIntToFixed2 } from "../utils";
import { Chart as ChartJS, registerables, PointElement } from "chart.js";
import { useNavigate } from "react-router";
import { NetworkLogo, NetworkLogos, networkMapping } from "../common/NetworkLogo";

interface ProtocolsListByTVLProps {
    protocolsToQuery: { [x: string]: any };
    getData: any;
}

function ProtocolsListByTVL({ protocolsToQuery, getData }: ProtocolsListByTVLProps) {
    const navigate = useNavigate();

    ChartJS.register(...registerables);
    ChartJS.register(PointElement);

    const [defiLlamaProtocols, setDefiLlamaProtocols] = useState<any[]>([]);

    const fetchDefiLlamaProtocols = () => {
        fetch("https://api.llama.fi/protocols", {
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        })
            .then(function (res) {
                return res.json();
            })
            .then(function (json) {
                setDefiLlamaProtocols(json);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    useEffect(() => {
        fetchDefiLlamaProtocols();
    }, []);

    useEffect(() => {
        if (!protocolsToQuery || Object.keys(protocolsToQuery).length === 0) {
            getData();
        }
    }, []);

    const categoryTypesSupported: { [x: string]: string } = {
        "yield": "Vaults",
        "yield aggregator": "Vaults",
        "reserve currency": "CDP",
        "lending": "Lending",
        "dexes": "Exchanges",
        "nft lending": "NFT Lending",
        "cdp": "CDP",
        "nft marketplace": "NFT Marketplace"
    }


    const protocolSlugs = Object.keys(protocolsToQuery);

    Object.keys(protocolsToQuery).forEach(slug => {
        if (slug.includes('-finance')) {
            protocolSlugs.push(slug.split('-finance')[0])
        } else {
            protocolSlugs.push(slug + '-finance');
        }
        if (slug.includes('-v2')) {
            protocolSlugs.push(slug.split('-v2')[0])
        }
        if (slug.includes('-v3')) {
            protocolSlugs.push(slug.split('-v3')[0])
        }
    })

    // Filter defi llama protocols for supported chains, supported schema types, and protocols already accounted for
    const protocolsToDevelop = defiLlamaProtocols.filter(x => {
        let onSupportedChain = false;
        x.chains.forEach((x: any) => {
            if (!!Object.keys(NetworkLogos).includes(x.toLowerCase())) {
                onSupportedChain = true;
            }
        })
        const supportedCategory = Object.keys(categoryTypesSupported).includes(x?.category?.toLowerCase());
        let slugNotUsed = false;
        if (!protocolSlugs.includes(x.slug) && !protocolSlugs.includes(x.slug.split('-')[0]) && !protocolSlugs.includes(x.slug + '-finance') && !protocolSlugs.includes(x.slug + '-protocol')) {
            slugNotUsed = true;
        }

        return slugNotUsed && onSupportedChain && supportedCategory
    }).sort((a, b) => b.tvl - a.tvl);

    const defiLlamaTableRows: any[] = protocolsToDevelop.map((protocol) => {
        return <TableRow onClick={() => window.location.href = "https://defillama.com/protocol/" + protocol.slug} key={protocol.slug + "PROTOCOLLISTROW"} sx={{ height: "10px", width: "100%", backgroundColor: "rgba(22,24,29,0.9)", cursor: "pointer" }}>
            <TableCell
                sx={{ padding: "0 0 0 6px", verticalAlign: "middle", height: "30px" }}
            >{protocol.name}</TableCell>
            <TableCell sx={{ padding: "0", paddingRight: "6px", textAlign: "right", display: "flex" }}>
                {protocol.chains.map((x: string) => {
                    if (!Object.keys(NetworkLogos).includes(x.toLowerCase()) && !Object.keys(networkMapping).includes(x.toLowerCase())) {
                        return null;
                    }
                    return <NetworkLogo key={'PROTOCOLLISTROWNETWORK' + x} size={30} network={x.toLowerCase()} />
                })}
            </TableCell>
            <TableCell sx={{ padding: "0", paddingRight: "6px", textAlign: "right" }}>
                ${formatIntToFixed2(protocol.tvl)}
            </TableCell>
            <TableCell sx={{ padding: "0", paddingRight: "6px", textAlign: "right" }}>
                {categoryTypesSupported[protocol.category.toLowerCase()]}
            </TableCell>
        </TableRow>
    });

    const columnLabels: string[] = [
        "Name",
        "Chains",
        "TVL",
        "Schema Type"
    ];

    const tableHead = (
        <TableHead sx={{ height: "20px" }}>
            <TableRow sx={{ height: "20px" }}>
                {columnLabels.map((x, idx) => {
                    let textAlign = "left";
                    let paddingLeft = "0px";
                    let minWidth = "auto"
                    let maxWidth = "auto";
                    if (idx > 1) {
                        textAlign = "right";
                        paddingLeft = "16px";
                    }
                    if (idx === 0) {
                        minWidth = "300px";
                        maxWidth = "300px";
                    }
                    return (
                        <TableCell sx={{ paddingLeft, minWidth, maxWidth }} key={"column" + x}>
                            <Typography variant="h5" fontSize={14} fontWeight={500} sx={{ margin: "0", width: "100%", textAlign }}>
                                {x}
                            </Typography>
                        </TableCell>
                    );
                })}
            </TableRow>
        </TableHead>
    );

    return (
        <>
            <Button variant="contained" color="primary" sx={{ my: 4 }} onClick={() => navigate("/")}>
                Back To Deployments List
            </Button>
            <TableContainer sx={{ my: 4 }} key={"TableContainer-DefiLlama"}>
                <div>
                    <Typography
                        key={"typography-DefiLlama"}
                        variant="h3"
                        align="center"
                        fontWeight={500}
                        fontSize={36}
                        sx={{ padding: "6px", my: 2 }}
                    >
                        Protocols To Develop
                    </Typography>
                </div>
                <Table stickyHeader>
                    {tableHead}
                    <TableBody>{defiLlamaTableRows}</TableBody>
                </Table>
            </TableContainer>
        </>
    );
}

export default ProtocolsListByTVL;
