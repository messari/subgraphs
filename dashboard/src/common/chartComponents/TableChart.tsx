import { DataGrid } from "@mui/x-data-grid";
import { toDate } from "../../../src/utils/index";
import { percentageFieldList } from "../../constants";

interface TableChartProps {
  datasetLabel: string;
  dataTable: any;
}

export const TableChart = ({ datasetLabel, dataTable }: TableChartProps) => {
  const isPercentageField = percentageFieldList.find((x) => {
    return datasetLabel.toUpperCase().includes(x.toUpperCase());
  });
  if (dataTable) {
    const columns = [
      { field: "date", headerName: "Date", width: 120 },
      {
        field: "value",
        headerName: "Value",
        flex: 1,
      },
    ];
    let suffix = "";
    if (isPercentageField) {
      suffix = "%";
    }
    const hourly = datasetLabel.toUpperCase().includes("HOURLY");
    const tableData = dataTable.map((val: any, i: any) => {
      let returnVal = val.value.toLocaleString() + suffix;
      if (isPercentageField && Array.isArray(val.value)) {
        returnVal = val.value.map((ele: string) => ele.toLocaleString() + "%").join(", ");
      }
      return {
        id: i,
        date: toDate(val.date, hourly),
        value: returnVal,
      };
    });
    return (
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
    );
  }
  return null;
};
