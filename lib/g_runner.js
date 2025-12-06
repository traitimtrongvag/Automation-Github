const { m_getRandomDelay, m_getRandomAction, m_getRandomTopic, m_shouldContinue } = require('./g_config');
const {
  m_findTrendingRepos,
  m_starRepo,
  m_forkRepo,
  m_watchRepo,
  m_followUser,
  m_createIssue,
  m_createCommit,
  m_createPullRequest,
  m_getActiveUsers
} = require('./g_github');

const m_sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const m_executeAction = async (s_action, s_repos, s_users) => {
  if (s_repos.length === 0 && s_users.length === 0) {
    return { success: false, action: s_action, reason: 'No targets' };
  }
  
  try {
    switch (s_action) {
      case 'star': {
        const s_repo = s_repos[Math.floor(Math.random() * s_repos.length)];
        const s_result = await m_starRepo(s_repo.owner.login, s_repo.name);
        return { success: s_result, action: 'star', target: s_repo.full_name };
      }
      
      case 'fork': {
        const s_repo = s_repos[Math.floor(Math.random() * s_repos.length)];
        const s_result = await m_forkRepo(s_repo.owner.login, s_repo.name);
        return { success: s_result, action: 'fork', target: s_repo.full_name };
      }
      
      case 'watch': {
        const s_repo = s_repos[Math.floor(Math.random() * s_repos.length)];
        const s_result = await m_watchRepo(s_repo.owner.login, s_repo.name);
        return { success: s_result, action: 'watch', target: s_repo.full_name };
      }
      
      case 'follow': {
        if (s_users.length === 0) {
          return { success: false, action: 'follow', reason: 'No users' };
        }
        const s_user = s_users[Math.floor(Math.random() * s_users.length)];
        const s_result = await m_followUser(s_user);
        return { success: s_result, action: 'follow', target: s_user };
      }
      
      case 'issue': {
        const s_repo = s_repos[Math.floor(Math.random() * s_repos.length)];
        const s_topic = m_getRandomTopic();
        const s_result = await m_createIssue(s_repo.owner.login, s_repo.name, s_topic);
        return { success: s_result, action: 'issue', target: s_repo.full_name };
      }
      
      case 'commit': {
        const s_myRepos = s_repos.filter(r => r.permissions && r.permissions.push);
        if (s_myRepos.length === 0) {
          return { success: false, action: 'commit', reason: 'No writable repos' };
        }
        const s_repo = s_myRepos[Math.floor(Math.random() * s_myRepos.length)];
        const s_result = await m_createCommit(s_repo.owner.login, s_repo.name);
        return { success: s_result, action: 'commit', target: s_repo.full_name };
      }
      
      case 'pr': {
        const s_myRepos = s_repos.filter(r => r.permissions && r.permissions.push);
        if (s_myRepos.length === 0) {
          return { success: false, action: 'pr', reason: 'No writable repos' };
        }
        const s_repo = s_myRepos[Math.floor(Math.random() * s_myRepos.length)];
        const s_result = await m_createPullRequest(s_repo.owner.login, s_repo.name);
        return { success: s_result, action: 'pr', target: s_repo.full_name };
      }
      
      default:
        return { success: false, action: s_action, reason: 'Unknown action' };
    }
  } catch (e) {
    return { success: false, action: s_action, error: e.message };
  }
};

const m_runSession = async () => {
  const s_startTime = Date.now();
  const s_results = [];
  
  console.log('Starting daily bot session...');
  
  const s_topics = [m_getRandomTopic(), m_getRandomTopic()];
  console.log(`Selected topics: ${s_topics.join(', ')}`);
  
  const s_repoPromises = s_topics.map(t => m_findTrendingRepos(t));
  const s_repoArrays = await Promise.all(s_repoPromises);
  const s_repos = s_repoArrays.flat();
  
  const s_users = await m_getActiveUsers(s_topics[0]);
  
  console.log(`Found ${s_repos.length} repos and ${s_users.length} users`);
  
  let s_actionCount = 0;
  
  while (m_shouldContinue(s_startTime, s_actionCount)) {
    const s_action = m_getRandomAction();
    const s_delay = m_getRandomDelay();
    
    console.log(`Action #${s_actionCount + 1}: ${s_action} after ${s_delay}ms`);
    await m_sleep(s_delay);
    
    const s_result = await m_executeAction(s_action, s_repos, s_users);
    s_results.push({
      ...s_result,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Result:`, s_result);
    
    if (s_result.success) {
      s_actionCount++;
    }
  }
  
  const s_duration = Date.now() - s_startTime;
  const s_successCount = s_results.filter(r => r.success).length;
  
  console.log(`Daily session completed: ${s_successCount}/${s_results.length} actions in ${Math.round(s_duration / 1000)}s`);
  
  return {
    duration: s_duration,
    total: s_results.length,
    successful: s_successCount,
    results: s_results
  };
};

module.exports = { m_runSession };