import { Box, Button, TextField } from "@mui/material";
import { DataGrid, GridAlignment } from "@mui/x-data-grid";
import { useState } from "react";
import { downloadCSV, toDate, toUnitsSinceEpoch } from "../../../src/utils/index";
import moment, { Moment } from "moment";
import { DatePicker } from "../utilComponents/DatePicker";

interface DynamicColumnTableChartProps {
    datasetLabel: string;
    dataTable: any;
    jpegDownloadHandler: any;
}

export const DynamicColumnTableChart = ({ datasetLabel, dataTable, jpegDownloadHandler }: DynamicColumnTableChartProps) => {
    const [sortColumn, setSortColumn] = useState<string>("date");
    const [sortOrderAsc, setSortOrderAsc] = useState<Boolean>(true);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dates, setDates] = useState<any>([]);
    const [showDateString, toggleDateString] = useState(true);

    function sortFunction(a: any, b: any) {
        let aVal = a[sortColumn];
        if (!isNaN(Number(a[sortColumn]))) {
            aVal = Number(a[sortColumn]);
        } else if (a[sortColumn].includes("%")) {
            aVal = Number(a[sortColumn].split("%").join(""));
        }
        let bVal = b[sortColumn];
        if (!isNaN(Number(b[sortColumn]))) {
            bVal = Number(b[sortColumn]);
        } else if (b[sortColumn].includes("%")) {
            bVal = Number(b[sortColumn].split("%").join(""));
        }

        if (sortOrderAsc) {
            return (aVal - bVal);
        } else {
            return (bVal - aVal);
        }
    }

    const hourly = datasetLabel.toUpperCase().includes("HOURLY");
    if (dataTable) {
        let xHeaderName = "Date";
        if (!showDateString) {
            if (hourly) {
                xHeaderName = "Hours";
            } else {
                xHeaderName = "Days";
            }
        }

        const columns = Object.keys(dataTable[0])?.map(chain => {
            if (chain === "date") {
                return { field: "date", headerName: xHeaderName, width: 120 };
            }
            return {
                field: chain,
                headerName: chain,
                width: 180,
                type: "number",
                headerAlign: "left" as GridAlignment,
                align: "left" as GridAlignment,
            }
        })


        const filteredData = dataTable.filter((val: any) =>
            dates.length
                ? dates.map((date: Moment) => date.format("l")).includes(moment.unix(val.date).utc().format("l"))
                : true,
        );
        const tableData = filteredData.map((val: any, i: any) => {

            let dateColumn = toDate(val.date, hourly);
            if (!showDateString) {
                dateColumn = toUnitsSinceEpoch(dateColumn, hourly);
            }

            return {
                id: i,
                ...val,
                date: dateColumn,
            };
        });

        return (
            <Box sx={{ height: "100%" }}>
                <Box position="relative" sx={{ marginTop: "-38px" }}>
                    {showDatePicker && <DatePicker dates={dates} setDates={setDates} />}

                    <Button className="Hover-Underline" onClick={() => setShowDatePicker((prev) => !prev)}>
                        Date Filter
                    </Button>
                    <Button className="Hover-Underline" onClick={() => toggleDateString(!showDateString)}>
                        {showDateString ? `${hourly ? "hours" : "days"} since epoch` : "Date MM/DD/YYYY"}
                    </Button>
                    <Button className="Hover-Underline" onClick={() => {
                        const datesSelectedTimestamps = dates.map((x: any) => x.format("YYYY-MM-DD"));
                        if (!Array.isArray(dataTable)) {
                            let length = dataTable[Object.keys(dataTable)[0]].length;
                            const arrayToSend: any = [];
                            for (let i = 0; i < length; i++) {
                                let objectIteration: any = {};
                                let hasUndefined = false;
                                objectIteration.date = dataTable[Object.keys(dataTable)[0]][i].date;
                                Object.keys(dataTable).forEach((x: any) => {
                                    if (dataTable[x][i]?.value) {
                                        objectIteration[x] = dataTable[x][i]?.value;
                                    } else {
                                        hasUndefined = true;
                                    }
                                });
                                if (!hasUndefined) {
                                    arrayToSend.push(objectIteration);
                                }
                            }
                            return downloadCSV(arrayToSend
                                .sort(sortFunction)
                                .filter((x: any) => {
                                    if (datesSelectedTimestamps.length > 0) {
                                        return datesSelectedTimestamps.includes(moment.utc(x.date * 1000).format("YYYY-MM-DD"));
                                    }
                                    return true;
                                })
                                .map((x: any) => ({ date: moment.utc(x.date * 1000).format("YYYY-MM-DD"), ...x })), datasetLabel + '-csv', datasetLabel);
                        } else {
                            downloadCSV(dataTable
                                .sort(sortFunction)
                                .filter((x: any) => {
                                    if (datesSelectedTimestamps.length > 0) {
                                        return datesSelectedTimestamps.includes(moment.utc(x.date * 1000).format("YYYY-MM-DD"));
                                    }
                                    return true;
                                })
                                .map((x: any) => ({ ...x, date: moment.utc(x.date * 1000).format("YYYY-MM-DD") })), datasetLabel + '-csv', datasetLabel);
                        }
                    }}>
                        Save CSV
                    </Button>
                    {jpegDownloadHandler ? <Button className="Hover-Underline" onClick={() => jpegDownloadHandler()}>Save Chart</Button> : null}
                </Box>
                <DataGrid
                    sx={{ textOverflow: "clip" }}
                    initialState={{
                        sorting: {
                            sortModel: [{ field: "date", sort: "desc" }],
                        },
                    }}
                    onSortModelChange={(x) => {
                        setSortColumn(x[0].field);
                        setSortOrderAsc(x[0].sort === "asc");
                    }}
                    rows={tableData}
                    columns={columns}
                />
            </Box>
        );
    }
    return null;
};
