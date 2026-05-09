# WeighWise

**Make big decisions feel clearer.**

Define what matters, weigh your priorities, and see which choice best fits what you care about.

## Deploy on Vercel

1. Push this repo to GitHub
2. Import into [Vercel](https://vercel.com)
3. Add environment variable: `ANTHROPIC_API_KEY` = your key from [console.anthropic.com](https://console.anthropic.com)
4. Deploy

## Local development

```bash
npm install
npm run dev
```

Create a `.env.local` file with:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

## Architecture

- **Frontend**: React + Vite, styled with CSS-in-JS
- **Storage**: localStorage (swap `src/storage.js` for Supabase later)
- **AI suggestions**: Vercel serverless function at `/api/suggest` proxies Claude API
- **No user accounts needed** — data persists per browser
