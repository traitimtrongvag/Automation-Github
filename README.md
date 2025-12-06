<div align="center" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;">
  <h1 style="margin-bottom:6px;">Automation-GitHub</h1>
  <p style="margin-top:0;">GitHub automation bot with AI-powered content generation.</p>
</div>

---

## Quick Setup

1. **Deploy to Vercel**
2. **Add Environment Variables:**

   * `GITHUB_TOKEN`: GitHub personal access token
   * `OPENAI_API_KEY`: OpenAI API key
   * `CRON_SECRET`: Random string for security
3. **Redeploy** after adding variables

## Important Safety Warning

> **Warning:** Using automation tools to interact with GitHub (starring, forking, following, creating issues, or creating pull requests) may violate GitHub Terms of Service or trigger automated abuse detection. This can result in account restriction or suspension. **Test this project only on a secondary/spare GitHub account.** The author is not responsible for any account actions taken by GitHub.

## Features

* Star, fork, or watch repositories
* Follow users
* Create issues, commits, and pull requests
* AI-generated content via OpenAI
* Configurable timing and action weights

## How It Works

1. Cron job triggers automation
2. Bot finds trending repositories by topic
3. Performs weighted-random actions with delays
4. AI generates natural commit messages and issue bodies
5. Session lasts 15–30 minutes with a smart exit strategy

## Files in Repository

```
.
├── README.md
├── lib
│   ├── g_ai.js
│   ├── g_config.js
│   ├── g_github.js
│   └── g_runner.js
├── package.json
├── pages
│   ├── api
│   │   └── run.js
│   └── index.js
└── vercel.json
```

## API / Pages

* `pages/api/run.js` - serverless endpoint triggered by cron to start a run

## Configuration Tips

* Keep `GITHUB_TOKEN` scope minimal. For actions like starring and forking, `public_repo` and `repo` scope may suffice.
* Use short, realistic delays and randomized timing to mimic human behavior.
* Log actions locally first and review logs before enabling larger runs.

## Legal / Ethical Notes

Automated interaction with third-party services may have legal and ethical consequences. Always review the target site's Terms of Service, rate limits, and acceptable-usage policies before running any automation.
