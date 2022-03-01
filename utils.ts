import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { lstatSync, readdirSync } from 'fs';
import { join as pathJoin, sep as pathSep } from 'path';
const mime = require('mime');

/***
 * Ensure path starts with a /
 * @param path
 */
export const ensureLeadingSlash = (path: string) => '/' + path.replace(/^\/+/, '');


/***
 * Ensure path ends with a /
 * @param path
 */
export const ensureTrailingSlash = (path: string) => path.replace(/\/+$/, '') + '/';

/***
 * Strip leading / from path
 * @param path
 */
export const stripLeadingSlash = (path: string) => path.replace(/^\/+/, '');

/***
 * Strip trailing / from path
 * @param path
 */
export const stripTrailingSlash = (path: string) => path.replace(/\/+$/, '');


/***
 * Ensure S3 prefix ends with a / and does not start with /
 * @param prefix
 */
export const normalizeS3Prefix = (prefix: string) =>
  stripLeadingSlash(ensureTrailingSlash(prefix));


/***
 * Ensure path uses / as separator and removes trailing slashes.
 * @param path Path to normalize.
 */
export const normalizePath = (path: string) =>
  stripTrailingSlash((pathSep !== '/' ? path.replace(/(\\+)/g, '/') : path));


/***
 * Returns an array of files under @dir.
 * @param dir Directory to search.
 * @param recursive Should search be recursive. Default true.
 * @param sortFiles Should returned array be sorted. Useful for hashing. Default true.
 * @param includePattern If provided only files matching RegExp will be returned.
 * @param excludePattern If provided files matching RegExp will be omitted.
 * @param depth Used internally to limit recursion to no more than 50 and optimize sort.
 */
export const folderFileList = (
  dir: string,
  recursive: boolean = true,
  sortFiles: boolean = true,
  includePattern: RegExp | null = null,
  excludePattern: RegExp | null = null,
  depth: number = 0
): string[] => {
  const itemOutputs: string[] = [];
  if (depth > 50) {
    throw new Error('Recursion limit of 50 exceeded!');
  }
  for (let item of readdirSync(dir)) {
    const filePath = normalizePath(pathJoin(dir, item));
    if (excludePattern && excludePattern.test(filePath)) {
      continue;
    }
    if (includePattern && !includePattern.test(filePath)) {
      continue;
    }
    if (recursive && lstatSync(filePath).isDirectory()) {
      const items = folderFileList(filePath, recursive, sortFiles, includePattern, excludePattern, depth + 1);
      itemOutputs.push(...items);
      continue;
    }
    itemOutputs.push(normalizePath(filePath));
  }
  // only sort files if requested and only at depth 0
  return sortFiles && depth === 0 ? itemOutputs.sort() : itemOutputs;
};

/***
 * Remap given path to a new path. Used to translate local path to bucket path.
 * @param dirBase Local filesystem path.
 * @param keyBase S3 Key to remap to.
 */
export const remapPathToS3 = (dirBase: string, keyBase: string) => {
  dirBase = normalizePath(dirBase);
  return folderFileList(dirBase)
    .map(normalizePath)
    .map(p => {
      return {path: p, key: p.replace(dirBase, keyBase)};
    });
};
/***
 * Recurse given folder and replicate structure in s3 starting at specified key.
 * @param dir Folder where all objects are located.
 * @param bucket S3 bucket for objects.
 * @param key S3 key prefix to put files. Defaults to no prefix.
 */
export const folderToS3 = (dir: string, bucket: aws.s3.Bucket, key: string = ''): aws.s3.BucketObject[] => {
  return remapPathToS3(dir, key).map(item => new aws.s3.BucketObject(
      item.key,
      {
        bucket: bucket,
        key: item.key,
        source: new pulumi.asset.FileAsset(item.path),
        contentType: mime.getType(item.path) || undefined
      },
      {provider: PulumiUtil.awsProvider}
    )
  );
};

export const REGION: aws.Region = 'us-west-2';

export class PulumiUtil {
  static awsProvider: any;
  static env: string;
}

PulumiUtil.awsProvider = new aws.Provider('localstack', {
  skipCredentialsValidation: true,
  skipMetadataApiCheck: true,
  skipRequestingAccountId: true,

  s3ForcePathStyle: true,
  accessKey: 'test',
  secretKey: 'test',
  region: REGION,
  endpoints: [{
    acm: 'http://localhost:4566',
    amplify: 'http://localhost:4566',
    apigateway: 'http://localhost:4566',
    apigatewayv2: 'http://localhost:4566',
    appconfig: 'http://localhost:4566',
    applicationautoscaling: 'http://localhost:4566',
    appsync: 'http://localhost:4566',
    athena: 'http://localhost:4566',
    backup: 'http://localhost:4566',
    batch: 'http://localhost:4566',
    cloudformation: 'http://localhost:4566',
    cloudfront: 'http://localhost:4566',
    cloudtrail: 'http://localhost:4566',
    cloudwatch: 'http://localhost:4566',
    cloudwatchlogs: 'http://localhost:4566',
    codecommit: 'http://localhost:4566',
    cognitoidentity: 'http://localhost:4566',
    cognitoidp: 'http://localhost:4566',
    docdb: 'http://localhost:4566',
    dynamodb: 'http://localhost:4566',
    dynamodbstreams: 'http://localhost:4566',
    ec2: 'http://localhost:4566',
    ecr: 'http://localhost:4566',
    ecs: 'http://localhost:4566',
    efs: 'http://localhost:4566',
    eks: 'http://localhost:4566',
    elasticache: 'http://localhost:4566',
    elasticbeanstalk: 'http://localhost:4566',
    elasticsearchservice: 'http://localhost:4566',
    elb: 'http://localhost:4566',
    elbv2: 'http://localhost:4566',
    emr: 'http://localhost:4566',
    eventbridge: 'http://localhost:4566',
    firehose: 'http://localhost:4566',
    glacier: 'http://localhost:4566',
    glue: 'http://localhost:4566',
    iam: 'http://localhost:4566',
    iot: 'http://localhost:4566',
    iotanalytics: 'http://localhost:4566',
    kafka: 'http://localhost:4566',
    kinesis: 'http://localhost:4566',
    kinesisanalytics: 'http://localhost:4566',
    kms: 'http://localhost:4566',
    lakeformation: 'http://localhost:4566',
    lambda: 'http://localhost:4566',
    mediastore: 'http://localhost:4566',
    neptune: 'http://localhost:4566',
    organizations: 'http://localhost:4566',
    qldb: 'http://localhost:4566',
    rds: 'http://localhost:4566',
    rdsdata: 'http://localhost:4566',
    redshift: 'http://localhost:4566',
    redshiftdata: 'http://localhost:4566',
    route53: 'http://localhost:4566',
    s3: 'http://localhost:4566',
    sagemaker: 'http://localhost:4566',
    secretsmanager: 'http://localhost:4566',
    ses: 'http://localhost:4566',
    sns: 'http://localhost:4566',
    sqs: 'http://localhost:4566',
    ssm: 'http://localhost:4566',
    stepfunctions: 'http://localhost:4566',
    sts: 'http://localhost:4566',
    timestreamquery: 'http://localhost:4566',
    timestreamwrite: 'http://localhost:4566',
    transfer: 'http://localhost:4566',
    xray: 'http://localhost:4566'
  }]
});


const stackPieces: string[] = pulumi.getStack().split('.');
PulumiUtil.env = stackPieces[stackPieces.length - 1];
