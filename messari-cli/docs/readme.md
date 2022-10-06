# messari CLI

A CLI for messari subgraph development. This CLI serves as a wrapper around the [graph-cli] as is relies on the [graph-cli] to codegen, build, and deploy subgraphs. This CLI is built using the gluegun framework just like the [graph-cli].

## Customizing your CLI (Gluegun Documentation)

Check out the documentation at https://github.com/infinitered/gluegun/tree/master/docs and https://infinitered.github.io/gluegun/#/?id=quick-start.

## Commands

- messari build
  - Alias: messari b
  - Description: Used for building subgraphs.
  - Usage: Run this command within a subgraph directory to build the subgraph (**root**/subgraphs/\*\*).
  - Deploy: Attach the `-d` flag to deploy the subgraph (`messar b -d`).
  - Help: Run `messari build --help` for more information about command options.
  - Options: Are passed optionally. If you do not pass an option, and it is required, you will be prompted for a response.

# License

MIT - see LICENSE
