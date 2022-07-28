# How To Raise Subgraph Github Issues

## 1. Go to the Messari Github Issue Page

Link - https://github.com/messari/subgraphs/issues\

## 2. See if there is an existing issue for the subgraph

You can search for the protocol in the search bar and filter for Subgraph QAs via the data-quality tag. If there is an existing issue open, please add to the existing issue by commenting on it. 

![Alt text](docs/images/how-to-raise-github-issue-images/image-1.png)

## 3. If there is not an existing issue, raise an issue via the “New Issue” Button
![Alt text](docs/images/how-to-raise-github-issue-images/image-2.png)

## 4. Formatting the issue

- **Issue Title**
    - For tracking and clarity purposes, please state the name of the protocol, network, schema version, subgraph version, and methodology version. If you do not know the schema, subgraph, or methodology version just the protocol and network are sufficient.
    - Example - **DODO V2 QA (Ethereum) Schema Version 1.2.0 Subgraph Version 0.2.1 Methodology Version 1.0.0**
- **Issue Content**
    - Ad hoc Issues
        - If you are not formally raising a full subgraph QA issue, please post the metric that is incorrect along with any explanation and evidence. The more detailed the metric description the better i.e. which snapshot, pool ID, etc. Example below -
        ![Alt text](docs/images/how-to-raise-github-issue-images/image-3.png)
    - Subgraph QA Issues
        - If you are raising an issue for a full subgraph QA, please organize your content by protocol and pool metrics. Here is an example - https://github.com/messari/subgraphs/issues/333. Alternatively, you can also make more detailed comments on the google doc evidence sheet and link it within the issue and summarize general comments in the Github issue.
        - I use a google spreadsheet to format my feedback before I add it to Github, so that that it populates in clear tables. You have to copy and paste #### and **** titles and tables all separately or Github formats it weird. You can preview your comments by pressing “Preview” too. Here is a blank version of my spreadsheet - https://docs.google.com/spreadsheets/d/1we-QYrkhLkIiuw9pdCIojXnqbrnLttX4LYDW-te9gd0/edit?usp=sharing
        

## 5. Labeling the issue

Please label the issue with the tag “data-quality” and if you are submitting a full subgraph QA also add the issue to the “Subgraph QA Changes” project (DON’T DO SECOND PART UNLESS YOU ARE DOING A FORMAL SUBGRAPH QA). If you cannot do either of these, please ask @this-username-is-taken (https://www.github.com/this-username-is-taken) for permissions. 

![Alt text](docs/images/how-to-raise-github-issue-images/image-4.png)

## 6. That is it. You can submit.
