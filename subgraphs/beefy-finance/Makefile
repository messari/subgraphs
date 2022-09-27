# used to make and deploy subgraphs for beefy
# beefy is special since there are hundreds of vaults and no factory contract
# so we need to generate the subgraph.yaml file dynamically

make: create codegen deploy

create:
	node ./setup/setup.js ${network}

codegen:
	graph codegen

deploy:
	graph deploy --product hosted-service ${deployment}

clean:
	rm -rf ./generated