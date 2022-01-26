import {Stack} from "aws-cdk-lib";
import {IPipelineParams} from "../params/pipeline-params";
import {Artifact} from "aws-cdk-lib/aws-codepipeline";
import {CodeBuildAction} from "aws-cdk-lib/aws-codepipeline-actions";
import {BuildSpec, LinuxBuildImage, PipelineProject} from "aws-cdk-lib/aws-codebuild";
import {ManagedPolicy} from "aws-cdk-lib/aws-iam";

export class BuildStage {
    private readonly stack: Stack
    private pipelineConfig: IPipelineParams;
    private readonly buildOutputArtifact: Artifact;

    constructor(stack: Stack,pipelineConfig: IPipelineParams) {
        this.stack=stack;
        this.pipelineConfig = pipelineConfig;
        this.buildOutputArtifact = new Artifact();
    }

    public getCodeBuildAction = (sourceOutputArtifact:Artifact) : CodeBuildAction => {
        return new CodeBuildAction({
            actionName: "BuildAction",
            input: sourceOutputArtifact,
            project: this.createCodeBuildProject(),
            outputs: [this.buildOutputArtifact]
        });
    }

    private createCodeBuildProject = (): PipelineProject => {
        const codeBuildProject = new PipelineProject(this.stack,'CodeBuildProject',{
            projectName: 'CodeBuild-Lambda',
            environment: {
                buildImage: LinuxBuildImage.STANDARD_5_0
            },
            buildSpec: BuildSpec.fromObject(this.getBuildSpecContent())
        } );

        codeBuildProject.role?.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'));
        return codeBuildProject;
    }

    private getBuildSpecContent = ()=> {
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
                        'export BUCKET='+this.pipelineConfig.buildStage.buildArtifactS3Bucket,
                        'sam package --s3-bucket $BUCKET --output-template-file '+ this.pipelineConfig.buildStage.outputTemplateFile,
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

    public getBuildOutputArtifact = (): Artifact => {
        return this.buildOutputArtifact;
    }
}