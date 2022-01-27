import {CfnCapabilities, Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Artifact, Pipeline} from "aws-cdk-lib/aws-codepipeline";
import {BuildSpec, LinuxBuildImage, PipelineProject} from "aws-cdk-lib/aws-codebuild";
import {Effect, ManagedPolicy, Policy, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {Repository} from "aws-cdk-lib/aws-codecommit";
import {
    CloudFormationCreateReplaceChangeSetAction, CloudFormationExecuteChangeSetAction,
    CodeBuildAction,
    CodeCommitSourceAction
} from "aws-cdk-lib/aws-codepipeline-actions";

export class CdkCodepipelineLambdaStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        //CodePipeline
        const codepipeline = new Pipeline(this, 'CodePipelineForLambdaDeployment', {});

        //##############################################################################################################

        //Source Stage
        const sourceArtifact = new Artifact();
        const sourceAction = new CodeCommitSourceAction({
            actionName: "Source",
            repository: Repository.fromRepositoryName(this, `CodeCommitRepositoryForLambdaFunction`, 'lambda-demo'),
            branch: 'master',
            output: sourceArtifact,
        });

        codepipeline.addStage({
                stageName: "Source",
                actions: [sourceAction],
            }
        );

        //##############################################################################################################

        //Build Stage
        const buildArtifact = new Artifact();
        const buildAction = new CodeBuildAction({
            actionName: "BuildAction",
            input: sourceArtifact,
            project: this.createCodeBuildProject(),
            outputs: [buildArtifact]
        });

        codepipeline.addStage({
                stageName: "Build",
                actions: [buildAction],
            }
        );

        //##############################################################################################################

        //Deploy Stage
        const stackName = 'Codepipeline-Lambda-Stack';
        const changeSetName = 'StagedChangeSet'

        const createReplaceChangeSetAction = new CloudFormationCreateReplaceChangeSetAction({
            actionName: "PrepareChanges",
            stackName: stackName,
            changeSetName: changeSetName,
            templatePath: buildArtifact.atPath('outputtemplate.yml'),
            cfnCapabilities: [
                CfnCapabilities.NAMED_IAM,
                CfnCapabilities.AUTO_EXPAND
            ],
            adminPermissions: false,
            runOrder: 1
        });

        const executeChangeSetAction = new  CloudFormationExecuteChangeSetAction({
            actionName: "ExecuteChanges",
            changeSetName:changeSetName,
            stackName: stackName,
            runOrder: 2
        })

        codepipeline.addStage({
                stageName: "Deploy",
                actions: [
                    createReplaceChangeSetAction,
                    executeChangeSetAction
                ],
            }
        );

        //Permission for CloudFormation to access Lambda and other resources
        createReplaceChangeSetAction.deploymentRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AWSLambdaExecute'));
        createReplaceChangeSetAction.deploymentRole.attachInlinePolicy(this.getCodePipelineCloudFormationInlinePolicy());
    }

    //##################################################################################################################

    //Helper Functions

    //Creating code build project
    private createCodeBuildProject = (): PipelineProject => {
        const codeBuildProject = new PipelineProject(this, 'CodeBuildProject', {
            projectName: 'CodeBuild-Lambda',
            environment: {
                buildImage: LinuxBuildImage.STANDARD_5_0
            },
            buildSpec: BuildSpec.fromObject(this.getBuildSpecContent())
        });

        codeBuildProject.role?.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'));
        return codeBuildProject;
    }

    //Creating the build spec content.
    private getBuildSpecContent = () => {
        return {
            version: '0.2',
            phases: {
                install: {
                    'runtime-versions': {
                        nodejs: '12'
                    }
                },
                pre_build: {
                    commands: [
                        'echo build start'
                    ]
                },
                build: {
                    commands: [
                        'echo Build started on `date`',
                        'echo Build started on `date`',
                        'sam build',
                        'export BUCKET=du-lambda-demo-bucket',
                        'sam package --s3-bucket $BUCKET --output-template-file outputtemplate.yml',
                        'echo Build completed on `date`'
                    ]
                }
            },
            artifacts: {
                type: 'zip',
                files: [
                    'template.yml',
                    'outputtemplate.yml'
                ]
            }
        }
    }

    //Inline permission policy for CloudFormation
    private getCodePipelineCloudFormationInlinePolicy = () => {
        return new Policy(this, 'CodePipelineCloudFormationInlinePolicy',{
            statements:[
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: [
                        "apigateway:*",
                        "codedeploy:*",
                        "lambda:*",
                        "cloudformation:CreateChangeSet",
                        "iam:GetRole",
                        "iam:CreateRole",
                        "iam:DeleteRole",
                        "iam:PutRolePolicy",
                        "iam:AttachRolePolicy",
                        "iam:DeleteRolePolicy",
                        "iam:DetachRolePolicy",
                        "iam:PassRole",
                        "s3:GetObject",
                        "s3:GetObjectVersion",
                        "s3:GetBucketVersioning"
                    ],
                    resources: ['*']
                })
            ]
        })
    }
}
