---
name: Facebook Group Lead Processor
description: Processes Facebook group member request data to categorize leads, flag spam accounts, generate email sequences, and create engagement content. Works for any Facebook group owner who wants to convert members into customers.
author: Bogen.ai
category: marketing
---

# Facebook Group Lead Processor

Processes raw Facebook group member data into actionable marketing campaigns for any Facebook group.

## What This Skill Does

When you paste raw data from Facebook's group member request screen, this skill will:
1. Parse and extract all member information
2. Score and categorize leads by quality
3. Flag spam/suspicious accounts
4. Generate CSV exports for your email platform
5. Create personalized email sequences
6. Suggest social engagement strategies

## Input Format

Copy and paste text directly from Facebook's group member request screen. Each member entry typically contains:
- Name
- Member status and request date
- Friend count and mutual friends
- Groups in common and total groups
- Facebook account age
- Location (sometimes)
- Job/Company (sometimes)
- Answers to your membership questions

## Processing Workflow

### Step 1: Parse Each Member Entry

The skill extracts and normalizes these fields:
- `name` - Full name as displayed
- `email` - If provided in answers
- `location` - City, State if present
- `role` - Job title/company if present
- `fb_age` - How long on Facebook
- `groups_count` - Number of groups they're in
- `friends_count` - Total friends
- `mutual_friends` - Friends in your group
- `request_date` - When they requested to join
- `answered_questions` - Yes/No/Partial

### Step 2: Calculate Lead Quality Score

**TIER 1 - HOT LEADS (Score 80-100)**
- Has email address
- Relevant job title for your niche
- Reasonable group count (<100)
- Bonuses: Location provided, answered all questions, has mutual friends

**TIER 2 - WARM LEADS (Score 50-79)**
- No email but answered some questions
- Relevant background or <50 groups
- Not flagged as spam

**TIER 3 - COLD LEADS (Score 20-49)**
- No email, minimal information
- No spam flags
- May still be legitimate

**TIER 4 - SPAM/SUSPICIOUS (Flag for Review)**
Auto-flagged if ANY of these:
- >300 groups (group collector)
- Account <6 months AND >100 groups
- Generic business account name
- No mutual friends AND >200 groups
- Name patterns suggesting fake accounts

### Step 3: Generated Outputs

1. **Lead Summary Table** - All leads sorted by tier with key metrics
2. **CSV Export** - Tier 1 leads formatted for email platform import
3. **Email Sequences** - Personalized welcome sequences for hot leads
4. **Engagement Posts** - Content designed to capture emails from Tier 2
5. **Spam Report** - Flagged accounts with decline recommendations

## Output Format

```markdown
## Lead Processing Report - [Date]

### Quick Stats
- Total Processed: X
- Tier 1 (Email Captured): X leads
- Tier 2 (Warm): X leads
- Tier 3 (Cold): X leads
- Flagged/Spam: X accounts

### Tier 1 Leads (Ready for Email Campaign)
| Name | Email | Location | Role | Score |
|------|-------|----------|------|-------|

### Tier 2 Leads (Need Nurturing)
| Name | Location | Role | Score | Suggested Action |
|------|----------|------|-------|------------------|

### Flagged Accounts
| Name | Reason | Groups | FB Age | Recommendation |
|------|--------|--------|--------|----------------|

### CSV Export
[Ready to paste into your email platform]

### Engagement Post Ideas
[Posts to capture emails from Tier 2 leads]
```

## Customization

Before using, tell Claude:
1. **Your niche** - What industry/topic is your group about?
2. **Your offer** - What do you sell to group members?
3. **Your funnel** - Free content → Email list → Paid product?
4. **Spam signals** - Any specific red flags for your niche?

Example setup prompt:
> "My group is for [INDUSTRY] professionals. I offer [YOUR SERVICE/PRODUCT].
> My funnel is: Free group → Email capture → Free webinar → Paid course.
> Flag anyone with 'guru' or 'coach' in their name as potential competitors."

## Email Sequence Framework

### Welcome Sequence (7 emails over 14 days)

**Email 1 (Day 0): Welcome**
- Thank them for joining
- Set expectations for the group
- One quick win/tip

**Email 2 (Day 2): Value**
- Your best piece of content
- No selling

**Email 3 (Day 4): Story**
- Your journey/why you started this
- Build connection

**Email 4 (Day 7): Social Proof**
- Member success stories
- Testimonials

**Email 5 (Day 9): Problem Agitation**
- The problem your offer solves
- Why it matters now

**Email 6 (Day 11): Solution**
- Introduce your paid offer
- Soft CTA

**Email 7 (Day 14): Direct Offer**
- Clear CTA to buy/book/join
- Deadline or scarcity if applicable

## Social Post Templates

### Email Capture Post
```
[Valuable insight or tip]

I put together a free [resource type] that shows you exactly how to [benefit].

Drop "SEND" in the comments and I'll DM you the link.
```

### Engagement Post
```
Quick poll for the group:

What's your biggest challenge with [topic]?

A) [Option 1]
B) [Option 2]
C) [Option 3]
D) Something else (comment below!)
```

### Value Post
```
[Counterintuitive insight or myth-busting]

Here's why most people get this wrong...

[2-3 paragraph explanation]

Save this post - you'll thank me later.
```

## Usage Tips

1. **Process in batches** - Don't let requests pile up beyond 50
2. **Act fast on Tier 1** - Hot leads cool quickly
3. **Review spam flags** - False positives happen
4. **Track conversions** - Know which source/tier converts best
5. **Update your questions** - If email capture is low, improve your membership questions

## Quality Checklist

Before finalizing output:
- [ ] All leads correctly categorized
- [ ] Spam accounts flagged with clear reasoning
- [ ] CSV properly formatted
- [ ] Email sequences personalized where possible
- [ ] Social posts have clear CTAs
- [ ] No personal data exposed inappropriately
