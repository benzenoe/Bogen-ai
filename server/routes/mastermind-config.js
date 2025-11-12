const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

/**
 * GET /api/mastermind/event-config
 * Get current mastermind event configuration (from database)
 */
router.get('/event-config', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM mastermind_events
      WHERE is_published = true AND is_featured = true
      ORDER BY event_date DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No published event found' });
    }

    const event = result.rows[0];

    // Format response to match old JSON structure for backwards compatibility
    const config = {
      eventTitle: event.event_title,
      eventSubtitle: event.event_subtitle,
      eventDate: event.event_date,
      eventDateDisplay: formatEventDate(event.event_date, event.show_day_only),
      eventTime: formatEventTime(event.event_time_start, event.event_time_end, event.show_time_range),
      eventTimeStart: event.event_time_start,
      eventTimeZone: event.event_timezone,
      zoomLink: event.zoom_link,
      meetingId: event.meeting_id,
      passcode: event.passcode,
      workbookLink: event.workbook_link,
      description: event.description,
      keyPoints: event.key_points,
      benefits: event.benefits
    };

    res.json(config);
  } catch (error) {
    console.error('Error reading mastermind config:', error);
    res.status(500).json({ error: 'Failed to load event configuration' });
  }
});

/**
 * Helper function to format event date
 */
function formatEventDate(date, showDayOnly) {
  const d = new Date(date);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  if (showDayOnly) {
    return days[d.getDay()];
  }

  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/**
 * Helper function to format event time
 */
function formatEventTime(startTime, endTime, showRange) {
  if (!startTime) return '';

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (showRange && endTime) {
    return `${formatTime(startTime)}-${formatTime(endTime).split(' ')[0]} ${formatTime(endTime).split(' ')[1]} Eastern Time`;
  }

  return `${formatTime(startTime)} Eastern Time`;
}

module.exports = router;
