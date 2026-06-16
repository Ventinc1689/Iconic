import json
import os
import boto3
from pydantic import BaseModel
from pydantic_ai import Agent, BinaryContent
from pydantic_ai.models.bedrock import BedrockConverseModel

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
RAW_BUCKET = os.environ['RAW_BUCKET']
PHOTO_TABLE = os.environ['PHOTO_TABLE']
MODEL_ID = 'us.anthropic.claude-sonnet-4-5-20250929-v1:0'

class MomentAnalysis(BaseModel):
    title: str
    player: list[str]
    game: str
    competition: str
    year: int
    caption: str

bedrock = BedrockConverseModel(MODEL_ID)

agent = Agent(
    model = bedrock,
    output_type = MomentAnalysis,
    system_prompt = (
        '''
            You are a football expert analyzing an iconic soccer moment. Look at this image and identify the moment. Title should be 1-5 words. Caption should be 2-3 sentences, describing what happened and why it matters historically. If there is already a famous title/name the moment is known for, use that as the title instead of generating a new one.
        '''
    )
)

def call_bedrock(event, context):
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
        image_data = response['Body'].read()

        # Detect the image format from the file extension
        ext = key.lower().split('.')[-1]
        media_type = 'image/jpeg' if ext in ['jpg', 'jpeg'] else f'image/{ext}'
        
        # Run the agent
        result = agent.run_sync([
            BinaryContent(data=image_data, media_type=media_type),
            'Analyze this soccer image and return the structured data.',
        ])

        data = result.output

        # Save the caption to DynamoDB
        table.update_item(
            Key={'photo_id': photo_id},
            UpdateExpression='''SET
                caption = :caption,
                title = :title,
                player = :player,
                game = :game,
                competition = :competition,
                match_year = :match_year,
                caption_status = :caption_status,
                photo_status = :photo_status
            ''',
            ExpressionAttributeValues={
                ':caption': data.caption,
                ':title': data.title,
                ':player': ', '.join(data.player) if data.player else 'Unknown',
                ':game': data.game,
                ':competition': data.competition,
                ':match_year': data.year,
                ':caption_status': 'done',
                ':photo_status': 'approved'
            },
        )