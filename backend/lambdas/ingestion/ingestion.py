import json
import os
import uuid
import boto3
from datetime import datetime, timezone

dynamodb = boto3.resource('dynamodb')
step_function = boto3.client('stepfunctions')

PHOTO_TABLE = os.environ['PHOTO_TABLE']
STATE_MACHINE_ARN = os.environ['STATE_MACHINE_ARN']


# Lambda function to handle S3 events when a new image is uploaded to the bucket
def ingestion(event, context):
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
            'photo_status': 'pending',
            'uploaded_at': datetime.now(timezone.utc).isoformat()
        })

        # Start step function 
        step_function.start_execution(
            stateMachineArn = STATE_MACHINE_ARN,
            input = json.dumps({
                'photo_id': photo_id,
                'bucket': bucket,
                'key': key,
            })
        )

        print(f"Started step function for photo_id={photo_id}")