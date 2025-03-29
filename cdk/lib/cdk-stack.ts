import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { InstanceTarget } from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as targets from 'aws-cdk-lib/aws-route53-targets';

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

// The name of the domain. Replace with your own domain name.
// This domain name must be registered in Route53.
const domainNameString = 'mursica.fm';
// More configurations for the github repository
// Replace with your own repository URL, branch, and app name
const repositoryURL = 'https://github.com/Dominicdaniel86/Mursica-FM.git';
const repositoryName = 'Mursica-FM'; // Needs to match the name of the repository
const gitBranch = 'main';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Use the default VPC
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVpc', { isDefault: true });

    // Route53 hosted zone
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: domainNameString,
    });

    // Create an IAM role for the EC2 instance
    const role = new iam.Role(this, 'InstanceSSMRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role to allow EC2 instance to access SSM parameters',
    });

    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
    );

    // Create an EC2 instance in the VPC
    const instance = new ec2.Instance(this, 'MursicaEC2Instance', {
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
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS traffic');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH traffic');
    /// Attach the security group to the instance
    instance.addSecurityGroup(securityGroup);

    // Create an Application Load Balancer
    const loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc,
      internetFacing: true,
      securityGroup: securityGroup,
      loadBalancerName: 'MursciaALB',
    });

    // Add a target group for the EC2 instance
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.INSTANCE,
      // healthCheck: {
      //   path: '/',
      //   port: '80',
      //   protocol: elbv2.Protocol.HTTP,
      //   healthyHttpCodes: '200',
      // },
    });
    targetGroup.addTarget(new InstanceTarget(instance));

    // Certificate (using existing hostedZone)
    const certificate = new acm.Certificate(this, 'MursicaCertificate', {
      domainName: 'mursica.fm',
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // Create a listener for the load balancer
    // Redirect HTTP (80) to HTTPS (443)
    loadBalancer.addListener('HTTPRedirectListener', {
      port: 80,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: 'HTTPS',
        port: '443',
        permanent: true,
      }),
    });


    const httpsListener = loadBalancer.addListener('HttpsListener', {
      port: 443,
      certificates: [certificate],
      defaultTargetGroups: [targetGroup],
    });

    // // Attach the target group to the listener
    // listener.addTargetGroups('DefaultTargetGroup', {
    //   targetGroups: [targetGroup],
    // });

    new route53.ARecord(this, 'AliasRecord', {
      zone: hostedZone,
      recordName: 'mursica.fm', // or leave blank for root
      target: route53.RecordTarget.fromAlias(new targets.LoadBalancerTarget(loadBalancer)),
    });

    // Add a user data script to install and start a web server
    instance.addUserData(
      'dnf update -y',
      'dnf install -y git',
      `git clone ${repositoryURL} /home/ec2-user/Mursica-FM`,
      `cd /home/ec2-user/${repositoryName} && git checkout ${gitBranch}`,
      'bash /home/ec2-user/Mursica-FM/scripts/installation.sh',
    );
  }
}
