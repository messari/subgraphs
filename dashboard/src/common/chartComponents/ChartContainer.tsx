import { Box, Button, Grid, Tooltip, Typography } from "@mui/material";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import { lineupChartDatapoints, toDate } from "../../utils";
import { CopyLinkToClipboard } from "../utilComponents/CopyLinkToClipboard";
import { UploadFileCSV } from "../utilComponents/UploadFileCSV";
import { ComparisonTable } from "./ComparisonTable";
import { StandardChart } from "./StandardChart";
import { TableChart } from "./TableChart";

interface ChartContainerProps {
    identifier: string;
    datasetLabel: string;
    dataChart: any;
    dataTable: any;
    downloadAllCharts: boolean;
    elementId: string;
    baseKey: string;
    chartsImageFiles: any;
    setChartsImageFiles: any;
}

export const ChartContainer = ({ identifier, elementId, baseKey, datasetLabel, dataChart, dataTable, downloadAllCharts, chartsImageFiles, setChartsImageFiles }: ChartContainerProps) => {
    const chartRef = useRef<any>(null);
    const [chartIsImage, setChartIsImage] = useState<boolean>(false);
    const [initialLoaded, setInitialLoaded] = useState<boolean>(false);
    const [csvJSON, setCsvJSON] = useState<any>(null);
    const [csvMetaData, setCsvMetaData] = useState<any>({ fileName: "", columnName: "" });
    const [isMonthly, setIsMonthly] = useState(false);

    function jpegDownloadHandler(downloadInZip: boolean) {
        try {
            const link = document.createElement('a');
            const field = datasetLabel.split("-")[1] || datasetLabel;
            let freq = datasetLabel.split("-")[0]?.toUpperCase()?.includes("HOURLY") ? "hourly-" : "";
            if (datasetLabel.split("-")[0]?.toUpperCase()?.includes("DAILY")) {
                freq = "daily-";
            }
            if (field?.toUpperCase()?.includes("DAILY") || field?.toUpperCase()?.includes("HOURLY")) {
                freq = "";
            }
            if (downloadInZip) {
                setChartsImageFiles((prevState: any) => ({ ...prevState, [datasetLabel]: chartRef.current?.toBase64Image('image/jpeg', 1) }))
            } else {
                link.download = identifier + '-' + freq + field + "-" + moment.utc(Date.now()).format("MMDDYY") + ".jpeg";
                link.href = chartRef.current?.toBase64Image('image/jpeg', 1);
                link.click();
            }
        } catch (err) {
            return;
        }
    }

    useEffect(() => {
        if (typeof dataChart === "object") {
            setChartIsImage(false);
        } else {
            setChartIsImage(true);
        }
    }, [dataChart])

    useEffect(() => {
        if (!!downloadAllCharts) {
            jpegDownloadHandler(true);
        }
    }, [downloadAllCharts])

    let chart = null;

    try {
        if (dataChart) {
            let labels: string[] = [];
            let datasets: { data: any; backgroundColor: string; borderColor: string; label: string }[] = [];
            let csvArr = [];
            if (csvJSON) {
                const csvDataPointsByDate: any = {};
                let iterativeBaseData = dataChart;
                if (typeof dataChart === "object" && !Array.isArray(dataChart)) {
                    iterativeBaseData = dataChart[Object.keys(dataChart)[0]];
                }
                csvJSON.forEach((x: any) => csvDataPointsByDate[moment.utc(x.date * 1000).format("YYYY-MM-DD")] = x.value);
                csvArr = iterativeBaseData.map((point: any) => {
                    let csvVal = 0;
                    let currentDateString = moment.utc(point.date * 1000).format("YYYY-MM-DD");
                    if (csvDataPointsByDate[currentDateString]) {
                        csvVal = csvDataPointsByDate[currentDateString];
                    }
                    return {
                        date: point.date,
                        value: csvVal
                    };
                });
            } else {
                csvArr = [];
            }
            if (Array.isArray(dataChart)) {
                if (csvArr.length === 0) {
                    labels = dataChart.map((e: any) => toDate(e.date));
                    datasets = [
                        {
                            data: dataChart.map((e: any) => e.value),
                            backgroundColor: "rgba(53, 162, 235, 0.5)",
                            borderColor: "rgb(53, 162, 235)",
                            label: datasetLabel,
                        },
                    ];
                } else {
                    dataChart = { [baseKey?.length > 0 ? baseKey : "base"]: dataChart, [csvMetaData.fileName]: csvArr };
                }
            }
            if (typeof dataChart === "object" && !Array.isArray(dataChart)) {
                const colorList = ["rgb(53, 162, 235)", "red", "yellow", "lime", "pink", "black", "orange", "green"];
                if (csvArr.length > 0) {
                    dataChart[csvMetaData.fileName] = csvArr;
                } else if (Object.keys(dataChart).includes(csvMetaData.fileName)) {
                    delete dataChart[csvMetaData.fileName];
                }
                datasets = Object.keys(dataChart).map((item: string, idx: number) => {
                    if (labels.length === 0) {
                        labels = dataChart[item].map((e: any) => toDate(e.date));
                    }
                    return {
                        data: dataChart[item].map((e: any) => e.value),
                        backgroundColor: colorList[idx],
                        borderColor: colorList[idx],
                        label: item,
                    };
                });
            }
            const chartData = {
                labels,
                datasets: datasets,
            };
            chart = (<>
                <Box padding={2} sx={{ border: 1, maxWidth: "100%" }}>
                    {chartIsImage && !!chartRef.current?.toBase64Image('image/jpeg', 1) && chartRef.current?.toBase64Image('image/jpeg', 1).toString() !== "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gIoSUNDX1BST0ZJTEUAAQEAAAIYAAAAAAQwAABtbnRyUkdCIFhZWiAAAAAAAAAAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAAHRyWFlaAAABZAAAABRnWFlaAAABeAAAABRiWFlaAAABjAAAABRyVFJDAAABoAAAAChnVFJDAAABoAAAAChiVFJDAAABoAAAACh3dHB0AAAByAAAABRjcHJ0AAAB3AAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAFgAAAAcAHMAUgBHAEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAABvogAAOPUAAAOQWFlaIAAAAAAAAGKZAAC3hQAAGNpYWVogAAAAAAAAJKAAAA+EAAC2z3BhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABYWVogAAAAAAAA9tYAAQAAAADTLW1sdWMAAAAAAAAAAQAAAAxlblVTAAAAIAAAABwARwBvAG8AZwBsAGUAIABJAG4AYwAuACAAMgAwADEANv/bAEMAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/bAEMBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/AABEIAZUDKgMBEQACEQEDEQH/xAAVAAEBAAAAAAAAAAAAAAAAAAAAC//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8An/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9k=" ? <img style={{ objectFit: "contain", maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto" }} src={chartRef.current?.toBase64Image('image/jpeg', 1)} /> : (
                        <StandardChart
                            chartData={chartData}
                            chartRef={chartRef}
                            initialLoaded={initialLoaded}
                            setChartIsImage={setChartIsImage}
                            setInitialLoaded={setInitialLoaded}
                        />)}
                </Box>
            </>);
        }
    } catch (err: any) {
        return <h3>{datasetLabel} chart container encountered an error upon rendering: {err.message}</h3>;
    }
    const linkToElementId = elementId.split(" ").join("%20");
    const staticButtonStyle = chartIsImage ? { backgroundColor: "rgb(102,86,248)", color: "white", border: "1px rgb(102,86,248) solid" } : { backgroundColor: "rgba(0,0,0,0)" };
    const dynamicButtonStyle = !chartIsImage && !!initialLoaded ? { backgroundColor: "rgb(102,86,248)", color: "white", border: "1px rgb(102,86,248) solid" } : { backgroundColor: "rgba(0,0,0,0)" };

    let tableRender = <TableChart datasetLabel={datasetLabel} dataTable={dataTable} jpegDownloadHandler={() => jpegDownloadHandler(false)} />
    if (csvJSON) {
        let compChart = lineupChartDatapoints({ [baseKey?.length > 0 ? baseKey : "base"]: dataTable, [csvMetaData.fileName]: csvJSON }, 0);
        compChart[baseKey?.length > 0 ? baseKey : "base"]
            .forEach((val: any, i: any) => {
                const customCSVPoint = compChart[csvMetaData.fileName][i];
                if (!customCSVPoint) {
                    return;
                }

                const customCSVTimestamp = customCSVPoint?.date || 0;
                const baseDate = toDate(val.date);

                if (Math.abs(customCSVTimestamp - val.date) > 86400) {
                    const dateIndex = compChart[csvMetaData.fileName].findIndex((x: any) => toDate(x.date) === baseDate || x.date > val.date);
                    compChart[csvMetaData.fileName] = [...compChart[csvMetaData.fileName].slice(0, i), ...compChart[csvMetaData.fileName].slice(dateIndex, compChart[csvMetaData.fileName].length)];
                    compChart = lineupChartDatapoints({ ...compChart }, i);
                }
            });

        tableRender = <ComparisonTable
            datasetLabel="Custom CSV Comparison"
            dataTable={compChart}
            isMonthly={isMonthly}
            setIsMonthly={(x: boolean) => setIsMonthly(x)}
            jpegDownloadHandler={() => jpegDownloadHandler(false)}
            baseKey={baseKey?.length > 0 ? baseKey : "base"}
            overlayKey={csvMetaData.fileName}
        />
    }
    return (
        <div key={elementId} id={linkToElementId}>
            <Box sx={{ width: "62.5%" }} mt={3}>
                <Grid container justifyContent="space-between">
                    <CopyLinkToClipboard link={window.location.href} scrollId={linkToElementId}>
                        <Typography variant="h6">{datasetLabel}</Typography>
                    </CopyLinkToClipboard>
                    <div style={{ margin: "5px 0" }}>
                        <Tooltip placement="top" title={"Overlay chart with data points populated from a .csv file"}><UploadFileCSV field={datasetLabel} csvJSON={csvJSON} setCsvJSON={setCsvJSON} setChartIsImage={setChartIsImage} setCsvMetaData={setCsvMetaData} /></Tooltip>
                        <Tooltip placement="top" title={"Chart can be dragged and dropped to another tab"}><Button onClick={() => setChartIsImage(true)} style={{ padding: "1px 8px", borderRadius: "0", border: "1px rgb(102,86,248) solid", ...staticButtonStyle }}>Static</Button></Tooltip>
                        <Tooltip placement="top" title={"Show plot points on hover"}><Button onClick={() => setChartIsImage(false)} style={{ padding: "1px 8px", borderRadius: "0", border: "1px rgb(102,86,248) solid", ...dynamicButtonStyle }}>Dynamic</Button></Tooltip>
                    </div>

                </Grid>
            </Box>
            <Grid container justifyContent="space-between">
                <Grid key={datasetLabel + "chart1"} item xs={7.5}>
                    {chart}
                </Grid>
                <Grid key={datasetLabel + "table2"} item xs={4}>
                    {tableRender}
                </Grid>
            </Grid>
        </div>
    )
};
