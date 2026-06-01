import json
import os
import boto3

sns = boto3.client('sns')
PHOTO_UPLOADED_TOPIC_ARN = os.environ['PHOTO_UPLOADED_TOPIC_ARN']

# Lambda function to handle S3 events when a new image is uploaded to the bucket
def handler(event, context):
    for record in event['Records']:
        bucket = record['s3']['bucket']['name'] # Get the bucket name from the event record
        key = record['s3']['object']['key'] # Get the object key (file name) from the event record

        # Builds the message payload to be published to the SNS topic
        payload = {
            'bucket': bucket,
            'key': key
        }

        # Publish the message to the SNS topic
        sns.publish(
            TopicArn = PHOTO_UPLOADED_TOPIC_ARN,
            Message = json.dumps(payload)
        )

        print(f"Published to SNS — bucket: {bucket}, key: {key}")