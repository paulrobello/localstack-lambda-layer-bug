import json
from dynamodb_json import json_util as dynamo_json

def lambda_handler(event, context):
    print(json.dumps(event))

