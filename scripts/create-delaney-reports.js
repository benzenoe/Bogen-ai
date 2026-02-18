const { pool } = require('../server/config/database');

const session1Html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8f9fa; color: #333; line-height: 1.7; padding: 40px 24px; max-width: 800px; margin: 0 auto; }
  .header { background: linear-gradient(135deg, #1a3e5c 0%, #0d2137 100%); color: white; padding: 40px 32px; border-radius: 12px; margin-bottom: 32px; }
  .header h1 { font-size: 1.6rem; font-weight: 300; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 8px; }
  .header .meta { color: rgba(255,255,255,0.7); font-size: 0.9rem; }
  .header .meta span { color: #00a8e1; }
  .section { background: white; border-radius: 10px; padding: 28px 32px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border-left: 4px solid #00a8e1; }
  .section h2 { font-size: 1.1rem; text-transform: uppercase; letter-spacing: 0.08em; color: #1a3e5c; margin-bottom: 16px; font-weight: 600; }
  .section p, .section li { font-size: 0.95rem; color: #444; }
  .section ul { padding-left: 20px; }
  .section li { margin-bottom: 8px; }
  .highlight { background: #e8f4fd; border-radius: 8px; padding: 16px 20px; margin: 16px 0; border-left: 3px solid #00a8e1; }
  .highlight strong { color: #1a3e5c; }
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin: 16px 0; }
  .stat-box { background: #f0f7fc; border-radius: 8px; padding: 16px; text-align: center; }
  .stat-box .value { font-size: 1.8rem; font-weight: 300; color: #00a8e1; }
  .stat-box .label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: #666; margin-top: 4px; }
  .action-items { background: #1a3e5c; color: white; border-radius: 10px; padding: 28px 32px; margin-bottom: 20px; border-left: 4px solid #00a8e1; }
  .action-items h2 { color: #00a8e1; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px; }
  .action-items li { color: rgba(255,255,255,0.9); margin-bottom: 10px; font-size: 0.95rem; }
  .footer { text-align: center; color: #999; font-size: 0.8rem; padding: 20px 0; }
</style>
</head>
<body>
<div class="header">
  <h1>Coaching Session #1</h1>
  <div class="meta"><span>February 5, 2026</span> &bull; 28 minutes &bull; Reconnection & Onboarding</div>
</div>

<div class="section">
  <h2>Session Overview</h2>
  <p>This was the initial reconnection and coaching onboarding call. Delaney and Edmund caught up on personal milestones &mdash; marriage to Richard, birth of baby Douglas (November 4, 2025), and a record production year &mdash; before establishing the coaching relationship structure and identifying the highest-priority areas of focus.</p>
</div>

<div class="section">
  <h2>2025 Performance Snapshot</h2>
  <div class="stats-grid">
    <div class="stat-box"><div class="value">23</div><div class="label">Units Closed</div></div>
    <div class="stat-box"><div class="value">$6M</div><div class="label">Total Volume</div></div>
    <div class="stat-box"><div class="value">$262K</div><div class="label">Avg Price Point</div></div>
    <div class="stat-box"><div class="value">9</div><div class="label">Years in RE</div></div>
  </div>
  <p>Best production year to date &mdash; achieved while navigating marriage, pregnancy, and the birth of Douglas. Q1 2026 pipeline: 3 new listings from January, no pendings yet, focused on building pipeline beyond March.</p>
</div>

<div class="section">
  <h2>Key Discussion Points</h2>
  <ul>
    <li><strong>VA Management (#1 Pain Point):</strong> Three VAs (full-time social media at $6/hr, per-transaction TC, part-time bookkeeper) need more structured direction. Currently communicating via WhatsApp and email &mdash; needs a centralized task management platform.</li>
    <li><strong>Social Media ROI:</strong> Social media VA posts across Google Business, blog/website, LinkedIn, and main platforms. Attributed 3 closed deals to social media in 2025 (2 Instagram, 1 LinkedIn) + 1 from Google. Struggling to define meaningful metrics beyond post volume.</li>
    <li><strong>Claude AI Demo:</strong> Edmund live-demonstrated Claude's Skills feature by creating a branded Instagram shout-out post for Delaney. Delaney had only been using Perplexity &mdash; introduced to Skills as the next evolution of AI for content automation.</li>
    <li><strong>Mommy Network:</strong> With Douglas in daycare 3-4 days/week, Delaney is now entering a new sphere of established, homeowning parents. Edmund identified this as a wide-open lead generation opportunity.</li>
    <li><strong>Coaching Structure:</strong> $150/month for one session, flexible scheduling, no long-term commitment. Mastermind access included (6 meetings/month). Text/call/email between sessions. Calls recorded via Otter with action items sent afterward.</li>
  </ul>
</div>

<div class="highlight">
  <strong>Key Insight:</strong> Delaney is producing at a high level but operating inefficiently. Fixing VA management systems is the single highest-leverage improvement she can make right now. Last year was the first year without any coaching or accountability structure &mdash; and she felt the difference.
</div>

<div class="action-items">
  <h2>Delaney's Action Items</h2>
  <ul>
    <li>Complete and return credit card authorization</li>
    <li>Research and select a centralized task management platform for VAs</li>
    <li>Define clearer performance metrics for social media VA</li>
    <li>Download and explore Claude AI &mdash; look at the Skills feature</li>
    <li>Start building mommy/parent network into sphere strategy</li>
    <li>Focus on generating pipeline activity beyond March</li>
  </ul>
</div>

<div class="footer">
  <p>Edmund Bogen Coaching &bull; bogen.ai &bull; Next Session: February 11, 2026</p>
</div>
</body>
</html>`;

const session2Html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8f9fa; color: #333; line-height: 1.7; padding: 40px 24px; max-width: 800px; margin: 0 auto; }
  .header { background: linear-gradient(135deg, #1a3e5c 0%, #0d2137 100%); color: white; padding: 40px 32px; border-radius: 12px; margin-bottom: 32px; }
  .header h1 { font-size: 1.6rem; font-weight: 300; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 8px; }
  .header .meta { color: rgba(255,255,255,0.7); font-size: 0.9rem; }
  .header .meta span { color: #00a8e1; }
  .section { background: white; border-radius: 10px; padding: 28px 32px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border-left: 4px solid #00a8e1; }
  .section h2 { font-size: 1.1rem; text-transform: uppercase; letter-spacing: 0.08em; color: #1a3e5c; margin-bottom: 16px; font-weight: 600; }
  .section p, .section li { font-size: 0.95rem; color: #444; }
  .section ul { padding-left: 20px; }
  .section li { margin-bottom: 8px; }
  .highlight { background: #e8f4fd; border-radius: 8px; padding: 16px 20px; margin: 16px 0; border-left: 3px solid #00a8e1; }
  .highlight strong { color: #1a3e5c; }
  .pipeline-card { background: white; border-radius: 10px; padding: 20px 24px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #00a8e1; }
  .pipeline-card .deal { font-weight: 600; color: #1a3e5c; }
  .pipeline-card .detail { font-size: 0.85rem; color: #666; }
  .pipeline-card .price { font-size: 1.2rem; color: #00a8e1; font-weight: 300; }
  .concept-box { background: linear-gradient(135deg, #0d2137 0%, #1a3e5c 100%); color: white; border-radius: 10px; padding: 24px 28px; margin: 20px 0; }
  .concept-box h3 { color: #00a8e1; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; }
  .concept-box p { color: rgba(255,255,255,0.85); font-size: 0.95rem; }
  .action-items { background: #1a3e5c; color: white; border-radius: 10px; padding: 28px 32px; margin-bottom: 20px; border-left: 4px solid #00a8e1; }
  .action-items h2 { color: #00a8e1; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px; }
  .action-items li { color: rgba(255,255,255,0.9); margin-bottom: 10px; font-size: 0.95rem; }
  .footer { text-align: center; color: #999; font-size: 0.8rem; padding: 20px 0; }
</style>
</head>
<body>
<div class="header">
  <h1>Coaching Session #2</h1>
  <div class="meta"><span>February 11, 2026</span> &bull; 44 minutes &bull; Pipeline Review & Strategy</div>
</div>

<div class="section">
  <h2>Session Overview</h2>
  <p>Deep pipeline review session covering active deals, lead source analysis, prospecting strategy, and time management. Edmund introduced the Minimum Viable Work (MVW) framework, the post-client debriefing practice, and the strategic principle of cutting the bottom 10% of clients to make room for higher-value work.</p>
</div>

<div class="section">
  <h2>Active Pipeline</h2>
  <div class="pipeline-card"><div><div class="deal">$400K Listing</div><div class="detail">Going live Monday &bull; Open house planned &bull; Highest-value opportunity</div></div><div class="price">$400,000</div></div>
  <div class="pipeline-card"><div><div class="deal">$300K Listing + $410K Buy-Side</div><div class="detail">13-camera client &bull; High-maintenance &bull; New construction buy-side</div></div><div class="price">$710,000</div></div>
  <div class="pipeline-card"><div><div class="deal">April Downsizer</div><div class="detail">Past client since 2019 &bull; April 1 listing at $300K &rarr; $220K patio home &bull; May/June closings</div></div><div class="price">$300,000</div></div>
  <div class="pipeline-card"><div><div class="deal">FHA Buyer Couple</div><div class="detail">Pre-approved $250K &bull; Husband wants equity play, wife wants move-in ready &bull; School proximity = key</div></div><div class="price">$250,000</div></div>
  <div class="pipeline-card"><div><div class="deal">Contractor Listings (3)</div><div class="detail">$170K + another + $45K (under contract) &bull; Relationship-based, low commission</div></div><div class="price">~$260,000</div></div>
</div>

<div class="section">
  <h2>Key Discussion Points</h2>
  <ul>
    <li><strong>Time Audit Lesson:</strong> The $300K/$410K client with 13 cameras took months of showings. Edmund coached on the post-client debrief &mdash; audit time invested vs. commission earned after each deal. Recognize patterns of time-wasting clients early. Delaney admitted she probably wouldn't have taken this client again.</li>
    <li><strong>Lead Source Mapping:</strong> ~25% of 2025 deals came from past clients or referrals. Redfin contributed another ~25% but at 33% referral fee. Edmund requested a full 2-year lead source map (Delaney completed and emailed this before Session 3).</li>
    <li><strong>Bottom 10% Pruning:</strong> The $45K listing = ~$1,300 commission. Edmund's principle: strategically cut the bottom 10% of clients every 6-12 months to make room for higher-value work. Find a newer agent to refer small deals to. Use Edmund as the &quot;blame&quot; &mdash; &quot;My business advisor instructed me to work at higher price points.&quot;</li>
    <li><strong>Circle Prospecting:</strong> For the $400K listing: 10 left, 10 right, across the street 10 left, 10 right = 40 houses. Nosy neighbor ad campaign. Open house with neighbor outreach: &quot;Hi, I'm Delaney &mdash; you'll see some traffic, just wanted to let you know.&quot;</li>
    <li><strong>1,200 CRM Contacts &mdash; No Newsletter:</strong> Nine years of contacts in Follow Up Boss with no email marketing. Edmund showed his newsletter system and its click-tracking capabilities as a model.</li>
    <li><strong>FHA Buyer Strategy:</strong> Husband wants equity play/fixer; wife wants move-in ready. Key insight: find something near the school that satisfies convenience (his compromise trigger). He's the decision-maker despite wife's enthusiasm.</li>
    <li><strong>Price Point Elevation:</strong> Average deal was $262K in 2025. $400K listing going live is the start of climbing to $400-600K range. Edmund shared his own journey from $350K minimums to negotiating a $17M deal.</li>
  </ul>
</div>

<div class="concept-box">
  <h3>Minimum Viable Work (MVW)</h3>
  <p>What is the absolute minimum amount of prospecting you will do every single day, come hell or high water? It could be one phone call. One text. But we set that floor and we track it. The goal is consistency over intensity &mdash; one brick in the wall every day builds the pipeline.</p>
</div>

<div class="concept-box">
  <h3>Bruce Lee Mindset</h3>
  <p>&quot;Never talk badly about yourself, even as a joke.&quot; Your brain doesn't distinguish between self-deprecating humor and genuine belief. Stop the negative self-talk. Adopt an abundance mentality &mdash; there is more than enough business, even when it doesn't feel that way.</p>
</div>

<div class="action-items">
  <h2>Delaney's Action Items</h2>
  <ul>
    <li>Map lead sources for past 2 years and email to Edmund &mdash; COMPLETED</li>
    <li>Implement post-client debrief process after each deal</li>
    <li>Define Minimum Viable Work (MVW) daily floor</li>
    <li>Circle prospect 40 homes around the $400K listing</li>
    <li>Plan open house strategy with nosy neighbor campaign</li>
    <li>Connect ChatGPT to calendar for time tracking</li>
    <li>Identify a newer agent to refer sub-$100K deals to</li>
    <li>Start planning the newsletter (1,200 contacts waiting)</li>
  </ul>
</div>

<div class="footer">
  <p>Edmund Bogen Coaching &bull; bogen.ai &bull; Next Session: February 17, 2026</p>
</div>
</body>
</html>`;

const session3Html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8f9fa; color: #333; line-height: 1.7; padding: 40px 24px; max-width: 800px; margin: 0 auto; }
  .header { background: linear-gradient(135deg, #1a3e5c 0%, #0d2137 100%); color: white; padding: 40px 32px; border-radius: 12px; margin-bottom: 32px; }
  .header h1 { font-size: 1.6rem; font-weight: 300; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 8px; }
  .header .meta { color: rgba(255,255,255,0.7); font-size: 0.9rem; }
  .header .meta span { color: #00a8e1; }
  .section { background: white; border-radius: 10px; padding: 28px 32px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border-left: 4px solid #00a8e1; }
  .section h2 { font-size: 1.1rem; text-transform: uppercase; letter-spacing: 0.08em; color: #1a3e5c; margin-bottom: 16px; font-weight: 600; }
  .section p, .section li { font-size: 0.95rem; color: #444; }
  .section ul { padding-left: 20px; }
  .section li { margin-bottom: 8px; }
  .highlight { background: #e8f4fd; border-radius: 8px; padding: 16px 20px; margin: 16px 0; border-left: 3px solid #00a8e1; }
  .highlight strong { color: #1a3e5c; }
  .progress-section { background: white; border-radius: 10px; padding: 28px 32px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border-left: 4px solid #00a8e1; }
  .progress-item { display: flex; align-items: center; margin-bottom: 12px; }
  .progress-item .icon { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 0.8rem; color: white; flex-shrink: 0; }
  .progress-item .icon.done { background: #4CAF50; }
  .progress-item .icon.active { background: #00a8e1; }
  .demo-box { background: linear-gradient(135deg, #0d2137 0%, #1a3e5c 100%); color: white; border-radius: 10px; padding: 24px 28px; margin: 20px 0; }
  .demo-box h3 { color: #00a8e1; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; }
  .demo-box p { color: rgba(255,255,255,0.85); font-size: 0.95rem; margin-bottom: 8px; }
  .demo-box ul { padding-left: 20px; }
  .demo-box li { color: rgba(255,255,255,0.8); margin-bottom: 6px; font-size: 0.9rem; }
  .action-items { background: #1a3e5c; color: white; border-radius: 10px; padding: 28px 32px; margin-bottom: 20px; border-left: 4px solid #00a8e1; }
  .action-items h2 { color: #00a8e1; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px; }
  .action-items li { color: rgba(255,255,255,0.9); margin-bottom: 10px; font-size: 0.95rem; }
  .footer { text-align: center; color: #999; font-size: 0.8rem; padding: 20px 0; }
</style>
</head>
<body>
<div class="header">
  <h1>Coaching Session #3</h1>
  <div class="meta"><span>February 17, 2026</span> &bull; 40 minutes &bull; Technology Onboarding & Marketing Systems</div>
</div>

<div class="section">
  <h2>Session Overview</h2>
  <p>The most hands-on session yet. Edmund revealed the interactive coaching dashboard built from Delaney's lead source data (she loved it &mdash; &quot;really user friendly&quot;). Walked through a live Claude AI onboarding, demonstrated the newsletter system with real analytics, showed the Facebook lead processing workflow, and assigned a workflow reverse-engineering exercise. Pipeline is progressing &mdash; approximately 70% to closing on one buyer side and one seller side.</p>
</div>

<div class="progress-section">
  <h2>Pipeline Status Update</h2>
  <div class="progress-item"><div class="icon active">~</div><div class="text"><strong>1 Buyer + 1 Seller ~70% to close</strong></div></div>
  <div class="progress-item"><div class="icon done">&#10003;</div><div class="text"><strong>$400K listing went live</strong> &mdash; Open house Sunday, expecting 4-5 groups</div></div>
  <div class="progress-item"><div class="icon active">~</div><div class="text"><strong>Circle prospecting underway</strong> &mdash; Reaching out to surrounding property owners before Sunday</div></div>
  <div class="progress-item"><div class="icon active">~</div><div class="text"><strong>Daily past-client outreach started</strong> &mdash; Working through list, one per day</div></div>
  <div class="progress-item"><div class="icon active">~</div><div class="text"><strong>Google Ads landing page live</strong> &mdash; Targeting downsizers, $400K+ dual-sided deals</div></div>
</div>

<div class="section">
  <h2>Key Discussion Points</h2>
  <ul>
    <li><strong>Coaching Dashboard Revealed:</strong> Edmund showed the interactive dashboard built from Delaney's lead source data. She found it &quot;really user friendly&quot; and easy to read. It will evolve to include deal tracking, session notes, and her own data inputs.</li>
    <li><strong>Past Client Referrals = #1 Growth Lever:</strong> Only ~3 referral deals in 2 years from past clients. Delaney committed to daily outreach (1 past client per day). Even relocated clients (Hawaii example) may have family and friends locally &mdash; don't exclude them from outreach.</li>
    <li><strong>Client Event ROI:</strong> Delaney has held events (baseball game, wine class, plant picking at local garden shop) but never cross-referenced attendee lists with closed deals. Edmund coached on tracking: who showed up + did they eventually become a deal?</li>
    <li><strong>Claude AI Onboarding (Live):</strong> Caught that Delaney had subscribed to the wrong platform (&quot;Quad&quot; instead of Claude). Guided her to claude.ai, signed up for Claude Pro ($20/month). Created her first skill: &quot;Delaney's Excel&quot; &mdash; a South Carolina real estate accounting spreadsheet skill.</li>
    <li><strong>LLM Stacking:</strong> Demonstrated using Claude to generate a spreadsheet, then dropping it into ChatGPT for error-checking. Using multiple AIs together for validation and cross-referencing.</li>
    <li><strong>5-Unit Apartment Analysis:</strong> Live-generated a full investment analysis for a $2.2M garden apartment complex in under 5 minutes using the Excel skill. Rent roll, expenses, and return scenarios at 5%, 10%, and 15%. Delaney's reaction: &quot;That's crazy. It's insane.&quot;</li>
  </ul>
</div>

<div class="demo-box">
  <h3>Newsletter System Demo</h3>
  <p>Edmund showed Samantha's (team member) newsletter analytics:</p>
  <ul>
    <li><strong>19% open rate</strong> &mdash; strong for real estate</li>
    <li><strong>12.2% click-through rate</strong> &mdash; indicates engaged audience</li>
    <li>Can see exactly which links people click (e.g., 12 people clicked Polo Club listings)</li>
    <li>Whole system built with Claude Skills &mdash; newsletter created in ~30 minutes</li>
    <li>Branded per agent (Edmund, Samantha, Dena each have their own version)</li>
  </ul>
  <p><strong>For Delaney:</strong> 1,200 CRM contacts waiting. Content as a marketing tool &mdash; real Columbia market data could be her differentiator.</p>
</div>

<div class="demo-box">
  <h3>Facebook Lead Processing Demo</h3>
  <p>Showed the &quot;New to Boca Raton&quot; group (10,600+ members) with 20+ pending requests:</p>
  <ul>
    <li>Members answer: Do you rent, own, or planning to buy?</li>
    <li>Email capture question built into the join form</li>
    <li>Claude skill auto-categorizes leads, looks up public info, and outputs to CRM/spreadsheet</li>
    <li>Can identify real prospects vs. bots (e.g., 13-year Facebook account = likely real person)</li>
  </ul>
</div>

<div class="highlight">
  <strong>Breakthrough Moment:</strong> Delaney created her first Claude skill (&quot;Delaney's Excel&quot;) during the session and immediately saw the 5-unit apartment analysis generated in under 5 minutes. She's now committed to exploring skills for her own business use cases and will attend the mastermind session to learn more.
</div>

<div class="action-items">
  <h2>Delaney's Action Items</h2>
  <ul>
    <li>Execute circle prospecting around $400K listing before Sunday open house</li>
    <li>Track open house results (groups, leads captured, follow-ups)</li>
    <li>Continue daily past-client outreach (1/day) &mdash; don't exclude relocated clients</li>
    <li>Send Google Ads downsizer landing page link to Edmund</li>
    <li>Explore Claude skills &mdash; build skills personalized for her business</li>
    <li>Complete workflow reverse-engineering exercise (map daily/weekly tasks in a circle diagram)</li>
    <li>Watch mastermind replays on bogen.ai (video archive section)</li>
    <li>Cross-reference past event attendees with closed deals to measure event ROI</li>
  </ul>
</div>

<div class="footer">
  <p>Edmund Bogen Coaching &bull; bogen.ai &bull; Next Session: March 17, 2026 at 2:00 PM</p>
  <p style="margin-top: 8px; font-style: italic;">Note: Edmund's hip replacement surgery is March 9. Text/email between sessions as needed.</p>
</div>
</body>
</html>`;

const reports = [
  {
    title: 'Coaching Session #1 — Reconnection & Onboarding',
    description: 'February 5, 2026 | 28 minutes | Reconnection call, coaching onboarding, VA management pain points, Claude AI demo, mommy network strategy.',
    report_type: 'general',
    report_html: session1Html
  },
  {
    title: 'Coaching Session #2 — Pipeline Review & Strategy',
    description: 'February 11, 2026 | 44 minutes | Pipeline audit, lead source mapping, cost-per-deal analysis, circle prospecting, Minimum Viable Work, Bruce Lee mindset.',
    report_type: 'general',
    report_html: session2Html
  },
  {
    title: 'Coaching Session #3 — Technology Onboarding & Marketing Systems',
    description: 'February 17, 2026 | 40 minutes | Coaching dashboard reveal, Claude AI onboarding, newsletter system demo, Facebook lead processing, workflow automation exercise.',
    report_type: 'general',
    report_html: session3Html
  }
];

async function insertReports() {
  try {
    for (const report of reports) {
      const result = await pool.query(
        `INSERT INTO client_reports (portal_client_id, title, description, report_html, report_type, is_published, created_by)
         VALUES ($1, $2, $3, $4, $5, TRUE, 'Edmund Bogen')
         RETURNING report_id, title`,
        [4, report.title, report.description, report.report_html, report.report_type]
      );
      console.log('Created report:', result.rows[0].report_id, '-', result.rows[0].title);
    }

    console.log('\nAll 3 coaching reports published to Delaney\'s portal.');
    await pool.end();
  } catch(e) {
    console.error('Error:', e.message);
    await pool.end();
    process.exit(1);
  }
}

insertReports();
