---
name: New Subgraph PR
about: Pull request checklist for building a new messari subgraph
title: "feat(#major); protocol-name; add subgraph"
---

**Describe the PR**

A clear and concise description of the PR. Preferably using bullet points.

- Added [protocol-name] subgraph using [x] schema

**Links**

Where can we see the subgraph deployment? The best place to link is [`okgraph.xyz`](https://okgraph.xyz/)

**New Subgraph Checklist**

- [ ] Researched protocol / contracts
- [ ] Modeled off this [template](https://github.com/messari/subgraphs/tree/master/subgraphs/_reference_) using the latest versions
- [ ] Updated title
- [ ] Added subgraph(s) to [deployment.json](https://github.com/messari/subgraphs/blob/master/deployment/deployment.json)
- [ ] Used standard subgraph libraries (if necessary/available)
- [ ] Viewed subgraph in https://subgraphs.messari.io/ to ensure no ERRORS from the automatic data validation / warnings are reasonable
- [ ] General aggregate metrics can be similar to known sources like the protocol or defi llama (The detailed QA will be done by a protocol specialist)
- [ ] Assigned the proper reviewers. If you are unsure, ask in our discord!
- [ ] Followed docs, especially [`WALKTHROUGH.md`](https://github.com/messari/subgraphs/blob/master/docs/WALKTHROUGH.md)

**New Developer Checklist**

If this is your first subgraph please go through this checklist before starting.

- [ ] [Setup](https://github.com/messari/subgraphs/blob/master/docs/SETUP.md) subgraph development environment
- [ ] Get a handle on typescript and graphql in our [resources](https://github.com/messari/subgraphs/blob/master/docs/RESOURCES.md)
- [ ] Go through the docs mentioned in ["Learn the Project"](https://github.com/messari/subgraphs#learn-the-project) in the README.md
  - [ ] [Structure](https://github.com/messari/subgraphs/blob/master/docs/STRUCTURE.md)
  - [ ] [Tooling](https://github.com/messari/subgraphs/blob/master/docs/TOOLING.md)
  - [ ] [Schema](https://github.com/messari/subgraphs/blob/master/docs/SCHEMA.md)
- [ ] Read these sections in ["Becoming a Subgraph Developer"](https://github.com/messari/subgraphs#becoming-a-subgraph-developer)
  - [ ] [Walkthrough](https://github.com/messari/subgraphs/blob/master/docs/WALKTHROUGH.md)
  - [ ] Skim [Errors](https://github.com/messari/subgraphs/blob/master/docs/ERRORS.md)
  - [ ] Understand how subgraphs [perform](https://github.com/messari/subgraphs/blob/master/docs/PERFORMANCE.md)
