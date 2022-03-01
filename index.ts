import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { PulumiUtil } from './utils';

// allow lambda to log to cloudwatch
export const lambdaLoggingPolicy = new aws.iam.Policy(
  'lambdaLoggingPolicy',
  {
    path: '/',
    description: 'IAM policy for logging from a lambda',
    policy: {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents'
          ],
          Resource: 'arn:aws:logs:*:*:*'
        }
      ]
    }
  },
  {provider: PulumiUtil.awsProvider}
);

export const lambdaRole = new aws.iam.Role(
  'lambdaRole',
  {
    assumeRolePolicy: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Principal: {
            Service: 'lambda.amazonaws.com'
          },
          Effect: 'Allow'
        }
      ]
    }
  },
  {provider: PulumiUtil.awsProvider}
);

new aws.iam.RolePolicyAttachment(
  'lambdaLoggingRoleAttachment',
  {
    role: lambdaRole.name,
    policyArn: lambdaLoggingPolicy.arn
  },
  {provider: PulumiUtil.awsProvider}
);

export const depsLambdaLayer = new aws.lambda.LayerVersion(
  'lambdaDeps',
  {
    compatibleRuntimes: ['python3.7'],
    code: new pulumi.asset.FileArchive('./lambda/python.zip'),
    layerName: 'lambdaDeps'
  },
  {provider: PulumiUtil.awsProvider}
);

export const uploadLambda = new aws.lambda.Function(
  'uploadLambda',
  {
    code: new pulumi.asset.FileArchive('./lambda/deploy.zip'),
    role: lambdaRole.arn,
    handler: 'lambda_function.lambda_handler',
    runtime: 'python3.7',
    layers: [depsLambdaLayer.arn],
    memorySize: 512,
    timeout: 15 * 60
  },
  {
    provider: PulumiUtil.awsProvider
  }
);
