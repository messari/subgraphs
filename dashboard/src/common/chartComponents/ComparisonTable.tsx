import { Box, Button } from "@mui/material";
import { DataGrid, GridAlignment } from "@mui/x-data-grid";
import moment from "moment";
import { useState } from "react";
import { downloadCSV, formatIntToFixed2, tableCellTruncate, toDate, upperCaseFirstOfString } from "../../../src/utils/index";
import { DatePicker } from "../utilComponents/DatePicker";

interface ComparisonTableProps {
  datasetLabel: string;
  dataTable: any;
  isMonthly: boolean;
  isHourly: boolean;
  setIsMonthly: any;
  jpegDownloadHandler: any;
  baseKey: string;
  overlayKey: string;
}

export const ComparisonTable = ({ datasetLabel, dataTable, isMonthly, isHourly, setIsMonthly, jpegDownloadHandler, baseKey, overlayKey }: ComparisonTableProps) => {
  const [sortColumn, setSortColumn] = useState<string>("date");
  const [sortOrderAsc, setSortOrderAsc] = useState<Boolean>(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dates, setDates] = useState<any>([]);

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

  try {
    if (dataTable) {
      const columns = [
        {
          field: "date",
          headerName: "Date",
          minWidth: (isHourly ? 130 : 100),
          headerAlign: "right" as GridAlignment,
          align: "right" as GridAlignment,
        },
        {
          field: baseKey,
          headerName: upperCaseFirstOfString(baseKey),
          minWidth: 160,
          headerAlign: "right" as GridAlignment,
          align: "right" as GridAlignment,
        },
        {
          field: overlayKey,
          headerName: upperCaseFirstOfString(overlayKey),
          minWidth: 160,
          headerAlign: "right" as GridAlignment,
          align: "right" as GridAlignment,
        },
        {
          field: "differencePercentage",
          headerName: "Diff. (%)",
          minWidth: 120,
          type: "number",
          headerAlign: "right" as GridAlignment,
          align: "right" as GridAlignment,
          renderCell: (params: any) => {
            const value = Number(params?.value);
            const cellStyle = { ...tableCellTruncate };
            cellStyle.width = "100%";
            cellStyle.textAlign = "right";
            return (
              <span style={cellStyle}>{value + (isNaN(Number(value)) ? "" : "%")}</span>
            );
          },
        },
      ];

      let formatStr = "YYYY-MM-DD";
      if (isHourly) {
        formatStr = "YYYY-MM-DD hh";
      }
      const datesSelectedTimestamps = dates.map((x: any) => x.format(formatStr));
      const differencePercentageArr: any = [];
      const dataTableCopy = JSON.parse(JSON.stringify({ ...dataTable }));
      dataTableCopy[baseKey] = dataTableCopy[baseKey].filter((x: any) => {
        if (datesSelectedTimestamps.length > 0) {
          return datesSelectedTimestamps.includes(moment.utc(x.date * 1000).format(formatStr));
        }
        return true;
      });
      dataTableCopy[overlayKey] = dataTableCopy[overlayKey].filter((x: any) => {
        if (datesSelectedTimestamps.length > 0) {
          return datesSelectedTimestamps.includes(moment.utc(x.date * 1000).format(formatStr));
        }
        return true;
      });
      const tableData = dataTableCopy[baseKey]
        .map((val: any, i: any) => {
          let date = toDate(val.date, isHourly);
          if (isMonthly) {
            date = date.split("-").slice(0, 2).join("-");
          }
          let overlayVal = dataTableCopy[overlayKey].find((point: any) => {
            if (isMonthly) {
              return toDate(point?.date)?.split("-")?.slice(0, 2)?.join("-");
            }
            return toDate(point?.date, isHourly) === date;
          })?.value;
          if (!overlayVal) {
            overlayVal = 0;
          }
          const diff = Math.abs(val.value - overlayVal);
          differencePercentageArr.push({ value: ((diff / overlayVal) * 100).toFixed(2) + "%", date: val.date });
          return {
            id: i,
            date: date,
            [baseKey]: "$" + formatIntToFixed2(val.value),
            [overlayKey]: "$" + formatIntToFixed2(overlayVal),
            differencePercentage: ((diff / overlayVal) * 100).toFixed(2),
          };
        })
        .reverse();

      return (
        <Box sx={{ height: "100%" }}>
          <Box position="relative" sx={{ marginTop: "-38px" }}>
            {showDatePicker && <DatePicker dates={dates} setDates={setDates} />}
            <Button className="Hover-Underline" onClick={() => setShowDatePicker((prev) => !prev)}>
              Date Filter
            </Button>
            <Button onClick={() => jpegDownloadHandler()}>Save Chart</Button>
            <Button className="Hover-Underline" onClick={() => {
              if (!Array.isArray(dataTableCopy)) {
                let length = dataTableCopy[Object.keys(dataTableCopy)[0]].length;
                const arrayToSend: any = [];
                for (let i = 0; i < length; i++) {
                  let objectIteration: any = {};
                  let hasUndefined = false;
                  objectIteration.date = dataTableCopy[Object.keys(dataTableCopy)[0]][i].date;
                  Object.keys(dataTableCopy).forEach((x: any) => {
                    if (dataTableCopy[x][i]?.value) {
                      objectIteration[x] = dataTableCopy[x][i]?.value;
                    } else {
                      hasUndefined = true;
                    }
                  });
                  if (differencePercentageArr[i]) {
                    objectIteration.differencePercentage = differencePercentageArr[i].value;
                  }
                  if (!hasUndefined) {
                    arrayToSend.push(objectIteration);
                  }
                }
                return downloadCSV(arrayToSend.sort(sortFunction).filter((x: any) => {
                  if (datesSelectedTimestamps.length > 0) {
                    return datesSelectedTimestamps.includes(moment.utc(x.date * 1000).format("YYYY-MM-DD"));
                  }
                  return true;
                }).map((x: any) => ({ ...x, date: moment.utc(x.date * 1000).format("YYYY-MM-DD") })), datasetLabel + '-csv', datasetLabel);
              } else {
                return downloadCSV(dataTableCopy.sort(sortFunction).filter((x: any) => {
                  if (datesSelectedTimestamps.length > 0) {
                    return datesSelectedTimestamps.includes(moment.utc(x.date * 1000).format("YYYY-MM-DD"));
                  }
                  return true;
                }).map((x: any) => ({ date: moment.utc(x.date * 1000).format("YYYY-MM-DD"), [datasetLabel]: x.value })), datasetLabel + '-csv', datasetLabel);
              }
            }}>
              Save CSV
            </Button>
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
  } catch (err: any) {
    console.error(err.message);
    return null;
  }

  return null;
};
