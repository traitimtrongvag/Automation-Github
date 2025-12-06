const g_cfg = {
  s_minDelay: 5000,
  s_maxDelay: 120000,
  s_sessionDuration: 1800000,
  s_minActions: 8,
  s_maxActions: 15,
  s_actions: [
    { type: 'star', weight: 35 },
    { type: 'fork', weight: 12 },
    { type: 'watch', weight: 8 },
    { type: 'follow', weight: 25 },
    { type: 'commit', weight: 8 },
    { type: 'pr', weight: 7 },
    { type: 'issue', weight: 5 }
  ],
  s_topics: [
    'javascript', 'typescript', 'react', 'nextjs', 'nodejs',
    'python', 'machine-learning', 'ai', 'web-development',
    'frontend', 'backend', 'api', 'database', 'devops'
  ]
};

const m_getRandomDelay = () => {
  return Math.floor(Math.random() * (g_cfg.s_maxDelay - g_cfg.s_minDelay)) + g_cfg.s_minDelay;
};

const m_getRandomAction = () => {
  const s_total = g_cfg.s_actions.reduce((sum, a) => sum + a.weight, 0);
  let s_rand = Math.random() * s_total;
  
  for (const s_action of g_cfg.s_actions) {
    s_rand -= s_action.weight;
    if (s_rand <= 0) return s_action.type;
  }
  
  return g_cfg.s_actions[0].type;
};

const m_getRandomTopic = () => {
  return g_cfg.s_topics[Math.floor(Math.random() * g_cfg.s_topics.length)];
};

const m_shouldContinue = (s_startTime, s_actionCount) => {
  const s_elapsed = Date.now() - s_startTime;
  const s_reachedMin = s_actionCount >= g_cfg.s_minActions;
  const s_reachedMax = s_actionCount >= g_cfg.s_maxActions;
  const s_timeExpired = s_elapsed >= g_cfg.s_sessionDuration;
  
  if (s_reachedMax || s_timeExpired) return false;
  if (s_reachedMin && Math.random() < 0.2) return false;
  
  return true;
};

module.exports = {
  g_cfg,
  m_getRandomDelay,
  m_getRandomAction,
  m_getRandomTopic,
  m_shouldContinue
};