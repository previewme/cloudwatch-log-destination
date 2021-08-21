import { default as createLogGroup } from './resources/cw-event-create-log-group.json';
import { handler } from '../src';

let mockDescribeSubscriptionFilter = jest.fn();
const mockDeleteSubscriptionFilter = jest.fn(() => {
    return {
        promise: jest.fn(() => Promise.resolve({}))
    };
});
const mockPutSubscriptionFilter = jest.fn(() => {
    return {
        promise: jest.fn(() => Promise.resolve({}))
    };
});

jest.mock('aws-sdk', () => {
    return {
        CloudWatchLogs: jest.fn(() => {
            return {
                describeSubscriptionFilters: mockDescribeSubscriptionFilter,
                deleteSubscriptionFilter: mockDeleteSubscriptionFilter,
                putSubscriptionFilter: mockPutSubscriptionFilter
            };
        })
    };
});

describe('Cloudwatch Logs have subscription filter correctly set', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        process.env = { ...OLD_ENV };
        process.env.DESTINATION_ARN = 'arn:jest-test';
        mockDescribeSubscriptionFilter = jest.fn(() => {
            return {
                promise: jest.fn(() => Promise.resolve({ subscriptionFilters: [] }))
            };
        });
    });

    afterAll(() => {
        process.env = OLD_ENV;
    });

    test('Empty array whe no subscription filters exist', async () => {
        delete process.env.DESTINATION_ARN;
        await expect(handler(createLogGroup)).rejects.toThrowError('DESTINATION_ARN not set in configuration');
    });

    test('Get subscription filter is called with the correct log group', async () => {
        await handler(createLogGroup);
        const calls = mockDescribeSubscriptionFilter.mock.calls;
        expect(calls[0]).toEqual([{ logGroupName: 'bhavik-test-log' }]);
    });

    test('Describe subscription filter does not contain subscription filters', async () => {
        mockDescribeSubscriptionFilter = jest.fn(() => {
            return {
                promise: jest.fn(() => Promise.resolve({}))
            };
        });

        await handler(createLogGroup);
        expect(mockDescribeSubscriptionFilter).toHaveBeenCalledTimes(1);
        expect(mockPutSubscriptionFilter).toHaveBeenCalledTimes(1);
        expect(mockDeleteSubscriptionFilter).not.toHaveBeenCalled();

        const calls = mockPutSubscriptionFilter.mock.calls;
        expect(calls[0]).toEqual([
            {
                logGroupName: 'bhavik-test-log',
                filterName: 'default-log-forwarder',
                filterPattern: '',
                destinationArn: 'arn:jest-test'
            }
        ]);
    });

    test('Does not attempt to create/update the subscription filter if it exists', async () => {
        mockDescribeSubscriptionFilter = jest.fn(() => {
            return {
                promise: jest.fn(() =>
                    Promise.resolve({
                        subscriptionFilters: [
                            {
                                filterName: 'default-log-forwarder',
                                destinationArn: 'arn:jest-test'
                            }
                        ]
                    })
                )
            };
        });

        await handler(createLogGroup);
        expect(mockDescribeSubscriptionFilter).toHaveBeenCalledTimes(1);
        expect(mockPutSubscriptionFilter).not.toHaveBeenCalled();
        expect(mockDeleteSubscriptionFilter).not.toHaveBeenCalled();
    });

    test('Removes existing subscription filter if at maximum already', async () => {
        mockDescribeSubscriptionFilter = jest.fn(() => {
            return {
                promise: jest.fn(() =>
                    Promise.resolve({
                        subscriptionFilters: [
                            {
                                filterName: 'filter-one',
                                destinationArn: 'arn:first-filter'
                            },
                            {
                                filterName: 'filter-two',
                                destinationArn: 'arn:second-filter'
                            }
                        ]
                    })
                )
            };
        });

        await handler(createLogGroup);
        expect(mockDescribeSubscriptionFilter).toHaveBeenCalledTimes(1);
        expect(mockDeleteSubscriptionFilter).toHaveBeenCalledTimes(1);
        expect(mockPutSubscriptionFilter).toHaveBeenCalledTimes(1);

        const deleteCall = mockDeleteSubscriptionFilter.mock.calls;
        expect(deleteCall[0]).toEqual([
            {
                logGroupName: 'bhavik-test-log',
                filterName: 'filter-two'
            }
        ]);

        const putCall = mockPutSubscriptionFilter.mock.calls;
        expect(putCall[0]).toEqual([
            {
                logGroupName: 'bhavik-test-log',
                filterName: 'default-log-forwarder',
                filterPattern: '',
                destinationArn: 'arn:jest-test'
            }
        ]);
    });

    test('Handle create log group event', async () => {
        await handler(createLogGroup);
        expect(mockDescribeSubscriptionFilter).toHaveBeenCalledTimes(1);
        expect(mockPutSubscriptionFilter).toHaveBeenCalledTimes(1);
        expect(mockDeleteSubscriptionFilter).not.toHaveBeenCalled();

        const calls = mockPutSubscriptionFilter.mock.calls;
        expect(calls[0]).toEqual([
            {
                logGroupName: 'bhavik-test-log',
                filterName: 'default-log-forwarder',
                filterPattern: '',
                destinationArn: 'arn:jest-test'
            }
        ]);
    });
});
