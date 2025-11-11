# How to Update Mastermind Event Details

## ✨ Quick Update (Just Tell Claude)

Simply say to Claude Code:

```
Update the mastermind event to:
- Date: [New Date]
- Time: [New Time]
- Zoom Link: [New Zoom Link]
- Meeting ID: [New Meeting ID]
- Passcode: [New Passcode]
- Topic: [New Topic/Title]
- Workbook: [New Workbook Link if changed]
```

**Example:**
```
Update the mastermind event to:
- Date: November 20, 2025 (Wednesday)
- Time: 10:00-11:00 AM Eastern
- Zoom Link: https://zoom.us/j/12345
- Meeting ID: 123 456 7890
- Passcode: 999888
- Topic: LEAD GENERATION: AI-POWERED PROSPECTING
```

Claude will update the single config file and everything will automatically update:
- ✅ Countdown timer
- ✅ Registration form
- ✅ Thank you page
- ✅ Email confirmation (when implemented)
- ✅ Database entries

---

## 📝 Manual Update (If You Want To Do It Yourself)

**File to Edit:** `/config/mastermind-event.json`

Just update this one file with your new event details. Everything else updates automatically!

### Example Event Config:

```json
{
  "eventTitle": "YOUR EVENT TITLE",
  "eventSubtitle": "Your Event Subtitle",
  "eventDate": "2025-11-20",
  "eventDateDisplay": "Wednesday, November 20, 2025",
  "eventTime": "10:00-11:00 AM Eastern Time",
  "eventTimeStart": "10:00",
  "eventTimeZone": "America/New_York",
  "zoomLink": "https://zoom.us/j/YOUR_MEETING_ID",
  "meetingId": "123 456 7890",
  "passcode": "999888",
  "workbookLink": "https://link-to-workbook.pdf",
  "description": "Your event description...",
  "keyPoints": [
    "First key point about the event",
    "Second key point",
    "Third key point"
  ],
  "benefits": [
    "First benefit attendees will get",
    "Second benefit",
    "Third benefit"
  ]
}
```

### Field Explanations:

- **eventTitle**: Main heading (e.g., "EXPANSION: LICENSE TO MULTIPLY MARKETS")
- **eventSubtitle**: Subheading (e.g., "The Geographic Domination Session")
- **eventDate**: Format YYYY-MM-DD (used for countdown and database)
- **eventDateDisplay**: How it appears to users (e.g., "Wednesday, November 20, 2025")
- **eventTime**: Display format (e.g., "10:00-11:00 AM Eastern Time")
- **eventTimeStart**: 24-hour format for countdown (e.g., "10:00")
- **eventTimeZone**: IANA timezone (e.g., "America/New_York")
- **zoomLink**: Full Zoom meeting URL
- **meetingId**: Formatted meeting ID with spaces
- **passcode**: Meeting passcode
- **workbookLink**: URL to session workbook/materials
- **description**: Main description paragraph
- **keyPoints**: Array of 3 main points (models, topics, etc.)
- **benefits**: Array of benefits attendees will receive

---

## 🚀 After Updating

1. Save the file
2. Commit to git: `git add . && git commit -m "Update mastermind event" && git push`
3. Vercel will auto-deploy (takes ~2 minutes)
4. New event details are live!

---

## 📋 What Gets Updated Automatically

When you change `mastermind-event.json`:

✅ **Homepage:**
- Countdown timer (automatically calculates to new date/time)
- Event title and description
- Registration form event details

✅ **Registration API:**
- Stores correct event date in database
- Returns correct Zoom details after registration

✅ **Thank You Page:**
- Displays correct event details
- Shows correct Zoom link and credentials
- Links to correct workbook

✅ **Future Email Confirmations:**
- Will use config details when implemented

---

## 💡 Pro Tips

1. **Update 1-2 days before the event** to avoid confusion
2. **Test the countdown** - make sure eventDate and eventTimeStart are correct
3. **Double-check Zoom details** - verify Meeting ID and Passcode
4. **Keep workbook link updated** if you create new materials
5. **Reuse previous events** - just change dates and Zoom info

---

## ⚠️ Important Notes

- **Date Format**: Must be YYYY-MM-DD for eventDate
- **Time Zone**: Eastern Time is "America/New_York"
- **Countdown Timer**: Uses eventDate + eventTimeStart + eventTimeZone
- **Valid JSON**: Make sure the file is valid JSON (no trailing commas, proper quotes)

---

## 🆘 Troubleshooting

**Countdown not working?**
- Check `eventDate` is YYYY-MM-DD format
- Check `eventTimeStart` is HH:MM format (24-hour)

**Details not updating?**
- Clear browser cache or hard refresh (Cmd+Shift+R)
- Wait 2-3 minutes for Vercel deployment

**Need help?**
- Ask Claude Code to validate your config
- Ask Claude to update it for you (easier!)

---

**Last Updated:** November 11, 2025
