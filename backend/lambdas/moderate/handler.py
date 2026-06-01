import json
import os
import boto3

rekognition = boto3.client('rekognition')
dynamodb = boto3.resource('dynamodb')

RAW_BUCKET = os.environ['RAW_BUCKET']
PHOTO_TABLE = os.environ['PHOTO_TABLE']

CONFIDENCE_THRESHOLD = 85.0 # Minimum confidence level for detecting inappropriate content

def handler(event, context):
    table = dynamodb.Table(PHOTO_TABLE)

    for record in event['Records']:

        # Unwrap SQS → SNS → payload
        sns_envelope = json.loads(record['body'])
        payload      = json.loads(sns_envelope['Message'])
 
        photo_id = payload['photo_id']
        bucket   = payload['bucket']
        key      = payload['key']

        # Call Rekognition to detect inappropriate content in the image
        response = rekognition.detect_moderation_labels(
            Image = {
                'S3Object': {
                    'Bucket': bucket,
                    'Name': key
                }
             },
             MinConfidence = CONFIDENCE_THRESHOLD
        )

        moderation_labels = response['ModerationLabels']

        # unsafe content detected, reject photo
        if moderation_labels:
            status = 'rejected'
            reason = moderation_labels[0]['Name'] # Get the most likely reason for rejection
            print(f"Photo {photo_id} rejected due to {reason}")

        # no unsafe content detected, approve photo
        else:
            status = 'approved'
            reason = 'none'
            print(f"Photo {photo_id} approved")

        # Update the photo record in DynamoDB with the moderation result
        table.update_item(
            Key={'photo_id': photo_id},
            UpdateExpression='SET #s = :status, moderation_status = :ms, rejection_reason = :r',
            ExpressionAttributeNames={
                '#s': 'status',  
            },
            ExpressionAttributeValues={
                ':status': status,
                ':ms':     'done',
                ':r':      reason,
            },
        )