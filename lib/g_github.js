const { Octokit } = require('octokit');
const { m_generateCommitMessage, m_generateIssueContent, m_generatePRContent, m_generateCode } = require('./g_ai');

const g_octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const m_findTrendingRepos = async (s_topic) => {
  const s_date = new Date();
  s_date.setDate(s_date.getDate() - 7);
  const s_dateStr = s_date.toISOString().split('T')[0];
  
  try {
    const { data } = await g_octokit.rest.search.repos({
      q: `topic:${s_topic} created:>${s_dateStr} stars:>5`,
      sort: 'stars',
      order: 'desc',
      per_page: 20
    });
    
    return data.items.filter(repo => !repo.archived && !repo.disabled);
  } catch (e) {
    console.error('Error finding repos:', e.message);
    if (e.status === 403) {
      console.warn('Rate limit hit, waiting...');
      await new Promise(resolve => setTimeout(resolve, 60000));
    }
    return [];
  }
};

const m_starRepo = async (s_owner, s_repo) => {
  try {
    const { data: isStarred } = await g_octokit.rest.activity.checkRepoIsStarredByAuthenticatedUser({
      owner: s_owner,
      repo: s_repo
    }).catch(() => ({ data: false }));
    
    if (isStarred) {
      console.log(`Already starred: ${s_owner}/${s_repo}`);
      return false;
    }
    
    await g_octokit.rest.activity.starRepoForAuthenticatedUser({
      owner: s_owner,
      repo: s_repo
    });
    return true;
  } catch (e) {
    console.error('Star failed:', e.message);
    return false;
  }
};

const m_forkRepo = async (s_owner, s_repo) => {
  try {
    const { data: repo } = await g_octokit.rest.repos.get({
      owner: s_owner,
      repo: s_repo
    });
    
    if (repo.fork) {
      console.log(`Skipping fork of fork: ${s_owner}/${s_repo}`);
      return false;
    }
    
    await g_octokit.rest.repos.createFork({
      owner: s_owner,
      repo: s_repo
    });
    return true;
  } catch (e) {
    console.error('Fork failed:', e.message);
    return false;
  }
};

const m_watchRepo = async (s_owner, s_repo) => {
  try {
    await g_octokit.rest.activity.setRepoSubscription({
      owner: s_owner,
      repo: s_repo,
      subscribed: true
    });
    return true;
  } catch (e) {
    console.error('Watch failed:', e.message);
    return false;
  }
};

const m_followUser = async (s_username) => {
  try {
    await g_octokit.rest.users.follow({
      username: s_username
    });
    return true;
  } catch (e) {
    console.error('Follow failed:', e.message);
    return false;
  }
};

const m_createIssue = async (s_owner, s_repo, s_topic) => {
  try {
    const s_content = await m_generateIssueContent(s_repo, s_topic);
    
    await g_octokit.rest.issues.create({
      owner: s_owner,
      repo: s_repo,
      title: s_content.title,
      body: s_content.body
    });
    return true;
  } catch (e) {
    console.error('Issue creation failed:', e.message);
    return false;
  }
};

const m_createCommit = async (s_owner, s_repo) => {
  try {
    const s_fileName = `utils/helper_${Date.now()}.js`;
    const s_code = await m_generateCode('javascript', 'utility');
    const s_message = await m_generateCommitMessage(s_fileName);
    
    const { data: s_ref } = await g_octokit.rest.git.getRef({
      owner: s_owner,
      repo: s_repo,
      ref: 'heads/main'
    });
    
    const { data: s_blob } = await g_octokit.rest.git.createBlob({
      owner: s_owner,
      repo: s_repo,
      content: Buffer.from(s_code).toString('base64'),
      encoding: 'base64'
    });
    
    const { data: s_tree } = await g_octokit.rest.git.createTree({
      owner: s_owner,
      repo: s_repo,
      base_tree: s_ref.object.sha,
      tree: [{
        path: s_fileName,
        mode: '100644',
        type: 'blob',
        sha: s_blob.sha
      }]
    });
    
    const { data: s_commit } = await g_octokit.rest.git.createCommit({
      owner: s_owner,
      repo: s_repo,
      message: s_message,
      tree: s_tree.sha,
      parents: [s_ref.object.sha]
    });
    
    await g_octokit.rest.git.updateRef({
      owner: s_owner,
      repo: s_repo,
      ref: 'heads/main',
      sha: s_commit.sha
    });
    
    return true;
  } catch (e) {
    console.error('Commit failed:', e.message);
    return false;
  }
};

const m_createPullRequest = async (s_owner, s_repo) => {
  try {
    const s_branchName = `update-${Date.now()}`;
    const s_fileName = `docs/update_${Date.now()}.md`;
    const s_content = `# Update\n\nImproved documentation and examples.`;
    
    const { data: s_ref } = await g_octokit.rest.git.getRef({
      owner: s_owner,
      repo: s_repo,
      ref: 'heads/main'
    });
    
    await g_octokit.rest.git.createRef({
      owner: s_owner,
      repo: s_repo,
      ref: `refs/heads/${s_branchName}`,
      sha: s_ref.object.sha
    });
    
    const { data: s_blob } = await g_octokit.rest.git.createBlob({
      owner: s_owner,
      repo: s_repo,
      content: Buffer.from(s_content).toString('base64'),
      encoding: 'base64'
    });
    
    const { data: s_tree } = await g_octokit.rest.git.createTree({
      owner: s_owner,
      repo: s_repo,
      base_tree: s_ref.object.sha,
      tree: [{
        path: s_fileName,
        mode: '100644',
        type: 'blob',
        sha: s_blob.sha
      }]
    });
    
    const { data: s_commit } = await g_octokit.rest.git.createCommit({
      owner: s_owner,
      repo: s_repo,
      message: await m_generateCommitMessage(s_fileName),
      tree: s_tree.sha,
      parents: [s_ref.object.sha]
    });
    
    await g_octokit.rest.git.updateRef({
      owner: s_owner,
      repo: s_repo,
      ref: `heads/${s_branchName}`,
      sha: s_commit.sha
    });
    
    const s_prContent = await m_generatePRContent(s_repo, 'documentation');
    
    await g_octokit.rest.pulls.create({
      owner: s_owner,
      repo: s_repo,
      title: s_prContent.title,
      body: s_prContent.body,
      head: s_branchName,
      base: 'main'
    });
    
    return true;
  } catch (e) {
    console.error('PR creation failed:', e.message);
    return false;
  }
};

const m_getActiveUsers = async (s_topic) => {
  try {
    const { data } = await g_octokit.rest.search.users({
      q: `followers:>100 repos:>5 type:user`,
      sort: 'followers',
      order: 'desc',
      per_page: 20
    });
    
    return data.items.map(u => u.login);
  } catch (e) {
    console.error('Error finding users:', e.message);
    if (e.status === 403) {
      console.warn('Rate limit hit for user search');
    }
    return [];
  }
};

module.exports = {
  m_findTrendingRepos,
  m_starRepo,
  m_forkRepo,
  m_watchRepo,
  m_followUser,
  m_createIssue,
  m_createCommit,
  m_createPullRequest,
  m_getActiveUsers
};