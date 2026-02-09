const OpenAI = require('openai');

const g_client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const m_retryWithBackoff = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

const m_generateCommitMessage = async (s_fileName) => {
  const s_prompt = `Generate a natural commit message for adding/updating ${s_fileName}. Keep it short, casual, and realistic like a real developer would write. Just return the message, nothing else.`;
  
  try {
    return await m_retryWithBackoff(async () => {
      const s_response = await g_client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: s_prompt }],
        temperature: 0.8,
        max_tokens: 50
      });
      
      const s_message = s_response.choices[0].message.content.trim();
      return s_message || `Update ${s_fileName}`;
    });
  } catch (e) {
    console.error('AI commit message failed:', e.message);
    return `Update ${s_fileName}`;
  }
};

const m_generateIssueContent = async (s_repoName, s_topic) => {
  const s_prompt = `Write a brief GitHub issue for a ${s_topic} project called ${s_repoName}. Make it sound natural and helpful, like a real user would write. Include a short title and description (2-3 sentences max).`;
  
  try {
    return await m_retryWithBackoff(async () => {
      const s_response = await g_client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: s_prompt }],
        temperature: 0.9,
        max_tokens: 150
      });
      
      const s_content = s_response.choices[0].message.content.trim();
      const s_lines = s_content.split('\n').filter(l => l.trim());
      
      if (s_lines.length === 0) {
        throw new Error('Empty response');
      }
      
      return {
        title: s_lines[0].replace(/^(Title:|##)\s*/i, '').trim(),
        body: s_lines.slice(1).join('\n').trim() || 'Could you provide more details on this implementation?'
      };
    });
  } catch (e) {
    console.error('AI issue generation failed:', e.message);
    return {
      title: `Question about ${s_topic}`,
      body: 'Could you provide more details on this implementation?'
    };
  }
};

const m_generatePRContent = async (s_repoName, s_changes) => {
  const s_prompt = `Create a pull request title and description for changes in ${s_repoName}: ${s_changes}. Sound natural and professional. Keep it concise.`;
  
  try {
    return await m_retryWithBackoff(async () => {
      const s_response = await g_client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: s_prompt }],
        temperature: 0.8,
        max_tokens: 120
      });
      
      const s_content = s_response.choices[0].message.content.trim();
      const s_lines = s_content.split('\n').filter(l => l.trim());
      
      if (s_lines.length === 0) {
        throw new Error('Empty response');
      }
      
      return {
        title: s_lines[0].replace(/^(Title:|PR:)\s*/i, '').trim(),
        body: s_lines.slice(1).join('\n').trim() || 'Minor improvements and fixes'
      };
    });
  } catch (e) {
    console.error('AI PR generation failed:', e.message);
    return {
      title: `Update ${s_changes}`,
      body: 'Minor improvements and fixes'
    };
  }
};

const m_generateCode = async (s_language, s_purpose) => {
  const s_prompt = `Write a simple ${s_language} ${s_purpose} function. Just code, no explanations. Keep it under 20 lines.`;
  
  try {
    return await m_retryWithBackoff(async () => {
      const s_response = await g_client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: s_prompt }],
        temperature: 0.7,
        max_tokens: 200
      });
      
      const s_code = s_response.choices[0].message.content
        .replace(/```[a-z]*\n?/g, '')
        .trim();
      
      return s_code || `// ${s_purpose}\nfunction example() {\n  return true;\n}`;
    });
  } catch (e) {
    console.error('AI code generation failed:', e.message);
    return `// ${s_purpose}\nfunction example() {\n  return true;\n}`;
  }
};

module.exports = {
  m_generateCommitMessage,
  m_generateIssueContent,
  m_generatePRContent,
  m_generateCode
};