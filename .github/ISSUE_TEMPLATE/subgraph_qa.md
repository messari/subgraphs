---
name: Subgraph QA
about: QA a subgraph
title: "#qa; protocol name"
labels: "data quality"
assignees: bye43
---

## Review Info

| Description          | Info                                                                                                                                                                                          |
| :------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Subgraph Reviewed    | Add https://okgraph.xyz/ link to subgraph                                                                                                                                                     |
| Schema Version       | TODO                                                                                                                                                                                          |
| Subgraph Version     | TODO                                                                                                                                                                                          |
| Methodology Version  | TODO                                                                                                                                                                                          |
| Evidence Spreadsheet | (Optional: Link to google sheets) See example [here](https://docs.google.com/spreadsheets/d/1lyrlXGcY9_MXgHYjCA8yunNJ21sMm3SN/edit?usp=sharing&ouid=113122484653829417213&rtpof=true&sd=true) |

## Metric to Review

### Example: TVL

- The TVL subgraph data is not mathematically aligned with Dune Analytics data as it shows a 5-day average discrepancy of -45.45%. This is probably due to some large pools missing in the subgraph. For example, the OP token pool which currently has a TVL of about $693 million, is missing from the subgraph data.

February 6, 2023:

| Subgraph - 5-day average TVL | Dune Analytics - 5-day average TVL | Absolute difference | Difference % |
| :--------------------------- | :--------------------------------- | :------------------ | :----------- |
| 1,246,131,990.32             | 2,284,425,000.00                   | -1,038,293,009.68   | -45.45%      |

- Refer to the sheet 'Protocol'

### Example: Total Pool Count

- The official website only shows 100 pools/supported tokens, while the subgraph data has 124 pools.
- Refer to the sheet 'Protocol'

## Additional Notes

- Any other notes that don't fit into the above sections that are important to know.

## QA Summary

A summary of the QA. How many issues were found? How much does it impact the data fidelity of this subgraph?
