import { Autocomplete, Typography } from "@mui/material";
import React, { useState } from "react";
import { useNavigate } from "react-router";
import { ComboBoxInput } from "./ComboBoxInput";

interface CsvOverlayColumnDropDownProps {
  columnsList: string[];
  setSelectedColumn: any;
  selectedColumn: string;
}

export const CsvOverlayColumnDropDown = ({
  columnsList,
  setSelectedColumn,
  selectedColumn
}: CsvOverlayColumnDropDownProps) => {
  const options = columnsList
  return (
    <>
      <Autocomplete
        options={options}
        value={selectedColumn}
        sx={{ width: 400, height: "100%" }}
        onChange={(event: React.SyntheticEvent) => {
          const targEle = event?.target as HTMLLIElement;
          setSelectedColumn(targEle.innerText);
        }}
        renderInput={(params) => (
          <ComboBoxInput label="Column Selection" params={params} setTextInput={(x: string) => console.log(x)} />
        )}
      />
    </>
  );
};
