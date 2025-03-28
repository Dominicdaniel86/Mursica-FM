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
      // Install necessary packages
      'dnf update -y',
      'dnf install -y git',
      'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash',
      'export NVM_DIR="$HOME/.nvm"',
      '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"',
      '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"',
      'nvm install v20',
      'nvm use v20',
      'sudo dnf install docker -y',
      'sudo systemctl start docker',
      'sudo systemctl enable docker',
      'sudo usermod -aG docker ec2-user',
      'mkdir -p ~/.docker/cli-plugins',
      'curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
        -o ~/.docker/cli-plugins/docker-compose',
      'chmod +x ~/.docker/cli-plugins/docker-compose',
      // Clone project
      'git clone https://github.com/Dominicdaniel86/Mursica-FM.git /home/ec2-user/Mursica-FM',
      'cd /home/ec2-user/Mursica-FM && git checkout feature/clean-up',
      // Then update the .env files with the environment variables
      'POSTGRES_USER=$(aws ssm get-parameter --name "/mursica/database/POSTGRES_USER" --with-decryption --query "Parameter.Value" --output text) \
        && echo "POSTGRES_USER=$POSTGRES_USER" >> /home/ec2-user/Mursica-FM/database/.env',
      'POSTGRES_PASSWORD=$(aws ssm get-parameter --name "/mursica/database/POSTGRES_PASSWORD" --with-decryption --query "Parameter.Value" --output text) \
        && echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" >> /home/ec2-user/Mursica-FM/database/.env',
      'POSTGRES_DB=$(aws ssm get-parameter --name "/mursica/database/POSTGRES_DB" --with-decryption --query "Parameter.Value" --output text) \
        && echo "POSTGRES_DB=$POSTGRES_DB" >> /home/ec2-user/Mursica-FM/database/.env',

      'ENVIRONMENT=$(aws ssm get-parameter --name "/mursica/backend/ENVIRONMENT" --query "Parameter.Value" --output text) \
        && echo "ENVIRONMENT=$ENVIRONMENT" >> /home/ec2-user/Mursica-FM/backend/.env',
      'PORT=$(aws ssm get-parameter --name "/mursica/backend/PORT" --query "Parameter.Value" --output text) \
        && echo "PORT=$PORT" >> /home/ec2-user/Mursica-FM/backend/.env',
      'CLIENT_ID=$(aws ssm get-parameter --name "/mursica/backend/CLIENT_ID" --query "Parameter.Value" --output text) \
        && echo "CLIENT_ID=$CLIENT_ID" >> /home/ec2-user/Mursica-FM/backend/.env',
      'CLIENT_SECRET=$(aws ssm get-parameter --name "/mursica/backend/CLIENT_SECRET" --with-decryption --query "Parameter.Value" --output text) \
        && echo "CLIENT_SECRET=$CLIENT_SECRET" >> /home/ec2-user/Mursica-FM/backend/.env',
      'DATABASE_URL=$(aws ssm get-parameter --name "/mursica/backend/DATABASE_URL" --query "Parameter.Value" --output text) \
        && echo "DATABASE_URL=$DATABASE_URL" >> /home/ec2-user/Mursica-FM/backend/.env',

      // Install node dependencies
      'cd /home/ec2-user/Mursica-FM/backend && npm install',
      'cd /home/ec2-user/Mursica-FM/frontend && npm install',
      // Start the Docker containers
      'cd /home/ec2-user/Mursica-FM && docker-compose up -d --build',
      // Migrate the database and compile the frontend code
      'cd /home/ec2-user/Mursica-FM/backend && npm run prisma:migrate',
      'cd /home/ec2-user/Mursica-FM/frontend && npm run build',
      // Restart the Docker containers
      // This is needed because the backend might have crashed, as the database was not ready yet
      'cd /home/ec2-user/Mursica-FM && docker-compose up -d --build',
    );
  }
}
