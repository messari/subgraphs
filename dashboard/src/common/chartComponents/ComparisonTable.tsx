import { LocalizationProvider, PickersDay, StaticDatePicker } from "@mui/lab";
import MomentAdapter from "@material-ui/pickers/adapter/moment";
import { Box, Button, TextField } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useState } from "react";
import { toDate, toUnitsSinceEpoch } from "../../../src/utils/index";
import { percentageFieldList } from "../../constants";
import moment, { Moment } from "moment";

interface ComparisonTableProps {
  datasetLabel: string;
  dataTable: any;
  isMonthly: boolean;
  setIsMonthly: any;
}

export const ComparisonTable = ({ datasetLabel, dataTable, isMonthly, setIsMonthly }: ComparisonTableProps) => {
  if (dataTable) {
    const columns = [
      { field: "date", headerName: "Date", flex: 1 },
      { field: "subgraphData", headerName: "Subgraph", flex: 1 },
      {
        field: "defiLlamaData",
        headerName: "DefiLlama",
        flex: 1,
      },
      {
        field: "differenceVal",
        headerName: "Diff. (value)",
        flex: 1,
      },
      {
        field: "differencePercentage",
        headerName: "Diff. (%)",
        flex: 1,
      },
    ];

    const tableData = dataTable.subgraph
      .map((val: any, i: any) => {
        let date = toDate(val.date);
        if (isMonthly) {
          date = date.split("-").slice(0, 2).join("-");
        }
        return {
          id: i,
          date: date,
          subgraphData: "$" + parseFloat(val.value.toFixed(2)).toLocaleString(),
          defiLlamaData: "$" + parseFloat(dataTable.defiLlama[i].value.toFixed(2)).toLocaleString(),
          differenceVal:
            "$" + parseFloat(Math.abs(val.value - dataTable.defiLlama[i].value).toFixed(2)).toLocaleString(),
          differencePercentage: (val.value / dataTable.defiLlama[i].value).toFixed(4) + "%",
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
