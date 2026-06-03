import * as cdk from 'aws-cdk-lib/core';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda_event_sources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';

export class IconicMomentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    // ============================================
    // S3 Bucket 
    // ============================================
    const imageBucket = new s3.Bucket(this, 'ImageBucket', {
      bucketName: 'iconic-moment-image-bucket',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [{
        allowedMethods: [s3.HttpMethods.PUT],
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
        maxAge: 3000,
      }],
    });

    const resizedImageBucket = new s3.Bucket(this, 'ResizedImageBucket', {
      bucketName: 'iconic-moment-resized-image-bucket',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // CloudFront distribution to serve resized images without making S3 public
    const imageDistribution = new cloudfront.Distribution(this, 'ImageDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(resizedImageBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
    });



    // ============================================
    // DynamoDB Table
    // ============================================
    const photoTable = new dynamodb.Table(this, 'PhotoTable', {
      tableName: 'iconic-photos',
      partitionKey: { name: 'photo_id', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    })



    // ============================================
    // SNS Topic
    // ============================================
    const photoUploadedTopic = new sns.Topic(this, 'PhotoUploadedTopic', {
      topicName: 'iconic-photo-uploaded',
    });



    // ============================================
    // SQS Resize Queue
    // ============================================

    // Create a dead-letter queue for failed resize attempts
    const resizeDLQ = new sqs.Queue(this, 'ResizeDLQ', {
      queueName: 'iconic-resize-dlq',
    });

    // Create the main SQS queue for resize tasks, with the DLQ configured
    const resizeQueue = new sqs.Queue(this, 'ResizeQueue', {
      queueName: 'iconic-resize-queue',
      visibilityTimeout: cdk.Duration.seconds(60),
      deadLetterQueue: {
        queue: resizeDLQ,
        maxReceiveCount: 3,
      },
    })

    // Subscribe the SQS queue to the SNS topic
    photoUploadedTopic.addSubscription(
      new sns_subs.SqsSubscription(resizeQueue)
    );



    // ============================================
    // SQS Moderate Queue
    // ============================================

    // Create a separate DLQ for the moderation workflow (if needed)
    const moderateDLQ = new sqs.Queue(this, 'ModerateDLQ', {
      queueName: 'iconic-moderate-dlq',
    })

    // Create the SQS queue for moderation tasks, with the DLQ configured
    const moderateQueue = new sqs.Queue(this, 'ModerateQueue', {
      queueName: 'iconic-moderate-queue',
      visibilityTimeout: cdk.Duration.seconds(60),
      deadLetterQueue: {
        queue: moderateDLQ,
        maxReceiveCount: 3,
      },
    })

    // Subscribe the moderation SQS queue to the SNS topic
    photoUploadedTopic.addSubscription(
      new sns_subs.SqsSubscription(moderateQueue)
    );



    // ============================================
    // SQS Caption Queue
    // ============================================

    // Create a DLQ for captioning tasks 
    const captionDLQ = new sqs.Queue(this, 'CaptionDLQ', {
      queueName: 'iconic-caption-dlq',
    })

    // Create the SQS queue for captioning tasks, with the DLQ configured
    const captionQueue = new sqs.Queue(this, 'CaptionQueue', {
      queueName: 'iconic-caption-queue',
      visibilityTimeout: cdk.Duration.seconds(120),
      deadLetterQueue: {
        queue: captionDLQ,
        maxReceiveCount: 3,
      },
    })

    // Subscribe the captioning SQS queue to the SNS topic
    photoUploadedTopic.addSubscription(
      new sns_subs.SqsSubscription(captionQueue)
    );



    // ============================================
    // Lambda Function for S3 Ingestion
    // ============================================
    const ingestionLambda = new lambda.Function(this, 'IngestionLambda', {
      functionName: 'moment-ingestion',
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset('../backend/lambdas/ingestion'),
      environment: {
        PHOTO_UPLOADED_TOPIC_ARN: photoUploadedTopic.topicArn,
        PHOTO_TABLE: photoTable.tableName,
      }
    });

    // Set up S3 event notification to trigger the Lambda function on new object creation
    imageBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED, 
      new s3n.LambdaDestination(ingestionLambda)
    );

    // ============================================
    // Permissions
    // ============================================
    imageBucket.grantRead(ingestionLambda);
    photoUploadedTopic.grantPublish(ingestionLambda);
    photoTable.grantWriteData(ingestionLambda);



    // ============================================
    // Lambda Function for Image Resizing
    // ============================================
    const resizePhoto = new lambda.Function(this, 'ResizeLambda', {
      functionName: 'resize-photo',
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset('../backend/lambdas/resize', {
        bundling: {
          image: lambda.Runtime.PYTHON_3_12.bundlingImage,
          command: [
            'bash', '-c',
            'pip install -r requirements.txt -t /asset-output --platform manylinux2014_x86_64 --only-binary=:all: && cp -r . /asset-output',
          ],
        },
      }),
      timeout: cdk.Duration.seconds(60),
      memorySize: 512,
      environment: {
        RAW_BUCKET: imageBucket.bucketName,
        RESIZED_BUCKET: resizedImageBucket.bucketName,
        PHOTO_TABLE: photoTable.tableName,
      },
    });

    // Wire SQS queue as event source for the resize Lambda
    resizePhoto.addEventSource(
      new lambda_event_sources.SqsEventSource(resizeQueue, { batchSize: 1 })
    )

    // Permissions for the resize Lambda
    imageBucket.grantRead(resizePhoto);
    resizedImageBucket.grantPut(resizePhoto);
    photoTable.grantWriteData(resizePhoto);



    // ============================================
    // Lambda — Moderate worker
    // ============================================
    const moderateLambda = new lambda.Function(this, 'ModerateLambda', {
      functionName: 'moderate-photo',
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset('../backend/lambdas/moderate'),
      timeout: cdk.Duration.seconds(60),
      environment: {
        RAW_BUCKET: imageBucket.bucketName,
        PHOTO_TABLE: photoTable.tableName,
      },
    });

    // Wire SQS queue as event source for the moderate Lambda
    moderateLambda.addEventSource(
      new lambda_event_sources.SqsEventSource(moderateQueue, { batchSize: 1 })
    )

    // Permissions for the moderate Lambda
    imageBucket.grantRead(moderateLambda);
    photoTable.grantWriteData(moderateLambda);

    // Allow moderate lambda to call Rekognition
    moderateLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['rekognition:DetectModerationLabels'],
      resources: ['*'],
    }));

    // ============================================
    // Lambda — Caption worker
    // ============================================
    const captionLambda = new lambda.Function(this, 'CaptionLambda', {
      functionName: 'caption-photo',
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset('../backend/lambdas/caption'),
      timeout: cdk.Duration.seconds(120),
      environment: {
        RAW_BUCKET: imageBucket.bucketName,
        PHOTO_TABLE: photoTable.tableName,
      },
    });

    // Wire SQS queue as event source for the caption Lambda
    captionLambda.addEventSource(
      new lambda_event_sources.SqsEventSource(captionQueue, { batchSize: 1 })
    );

    // Permissions for the caption Lambda
    imageBucket.grantRead(captionLambda);
    photoTable.grantWriteData(captionLambda);

    // Allow caption lambda to call Bedrock for image captioning
    captionLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel'],
      resources: [
        'arn:aws:bedrock:*::foundation-model/*anthropic.claude-sonnet-4-5-20250929-v1:0',
        'arn:aws:bedrock:*:*:inference-profile/*anthropic.claude-sonnet-4-5-20250929-v1:0',
      ]
    }))



    // ============================================
    // Lambda — photo retrieval API worker
    // ============================================
    const getPhotosLambda = new lambda.Function(this, 'GetPhotosLambda', {
      functionName: 'get-photos',
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset('../backend/lambdas/photo'),
      environment: {
        PHOTO_TABLE: photoTable.tableName,
        THUMBNAIL_BUCKET: `https://${imageDistribution.distributionDomainName}`,
      },
    });

    photoTable.grantReadData(getPhotosLambda);



    // ============================================
    // Lambda — presigned upload URL
    // ============================================
    const uploadUrlLambda = new lambda.Function(this, 'UploadUrlLambda', {
      functionName: 'get-upload-url',
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset('../backend/lambdas/upload_url'),
      environment: {
        RAW_BUCKET: imageBucket.bucketName,
      },
    });

    imageBucket.grantPut(uploadUrlLambda);



    // ============================================
    // API Gateway
    // ============================================
    const api = new apigateway.RestApi(this, 'IconicAPI', {
      restApiName: 'iconic-api',
      description: 'API for retrieving iconic moment photos and metadata',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type'],
      },
    });

    // GET /photos
    const photos = api.root.addResource('photos');
    photos.addMethod('GET', new apigateway.LambdaIntegration(getPhotosLambda));

    // POST /upload-url  — returns a presigned S3 PUT URL
    const uploadUrl = api.root.addResource('upload-url');
    uploadUrl.addMethod('POST', new apigateway.LambdaIntegration(uploadUrlLambda));



    // ============================================
    // Outputs
    // ============================================

    // Output the bucket name as a CloudFormation output
    new cdk.CfnOutput(this, 'BucketName', {
      value: imageBucket.bucketName,
      description: 'S3 Bucket for storing soccer iconic moment images',
    })

    // Output the resized bucket name as a CloudFormation output
    new cdk.CfnOutput(this, 'ResizedBucketName', {
      value: resizedImageBucket.bucketName,
      description: 'S3 Bucket for storing resized soccer iconic moment images',
    })

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url + 'photos',
      description: 'URL for the approved photos API endpoint',
    })
  }
}
