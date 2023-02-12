import { Box, Button, Grid, Tooltip, Typography } from "@mui/material";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { lineupChartDatapoints, toDate } from "../../utils";
import { CopyLinkToClipboard } from "../utilComponents/CopyLinkToClipboard";
import { CsvOverlayColumnDropDown } from "../utilComponents/CsvOverlayColumnDropDown";
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
    csvJSONProp: any;
    csvMetaDataProp: any;
    isStringField: boolean;
}

const colorList = ["rgb(53, 162, 235)", "red", "yellow", "lime", "pink", "black", "orange", "green"];

export const ChartContainer = ({ identifier, elementId, baseKey, datasetLabel, dataChart, dataTable, downloadAllCharts, chartsImageFiles, setChartsImageFiles, csvJSONProp, csvMetaDataProp, isStringField = false }: ChartContainerProps) => {
    const chartRef = useRef<any>(null);
    const [chartIsImage, setChartIsImage] = useState<boolean>(false);
    const [csvJSON, setCsvJSON] = useState<any>(null);
    const [csvMetaData, setCsvMetaData] = useState<any>({ fileName: "", columnName: "", csvError: null });
    const [compChart, setCompChart] = useState<any>({});
    const [overlayKey, setOverlayKey] = useState<string>("");
    const dataChartPropKeys = Object.keys(dataChart);
    let dataChartCopy = JSON.parse(JSON.stringify(dataChart));

    useEffect(() => {
        if (!!compChart && !csvJSONProp && !csvJSON && Array.isArray(dataChart)) {
            setCompChart({})
        }
    }, [dataChart, csvJSONProp, csvJSON])

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
        if (!!downloadAllCharts) {
            jpegDownloadHandler(true);
        }
    }, [downloadAllCharts]);

    useEffect(() => {
        setChartIsImage(false);
        if (!csvJSON && csvMetaData) {
            setCsvMetaData({ fileName: "", columnName: "", csvError: null });
        }
    }, [csvJSONProp, csvJSON]);

    useEffect(() => {
        try {
            let compChartToSet = compChart;
            let overlayKey = csvMetaData.fileName?.length > 0 ? csvMetaData.fileName : csvMetaDataProp.fileName;
            if (csvMetaData.columnName) {
                overlayKey += '-' + csvMetaData.columnName;
            }
            if ((csvJSON || csvJSONProp) && !Array.isArray(dataChartCopy) && typeof dataChartCopy === 'object' && (Object.keys(dataChartCopy).includes(csvMetaData.fileName?.length > 0 ? csvMetaData.fileName : csvMetaDataProp.fileName))) {
                compChartToSet = lineupChartDatapoints({ [baseKey?.length > 0 ? baseKey : "base"]: dataTable, [overlayKey]: dataChartCopy[csvMetaData.fileName?.length > 0 ? csvMetaData.fileName : csvMetaDataProp.fileName] });
                if (compChartToSet instanceof Error) {
                    throw new Error(compChartToSet?.message);
                } else {
                    setOverlayKey(overlayKey);
                    setCompChart(compChartToSet);
                }
            } else if (!Array.isArray(dataChartCopy) && typeof dataChartCopy === 'object' && Object.keys(dataChartCopy)?.length >= 2 && !!baseKey) {
                if (!overlayKey) {
                    overlayKey = Object.keys(dataChartCopy)[1];
                }
                compChartToSet = lineupChartDatapoints({ [baseKey]: dataChartCopy[baseKey], [Object.keys(dataChartCopy)[1]]: dataChartCopy[Object.keys(dataChartCopy)[1]] });
                if (compChartToSet instanceof Error) {
                    throw new Error(compChartToSet?.message);
                } else {
                    setOverlayKey(overlayKey);
                    setCompChart(compChartToSet);
                }
            } else if (dataTable?.length > 0) {
                let valueArray = [];
                let dateArray: number[] = [];
                if (csvJSON) {
                    if (csvJSON[csvMetaData?.columnName]) {
                        valueArray = csvJSON[csvMetaData?.columnName];
                        dateArray = csvJSON.date;
                    }
                } else if (csvJSONProp) {
                    if (csvJSONProp[csvMetaData?.columnName]) {
                        valueArray = csvJSONProp[csvMetaData?.columnName];
                        dateArray = csvJSONProp.date;
                    }
                }
                if (valueArray.length > 0) {
                    const overlayData = valueArray.map((x: any, idx: number) => {
                        if (dateArray[idx]) {
                            return {
                                date: dateArray[idx],
                                value: x
                            };
                        }
                    });
                    compChartToSet = lineupChartDatapoints({ [baseKey?.length > 0 ? baseKey : "base"]: dataTable, [overlayKey]: overlayData });
                    if (compChartToSet instanceof Error) {
                        throw new Error(compChart?.message);
                    } else if (compChartToSet) {
                        if (Object.keys(compChartToSet)?.length > 0) {
                            setCompChart(compChartToSet);
                            setOverlayKey(overlayKey);
                        }
                    }
                }
            }
        } catch (err) {
            console.log(err);
        }
    }, [dataTable, dataChart, csvJSONProp, csvJSON, csvMetaDataProp, csvMetaData])

    const hourly = datasetLabel.split("-")[0]?.toUpperCase()?.includes("HOURLY");

    let chart = null;
    let csvColumnOptions = null;
    let datasets: { data: any; backgroundColor: string; borderColor: string; label: string }[] = [];

    try {
        if (dataChartCopy) {
            let labels: string[] = [];
            let csvArr = [];
            let jsonToUse: any = null;
            if (csvJSONProp?.[csvMetaData?.columnName]) {
                jsonToUse = csvJSONProp[csvMetaData?.columnName].map((x: any, idx: number) => {
                    if (csvJSONProp?.date[idx]) {
                        return {
                            date: csvJSONProp?.date[idx],
                            value: x
                        };
                    }
                });
            }
            if (csvJSON) {
                jsonToUse = csvJSON;
            }

            if (jsonToUse) {
                if (Array.isArray(jsonToUse)) {
                    const csvDataPointsByDate: any = {};
                    let iterativeBaseData = dataChartCopy;
                    if (typeof dataChartCopy === "object" && !Array.isArray(dataChartCopy)) {
                        iterativeBaseData = dataChartCopy[Object.keys(dataChartCopy)[0]];
                    }
                    let formatStr = "YYYY-MM-DD";
                    if (hourly) {
                        formatStr = "YYYY-MM-DD hh";
                    }
                    jsonToUse.forEach((x: any) => csvDataPointsByDate[moment.utc(x.date * 1000).format(formatStr)] = x.value);
                    csvArr = iterativeBaseData.map((point: any) => {
                        let csvVal = 0;
                        let currentDateString = moment.utc(point.date * 1000).format(formatStr);
                        if (csvDataPointsByDate[currentDateString]) {
                            csvVal = csvDataPointsByDate[currentDateString];
                        }
                        return {
                            date: point.date,
                            value: csvVal
                        };
                    });
                } else {
                    const columnsList = Object.keys(jsonToUse).filter(x => x !== 'date');
                    csvColumnOptions = <CsvOverlayColumnDropDown setSelectedColumn={(x: string) => setCsvMetaData({ ...csvMetaData, columnName: x })} selectedColumn={csvMetaData.columnName} columnsList={columnsList} />
                    if (csvMetaData.columnName) {
                        let formatStr = "YYYY-MM-DD";
                        if (hourly) {
                            formatStr = "YYYY-MM-DD hh";
                        }
                        const csvDataPointsByDate: any = {};
                        let iterativeBaseData = dataChartCopy;
                        if (typeof dataChartCopy === "object" && !Array.isArray(dataChartCopy)) {
                            iterativeBaseData = dataChartCopy[Object.keys(dataChartCopy)[0]];
                        }
                        if (jsonToUse) {
                            jsonToUse?.date?.forEach((x: any, idx: number) => {
                                csvDataPointsByDate[moment.utc(x * 1000).format(formatStr)] = jsonToUse[csvMetaData.columnName][idx];
                            });
                        }
                        csvArr = iterativeBaseData.map((point: any) => {
                            let csvVal = 0;
                            let currentDateString = moment.utc(point.date * 1000).format(formatStr);
                            if (csvDataPointsByDate[currentDateString]) {
                                csvVal = csvDataPointsByDate[currentDateString];
                            }
                            return {
                                date: point.date,
                                value: csvVal
                            };
                        });
                    }
                }
            } else {
                csvArr = [];
            }
            if (Array.isArray(dataChartCopy)) {
                if (csvArr.length === 0) {
                    labels = dataChartCopy.map((e: any) => toDate(e.date));
                    datasets = [
                        {
                            data: dataChartCopy.map((e: any) => e.value),
                            backgroundColor: "rgba(53, 162, 235, 0.5)",
                            borderColor: "rgb(53, 162, 235)",
                            label: datasetLabel,
                        },
                    ];
                } else {
                    dataChartCopy = { [baseKey?.length > 0 ? baseKey : "base"]: dataChartCopy, [csvMetaData.fileName?.length > 0 ? csvMetaData.fileName : csvMetaDataProp.fileName]: csvArr };
                }
            }
            if (typeof dataChartCopy === "object" && !Array.isArray(dataChartCopy)) {
                if (csvArr.length > 0) {
                    dataChartCopy[csvMetaData.fileName?.length > 0 ? csvMetaData.fileName : csvMetaDataProp.fileName] = csvArr;
                } else if (Object.keys(dataChartCopy).includes(csvMetaData.fileName?.length > 0 ? csvMetaData.fileName : csvMetaDataProp.fileName) && !csvMetaData.columnName) {
                    delete dataChartCopy[csvMetaData.fileName?.length > 0 ? csvMetaData.fileName : csvMetaDataProp.fileName];
                }
                datasets = Object.keys(dataChartCopy).map((item: string, idx: number) => {
                    let key = item;
                    if (csvMetaData.columnName && item === (csvMetaData.fileName?.length > 0 ? csvMetaData.fileName : csvMetaDataProp.fileName)) {
                        key += '-' + csvMetaData.columnName;
                    }
                    if (labels.length === 0) {
                        labels = dataChartCopy[item].map((e: any) => toDate(e.date));
                    }
                    return {
                        data: dataChartCopy[item].map((e: any) => e.value),
                        backgroundColor: colorList[idx],
                        borderColor: colorList[idx],
                        label: key,
                    };
                });
                if (jsonToUse) {
                    if (Array.isArray(jsonToUse)) {
                        const csvDataPointsByDate: any = {};
                        let iterativeBaseData = dataChartCopy;
                        if (typeof dataChartCopy === "object" && !Array.isArray(dataChartCopy)) {
                            iterativeBaseData = dataChartCopy[Object.keys(dataChartCopy)[0]];
                        }
                        jsonToUse.forEach((x: any) => csvDataPointsByDate[moment.utc(x.date * 1000).format("YYYY-MM-DD")] = x.value);
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
                        const columnsList = Object.keys(jsonToUse).filter(x => x !== 'date');
                        csvColumnOptions = <CsvOverlayColumnDropDown setSelectedColumn={(x: string) => setCsvMetaData({ ...csvMetaData, columnName: x })} selectedColumn={csvMetaData.columnName} columnsList={columnsList} />
                        if (csvMetaData.columnName) {
                            const csvDataPointsByDate: any = {};
                            let iterativeBaseData = dataChartCopy;
                            if (typeof dataChartCopy === "object" && !Array.isArray(dataChartCopy)) {
                                iterativeBaseData = dataChartCopy[Object.keys(dataChartCopy)[0]];
                            }
                            if (jsonToUse) {
                                jsonToUse.date.forEach((x: any, idx: number) => csvDataPointsByDate[moment.utc(x * 1000).format("YYYY-MM-DD")] = jsonToUse[csvMetaData.columnName][idx]);
                            }
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
                        }
                    }
                    if (csvArr?.length > 0 && !datasets.find(x => x.label === (csvMetaData.fileName?.length > 0 ? csvMetaData.fileName : csvMetaDataProp.fileName) || (x.label.includes(csvMetaData.columnName) && x.label.includes(csvMetaData.fileName?.length > 0 ? csvMetaData.fileName : csvMetaDataProp.fileName)))) {
                        datasets.push({
                            data: csvArr,
                            backgroundColor: colorList[datasets.length],
                            borderColor: colorList[datasets.length],
                            label: csvMetaData.fileName?.length > 0 ? csvMetaData.fileName : csvMetaDataProp.fileName,
                        });
                    }
                }

                Object.keys(dataChartCopy).forEach(x => {
                    if (!dataChartPropKeys.includes(x) && !x.includes(csvMetaData.columnName)) {
                        delete dataChartCopy[x];
                    }
                })
            }

            const datasetsCopy = JSON.parse(JSON.stringify(datasets));

            const chartData = {
                labels,
                datasets: datasetsCopy,
            };
            chart = (<>
                <Box padding={2} sx={{ border: 1, maxWidth: "100%" }}>
                    {chartIsImage && !!chartRef.current?.toBase64Image('image/jpeg', 1) && chartRef.current?.toBase64Image('image/jpeg', 1).toString() !== "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gIoSUNDX1BST0ZJTEUAAQEAAAIYAAAAAAQwAABtbnRyUkdCIFhZWiAAAAAAAAAAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAAHRyWFlaAAABZAAAABRnWFlaAAABeAAAABRiWFlaAAABjAAAABRyVFJDAAABoAAAAChnVFJDAAABoAAAAChiVFJDAAABoAAAACh3dHB0AAAByAAAABRjcHJ0AAAB3AAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAFgAAAAcAHMAUgBHAEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAABvogAAOPUAAAOQWFlaIAAAAAAAAGKZAAC3hQAAGNpYWVogAAAAAAAAJKAAAA+EAAC2z3BhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABYWVogAAAAAAAA9tYAAQAAAADTLW1sdWMAAAAAAAAAAQAAAAxlblVTAAAAIAAAABwARwBvAG8AZwBsAGUAIABJAG4AYwAuACAAMgAwADEANv/bAEMAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/bAEMBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/AABEIAZUDKgMBEQACEQEDEQH/xAAVAAEBAAAAAAAAAAAAAAAAAAAAC//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8An/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9k=" ? <img style={{ objectFit: "contain", maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto" }} src={chartRef.current?.toBase64Image('image/jpeg', 1)} /> : (
                        <StandardChart
                            chartData={chartData}
                            chartRef={chartRef}
                        />)}
                </Box>
            </>);
        }
    } catch (err: any) {
        console.error(err.message)
        chart = <h3>{datasetLabel} chart container encountered an error upon rendering: {err.message}</h3>;
    }
    const linkToElementId = elementId.split(" ").join("%20");
    const staticButtonStyle = chartIsImage ? { backgroundColor: "rgb(102,86,248)", color: "white", border: "1px rgb(102,86,248) solid" } : { backgroundColor: "rgba(0,0,0,0)" };
    const dynamicButtonStyle = !chartIsImage ? { backgroundColor: "rgb(102,86,248)", color: "white", border: "1px rgb(102,86,248) solid" } : { backgroundColor: "rgba(0,0,0,0)" };

    let tableRender = <TableChart datasetLabel={datasetLabel} dataTable={dataTable} jpegDownloadHandler={() => jpegDownloadHandler(false)} isStringField={isStringField} />
    if (Object.keys(compChart)?.length > 0) {
        tableRender = <ComparisonTable
            datasetLabel="Custom CSV Comparison"
            dataTable={compChart}
            isHourly={hourly}
            jpegDownloadHandler={() => jpegDownloadHandler(false)}
            baseKey={baseKey?.length > 0 ? baseKey : "base"}
            overlayKey={overlayKey}
        />
    }
    if (!csvColumnOptions && csvJSONProp && !csvJSON) {
        const columnsList = Object.keys(csvJSONProp).filter(x => x !== 'date');
        csvColumnOptions = <CsvOverlayColumnDropDown setSelectedColumn={(x: string) => setCsvMetaData({ ...csvMetaData, columnName: x })} selectedColumn={csvMetaData.columnName} columnsList={columnsList} />
    }
    let chartTitle = datasetLabel;
    if ((csvJSON || csvJSONProp) && datasetLabel.length > 50) {
        chartTitle = `${chartTitle.slice(0, 20)} ... ${chartTitle.slice(chartTitle.length - 25, chartTitle.length)}`;
    }
    return (
        <div key={elementId} id={linkToElementId}>
            <Box sx={{ width: "62.5%", marginBottom: "8px" }} mt={3}>
                <Grid container justifyContent="space-between">
                    <CopyLinkToClipboard link={window.location.href} scrollId={linkToElementId}>
                        <Typography variant="h6">{chartTitle}</Typography>
                    </CopyLinkToClipboard>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        {csvColumnOptions}
                        <div style={{ marginLeft: "35px" }}>
                            <Tooltip placement="top" title={"Overlay chart with data points populated from a .csv file"}>
                                <UploadFileCSV style={{}} csvMetaData={csvMetaData} field={datasetLabel} csvJSON={csvJSON} setCsvJSON={(x: any) => {
                                    if (!x) {
                                        setCompChart({})
                                        setCsvJSON(null)
                                    } else {
                                        setCsvJSON(x);
                                    }
                                }} setCsvMetaData={setCsvMetaData} isEntityLevel={false} />
                            </Tooltip>
                            <Tooltip placement="top" title={"Chart can be dragged and dropped to another tab"}><Button onClick={() => setChartIsImage(true)} style={{ margin: "1.5px 0 0 0", padding: "6px 8px 5px 8px", borderRadius: "0", border: "1px rgb(102,86,248) solid", ...staticButtonStyle }}>Static</Button></Tooltip>
                            <Tooltip placement="top" title={"Show plot points on hover"}><Button onClick={() => setChartIsImage(false)} style={{ margin: "1.5px 0 0 0", padding: "6px 8px 5px 8px", borderRadius: "0", border: "1px rgb(102,86,248) solid", ...dynamicButtonStyle }}>Dynamic</Button></Tooltip>
                        </div>

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