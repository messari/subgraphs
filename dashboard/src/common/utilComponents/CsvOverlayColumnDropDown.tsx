import { Autocomplete } from "@mui/material";
import React from "react";
import { ComboBoxInput } from "./ComboBoxInput";

interface CsvOverlayColumnDropDownProps {
  columnsList: string[];
  setSelectedColumn: any;
  selectedColumn: string;
}

export const CsvOverlayColumnDropDown = ({
  columnsList,
  setSelectedColumn,
  selectedColumn,
}: CsvOverlayColumnDropDownProps) => {
  const options = columnsList;
  return (
    <>
      <Autocomplete
        options={options}
        value={selectedColumn}
        sx={{ width: 300, height: "40px", padding: "0" }}
        size="small"
        onChange={(event: React.SyntheticEvent) => {
          const targEle = event?.target as HTMLLIElement;
          setSelectedColumn(targEle.innerText);
        }}
        renderInput={(params) => (
          <ComboBoxInput
            style={{ width: 300, height: "40px", padding: "0" }}
            label="Select Metric"
            params={params}
            setTextInput={(x: string) => console.log(x)}
          />
        )}
      />
    </>
  );
};
