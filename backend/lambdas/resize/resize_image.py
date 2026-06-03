import json
import os
import io
import boto3
from PIL import Image

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
RAW_BUCKET = os.environ['RAW_BUCKET']
RESIZED_BUCKET = os.environ['RESIZED_BUCKET']
PHOTO_TABLE = os.environ['PHOTO_TABLE']

SIZE = 800 # Thumbnail width in pixels

# Lambda function to handle SQS events triggered by messages from the SNS topic
def resize_image(event, context):
    photo_table = dynamodb.Table(PHOTO_TABLE) # Get a reference to the DynamoDB table

    for record in event['Records']: # Loop through each record in the SQS event

        # Parse the SNS message from the SQS record body
        sns_envelope = json.loads(record['body']) 

        # Extract the original bucket and key information from the SNS message payload
        payload = json.loads(sns_envelope['Message'])
        bucket = payload['bucket']
        key = payload['key']
        photo_id = payload['photo_id']

        # Download the original image from the S3 bucket
        response = s3.get_object(Bucket=bucket, Key=key)
        image_data = response['Body'].read() # Read the image data from the S3
        original_image = Image.open(io.BytesIO(image_data)) # Open the image using PIL

        # Convert to RGB so JPEG encoding works for any input format (AVIF, WebP, PNG with alpha, etc.)
        if original_image.mode != 'RGB':
            original_image = original_image.convert('RGB')

        # Strip extension cleanly regardless of format
        basename = os.path.splitext(key.split('/')[-1])[0]

        ratio = SIZE / original_image.width
        height = int(original_image.height * ratio)
        resized = original_image.resize((SIZE, height), Image.LANCZOS)

        buffer = io.BytesIO()
        resized.save(buffer, format='JPEG', quality=95)
        buffer.seek(0)

        thumbnail_key = f"thumbnails/{basename}_{SIZE}w.jpg"

        s3.put_object(
            Bucket = RESIZED_BUCKET,
            Key = thumbnail_key,
            Body = buffer,
            ContentType = 'image/jpeg'
        )
        print(f"Saved thumbnail - {thumbnail_key}")

        photo_table.update_item(
            Key = { 'photo_id': photo_id },
            UpdateExpression = '''SET 
                thumbnail_key = :thumbnail_key, 
                resize_status = :resize_status
            ''',
            ExpressionAttributeValues = {
                ':thumbnail_key': thumbnail_key,
                ':resize_status': 'done'
            },
        )
        
        print(f"Updated DynamoDB photo_id={photo_id}")