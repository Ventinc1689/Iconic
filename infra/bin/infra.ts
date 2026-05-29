#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib/core';
import { IconicMomentStack } from '../lib/IconicMomentStack';

const app = new cdk.App();
new IconicMomentStack(app, 'IconicMomentStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
});
