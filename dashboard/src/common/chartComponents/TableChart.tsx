import { DataGrid } from "@mui/x-data-grid";
import { toDate } from "../../../src/utils/index";
import { percentageFieldList } from "../../constants";

export const TableChart = (_datasetLabel: string, dataTable: any, _dataLength: number) => {
  const isPercentageField = percentageFieldList.find((x) => {
    return _datasetLabel.toUpperCase().includes(x.toUpperCase());
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
    const hourly = _datasetLabel.toUpperCase().includes("HOURLY");
    const tableData = dataTable.map((val: any, i: any) => {
      return {
        id: i,
        date: toDate(val.date, hourly),
        value: val.value.toLocaleString() + suffix,
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
