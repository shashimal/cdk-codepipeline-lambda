import {IPipelineParams} from "../lib/params/pipeline-params";

export const PipelineConfig: IPipelineParams = {
    sourceStage: {
        repositoryName: 'lambda-demo',
        branchName: 'main'
    },
    buildStage: {
        buildArtifactS3Bucket: 'du-lambda-demo-bucket',
        outputTemplateFile: 'outputtemplate.yml'
    },
    deployStage: {

    }
}