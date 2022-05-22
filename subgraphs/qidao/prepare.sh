#!/bin/sh
./node_modules/.bin/mustache config/$1.json subgraph.template.yaml > subgraph.yaml
