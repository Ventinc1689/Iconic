import json
import os
import io
import boto3
from PIL import Image

s3 = boto3.client('s3')
RAW_BUCKET = os.environ['RAW_BUCKET']
RESIZED_BUCKET = os.environ['RESIZED_BUCKET']
SIZES = [300, 800]

# Lambda function to handle SQS events triggered by messages from the SNS topic
def handler(event, context):
    for record in event['Records']: # Loop through each record in the SQS event

        # Parse the SNS message from the SQS record body
        sns_envelope = json.loads(record['body']) 

        # Extract the original bucket and key information from the SNS message payload
        payload = json.loads(sns_envelope['Message'])
        bucket = payload['bucket']
        key = payload['key']

        # Download the original image from the S3 bucket
        response = s3.get_object(Bucket=bucket, Key=key)
        image_data = response['Body'].read() # Read the image data from the S3
        original_image = Image.open(io.BytesIO(image_data)) # Open the image using PIL

        # Generate the thumbnail for each size
        for width in SIZES:
            ratio = width / original_image.width # Calculate the aspect ratio
            height = int(original_image.height * ratio) # Calculate the new height to maintain aspect ratio
            resized = original_image.resize((width, height), Image.LANCZOS) # Resize the image

            # save the resized image to a buffer
            buffer = io.BytesIO()
            resized.save(buffer, format='JPEG', quality=85) # Save the resized image to the buffer in JPEG
            buffer.seek(0) # Reset the buffer position to the beginning

            # Upload the resized image back to the S3 bucket 
            filename = key.split('/')[-1].replace('.jpg', '').replace('.jpeg', '').replace('.png', '')
            thumbnail_key = f"thumbnails/{filename}_{width}w.jpg" # Create a new key for the thumbnail

            s3.put_object(
                Bucket = RESIZED_BUCKET,
                Key = thumbnail_key,
                Body = buffer,
                ContentType = 'image/jpeg'
            )
        
        print(f"Saved thumbnail - {thumbnail_key} ({width}px wide)")