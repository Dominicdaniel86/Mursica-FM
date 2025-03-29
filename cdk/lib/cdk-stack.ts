import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
const dotenv = require('dotenv');
import * as iam from 'aws-cdk-lib/aws-iam';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

// The database environment variables
export interface DatabaseEnvProps {
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_DB: string;
}

// The backend environment variables
export interface BackendEnvProps {
  ENVIRONMENT: string;
  PORT: number;
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  DATABASE_URL: string;
}

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Use the default VPC
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVpc', { isDefault: true });

    // Create an IAM role for the EC2 instance
    const role = new iam.Role(this, 'InstanceSSMRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role to allow EC2 instance to access SSM parameters',
    });

    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
    );

    // Create an EC2 instance in the VPC
    const instance = new ec2.Instance(this, 'SpotifyEC2Instance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      role: role,
    });

    // Add security group to allow HTTP traffic
    const securityGroup = new ec2.SecurityGroup(this, 'InstanceSecurityGroup', {
      vpc,
      allowAllOutbound: true,
      description: 'Allow HTTP traffic',
      securityGroupName: 'InstanceSecurityGroup',
    });

    // Add ingress rule to allow HTTP traffic
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH traffic');
    /// Attach the security group to the instance
    instance.addSecurityGroup(securityGroup);

    // Add a user data script to install and start a web server
    instance.addUserData(
      'dnf update -y',
      'dnf install -y git',
      'git clone https://github.com/Dominicdaniel86/Mursica-FM.git /home/ec2-user/Mursica-FM',
      'cd /home/ec2-user/Mursica-FM && git checkout feature/clean-up',
      'bash /home/ec2-user/Mursica-FM/scripts/installation.sh',
    );
  }
}
