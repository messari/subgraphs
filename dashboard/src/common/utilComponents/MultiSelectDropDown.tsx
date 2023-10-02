import { Autocomplete, Typography } from "@mui/material";
import React, { useState } from "react";
import { ComboBoxInput } from "./ComboBoxInput";

interface MultiSelectDropDownProps {
  optionsList: string[];
  setOptionsSelected: any;
  optionsSelected: string[];
  label: string;
}

export const MultiSelectDropDown = ({
  optionsList,
  setOptionsSelected,
  optionsSelected,
  label,
}: MultiSelectDropDownProps) => {
  const options = ["All", ...optionsList];
  return (
    <>
      <Autocomplete
        options={options}
        value={optionsSelected}
        multiple
        size="medium"
        disableCloseOnSelect={true}
        disableListWrap={true}
        sx={{ width: 600, height: "100%" }}
        onChange={(event: React.SyntheticEvent) => {
          const targEle = event?.target as HTMLLIElement;
          let selected = null;
          if (targEle?.innerText) {
            if (optionsSelected.includes(targEle.innerText)) {
              selected = targEle.innerText;
            } else {
              if (targEle.innerText.toUpperCase() === "ALL" || optionsSelected[0]?.toUpperCase() === "ALL") {
                setOptionsSelected([targEle.innerText]);
              } else if (!optionsSelected.includes(targEle.innerText)) {
                setOptionsSelected([...optionsSelected, targEle.innerText]);
              }
            }
          } else {
            if (targEle?.parentElement?.childNodes) {
              Array.from(targEle.parentElement.childNodes)?.forEach((x: any) => {
                if (optionsSelected.includes(x.innerText)) {
                  selected = x.innerText;
                }
              });
            }
            if (!selected && targEle?.parentElement?.parentElement?.childNodes) {
              Array.from(targEle.parentElement.parentElement.childNodes)?.forEach((x: any) => {
                if (optionsSelected.includes(x.innerText)) {
                  selected = x.innerText;
                }
              });
            }
          }
          if (selected) {
            const idx = optionsSelected.indexOf(selected);
            const selectionsCopy = [...optionsSelected];
            selectionsCopy.splice(idx, 1);
            setOptionsSelected(selectionsCopy);
          }
        }}
        renderInput={(params) => (
          <ComboBoxInput label={label} params={params} setTextInput={(x: string) => console.log(x)} />
        )}
      />
    </>
  );
};
