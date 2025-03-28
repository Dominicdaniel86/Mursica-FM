import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Use the default VPC
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVpc', { isDefault: true });

    // Create an EC2 instance in the VPC
    const instance = new ec2.Instance(this, 'SpotifyEC2Instance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
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
      'git clone https://github.com/Dominicdaniel86/Spotify-Session-App.git /home/ec2-user/Spotify-Session-App',
      'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash',
      'source ~/.bashrc',
      'nvm install v20',
      'nvm use v20',
      'sudo dnf install docker -y',
      'sudo systemctl start docker',
      'sudo systemctl enable docker',
      'sudo usermod -aG docker ec2-user',
      'cd /home/ec2-user/Spotify-Session-App && git checkout feature/clean-up',
      'mkdir -p ~/.docker/cli-plugins',
      'curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
        -o ~/.docker/cli-plugins/docker-compose',
      'chmod +x ~/.docker/cli-plugins/docker-compose',
      // configure env variables
      // start container
      // migrate database
      // compile frontend
      // restart container
    );
  }
}
