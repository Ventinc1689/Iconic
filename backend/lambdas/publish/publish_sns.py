import json
import os
import boto3

sns = boto3.client('sns')
PHOTO_UPLOADED_TOPIC_ARN = os.environ['PHOTO_UPLOADED_TOPIC_ARN']

def publish_sns(event, context):
    sns.publish(
        TopicArn = PHOTO_UPLOADED_TOPIC_ARN,
        Message = json.dumps({
            'photo_id': event['photo_id'],
            'bucket': event['bucket'],
            'key': event['key'],
        }),
    )
    print(f"Published to SNS photo_id={event['photo_id']}")
