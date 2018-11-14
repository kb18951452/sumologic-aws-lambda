# sumologic-securityhub-connector

This lambda function is used for importing findings from Sumo Logic to AWS Security Hub.


Made with ❤️ by Sumo Logic. Available on the [AWS Serverless Application Repository](https://aws.amazon.com/serverless)

![Sumo to Security Hub Collection Flow](https://s3.amazonaws.com/appdev-cloudformation-templates/sumologic-guardduty-evetns-processor.png)

## Setup

1. Go to https://serverlessrepo.aws.amazon.com/applications.
2. Search for sumologic-securityhub-connector and click on deploy.
3. Click on Deploy
4. Copy the value of SecurityHubConnectorApiUrl from Output which is the API Gateway endpoint.

5. Create a [Webhook connection](https://help.sumologic.com/Manage/Connections-and-Integrations/Webhook-Connections/Webhook-Connection-for-AWS-Lambda).Use the value copied in step 4 as URL.
Note: SAM application already secures the endpoint with AWS_IAM authorization type
   It should have the following payload
```{
  "Types": "<type> Ex: Software and Configuration Checks/Industry and Regulatory Standards/PCI-DSS Controls",
  "Description": "{{SearchDescription}}",
  "SourceUrl": "{{SearchQueryUrl}}",
  "GeneratorID": "{{SearchName}}",
  "Severity": <number from 0 to 100>,
  "Rows": "{{AggregateResultsJson}}"
  "ComplianceStatus"(Optional): "<status> - PASSED/WARNING/FAILED/NOT_AVAILABLE",
}
```
  Also make sure the IAM role or IAM user(whose credentials are used) has permissions to invoke the api in API Gateway. Refer the [docs](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-control-access-using-iam-policies-to-invoke-api.html)

6. Create a [Scheduled Search](https://help.sumologic.com/Dashboards-and-Alerts/Alerts/02-Schedule-a-Search).
Also the rows in AggregateResultsJson should contain following mandatory fields
"finding_time"(timestamp), "resource_type", "resource_id", "title"


## License

Apache License 2.0 (Apache-2.0)


## Support
Requests & issues should be filed on GitHub: https://github.com/SumoLogic/sumologic-aws-lambda/issues
