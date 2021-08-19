import { EventBridgeEvent } from 'aws-lambda';
import { CloudWatchLogs } from 'aws-sdk';
import { SubscriptionFilters } from 'aws-sdk/clients/cloudwatchlogs';

const DEFAULT_FILTER_NAME = 'default-log-forwarder';

interface CloudwatchLogDetail {
    eventVersion: string;
    eventTime: string;
    eventSource: string;
    eventName: string;
    awsRegion: string;
    requestParameters: {
        logGroupName: string;
        destinationArn?: string;
        filterPattern?: string;
        filterName?: string;
    };
}

function getDefaultDestinationArn(): string {
    const destinationArn = process.env.DESTINATION_ARN;
    if (destinationArn) {
        return destinationArn;
    }
    throw new Error('DESTINATION_ARN not set in configuration');
}

async function getSubscriptionFilters(logGroupName: string, client: CloudWatchLogs): Promise<SubscriptionFilters> {
    const subscriptionFilters = await client.describeSubscriptionFilters({ logGroupName: logGroupName }).promise();
    if (subscriptionFilters.subscriptionFilters) {
        return subscriptionFilters.subscriptionFilters;
    }
    return [];
}

async function removeExcessFilters(
    client: CloudWatchLogs,
    logGroupName: string,
    existingFilters: CloudWatchLogs.SubscriptionFilter[]
): Promise<void> {
    if (existingFilters.length === 2 && existingFilters[1].filterName) {
        await client
            .deleteSubscriptionFilter({
                logGroupName: logGroupName,
                filterName: existingFilters[1].filterName
            })
            .promise();
    }
}

async function putSubscriptionFilter(client: CloudWatchLogs, logGroupName: string, defaultDestinationArn: string): Promise<void> {
    await client
        .putSubscriptionFilter({
            logGroupName: logGroupName,
            filterName: DEFAULT_FILTER_NAME,
            filterPattern: '',
            destinationArn: defaultDestinationArn
        })
        .promise();
}

export async function handler(event: EventBridgeEvent<string, CloudwatchLogDetail>): Promise<void> {
    const logGroupName = event.detail.requestParameters.logGroupName;
    const region = process.env.AWS_REGION;
    const client = new CloudWatchLogs({ region: region });
    const existingFilters = await getSubscriptionFilters(logGroupName, client);
    const defaultDestinationArn = getDefaultDestinationArn();
    const exists = existingFilters.some((filter) => filter.filterName === DEFAULT_FILTER_NAME && filter.destinationArn === defaultDestinationArn);
    if (!exists) {
        await removeExcessFilters(client, logGroupName, existingFilters);
        await putSubscriptionFilter(client, logGroupName, defaultDestinationArn);
    }
}
