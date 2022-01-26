export interface IPipelineParams {
    sourceStage: ISourceStage;
    buildStage: IBuildStage;
    deployStage: IDeployStage;
}

export interface ISourceStage {
    repositoryName: string;
    branchName: string;
}

export interface IBuildStage {
    buildArtifactS3Bucket: string
    outputTemplateFile: string
}

export interface IDeployStage {

}

export interface INotification {
    slackChannelConfigArn: string
}