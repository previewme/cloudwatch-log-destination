# cloudwatch-log-destination

[![CI Workflow](https://github.com/previewme/cloudwatch-log-destination/actions/workflows/ci.yml/badge.svg)](https://github.com/previewme/cloudwatch-log-destination/actions/workflows/ci.yml)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=previewme_cloudwatch-log-destination&metric=coverage)](https://sonarcloud.io/dashboard?id=previewme_cloudwatch-log-destination)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=previewme_cloudwatch-log-destination&metric=vulnerabilities)](https://sonarcloud.io/dashboard?id=previewme_cloudwatch-log-destination)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=previewme_cloudwatch-log-destination&metric=alert_status)](https://sonarcloud.io/dashboard?id=previewme_cloudwatch-log-destination)

Lambda function which automatically sets a destination for all newly created Cloudwatch Log groups. When a subscription filter is modified or deleted, the function will add back the expected subscription filter. In the case there are two subscription filters already, the last one is deleted.

This allows us to centralise all of our logs into a single account.

## Configuration

### Environment variables

| Environment Variable | Description | Required |
| --- | --- | --- |
| DESTINATION_ARN | The destination arn where the logs will be sent | Yes |

## Build

To build the lambda function run the following.

```
npm install
npm run build
```

## Test

To run the tests.

```
npm test
```

## Package

The following will package the lambda function into a zip bundle to allow manual deployment.

```
zip -q -r dist/lambda.zip node_modules dist
```
