import { useEffect, useState } from "react";
import { Button, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { downloadCSV, formatIntToFixed2 } from "../utils";
import { Chart as ChartJS, registerables, PointElement } from "chart.js";
import { useNavigate } from "react-router";
import { NetworkLogo, NetworkLogos, networkMapping } from "../common/NetworkLogo";
import { ProtocolTypeDropDown } from "../common/utilComponents/ProtocolTypeDropDown";
import moment from "moment";

interface ProtocolsListByTVLProps {
    protocolsToQuery: { [x: string]: any };
    getData: any;
}

function ProtocolsListByTVL({ protocolsToQuery, getData }: ProtocolsListByTVLProps) {
    const navigate = useNavigate();

    ChartJS.register(...registerables);
    ChartJS.register(PointElement);

    const [defiLlamaProtocols, setDefiLlamaProtocols] = useState<any[]>([]);
    const [defiLlamaProtocolsLoading, setDefiLlamaProtocolsLoading] = useState<boolean>(false);
    const [currentProtocolType, setProtocolType] = useState<string>("All Protocol Types");
    const fetchDefiLlamaProtocols = () => {
        setDefiLlamaProtocolsLoading(true);
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
                setDefiLlamaProtocolsLoading(false);
            })
            .catch((err) => {
                setDefiLlamaProtocolsLoading(false);
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
        "All Protocol Types": "All Protocol Types",
        "yield": "Vaults",
        "yield aggregator": "Vaults",
        "reserve currency": "CDP",
        "cdp": "CDP",
        "lending": "Lending",
        "dexes": "Exchanges",
        "nft lending": "NFT Lending",
        "nft marketplace": "NFT Marketplace",
    }


    const protocolSlugs = Object.keys(protocolsToQuery);

    Object.keys(protocolsToQuery).forEach(slug => {
        if (slug.includes('-finance')) {
            protocolSlugs.push(slug.split('-finance')[0]);
        } else {
            protocolSlugs.push(slug + '-finance');
        }
        if (slug.includes('-v2')) {
            protocolSlugs.push(slug.split('-v2')[0]);
        }
        if (slug.includes('-v3')) {
            protocolSlugs.push(slug.split('-v3')[0]);
        }
    })

    const protocolTypeList: string[] = [];

    // Filter defi llama protocols for supported chains, supported schema types, and protocols already accounted for
    const protocolsToDevelop = defiLlamaProtocols.filter((x: any, idx: number) => {
        try {
            let onSupportedChain = false;
            x.chains.forEach((chain: any) => {
                if (!!Object.keys(NetworkLogos).includes(chain.toLowerCase())) {
                    onSupportedChain = true;
                }
            })
            const supportedCategory = Object.keys(categoryTypesSupported).includes(x?.category?.toLowerCase());
            let slugNotUsed = false;
            if (!protocolSlugs.includes(x.slug) && !protocolSlugs.includes(x.slug.split('-')[0]) && !protocolSlugs.includes(x.slug + '-finance') && !protocolSlugs.includes(x.slug + '-protocol')) {
                slugNotUsed = true;
            }

            let isCurrentProtocolType = categoryTypesSupported[x?.category?.toLowerCase()] === currentProtocolType;
            if (currentProtocolType === "" || currentProtocolType === "All Protocol Types") {
                isCurrentProtocolType = true;
            }
            if (!protocolTypeList.includes(x?.category?.toLowerCase()) && supportedCategory) {
                protocolTypeList.push(x?.category?.toLowerCase());
            }

            return slugNotUsed && onSupportedChain && supportedCategory && isCurrentProtocolType;
        } catch (err: any) {
            console.error(err.message)
            return false;
        }
    }).sort((a, b) => {
        let aAddedTVL = 0;
        Object.keys(a.chainTvls).forEach(x => {
            aAddedTVL += a.chainTvls[x];
        })

        let bAddedTVL = 0;
        Object.keys(b.chainTvls).forEach(x => {
            bAddedTVL += b.chainTvls[x];
        })

        return bAddedTVL - aAddedTVL;
    });

    const defiLlamaTableRows: any[] = protocolsToDevelop.map((protocol) => {
        let tvl = 0
        Object.keys(protocol.chainTvls).forEach(x => {
            tvl += protocol.chainTvls[x];
        })

        return <TableRow onClick={() => window.location.href = "https://defillama.com/protocol/" + protocol.slug} key={protocol.slug + "PROTOCOLLISTROW"} sx={{ height: "10px", width: "100%", backgroundColor: "rgba(22,24,29,0.9)", cursor: "pointer" }}>
            <TableCell
                sx={{ padding: "0 0 0 6px", verticalAlign: "middle", height: "30px" }}
            >{protocol.name}</TableCell>
            <TableCell sx={{ padding: "0", paddingRight: "6px", textAlign: "right", display: "flex" }}>
                {protocol.chains.map((x: string) => {
                    if (!Object.keys(NetworkLogos).includes(x.toLowerCase()) && !Object.keys(networkMapping).includes(x.toLowerCase())) {
                        return null;
                    }
                    return <NetworkLogo tooltip={x.toLowerCase()} key={'PROTOCOLLISTROWNETWORK' + x} size={30} network={x.toLowerCase()} />
                })}
            </TableCell>
            <TableCell sx={{ padding: "0", paddingRight: "6px", textAlign: "right" }}>
                ${formatIntToFixed2(tvl)}
            </TableCell>
            <TableCell sx={{ padding: "0", paddingRight: "6px", textAlign: "right" }}>
                {categoryTypesSupported[protocol.category.toLowerCase()]}
            </TableCell>
        </TableRow>
    });

    const columnLabels: string[] = [
        "Name",
        "Chains",
        "TVL (Sum Across Networks)",
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
                        <TableCell sx={{ paddingLeft, minWidth, maxWidth, paddingRight: 0 }} key={"column" + x}>
                            <Typography variant="h5" fontSize={14} fontWeight={500} sx={{ margin: "0", textAlign }}>
                                {x}
                            </Typography>
                        </TableCell>
                    );
                })}
            </TableRow>
        </TableHead>
    );

    let tableBody = <TableBody>{defiLlamaTableRows}</TableBody>;
    if (defiLlamaTableRows.length === 0) {
        tableBody = <Typography
            variant="h5"
            align="left"
            fontSize={22}
            sx={{ padding: "0 6px" }}
        >
            No Protocols Found With Selected Type
        </Typography>
    }
    if (defiLlamaProtocolsLoading) {
        tableBody = <div style={{ margin: "30px" }}><CircularProgress size={60} /></div>;
    }

    return (
        <div style={{ overflowX: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", margin: "40px 24px 10px 16px" }}>
                <Button variant="contained" color="primary" onClick={() => navigate("/")}>
                    Back To Deployments List
                </Button>
                <ProtocolTypeDropDown protocolTypeList={Object.values(categoryTypesSupported).filter((x, i, a) => a.indexOf(x) === i)} setProtocolType={(x: string) => setProtocolType(x)} currentProtocolType={currentProtocolType} />
            </div>

            <TableContainer sx={{ my: 4, mx: 2 }} key={"TableContainer-DefiLlama"}>
                <div style={{ width: "97.5%" }}>
                    <Typography
                        key={"typography-DefiLlama"}
                        variant="h3"
                        align="left"
                        fontWeight={500}
                        fontSize={38}
                        sx={{ my: 1 }}
                    >
                        Protocols To Develop
                    </Typography>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography
                            variant="h4"
                            align="left"
                            fontSize={26}
                        >
                            {currentProtocolType}
                        </Typography>
                        <Button variant="contained" color="primary" onClick={() => {
                            downloadCSV(protocolsToDevelop.map((protocol) => {
                                let tvl = 0;
                                Object.keys(protocol.chainTvls).forEach(x => {
                                    tvl += protocol.chainTvls[x];
                                })
                                return { name: protocol.name, chains: protocol.chains.join(","), schemaType: categoryTypesSupported[protocol.category.toLowerCase()], tvl: formatIntToFixed2(tvl) }
                            }), currentProtocolType + '-csv', currentProtocolType)
                        }}>
                            Save CSV
                        </Button>
                    </div>
                </div>
                <Table sx={{ width: "97.5%" }} stickyHeader>
                    {tableHead}
                    {tableBody}
                </Table>
            </TableContainer>
        </div>
    );
}

export default ProtocolsListByTVL;
