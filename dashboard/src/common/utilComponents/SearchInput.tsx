import { FC, KeyboardEventHandler, useRef } from "react";
import { Button, InputBase, inputBaseClasses, InputBaseProps, styled } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

const InputContainer = styled("div")`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  background: rgba(22, 24, 29, 1);
  padding: ${({ theme }) => theme.spacing(1)};
  border-radius: ${({ theme }) => theme.shape.borderRadius};

  .${inputBaseClasses.root} {
    flex-grow: 2;
  }
`;

interface SearchInputProps extends InputBaseProps {
  onSearch: (value: string) => void;
}

export const SearchInput: FC<SearchInputProps> = ({ onSearch, children, ...rest }) => {
  const ref = useRef<HTMLInputElement>(null);
  const keyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    rest.onKeyDown && rest.onKeyDown(e);
    if (e.key === "Enter") {
      onSearch(ref.current?.value ?? "");
    }
  };
  return (
    <InputContainer>
      <SearchIcon color="action" />
      <InputBase inputRef={ref} onKeyDown={keyDown} {...rest} />
      <Button variant="contained" color="primary" onClick={() => onSearch(ref.current?.value ?? "")}>
        {children}
      </Button>
    </InputContainer>
  );
};
