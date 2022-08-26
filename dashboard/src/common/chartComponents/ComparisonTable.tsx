import { Box, Button, TextField } from "@mui/material";
import { DataGrid, GridAlignment } from "@mui/x-data-grid";
import { useState } from "react";
import { formatIntToFixed2, toDate } from "../../../src/utils/index";

interface ComparisonTableProps {
  datasetLabel: string;
  dataTable: any;
  isMonthly: boolean;
  setIsMonthly: any;
}

export const ComparisonTable = ({ datasetLabel, dataTable, isMonthly, setIsMonthly }: ComparisonTableProps) => {
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
        field: "differenceVal",
        headerName: "Diff. (value)",
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
        const diff = Math.abs(val.value - dataTable.defiLlama[i].value);
        return {
          id: i,
          date: date,
          subgraphData: "$" + formatIntToFixed2(val.value),
          defiLlamaData: "$" + formatIntToFixed2(dataTable.defiLlama[i].value),
          differenceVal: "$" + formatIntToFixed2(diff),
          differencePercentage: ((diff / dataTable.defiLlama[i].value) * 100).toFixed(2) + "%",
        };
      })
      .reverse();

    return (
      <Box sx={{ height: "100%" }}>
        <Box>
          <Button onClick={() => setIsMonthly((prev: boolean) => !prev)}>View {isMonthly ? "daily" : "monthly"}</Button>
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
