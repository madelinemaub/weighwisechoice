export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check API key exists
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const decision = body.decision;

    if (!decision) {
      return new Response(JSON.stringify({ error: 'Missing decision text' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `A person is making this decision: "${decision}"

Generate 12-14 specific factors they should consider when comparing their options. Write them the way a real person would — like what you'd scribble on a whiteboard or text a friend asking for advice.

Rules:
- Be SPECIFIC to this exact decision, not generic
- Include both cost factors (upfront cost, monthly cost, hidden costs) and quality-of-life factors
- Include practical dealbreaker-type factors (things that could be pass/fail)
- Include factors that vary meaningfully between options (not things that are the same everywhere)
- Use plain language, 1-5 words each
- Think about what someone would actually google or ask friends about when making this choice

Good examples:
- For choosing a dog breed: "Upfront cost", "Monthly care cost", "Size at full grown", "Shedding amount", "Activity level needed", "Good with kids", "Lifespan", "General breed health", "Trainability", "Barking tendency", "Hypoallergenic", "Grooming needs", "Apartment-friendly", "Good with other pets"
- For choosing an apartment: "Monthly rent", "Commute to work", "Natural light", "Noise level", "Laundry in unit", "Pet policy", "Neighborhood safety", "Kitchen size", "Closet/storage space", "Move-in cost", "Lease flexibility", "Grocery stores nearby"
- For choosing a job offer: "Total compensation", "Remote/hybrid policy", "Growth trajectory", "Team you'd join", "Manager quality", "Benefits (health/401k)", "Work-life balance", "Day-to-day work", "Job security", "Company mission"

Bad examples (too vague): "Quality", "Value", "Risk", "Opportunity", "Energy", "Trust"

Respond with ONLY a JSON array of strings, nothing else.`
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ 
        error: 'Anthropic API error', 
        status: response.status,
        details: data 
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const text = data.content?.[0]?.text || '[]';
    const clean = text.replace(/```json|```/g, '').trim();
    const factors = JSON.parse(clean);

    return new Response(JSON.stringify({ factors }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to generate suggestions', message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
