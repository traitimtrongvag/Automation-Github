export default function Home() {
  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Git-AI Bot</h1>
      <p>GitHub automation bot is running via Vercel Cron Jobs.</p>
      <ul>
        <li>Runs every 15 minutes</li>
        <li>Random 5-minute activity sessions</li>
        <li>AI-powered content generation</li>
        <li>Natural human-like behavior</li>
      </ul>
      <h2>Actions</h2>
      <ul>
        <li> Star repositories</li>
        <li> Fork projects</li>
        <li> Watch repos</li>
        <li> Follow users</li>
        <li> Create issues</li>
        <li> Create commits</li>
        <li> Submit pull requests</li>
      </ul>
    </div>
  );
}