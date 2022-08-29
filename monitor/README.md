# Purpose

This script will function as a service continually querying deployed subgraphs and validating data. When outliers and issues are detected within the data, send an alert on Discord to bring attention to some inconsitency in the data.

# Implementation

## Execution Flow

- Set an interval to execute every hour
- Pull an updated list of deployments
- Execution flows from check to check, and within each check group by protocol type and exectute queries/validation asynchronously.

### Check groups

- Indexing status
    - Get list of valid current deployments
    - Get list of valid pending deployments
    - Combine two lists above into index failed depos and index success depos
    - Use index success list for validating subgraph data
    - send alerts for depos that have indexing errors
- protocol level data
    - Separated into TS data validation and non TS data validation
- pool level data
    - Separated into TS data validation and non TS data validation

### Discord Alerts

Need to post errors for messages, but only in the case it is the first time an error type is detected on a deployment or if it is a reminder

- Discord message for each check group
- Gets discord channel messages from the last week via api.
- If there is no message on channel within the last week with the same list of hash of error code list (order a-z), posts an error message to Discord for each deployment with a list of errors to fix
