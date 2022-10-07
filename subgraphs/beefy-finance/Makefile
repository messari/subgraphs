all: template codegen deploy

template:
	npm run build --id=beefy-finance-$(network)

codegen:
	graph codegen

deploy:
	graph deploy --product hosted-service dmelotik/beefy-finance-$(network)