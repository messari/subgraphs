make: create codegen deploy

create:
	node ./setup/setup.js ${network}

codegen:
	graph codegen

deploy:
	graph deploy --product hosted-service ${deployment}

clean:
	rm -rf ./generated