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
            modelId=MODEL_ID,
            body=json.dumps({
                'anthropic_version': 'bedrock-2023-05-31',
                'max_tokens': 500,
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
                                'text': '''You are a football expert analyzing an iconic soccer moment. Look at this image and respond with only a JSON object. Do not wrap the JSON in markdown code blocks. Return only the raw JSON object.:
                                    {
                                        "title": "short memorable name for this moment",
                                        "player": "main player(s) involved",
                                        "match": "The two teams involved",
                                        "competition": "competition name",
                                        "year": "year this moment happened",
                                        "caption": "2-3 sentence caption describing what happened and why it matters historically"
                                    }
                                If you cannot identify specific details, make your best guess from visual cues. Return only the JSON, no markdown, no explanation. '''
                            },
                        ],
                    }
                ],
            }),
        )
        
        # Parse the response from Bedrock
        result = json.loads(bedrock_response['body'].read())
        raw_text = result['content'][0]['text'].strip()

        # Strip markdown code fences if the model wrapped its output
        if raw_text.startswith('```'):
            raw_text = raw_text.split('\n', 1)[-1]  # drop the opening ```json line
            raw_text = raw_text.rsplit('```', 1)[0].strip()

        try:
            data = json.loads(raw_text)
        except json.JSONDecodeError:
            data = {'caption': raw_text}

        # Save the caption to DynamoDB
        table.update_item(
            Key={'photo_id': photo_id},
            UpdateExpression='''SET
                caption = :caption,
                title = :title,
                player = :player,
                #m = :match,
                competition = :competition,
                #y = :year,
                caption_status = :cs
            ''',
            ExpressionAttributeNames={
                '#m': 'match',  
                '#y': 'year',  
            },
            ExpressionAttributeValues={
                ':caption': data.get('caption', ''),
                ':title': data.get('title', 'Untitled Moment'),
                ':player': data.get('player', 'Unknown'),
                ':match': data.get('match', ''),
                ':competition': data.get('competition', ''),
                ':year': data.get('year', 0),
                ':cs': 'done',
            },
        )