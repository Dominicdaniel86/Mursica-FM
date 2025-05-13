#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ec2Stack } from '../lib/ec2Stack';

const app = new cdk.App();
new ec2Stack(app, 'CdkStack', {
  // Flexible environment: reads the account and region from the current AWS CLI configuration
  // This also bins the stack to the current AWS CLI profile (recommended)
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
