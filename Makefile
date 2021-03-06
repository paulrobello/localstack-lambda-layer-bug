APP_NAME=portal
AWS_REGION=us-west-2
REGION=us-west-2
ENV=local
STACK=$(APP_NAME).$(ENV)
PULUMI_CONFIG_PASSPHRASE=test
PULUMI_BACKEND_URL=file://
ENDPOINT=http://localhost:4566
AWS_ACCESS_KEY=test
AWS_SECRET_ACCESS_KEY=test

.PHONY: all all-t ups downs cleanup restart list-s3 list-lambda get-logs-aws get-logs-db

# build everything && install dependencies
# create local stack containers, create pulumi stack, deploy pulumi stack, write output to file
ups: up install-npm-packages build-lambda build-pulumi add-pulumi-output-file
# destroy pulumi stack & resources, bring down localstack container
downs: destroy down
# reset everything
reset: reset-iac remove-pulumi-output-file remove-lambda-zips
# destroy pulumi stack & resources, bring down localstack container, remove zip artifacts from local directory
cleanup: downs prune-docker reset
# take down pulumi & localstack resources & containers, then bring them back up
restart: cleanup ups
# blow it out and build it again
it-again: down prune-docker reset ups
# get bucket upload uri
bucket-uri:
	jq -crM '.siteBucket.bucket | "s3://"+.+"/upload/"' pulumi_output.json
copy-file-to-bucket:
	aws --endpoint-url http://localhost:4566/ s3 cp ./package.json $(shell make -s bucket-uri)package.json
# list contents of upload folder in bucket
list-bucket:
	aws --endpoint-url http://localhost:4566/ s3 ls $(shell make -s bucket-uri)

lambda-log-group:
	jq -rcM '.uploadLambda.id|"/aws/lambda/"+.' pulumi_output.json

tail-lambda-log-group:
	aws --endpoint-url http://localhost:4566/ logs tail --format short --follow $(shell make -s lambda-log-group)

up:
	mkdir localstack_tmp >/dev/null 2>&1; echo dont_care >/dev/null 2>&1
	docker compose up -d

build-lambda:
	cd ./lambda && ./build.sh

remove-lambda-zips:
	rm -rf ./lambda/*.zip || echo dont_care >/dev/null 2>&1

build-pulumi:
	export PULUMI_BACKEND_URL=$(PULUMI_BACKEND_URL); export PULUMI_CONFIG_PASSPHRASE=$(PULUMI_CONFIG_PASSPHRASE); \
	pulumi stack init $(STACK) || pulumi stack select $(STACK) && \
	pulumi config set aws:region $(REGION);export $(AWS_ACCESS_KEY);export $(AWS_SECRET_ACCESS_KEY);pulumi up -y -s $(STACK);

down:
	docker compose down -v; rm -rf localstack_tmp

install-npm-packages:
	yarn install

destroy:
	export PULUMI_CONFIG_PASSPHRASE=$(PULUMI_CONFIG_PASSPHRASE) && \
	export PULUMI_BACKEND_URL=$(PULUMI_BACKEND_URL) && pulumi destroy -y -s $(STACK) && pulumi stack rm -f -y -s $(STACK)

list-s3:
	aws --endpoint-url=$(ENDPOINT) s3 ls

get-logs-aws:
	docker logs localstack-fdp -f

reset-iac:
	rm -rf .pulumi Pulumi.*.local.yaml node_modules

prune-docker:
	docker system prune -a -f

add-pulumi-output-file:
	export PULUMI_CONFIG_PASSPHRASE=$(PULUMI_CONFIG_PASSPHRASE) && export PULUMI_BACKEND_URL=$(PULUMI_BACKEND_URL) && \
	pulumi stack output -j > pulumi_output.json

remove-pulumi-output-file:
	rm pulumi_output.json ; echo dont_care >/dev/null 2>&1
