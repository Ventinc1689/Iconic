import json
import os
import boto3
import base64

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
bedrock = boto3.client('bedrock-runtime')

RAW_BUCKET = os.environ['RAW_BUCKET']
PHOTO_TABLE = os.environ['PHOTO_TABLE']

MODEL_ID = 'us.anthropic.claude-sonnet-4-5-20250929-v1:0'

def handler(event, context):
    table = dynamodb.Table(PHOTO_TABLE)

    for record in event['Records']:

        # Unwrap SQS → SNS → payload
        sns_envelope = json.loads(record['body'])
        payload      = json.loads(sns_envelope['Message'])
 
        photo_id = payload['photo_id']
        bucket   = payload['bucket']
        key      = payload['key']

        # Download the image for S3
        response = s3.get_object(Bucket=bucket, Key=key)
        image_data = response['Body'].read() # Read the image data from the S3
        image_base64 = base64.standard_b64encode(image_data).decode('utf-8') # Encode the image data in base64 for Bedrock input

        # Detect the image format from the file extension
        ext = key.lower().split('.')[-1]
        media_type = 'image/jpeg' if ext in ['jpg', 'jpeg'] else f'image/{ext}'

        # Build the Bedrock request
        bedrock_response = bedrock.invoke_model(
            modelId = MODEL_ID,
            body=json.dumps({
                'anthropic_version': 'bedrock-2023-05-31',
                'max_tokens': 300,
                'messages': [
                    {
                        'role': 'user',
                        'content': [
                            {
                                'type': 'image',
                                'source': {
                                    'type':       'base64',
                                    'media_type': media_type,
                                    'data':       image_base64,
                                },
                            },
                            {
                                'type': 'text',
                                'text': (
                                    'You are a football expert writing captions for a gallery of iconic soccer moments. Look at this image and write a compelling 2-sentence caption that describes what is happening and why this moment matters historically. Be specific about players, teams, and the significance of the moment. If you cannot identify the specific moment, describe what you see and its emotional impact.'
                                ),
                            },
                        ],
                    }
                ],
            }),
        )
        
        # Parse the response from Bedrock
        result = json.loads(bedrock_response['body'].read())
        caption = result['content'][0]['text']

        print(f"Generated caption for photo_id={photo_id}: {caption[:80]}...")

        # Save the caption to DynamoDB
        table.update_item(
            Key={'photo_id': photo_id},
            UpdateExpression='SET caption = :c, caption_status = :cs',
            ExpressionAttributeValues={
                ':c':  caption,
                ':cs': 'done',
            },
        )