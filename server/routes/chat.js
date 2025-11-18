// Chatbot API Routes - v1.1 (Updated mastermind session info)
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Load chatbot knowledge base and system prompt
const knowledgeBase = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../config/chatbot-knowledge-base.json'), 'utf8')
);
const faqData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../config/chatbot-faq.json'), 'utf8')
);
const systemPrompt = fs.readFileSync(
  path.join(__dirname, '../../config/chatbot-system-prompt.txt'),
  'utf8'
);

// Helper function to build context from knowledge base
function buildKnowledgeContext() {
  const faqText = faqData.faqs
    .sort((a, b) => a.priority - b.priority)
    .map(faq => `Q: ${faq.question}\nA: ${faq.answer}`)
    .join('\n\n');

  return `
KNOWLEDGE BASE:

${JSON.stringify(knowledgeBase, null, 2)}

FREQUENTLY ASKED QUESTIONS:

${faqText}
`;
}

// POST /api/chat/message - Send message and get response
router.post('/message', async (req, res) => {
  try {
    const { sessionId, message, metadata = {} } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create conversation
    let conversation;
    let conversationId;

    if (sessionId) {
      const result = await pool.query(
        'SELECT * FROM chat_conversations WHERE session_id = $1',
        [sessionId]
      );
      conversation = result.rows[0];
      conversationId = conversation?.id;
    }

    if (!conversationId) {
      // Create new conversation
      const newSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const insertResult = await pool.query(
        `INSERT INTO chat_conversations (session_id, visitor_ip, user_agent, metadata)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          newSessionId,
          req.ip || req.connection.remoteAddress,
          req.headers['user-agent'],
          metadata
        ]
      );
      conversation = insertResult.rows[0];
      conversationId = conversation.id;
    } else {
      // Update last activity
      await pool.query(
        'UPDATE chat_conversations SET last_activity_at = CURRENT_TIMESTAMP WHERE id = $1',
        [conversationId]
      );
    }

    // Save user message
    await pool.query(
      'INSERT INTO chat_messages (conversation_id, role, content) VALUES ($1, $2, $3)',
      [conversationId, 'user', message]
    );

    // Get conversation history (last 20 messages)
    const historyResult = await pool.query(
      `SELECT role, content FROM chat_messages
       WHERE conversation_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [conversationId]
    );

    const conversationHistory = historyResult.rows.reverse();

    // Build messages for Claude
    const messages = conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Define tools available to Claude
    const tools = [
      {
        name: 'register_for_mastermind',
        description: 'Register a user for Edmund\'s Mastermind event. Use this when the user wants to register for the mastermind session. Collect all required information (first_name, last_name, email) and optional information (phone, company, how_heard) before calling this tool.',
        input_schema: {
          type: 'object',
          properties: {
            first_name: {
              type: 'string',
              description: 'The user\'s first name'
            },
            last_name: {
              type: 'string',
              description: 'The user\'s last name'
            },
            email: {
              type: 'string',
              description: 'The user\'s email address'
            },
            phone: {
              type: 'string',
              description: 'The user\'s phone number (optional)'
            },
            company: {
              type: 'string',
              description: 'The user\'s company or brokerage name (optional)'
            },
            how_heard: {
              type: 'string',
              description: 'How the user heard about the mastermind (optional)'
            }
          },
          required: ['first_name', 'last_name', 'email']
        }
      }
    ];

    // Call Claude API with tool support
    let response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      system: `${systemPrompt}\n\n${buildKnowledgeContext()}`,
      messages: messages,
      tools: tools
    });

    // Handle tool use
    let assistantMessage = '';

    if (response.stop_reason === 'tool_use') {
      const toolUse = response.content.find(block => block.type === 'tool_use');

      if (toolUse && toolUse.name === 'register_for_mastermind') {
        // Call the registration API
        try {
          const registrationData = toolUse.input;
          const axios = require('axios');

          // Call our own registration endpoint
          const registrationResponse = await axios.post(
            `${process.env.BASE_URL || 'http://localhost:3000'}/api/mastermind/register`,
            registrationData
          );

          // Continue conversation with tool result
          const toolResultMessages = [
            ...messages,
            {
              role: 'assistant',
              content: response.content
            },
            {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: JSON.stringify({
                    success: true,
                    message: registrationResponse.data.message,
                    zoom_link: registrationResponse.data.zoom_link,
                    meeting_id: registrationResponse.data.meeting_id,
                    event_date: registrationResponse.data.event_date,
                    event_time: registrationResponse.data.event_time
                  })
                }
              ]
            }
          ];

          // Get Claude's response with the tool result
          const finalResponse = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1024,
            system: `${systemPrompt}\n\n${buildKnowledgeContext()}`,
            messages: toolResultMessages,
            tools: tools
          });

          assistantMessage = finalResponse.content[0].text;

        } catch (registrationError) {
          console.error('Registration error:', registrationError);

          // Continue conversation with error
          const toolResultMessages = [
            ...messages,
            {
              role: 'assistant',
              content: response.content
            },
            {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: JSON.stringify({
                    success: false,
                    error: 'Registration failed. Please try again or contact Edmund directly.'
                  })
                }
              ]
            }
          ];

          const finalResponse = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1024,
            system: `${systemPrompt}\n\n${buildKnowledgeContext()}`,
            messages: toolResultMessages,
            tools: tools
          });

          assistantMessage = finalResponse.content[0].text;
        }
      }
    } else {
      assistantMessage = response.content[0].text;
    }

    // Save assistant response
    await pool.query(
      'INSERT INTO chat_messages (conversation_id, role, content) VALUES ($1, $2, $3)',
      [conversationId, 'assistant', assistantMessage]
    );

    // Check if should escalate (simple heuristic - can be enhanced)
    const shouldEscalate = checkForEscalation(assistantMessage, conversationHistory.length);

    if (shouldEscalate && !conversation.escalated) {
      await pool.query(
        'UPDATE chat_conversations SET escalated = true WHERE id = $1',
        [conversationId]
      );
    }

    res.json({
      sessionId: conversation.session_id,
      message: assistantMessage,
      shouldEscalate,
      conversationId
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Failed to process message',
      message: 'I apologize, but I encountered an error. Please try again or contact Edmund directly at edmund@bogenhomes.com or 561-235-7575.'
    });
  }
});

// POST /api/chat/lead - Capture qualified lead
router.post('/lead', async (req, res) => {
  try {
    const {
      sessionId,
      name,
      email,
      phone,
      businessType,
      revenueRange,
      mainBottleneck,
      leadsPerMonth,
      notes
    } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Get conversation
    const conversationResult = await pool.query(
      'SELECT id FROM chat_conversations WHERE session_id = $1',
      [sessionId]
    );

    if (conversationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const conversationId = conversationResult.rows[0].id;

    // Calculate qualification score
    let qualificationScore = 0;
    if (email) qualificationScore += 20;
    if (phone) qualificationScore += 20;
    if (revenueRange && (revenueRange.includes('$250K') || revenueRange.includes('$1M'))) qualificationScore += 30;
    if (businessType) qualificationScore += 15;
    if (mainBottleneck) qualificationScore += 15;

    // Insert lead
    const result = await pool.query(
      `INSERT INTO chat_leads (
        conversation_id, name, email, phone, business_type,
        revenue_range, main_bottleneck, leads_per_month,
        qualification_score, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        conversationId,
        name,
        email,
        phone,
        businessType,
        revenueRange,
        mainBottleneck,
        leadsPerMonth,
        qualificationScore,
        notes
      ]
    );

    // Mark conversation as lead captured
    await pool.query(
      'UPDATE chat_conversations SET lead_captured = true WHERE id = $1',
      [conversationId]
    );

    // TODO: Send email notification to Edmund
    // TODO: Add to CRM if integrated

    res.json({
      success: true,
      leadId: result.rows[0].id,
      qualificationScore
    });

  } catch (error) {
    console.error('Lead capture error:', error);
    res.status(500).json({ error: 'Failed to capture lead' });
  }
});

// GET /api/chat/conversations - Get all conversations (admin only)
router.get('/conversations', async (req, res) => {
  try {
    // TODO: Add authentication check for admin
    const { limit = 50, offset = 0, active_only = false } = req.query;

    let query = `
      SELECT
        c.*,
        COUNT(m.id) as message_count,
        l.email as lead_email,
        l.name as lead_name,
        l.qualification_score
      FROM chat_conversations c
      LEFT JOIN chat_messages m ON m.conversation_id = c.id
      LEFT JOIN chat_leads l ON l.conversation_id = c.id
    `;

    const params = [limit, offset];

    if (active_only === 'true') {
      query += ' WHERE c.is_active = true';
    }

    query += ' GROUP BY c.id, l.email, l.name, l.qualification_score ORDER BY c.last_activity_at DESC LIMIT $1 OFFSET $2';

    const result = await pool.query(query, params);

    res.json({
      conversations: result.rows,
      total: result.rowCount
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// GET /api/chat/conversation/:sessionId - Get specific conversation with messages
router.get('/conversation/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const conversationResult = await pool.query(
      'SELECT * FROM chat_conversations WHERE session_id = $1',
      [sessionId]
    );

    if (conversationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const conversation = conversationResult.rows[0];

    const messagesResult = await pool.query(
      'SELECT * FROM chat_messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [conversation.id]
    );

    const leadResult = await pool.query(
      'SELECT * FROM chat_leads WHERE conversation_id = $1',
      [conversation.id]
    );

    res.json({
      conversation,
      messages: messagesResult.rows,
      lead: leadResult.rows[0] || null
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Helper function to check if conversation should escalate
function checkForEscalation(message, messageCount) {
  const escalationKeywords = [
    'talk to edmund',
    'speak to someone',
    'call me',
    'schedule a call',
    'strategy call',
    'talk to a human',
    'speak to a person'
  ];

  const lowerMessage = message.toLowerCase();
  const hasEscalationKeyword = escalationKeywords.some(keyword =>
    lowerMessage.includes(keyword)
  );

  // Escalate if:
  // 1. Message contains escalation keywords
  // 2. Conversation is very long (20+ messages) - might be stuck
  // 3. Message mentions Calendly link
  return hasEscalationKeyword || messageCount > 20 || lowerMessage.includes('calendly');
}

module.exports = router;
