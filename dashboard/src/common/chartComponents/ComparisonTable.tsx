import { Box, Button } from "@mui/material";
import { DataGrid, GridAlignment } from "@mui/x-data-grid";
import moment, { Moment } from "moment";
import { useState } from "react";
import { downloadCSV, formatIntToFixed2, tableCellTruncate, toDate, toUnitsSinceEpoch, upperCaseFirstOfString } from "../../../src/utils/index";
import { DatePicker } from "../utilComponents/DatePicker";

interface ComparisonTableProps {
  datasetLabel: string;
  dataTable: any;
  isHourly: boolean;
  jpegDownloadHandler: any;
  baseKey: string;
  overlayKey: string;
}

export const ComparisonTable = ({ datasetLabel, dataTable, isHourly, jpegDownloadHandler, baseKey, overlayKey }: ComparisonTableProps) => {
  const [sortColumn, setSortColumn] = useState<string>("date");
  const [sortOrderAsc, setSortOrderAsc] = useState<Boolean>(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dates, setDates] = useState<Moment[]>([]);

  function sortFunction(aArg: any, bArg: any) {
    let aVal = aArg[sortColumn];
    if (!isNaN(Number(aArg[sortColumn]))) {
      aVal = Number(aArg[sortColumn]);
    } else if (aArg[sortColumn].includes("%")) {
      aVal = Number(aArg[sortColumn].split("%").join(""));
    }
    let bVal = bArg[sortColumn];
    if (!isNaN(Number(bArg[sortColumn]))) {
      bVal = Number(bArg[sortColumn]);
    } else if (bArg[sortColumn].includes("%")) {
      bVal = Number(bArg[sortColumn].split("%").join(""));
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
          renderCell: (params: { [x: string]: any }) => {
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
      const datesSelectedTimestamps = dates.map((date: any) => date.format(formatStr));
      const differencePercentageArr: any = [];
      const dataTableCopy = JSON.parse(JSON.stringify({ ...dataTable }));
      dataTableCopy[baseKey] = dataTableCopy[baseKey].filter((obj: { [x: string]: any }) => {
        if (datesSelectedTimestamps.length > 0) {
          return datesSelectedTimestamps.includes(moment.utc(obj.date * 1000).format(formatStr));
        }
        return true;
      });
      dataTableCopy[overlayKey] = dataTableCopy[overlayKey].filter((obj: any) => {
        if (datesSelectedTimestamps.length > 0) {
          return datesSelectedTimestamps.includes(moment.utc(obj.date * 1000).format(formatStr));
        }
        return true;
      });

      const dateToValMap: any = {};
      dataTableCopy[overlayKey].forEach((val: any) => {
        const key = toUnitsSinceEpoch(toDate(val.date, isHourly), isHourly);
        dateToValMap[key] = val.value;
      });
      const tableData = dataTableCopy[baseKey]
        .map((val: any, idx: any) => {
          let date = toDate(val.date, isHourly);
          const dateKey = toUnitsSinceEpoch(toDate(val.date, isHourly), isHourly);
          let overlayVal = dateToValMap[dateKey];
          if (!overlayVal) {
            overlayVal = 0;
          }
          const diff = Math.abs(val.value - overlayVal);
          differencePercentageArr.push({ value: ((diff / overlayVal) * 100).toFixed(2) + "%", date: val.date });
          return {
            id: idx,
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
                for (let iteration = 0; iteration < length; iteration++) {
                  let objectIteration: any = {};
                  let hasUndefined = false;
                  objectIteration.date = dataTableCopy[Object.keys(dataTableCopy)[0]][iteration].date;
                  Object.keys(dataTableCopy).forEach((key: string) => {
                    if (dataTableCopy[key][iteration]?.value) {
                      objectIteration[key] = dataTableCopy[key][iteration]?.value;
                    } else {
                      hasUndefined = true;
                    }
                  });
                  if (differencePercentageArr[iteration]) {
                    objectIteration.differencePercentage = differencePercentageArr[iteration].value;
                  }
                  if (!hasUndefined) {
                    arrayToSend.push(objectIteration);
                  }
                }
                return downloadCSV(arrayToSend.sort(sortFunction).filter((obj: { [x: string]: any }) => {
                  if (datesSelectedTimestamps.length > 0) {
                    return datesSelectedTimestamps.includes(moment.utc(obj.date * 1000).format("YYYY-MM-DD"));
                  }
                  return true;
                }).map((json: { [x: string]: any }) => ({ ...json, date: moment.utc(json.date * 1000).format("YYYY-MM-DD") })), datasetLabel + '-csv', datasetLabel);
              } else {
                return downloadCSV(dataTableCopy.sort(sortFunction).filter((json: { [x: string]: any }) => {
                  if (datesSelectedTimestamps.length > 0) {
                    return datesSelectedTimestamps.includes(moment.utc(json.date * 1000).format("YYYY-MM-DD"));
                  }
                  return true;
                }).map((json: { [x: string]: any }) => ({ date: moment.utc(json.date * 1000).format("YYYY-MM-DD"), [datasetLabel]: json.value })), datasetLabel + '-csv', datasetLabel);
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
            onSortModelChange={((data: any[]) => {
              setSortColumn(data[0].field);
              setSortOrderAsc(data[0].sort === "asc");
            })}
            rows={tableData}
            columns={columns}
          />
        </Box>
      );
    }
  } catch (err: any) {
    console.error(err);
    return null;
  }

  return null;
};
