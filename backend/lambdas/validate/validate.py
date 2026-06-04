import json
import os
import boto3
import base64
from pydantic import BaseModel
from pydantic_ai import Agent, BinaryContent
from pydantic_ai.models.bedrock import BedrockConverseModel

s3 = boto3.client('s3')

class ValidationResult(BaseModel):
    is_soccer_moment: bool
    is_appropriate: bool
    rejection_reason: str

MODEL_ID = 'us.anthropic.claude-sonnet-4-5-20250929-v1:0'
bedrock = BedrockConverseModel(MODEL_ID)

agent = Agent(
    model = bedrock,
    output_type = ValidationResult,
    system_prompt = (
        '''
            You are a content moderator for a soccer photo gallery. Look at the image and determine:
                - Set 'is_soccer_moment' to false if the image is not related to soccer/football.
                - Set 'is_appropriate' to false if the image contains nudity, sexual content, or other material not suitable for a general audience. Shirtless celebrations, slide tackles, physical contact are normal for soccer and should be appropriate.
                - rejection_reason: short reaosn if rejected, empty string if approved.
        '''
    )
)

def validate(event, context):
    bucket = event['bucket']
    key = event['key']
    photo_id = event['photo_id']

    # Download and send to Bedrock
    response = s3.get_object(Bucket=bucket, Key=key)
    image_data = response['Body'].read()

    # Detect the image format from the file extension
    ext = key.lower().split('.')[-1]
    media_type = 'image/jpeg' if ext in ['jpg', 'jpeg'] else f'image/{ext}'
        
    # Run the agent
    result = agent.run_sync([
        BinaryContent(data=image_data, media_type=media_type),
        'Validate this image for soccer gallery.',
    ])

    data = result.output

    return {
        'photo_id': photo_id,
        'bucket': bucket,
        'key': key,
        'is_valid': data.is_soccer_moment and data.is_appropriate,
        'rejection_reason': data.rejection_reason,
    }
