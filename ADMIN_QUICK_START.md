# Admin Quick Start Guide

Quick reference for setting up and using the Bogen.ai admin backend.

## 🚀 First Time Setup

If you need to create your first admin user:

```bash
node scripts/setup-first-admin.js
```

This will create Edmund's admin account with the credentials:
- **Email:** edmund@bogenhomes.com
- **Password:** Joyousgarde1

## 🔐 Login

**URL:** https://www.bogen.ai/admin

**Current Credentials:**
- Email: edmund@bogenhomes.com
- Password: Joyousgarde1

## 👥 Add Additional Admins

To create more admin users:

```bash
node scripts/create-admin-user.js
```

Follow the prompts to enter:
- Admin name
- Email address
- Password (min 8 characters)
- Password confirmation

## 📊 Dashboard Features

### Partners Tab
- Approve or reject partner applications
- View partner referral codes
- Track partner commissions
- Suspend partners if needed

### Clients Tab
- View all client inquiries
- Update client status (Lead → Active)
- See which partner referred them
- Track sales pipeline

### Referrals Tab
- View active client subscriptions
- Track monthly recurring revenue (MRR)
- Calculate partner commissions (20% default)
- Update referral status

### Mastermind Tab
- View all event registrations
- See attendee details
- Mark attendance after events
- Export registrations list

### Videos Tab
- Add featured videos to Video Archive page
- Manage video display order
- Feature/unfeature videos

## 🔧 Common Tasks

### Approve a New Partner
1. Go to Partners tab
2. Click "Approve" next to pending partner
3. They'll receive email with login credentials
4. Their referral link becomes active

### Convert Lead to Active Client
1. Go to Clients tab
2. Find the lead
3. Click "Convert to Active"
4. Enter monthly subscription amount
5. Select services
6. If referred by partner, commission is auto-created

### Update Mastermind Event
1. Edit `/config/mastermind-event.json`
2. Update date, time, Zoom link, etc.
3. Push to GitHub
4. Vercel auto-deploys (takes 2-3 minutes)

See `HOW_TO_UPDATE_MASTERMIND_EVENT.md` for details.

## 📞 Need Help?

**Technical Issues:**
- Check if server is running
- Clear browser cache
- Try different browser
- Contact Eytan

**Database Access:**
- Neon Console: https://console.neon.tech
- Database: bogenai
- Use for direct SQL queries if needed

**For Full Documentation:**
See the complete Admin Backend Documentation in Notion

---

**Last Updated:** November 11, 2025
