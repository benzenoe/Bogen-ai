const { pool } = require('../server/config/database');

// ============================================================
// Shared CSS foundation for all three reports
// ============================================================
const sharedStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: #faf8f5;
    color: #3a3530;
    line-height: 1.75;
    padding: 0;
    margin: 0;
  }

  /* ---- Hero Banner ---- */
  .hero {
    position: relative;
    width: 100%;
    min-height: 320px;
    overflow: hidden;
    display: flex;
    align-items: flex-end;
  }
  .hero img {
    position: absolute;
    top: 0; left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 20%;
  }
  .hero-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(
      to bottom,
      rgba(26,62,92,0.25) 0%,
      rgba(26,62,92,0.55) 40%,
      rgba(13,33,55,0.92) 100%
    );
  }
  .hero-content {
    position: relative;
    z-index: 2;
    padding: 48px 40px 36px;
    width: 100%;
  }
  .hero-badge {
    display: inline-block;
    background: rgba(201,168,76,0.9);
    color: #fff;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    padding: 5px 14px;
    border-radius: 20px;
    margin-bottom: 14px;
  }
  .hero h1 {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 2rem;
    font-weight: 600;
    color: #fff;
    margin-bottom: 8px;
    line-height: 1.2;
  }
  .hero .meta {
    color: rgba(255,255,255,0.75);
    font-size: 0.9rem;
    font-weight: 300;
  }
  .hero .meta strong {
    color: #c9a84c;
    font-weight: 500;
  }

  /* ---- Content Container ---- */
  .content {
    max-width: 780px;
    margin: 0 auto;
    padding: 36px 28px 48px;
  }

  /* ---- Client Greeting ---- */
  .greeting {
    text-align: center;
    padding: 24px 20px 8px;
    color: #7a7168;
    font-size: 0.85rem;
    font-weight: 400;
    letter-spacing: 0.04em;
  }
  .greeting strong {
    color: #1a3e5c;
  }

  /* ---- Section Cards ---- */
  .section {
    background: #fff;
    border-radius: 14px;
    padding: 30px 34px;
    margin-bottom: 22px;
    box-shadow: 0 2px 12px rgba(26,62,92,0.06), 0 1px 3px rgba(0,0,0,0.04);
    border-left: 4px solid #c9a84c;
  }
  .section h2 {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.15rem;
    color: #1a3e5c;
    margin-bottom: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .section h2 .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: linear-gradient(135deg, #e8ede5, #dfe8db);
    font-size: 0.85rem;
    flex-shrink: 0;
  }
  .section p, .section li {
    font-size: 0.95rem;
    color: #4a4540;
    line-height: 1.75;
  }
  .section ul {
    padding-left: 0;
    list-style: none;
  }
  .section li {
    margin-bottom: 12px;
    padding-left: 22px;
    position: relative;
  }
  .section li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 10px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: linear-gradient(135deg, #c9a84c, #a88a3c);
  }
  .section li strong {
    color: #1a3e5c;
  }

  /* ---- Stats Grid ---- */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
    margin: 20px 0;
  }
  .stat-box {
    background: linear-gradient(145deg, #faf8f5, #f3f0eb);
    border-radius: 12px;
    padding: 22px 16px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(26,62,92,0.05);
    border: 1px solid rgba(201,168,76,0.15);
  }
  .stat-box .value {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 2rem;
    font-weight: 600;
    color: #1a3e5c;
    line-height: 1.1;
  }
  .stat-box .label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #8a8279;
    margin-top: 6px;
    font-weight: 500;
  }

  /* ---- Highlight / Insight Box ---- */
  .highlight {
    background: linear-gradient(135deg, #faf6ee, #f5f0e4);
    border-radius: 12px;
    padding: 22px 26px;
    margin: 22px 0;
    border-left: 4px solid #c9a84c;
    position: relative;
  }
  .highlight::before {
    content: '\\2728';
    position: absolute;
    top: -10px;
    left: 20px;
    font-size: 1.2rem;
    background: #faf8f5;
    padding: 0 6px;
    border-radius: 50%;
  }
  .highlight strong {
    color: #1a3e5c;
    font-weight: 600;
  }
  .highlight p {
    font-size: 0.95rem;
    color: #4a4540;
    line-height: 1.75;
  }

  /* ---- Concept Box (dark) ---- */
  .concept-box {
    background: linear-gradient(145deg, #1a3e5c 0%, #0d2137 100%);
    color: white;
    border-radius: 14px;
    padding: 28px 30px;
    margin: 22px 0;
    border-left: 4px solid #c9a84c;
    box-shadow: 0 4px 16px rgba(13,33,55,0.2);
  }
  .concept-box h3 {
    font-family: 'Playfair Display', Georgia, serif;
    color: #c9a84c;
    font-size: 1.05rem;
    margin-bottom: 10px;
    font-weight: 600;
  }
  .concept-box p {
    color: rgba(255,255,255,0.88);
    font-size: 0.95rem;
    line-height: 1.75;
  }

  /* ---- Demo / Feature Box ---- */
  .demo-box {
    background: linear-gradient(145deg, #1a3e5c 0%, #0d2137 100%);
    color: white;
    border-radius: 14px;
    padding: 28px 30px;
    margin: 22px 0;
    border-left: 4px solid #c9a84c;
    box-shadow: 0 4px 16px rgba(13,33,55,0.2);
  }
  .demo-box h3 {
    font-family: 'Playfair Display', Georgia, serif;
    color: #c9a84c;
    font-size: 1.05rem;
    margin-bottom: 12px;
    font-weight: 600;
  }
  .demo-box p {
    color: rgba(255,255,255,0.88);
    font-size: 0.95rem;
    margin-bottom: 10px;
    line-height: 1.75;
  }
  .demo-box ul {
    padding-left: 0;
    list-style: none;
  }
  .demo-box li {
    color: rgba(255,255,255,0.82);
    margin-bottom: 8px;
    font-size: 0.9rem;
    padding-left: 20px;
    position: relative;
  }
  .demo-box li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 9px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #c9a84c;
  }
  .demo-box li strong {
    color: #c9a84c;
  }

  /* ---- Pipeline Cards ---- */
  .pipeline-card {
    background: #fff;
    border-radius: 12px;
    padding: 20px 24px;
    margin-bottom: 14px;
    box-shadow: 0 2px 10px rgba(26,62,92,0.06);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-left: 4px solid #c9a84c;
    transition: box-shadow 0.2s ease;
  }
  .pipeline-card .deal {
    font-weight: 600;
    color: #1a3e5c;
    font-size: 0.95rem;
  }
  .pipeline-card .detail {
    font-size: 0.83rem;
    color: #7a7168;
    margin-top: 3px;
  }
  .pipeline-card .price {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.25rem;
    color: #1a3e5c;
    font-weight: 600;
    white-space: nowrap;
    margin-left: 16px;
  }

  /* ---- Progress Items ---- */
  .progress-section {
    background: #fff;
    border-radius: 14px;
    padding: 30px 34px;
    margin-bottom: 22px;
    box-shadow: 0 2px 12px rgba(26,62,92,0.06);
    border-left: 4px solid #c9a84c;
  }
  .progress-section h2 {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.15rem;
    color: #1a3e5c;
    margin-bottom: 18px;
    font-weight: 600;
  }
  .progress-item {
    display: flex;
    align-items: center;
    margin-bottom: 14px;
  }
  .progress-item .icon {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 14px;
    font-size: 0.8rem;
    color: white;
    flex-shrink: 0;
    font-weight: 600;
  }
  .progress-item .icon.done {
    background: linear-gradient(135deg, #6a9e6a, #4d8a4d);
    box-shadow: 0 2px 6px rgba(77,138,77,0.3);
  }
  .progress-item .icon.active {
    background: linear-gradient(135deg, #c9a84c, #a88a3c);
    box-shadow: 0 2px 6px rgba(201,168,76,0.3);
  }
  .progress-item .text {
    font-size: 0.93rem;
    color: #4a4540;
  }
  .progress-item .text strong {
    color: #1a3e5c;
  }

  /* ---- Action Items ---- */
  .action-items {
    background: linear-gradient(145deg, #1a3e5c 0%, #15334d 50%, #0d2137 100%);
    color: white;
    border-radius: 14px;
    padding: 32px 34px;
    margin-bottom: 22px;
    border-left: 4px solid #c9a84c;
    box-shadow: 0 4px 20px rgba(13,33,55,0.2);
  }
  .action-items h2 {
    font-family: 'Playfair Display', Georgia, serif;
    color: #c9a84c;
    font-size: 1.15rem;
    margin-bottom: 18px;
    font-weight: 600;
  }
  .action-items ul {
    padding-left: 0;
    list-style: none;
  }
  .action-items li {
    color: rgba(255,255,255,0.9);
    margin-bottom: 14px;
    font-size: 0.93rem;
    padding-left: 32px;
    position: relative;
    line-height: 1.65;
  }
  .action-items li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 6px;
    width: 18px;
    height: 18px;
    border-radius: 5px;
    border: 2px solid rgba(201,168,76,0.6);
    background: rgba(201,168,76,0.08);
  }

  /* ---- Footer ---- */
  .footer {
    text-align: center;
    padding: 32px 20px 20px;
    border-top: 1px solid #e8e3dc;
    margin-top: 12px;
  }
  .footer p {
    color: #9a9189;
    font-size: 0.8rem;
    line-height: 1.6;
  }
  .footer .brand {
    font-family: 'Playfair Display', Georgia, serif;
    color: #1a3e5c;
    font-weight: 600;
    font-size: 0.9rem;
  }
`;

// ============================================================
// Helper: wrap content in the full HTML shell with hero
// ============================================================
function buildReport({ sessionNumber, sessionTitle, date, duration, bodyContent }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
${sharedStyles}
</style>
</head>
<body>

<!-- Hero Banner with Photo -->
<div class="hero">
  <img src="/assets/clients/delaney-morgan.png" alt="Delaney Morgan" />
  <div class="hero-overlay"></div>
  <div class="hero-content">
    <div class="hero-badge">Session #${sessionNumber}</div>
    <h1>${sessionTitle}</h1>
    <div class="meta"><strong>${date}</strong> &nbsp;&bull;&nbsp; ${duration} &nbsp;&bull;&nbsp; Delaney Morgan</div>
  </div>
</div>

<div class="content">
  <div class="greeting">Prepared for <strong>Delaney Morgan</strong> &nbsp;|&nbsp; Morgan Realty &nbsp;|&nbsp; Columbia, South Carolina</div>

${bodyContent}

  <div class="footer">
    <p class="brand">Edmund Bogen Coaching</p>
    <p>bogen.ai &nbsp;&bull;&nbsp; Elevating your business, one session at a time</p>
  </div>
</div>

</body>
</html>`;
}

// ============================================================
// Session 1 Body
// ============================================================
const session1Body = `
  <div class="section">
    <h2><span class="icon">&#128172;</span> Session Overview</h2>
    <p>This was the initial reconnection and coaching onboarding call. Delaney and Edmund caught up on personal milestones &mdash; marriage to Richard, birth of baby Douglas (November 4, 2025), and a record production year &mdash; before establishing the coaching relationship structure and identifying the highest-priority areas of focus.</p>
  </div>

  <div class="section">
    <h2><span class="icon">&#128200;</span> 2025 Performance Snapshot</h2>
    <div class="stats-grid">
      <div class="stat-box"><div class="value">23</div><div class="label">Units Closed</div></div>
      <div class="stat-box"><div class="value">$6M</div><div class="label">Total Volume</div></div>
      <div class="stat-box"><div class="value">$262K</div><div class="label">Avg Price Point</div></div>
      <div class="stat-box"><div class="value">9</div><div class="label">Years in RE</div></div>
    </div>
    <p>Best production year to date &mdash; achieved while navigating marriage, pregnancy, and the birth of Douglas. Q1 2026 pipeline: 3 new listings from January, no pendings yet, focused on building pipeline beyond March.</p>
  </div>

  <div class="section">
    <h2><span class="icon">&#128161;</span> Key Discussion Points</h2>
    <ul>
      <li><strong>VA Management (#1 Pain Point):</strong> Three VAs (full-time social media at $6/hr, per-transaction TC, part-time bookkeeper) need more structured direction. Currently communicating via WhatsApp and email &mdash; needs a centralized task management platform.</li>
      <li><strong>Social Media ROI:</strong> Social media VA posts across Google Business, blog/website, LinkedIn, and main platforms. Attributed 3 closed deals to social media in 2025 (2 Instagram, 1 LinkedIn) + 1 from Google. Struggling to define meaningful metrics beyond post volume.</li>
      <li><strong>Claude AI Demo:</strong> Edmund live-demonstrated Claude's Skills feature by creating a branded Instagram shout-out post for Delaney. Delaney had only been using Perplexity &mdash; introduced to Skills as the next evolution of AI for content automation.</li>
      <li><strong>Mommy Network:</strong> With Douglas in daycare 3-4 days/week, Delaney is now entering a new sphere of established, homeowning parents. Edmund identified this as a wide-open lead generation opportunity.</li>
      <li><strong>Coaching Structure:</strong> $150/month for one session, flexible scheduling, no long-term commitment. Mastermind access included (6 meetings/month). Text/call/email between sessions. Calls recorded via Otter with action items sent afterward.</li>
    </ul>
  </div>

  <div class="highlight">
    <p><strong>Key Insight:</strong> Delaney is producing at a high level but operating inefficiently. Fixing VA management systems is the single highest-leverage improvement she can make right now. Last year was the first year without any coaching or accountability structure &mdash; and she felt the difference.</p>
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
    <p style="color:#8a8279; font-size:0.82rem;">Next Session: February 11, 2026</p>
  </div>
`;

// ============================================================
// Session 2 Body
// ============================================================
const session2Body = `
  <div class="section">
    <h2><span class="icon">&#128172;</span> Session Overview</h2>
    <p>Deep pipeline review session covering active deals, lead source analysis, prospecting strategy, and time management. Edmund introduced the Minimum Viable Work (MVW) framework, the post-client debriefing practice, and the strategic principle of cutting the bottom 10% of clients to make room for higher-value work.</p>
  </div>

  <div class="section">
    <h2><span class="icon">&#127968;</span> Active Pipeline</h2>
    <div class="pipeline-card"><div><div class="deal">$400K Listing</div><div class="detail">Going live Monday &bull; Open house planned &bull; Highest-value opportunity</div></div><div class="price">$400,000</div></div>
    <div class="pipeline-card"><div><div class="deal">$300K Listing + $410K Buy-Side</div><div class="detail">13-camera client &bull; High-maintenance &bull; New construction buy-side</div></div><div class="price">$710,000</div></div>
    <div class="pipeline-card"><div><div class="deal">April Downsizer</div><div class="detail">Past client since 2019 &bull; April 1 listing at $300K &rarr; $220K patio home &bull; May/June closings</div></div><div class="price">$300,000</div></div>
    <div class="pipeline-card"><div><div class="deal">FHA Buyer Couple</div><div class="detail">Pre-approved $250K &bull; Husband wants equity play, wife wants move-in ready &bull; School proximity = key</div></div><div class="price">$250,000</div></div>
    <div class="pipeline-card"><div><div class="deal">Contractor Listings (3)</div><div class="detail">$170K + another + $45K (under contract) &bull; Relationship-based, low commission</div></div><div class="price">~$260,000</div></div>
  </div>

  <div class="section">
    <h2><span class="icon">&#128161;</span> Key Discussion Points</h2>
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
    <p style="color:#8a8279; font-size:0.82rem;">Next Session: February 17, 2026</p>
  </div>
`;

// ============================================================
// Session 3 Body
// ============================================================
const session3Body = `
  <div class="section">
    <h2><span class="icon">&#128172;</span> Session Overview</h2>
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
    <h2><span class="icon">&#128161;</span> Key Discussion Points</h2>
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
    <p><strong>Breakthrough Moment:</strong> Delaney created her first Claude skill (&quot;Delaney's Excel&quot;) during the session and immediately saw the 5-unit apartment analysis generated in under 5 minutes. She's now committed to exploring skills for her own business use cases and will attend the mastermind session to learn more.</p>
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
    <p style="color:#8a8279; font-size:0.82rem;">Next Session: March 17, 2026 at 2:00 PM</p>
    <p style="margin-top: 6px; font-style: italic; color:#9a9189; font-size:0.8rem;">Note: Edmund's hip replacement surgery is March 9. Text/email between sessions as needed.</p>
  </div>
`;

// ============================================================
// Build the three full HTML reports
// ============================================================
const session1Html = buildReport({
  sessionNumber: 1,
  sessionTitle: 'Reconnection & Onboarding',
  date: 'February 5, 2026',
  duration: '28 minutes',
  bodyContent: session1Body
});

const session2Html = buildReport({
  sessionNumber: 2,
  sessionTitle: 'Pipeline Review & Strategy',
  date: 'February 11, 2026',
  duration: '44 minutes',
  bodyContent: session2Body
});

const session3Html = buildReport({
  sessionNumber: 3,
  sessionTitle: 'Technology Onboarding & Marketing Systems',
  date: 'February 17, 2026',
  duration: '40 minutes',
  bodyContent: session3Body
});

// ============================================================
// Update the database
// ============================================================
async function updateReports() {
  try {
    const updates = [
      { reportId: 1, html: session1Html },
      { reportId: 2, html: session2Html },
      { reportId: 3, html: session3Html },
    ];

    for (const { reportId, html } of updates) {
      const result = await pool.query(
        `UPDATE client_reports SET report_html = $1, updated_at = NOW() WHERE report_id = $2 AND portal_client_id = $3 RETURNING report_id, title`,
        [html, reportId, 4]
      );
      if (result.rowCount === 0) {
        console.log(`WARNING: No report found with report_id=${reportId} for portal_client_id=4`);
      } else {
        console.log(`Updated report_id ${result.rows[0].report_id}: ${result.rows[0].title}`);
      }
    }

    console.log('\nAll 3 coaching reports updated with new visual design.');
    await pool.end();
  } catch (e) {
    console.error('Error:', e.message);
    await pool.end();
    process.exit(1);
  }
}

updateReports();
