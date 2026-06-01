import json
import os
import uuid
import boto3
from datetime import datetime, timezone

sns = boto3.client('sns')
dynamodb = boto3.resource('dynamodb')
PHOTO_UPLOADED_TOPIC_ARN = os.environ['PHOTO_UPLOADED_TOPIC_ARN']
PHOTO_TABLE = os.environ['PHOTO_TABLE']


# Lambda function to handle S3 events when a new image is uploaded to the bucket
def handler(event, context):
    photo_table = dynamodb.Table(PHOTO_TABLE) # Get a reference to the DynamoDB table

    for record in event['Records']:
        bucket = record['s3']['bucket']['name'] # Get the bucket name from the event record
        key = record['s3']['object']['key'] # Get the object key (file name) from the event record
        photo_id = str(uuid.uuid4()) # Generate a unique photo ID using UUID

        # Save the photo metadata to DynamoDB with a status of 'pending'
        photo_table.put_item(Item={
            'photo_id': photo_id,
            'bucket': bucket,
            'key': key,
            'status': 'pending',
            'uploaded_at': datetime.now(timezone.utc).isoformat()
        })

        # Builds the message payload to be published to the SNS topic
        payload = {
            'photo_id': photo_id,
            'bucket': bucket,
            'key': key
        }

        # Publish the message to the SNS topic
        sns.publish(
            TopicArn = PHOTO_UPLOADED_TOPIC_ARN,
            Message = json.dumps(payload)
        )

        print(f"Published to SNS — bucket: {bucket}, status=pending")