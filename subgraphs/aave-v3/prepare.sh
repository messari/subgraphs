#!/bin/sh
./node_modules/.bin/mustache protocols/aave-v3/config/networks/$1/$1.json protocols/aave-v3/config/templates/aave-v3.template.yaml > subgraph.yaml
