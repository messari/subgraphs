import { Box, IconButton, Tooltip } from "@mui/material";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import { FC, useMemo } from "react";
import LinkIcon from "@mui/icons-material/Link";
import { styled } from "../../styled";

const LinkBox = styled(Box)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  cursor: pointer;

  > svg {
    opacity: 0.4;
  }

  &:hover {
    > svg {
      opacity: 1;
    }
  }
`;

interface CopyLinkToClipboardProps {
  link: string;
  scrollId?: string;
}

export const CopyLinkToClipboard: FC<CopyLinkToClipboardProps> = ({ link, scrollId, children }) => {
  const newLink = useMemo(() => {
    const href = new URL(link);
    const p = new URLSearchParams(href.search);
    if (scrollId) {
      p.set("elementId", scrollId);
    } else {
      p.delete("elementId");
    }
    return `${href.origin}${href.pathname}?${p.toString()}`;
  }, [scrollId, link]);
  return (
    <Tooltip title="Copy link">
      {children ? (
        <LinkBox onClick={() => navigator.clipboard.writeText(newLink)}>
          {children}
          <LinkIcon />
        </LinkBox>
      ) : (
        <IconButton onClick={() => navigator.clipboard.writeText(newLink)}>
          <ShareOutlinedIcon />
        </IconButton>
      )}
    </Tooltip>
  );
};
