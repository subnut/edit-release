const core = require('@actions/core');
const github = require('@actions/github');
const context = github.context
const fs = require('fs');

async function run() {
  try {
    // Get authenticated GitHub client (Octokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
    const octokit = github.getOctokit(process.env.GITHUB_TOKEN); // eslint-disable-line no-undef

    // Get owner and repo from context of payload that triggered the action
    const { owner: currentOwner, repo: currentRepo } = context.repo;

    // Get the inputs from the workflow file: https://github.com/actions/toolkit/tree/master/packages/core#inputsoutputs
    const tagName = core.getInput('tag_name', { required: false });

    // This removes the 'refs/tags' portion of the string, i.e. from 'refs/tags/v1.10.15' to 'v1.10.15'
    const tag = tagName.replace('refs/tags/', '');

    const owner = core.getInput('owner', { required: false }) || currentOwner;
    const repo = core.getInput('repo', { required: false }) || currentRepo;

    const bodyPath = core.getInput('body_path', { required: false });

    const releaseName = core.getInput('release_name', { required: false }).replace('refs/tags/', '');
    const body = core.getInput('body', { required: false });
    const draft = core.getInput('draft', { required: false }) === 'true';
    const prerelease = core.getInput('prerelease', { required: false }) === 'true';
    const commitish = core.getInput('commitish', { required: false }) || context.sha;

    let bodyFileContent = null;
    if (bodyPath !== '' && !!bodyPath) {
      try {
        bodyFileContent = fs.readFileSync(bodyPath, { encoding: 'utf8' });
      } catch (error) {
        core.setFailed(error.message);
      }
    }


   // Get the release id
   const getReleaseResponse = await octokit.repos.getReleaseByTag({
      owner,
      repo,
      tag
    });
    const {
      data: {
        id: releaseID,
        name: releaseNameOld,
        body: bodyOld,
        draft: draftOld,
        prerelease: prereleaseOld,
        target_commitish: commitishOld
      }
    } = getReleaseResponse;
    console.log("Release id:", releaseID);

    // Edit the release
    // API Documentation: https://developer.github.com/v3/repos/releases/#create-a-release
    // Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-create-release
    console.log(owner);
    console.log(repo);
    console.log(releaseID);
    const updateReleaseResponse = await octokit.repos.updateRelease({
      owner,
      repo,
      releaseID,
      prerelease: false
    });
    console.log(updateReleaseResponse);

    // Get the ID, html_url, and upload URL for the updated Release from the response
    const {
      data: { id: releaseIdUpdated, html_url: htmlUrlUpdated, upload_url: uploadUrlUpdated }
    } = updateReleaseResponse;

    // Set the output variables for use by other actions: https://github.com/actions/toolkit/tree/master/packages/core#inputsoutputs
    core.setOutput('id', releaseIdUpdated);
    core.setOutput('html_url', htmlUrlUpdated);
    core.setOutput('upload_url', uploadUrlUpdated);
  } catch (error) {
    core.setFailed(error.message);
  }
}

module.exports = run;
