import { Box, Button, TextField } from "@mui/material";
import { DataGrid, GridAlignment } from "@mui/x-data-grid";
import moment from "moment";
import { useState } from "react";
import { downloadCSV, formatIntToFixed2, toDate } from "../../../src/utils/index";

interface ComparisonTableProps {
  datasetLabel: string;
  dataTable: any;
  isMonthly: boolean;
  setIsMonthly: any;
  jpegDownloadHandler: any;
}

export const ComparisonTable = ({ datasetLabel, dataTable, isMonthly, setIsMonthly, jpegDownloadHandler }: ComparisonTableProps) => {
  if (dataTable) {
    const columns = [
      {
        field: "date",
        headerName: "Date",
        minWidth: 100,
        headerAlign: "right" as GridAlignment,
        align: "right" as GridAlignment,
      },
      {
        field: "subgraphData",
        headerName: "Subgraph",
        minWidth: 160,
        headerAlign: "right" as GridAlignment,
        align: "right" as GridAlignment,
      },
      {
        field: "defiLlamaData",
        headerName: "DefiLlama",
        minWidth: 160,
        headerAlign: "right" as GridAlignment,
        align: "right" as GridAlignment,
      },
      {
        field: "differencePercentage",
        headerName: "Diff. (%)",
        minWidth: 120,
        headerAlign: "right" as GridAlignment,
        align: "right" as GridAlignment,
      },
    ];
    const tableData = dataTable.subgraph
      .map((val: any, i: any) => {
        let date = toDate(val.date);
        if (isMonthly) {
          date = date.split("-").slice(0, 2).join("-");
        }
        let llamaVal = dataTable.defiLlama.find((point: any) => {
          if (isMonthly) {
            return toDate(point?.date)?.split("-")?.slice(0, 2)?.join("-");
          }
          return toDate(point?.date) === date;
        })?.value;
        if (!llamaVal) {
          llamaVal = 0;
        }
        const diff = Math.abs(val.value - llamaVal);
        return {
          id: i,
          date: date,
          subgraphData: "$" + formatIntToFixed2(val.value),
          defiLlamaData: "$" + formatIntToFixed2(llamaVal),
          differencePercentage: ((diff / llamaVal) * 100).toFixed(2) + "%",
        };
      })
      .reverse();

    return (
      <Box sx={{ height: "100%" }}>
        <Box position="relative" sx={{ marginTop: "-38px" }}>
          <Button onClick={() => setIsMonthly((prev: boolean) => !prev)}>View {isMonthly ? "daily" : "monthly"}</Button>
          <Button onClick={() => jpegDownloadHandler()}>Save Chart</Button>
          <Button className="Hover-Underline" onClick={() => {
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
              return downloadCSV(arrayToSend.sort((a: any, b: any) => (Number(a.date) - Number(b.date))).map((x: any) => ({ date: moment.utc(x.date * 1000).format("YYYY-MM-DD"), ...x })), datasetLabel + '-csv', datasetLabel);
            } else {
              return downloadCSV(dataTable.sort((a: any, b: any) => (Number(a.date) - Number(b.date))).map((x: any) => ({ date: moment.utc(x.date * 1000).format("YYYY-MM-DD"), [datasetLabel]: x.value })), datasetLabel + '-csv', datasetLabel);
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
          rows={tableData}
          columns={columns}
        />
      </Box>
    );
  }
  return null;
};
