make: create codegen deploy

create:
	node ./setup/setup.js ${network}

codegen:
	graph codegen

deploy:
	graph deploy --product hosted-service messari/beefy-finance-${network}

clean:
	rm -rf ./generated