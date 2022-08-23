#!/bin/sh
./node_modules/.bin/mustache protocols/qidao/config/networks/$1/$1.json protocols/qidao/config/templates/qidao.template.yaml > subgraph.yaml
