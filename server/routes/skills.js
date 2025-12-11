const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateAdmin } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

// Helper function to generate slug from name
function generateSlug(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

// GET /api/skills - List all published skills (with optional category filter)
router.get('/', async (req, res) => {
    try {
        const { category, featured, search, limit = 50, offset = 0 } = req.query;

        let query = `
            SELECT id, slug, name, category, description, author_name, author_website,
                   is_free, price_cents, install_count, is_featured, created_at
            FROM skills
            WHERE is_published = true
        `;
        const params = [];
        let paramCount = 0;

        if (category) {
            paramCount++;
            query += ` AND category = $${paramCount}`;
            params.push(category);
        }

        if (featured === 'true') {
            query += ` AND is_featured = true`;
        }

        if (search) {
            paramCount++;
            query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        query += ` ORDER BY is_featured DESC, install_count DESC, created_at DESC`;

        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(parseInt(limit));

        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(parseInt(offset));

        const result = await pool.query(query, params);

        // Get total count for pagination
        let countQuery = `SELECT COUNT(*) FROM skills WHERE is_published = true`;
        const countParams = [];
        let countParamNum = 0;

        if (category) {
            countParamNum++;
            countQuery += ` AND category = $${countParamNum}`;
            countParams.push(category);
        }
        if (search) {
            countParamNum++;
            countQuery += ` AND (name ILIKE $${countParamNum} OR description ILIKE $${countParamNum})`;
            countParams.push(`%${search}%`);
        }

        const countResult = await pool.query(countQuery, countParams);

        res.json({
            skills: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error fetching skills:', error);
        res.status(500).json({ error: 'Failed to fetch skills' });
    }
});

// GET /api/skills/categories - Get category stats
router.get('/categories', async (req, res) => {
    try {
        const { parent } = req.query;

        // Check if skill_categories table exists
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'skill_categories'
            );
        `);

        if (tableCheck.rows[0].exists) {
            // Use new categories table
            let query;
            let params = [];

            if (parent) {
                // Get subcategories for a parent
                query = `
                    SELECT sc.slug, sc.name, sc.description, sc.icon, sc.display_order,
                           COALESCE(skill_counts.count, 0) as skill_count
                    FROM skill_categories sc
                    LEFT JOIN (
                        SELECT category, COUNT(*) as count
                        FROM skills
                        WHERE is_published = true
                        GROUP BY category
                    ) skill_counts ON skill_counts.category = sc.slug
                    WHERE sc.parent_slug = $1 AND sc.is_active = true
                    ORDER BY sc.display_order, sc.name
                `;
                params = [parent];
            } else {
                // Get parent categories (top-level)
                query = `
                    SELECT sc.slug, sc.name, sc.description, sc.icon, sc.display_order,
                           COALESCE(SUM(child_counts.skill_count), 0) as skill_count
                    FROM skill_categories sc
                    LEFT JOIN (
                        SELECT sc2.parent_slug, COALESCE(COUNT(s.id), 0) as skill_count
                        FROM skill_categories sc2
                        LEFT JOIN skills s ON s.category = sc2.slug AND s.is_published = true
                        WHERE sc2.parent_slug IS NOT NULL
                        GROUP BY sc2.parent_slug
                    ) child_counts ON child_counts.parent_slug = sc.slug
                    WHERE sc.parent_slug IS NULL AND sc.is_active = true
                    GROUP BY sc.slug, sc.name, sc.description, sc.icon, sc.display_order
                    ORDER BY sc.display_order, sc.name
                `;
            }

            const result = await pool.query(query, params);
            res.json({ categories: result.rows });
        } else {
            // Fallback to old hardcoded categories
            const result = await pool.query(`
                SELECT category, COUNT(*) as count
                FROM skills
                WHERE is_published = true
                GROUP BY category
                ORDER BY count DESC
            `);

            const categories = [
                { slug: 'real-estate', name: 'Real Estate', description: 'Skills for real estate professionals', icon: '🏠' },
                { slug: 'marketing', name: 'Marketing', description: 'Content creation and marketing automation', icon: '📢' },
                { slug: 'sales', name: 'Sales', description: 'Sales automation and lead management', icon: '💰' },
                { slug: 'operations', name: 'Operations', description: 'Business operations and workflow automation', icon: '⚙️' },
                { slug: 'development', name: 'Development', description: 'Developer tools and code generation', icon: '💻' }
            ];

            const categoriesWithCounts = categories.map(cat => {
                const found = result.rows.find(r => r.category === cat.slug);
                return {
                    ...cat,
                    skill_count: found ? parseInt(found.count) : 0
                };
            });

            res.json({ categories: categoriesWithCounts });
        }
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// GET /api/skills/:category - List skills by category
router.get('/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const validCategories = ['real-estate', 'marketing', 'sales', 'operations', 'development'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ error: 'Invalid category' });
        }

        const result = await pool.query(`
            SELECT id, slug, name, category, description, author_name, author_website,
                   is_free, price_cents, install_count, is_featured, created_at
            FROM skills
            WHERE is_published = true AND category = $1
            ORDER BY is_featured DESC, install_count DESC, created_at DESC
            LIMIT $2 OFFSET $3
        `, [category, parseInt(limit), parseInt(offset)]);

        const countResult = await pool.query(
            'SELECT COUNT(*) FROM skills WHERE is_published = true AND category = $1',
            [category]
        );

        res.json({
            skills: result.rows,
            category,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error fetching skills by category:', error);
        res.status(500).json({ error: 'Failed to fetch skills' });
    }
});

// GET /api/skills/:category/:slug - Get single skill details
router.get('/:category/:slug', async (req, res) => {
    try {
        const { category, slug } = req.params;

        const result = await pool.query(`
            SELECT *
            FROM skills
            WHERE slug = $1 AND category = $2 AND is_published = true
        `, [slug, category]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Skill not found' });
        }

        // Get related skills (same category, excluding current)
        const relatedResult = await pool.query(`
            SELECT id, slug, name, category, description, author_name, is_free, price_cents
            FROM skills
            WHERE category = $1 AND slug != $2 AND is_published = true
            ORDER BY install_count DESC
            LIMIT 5
        `, [category, slug]);

        res.json({
            skill: result.rows[0],
            relatedSkills: relatedResult.rows
        });
    } catch (error) {
        console.error('Error fetching skill:', error);
        res.status(500).json({ error: 'Failed to fetch skill' });
    }
});

// POST /api/skills/:slug/install - Increment install count
router.post('/:slug/install', async (req, res) => {
    try {
        const { slug } = req.params;

        const result = await pool.query(`
            UPDATE skills
            SET install_count = install_count + 1
            WHERE slug = $1 AND is_published = true
            RETURNING install_count
        `, [slug]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Skill not found' });
        }

        res.json({ install_count: result.rows[0].install_count });
    } catch (error) {
        console.error('Error incrementing install count:', error);
        res.status(500).json({ error: 'Failed to update install count' });
    }
});

// POST /api/skills/submit - Submit new skill for review
router.post('/submit', [
    body('name').trim().notEmpty().withMessage('Skill name is required'),
    body('category').isIn(['real-estate', 'marketing', 'sales', 'operations', 'development'])
        .withMessage('Invalid category'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('skill_content').trim().notEmpty().withMessage('Skill content (SKILL.md) is required'),
    body('author_name').trim().notEmpty().withMessage('Author name is required'),
    body('author_email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('author_website').optional().trim(),
    body('is_free').isBoolean().withMessage('Must specify if skill is free'),
    body('gumroad_url').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            name,
            category,
            description,
            skill_content,
            author_name,
            author_email,
            author_website,
            is_free,
            price_cents,
            gumroad_url
        } = req.body;

        // Generate slug
        const slug = generateSlug(name);

        // Check if slug already exists
        const existingSkill = await pool.query(
            'SELECT id FROM skills WHERE slug = $1',
            [slug]
        );

        const existingSubmission = await pool.query(
            "SELECT id FROM skill_submissions WHERE skill_data->>'slug' = $1 AND status = 'pending'",
            [slug]
        );

        if (existingSkill.rows.length > 0 || existingSubmission.rows.length > 0) {
            return res.status(400).json({
                error: 'A skill with a similar name already exists or is pending review'
            });
        }

        // Store submission
        const skillData = {
            slug,
            name,
            category,
            description,
            skill_content,
            author_name,
            author_email,
            author_website: author_website || null,
            is_free,
            price_cents: is_free ? null : price_cents,
            gumroad_url: is_free ? null : gumroad_url
        };

        const result = await pool.query(`
            INSERT INTO skill_submissions (skill_data, status)
            VALUES ($1, 'pending')
            RETURNING id, submitted_at
        `, [JSON.stringify(skillData)]);

        // Send notification email to admin
        try {
            await sendEmail({
                to: process.env.ADMIN_EMAIL || 'edmund@bogen.ai',
                subject: `New Skill Submission: ${name}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #1a3a52;">New Skill Submission</h2>
                        <p>A new skill has been submitted for review:</p>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Name:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">${name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Category:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">${category}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Author:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">${author_name} (${author_email})</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Type:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">${is_free ? 'Free' : `Paid ($${(price_cents / 100).toFixed(2)})`}</td>
                            </tr>
                        </table>
                        <p style="margin-top: 20px;">
                            <a href="${process.env.BASE_URL || 'https://bogen.ai'}/skills/admin"
                               style="background: #64b5f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                                Review Submission
                            </a>
                        </p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error('Failed to send notification email:', emailError);
            // Don't fail the request if email fails
        }

        res.status(201).json({
            message: 'Skill submitted successfully! It will be reviewed and published soon.',
            submission_id: result.rows[0].id,
            submitted_at: result.rows[0].submitted_at
        });
    } catch (error) {
        console.error('Error submitting skill:', error);
        res.status(500).json({ error: 'Failed to submit skill' });
    }
});

// ============ ADMIN ROUTES ============

// GET /api/skills/admin/submissions - List pending submissions (admin only)
router.get('/admin/submissions', authenticateAdmin, async (req, res) => {
    try {
        const { status = 'pending' } = req.query;

        const result = await pool.query(`
            SELECT s.*, a.name as reviewer_name
            FROM skill_submissions s
            LEFT JOIN admin_users a ON s.reviewed_by = a.admin_id
            WHERE s.status = $1
            ORDER BY s.submitted_at DESC
        `, [status]);

        res.json({ submissions: result.rows });
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

// POST /api/skills/admin/submissions/:id/approve - Approve submission (admin only)
router.post('/admin/submissions/:id/approve', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { edits } = req.body; // Optional edits before publishing

        // Get submission
        const submission = await pool.query(
            'SELECT * FROM skill_submissions WHERE id = $1 AND status = $2',
            [id, 'pending']
        );

        if (submission.rows.length === 0) {
            return res.status(404).json({ error: 'Submission not found or already processed' });
        }

        let skillData = submission.rows[0].skill_data;

        // Apply any edits
        if (edits) {
            skillData = { ...skillData, ...edits };
        }

        // Generate meta tags
        const metaTitle = `${skillData.name} - ${skillData.is_free ? 'Free' : 'Premium'} Claude AI Skill | Bogen.ai`;
        const metaDescription = skillData.description.substring(0, 160);

        // Insert into skills table
        const skillResult = await pool.query(`
            INSERT INTO skills (
                slug, name, category, description, skill_content,
                author_name, author_website, author_email,
                is_free, price_cents, gumroad_url,
                is_published, meta_title, meta_description
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, $12, $13)
            RETURNING *
        `, [
            skillData.slug,
            skillData.name,
            skillData.category,
            skillData.description,
            skillData.skill_content,
            skillData.author_name,
            skillData.author_website,
            skillData.author_email,
            skillData.is_free,
            skillData.price_cents,
            skillData.gumroad_url,
            metaTitle,
            metaDescription
        ]);

        // Update submission status
        await pool.query(`
            UPDATE skill_submissions
            SET status = 'approved', reviewed_at = NOW(), reviewed_by = $1
            WHERE id = $2
        `, [req.admin.id, id]);

        // Send approval email to author
        try {
            await sendEmail({
                to: skillData.author_email,
                subject: `Your Skill "${skillData.name}" is Now Live on Bogen.ai!`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #1a3a52;">Congratulations!</h2>
                        <p>Your skill <strong>${skillData.name}</strong> has been approved and is now live on the Bogen.ai Skills Marketplace!</p>
                        <p>
                            <a href="${process.env.BASE_URL || 'https://bogen.ai'}/skills/${skillData.category}/${skillData.slug}"
                               style="background: #64b5f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                                View Your Skill
                            </a>
                        </p>
                        <p style="margin-top: 20px; color: #666;">Thank you for contributing to the community!</p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error('Failed to send approval email:', emailError);
        }

        res.json({
            message: 'Skill approved and published',
            skill: skillResult.rows[0]
        });
    } catch (error) {
        console.error('Error approving submission:', error);
        res.status(500).json({ error: 'Failed to approve submission' });
    }
});

// POST /api/skills/admin/submissions/:id/reject - Reject submission (admin only)
router.post('/admin/submissions/:id/reject', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const submission = await pool.query(
            'SELECT * FROM skill_submissions WHERE id = $1 AND status = $2',
            [id, 'pending']
        );

        if (submission.rows.length === 0) {
            return res.status(404).json({ error: 'Submission not found or already processed' });
        }

        await pool.query(`
            UPDATE skill_submissions
            SET status = 'rejected', reviewed_at = NOW(), reviewed_by = $1, admin_notes = $2
            WHERE id = $3
        `, [req.admin.id, reason, id]);

        // Send rejection email to author
        const skillData = submission.rows[0].skill_data;
        try {
            await sendEmail({
                to: skillData.author_email,
                subject: `Update on Your Skill Submission "${skillData.name}"`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #1a3a52;">Skill Submission Update</h2>
                        <p>Thank you for submitting <strong>${skillData.name}</strong> to the Bogen.ai Skills Marketplace.</p>
                        <p>After review, we were unable to publish this skill at this time.</p>
                        ${reason ? `<p><strong>Feedback:</strong> ${reason}</p>` : ''}
                        <p>Feel free to make adjustments and resubmit. If you have questions, reply to this email.</p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error('Failed to send rejection email:', emailError);
        }

        res.json({ message: 'Submission rejected' });
    } catch (error) {
        console.error('Error rejecting submission:', error);
        res.status(500).json({ error: 'Failed to reject submission' });
    }
});

// PUT /api/skills/admin/:id - Update skill (admin only)
router.put('/admin/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, description, skill_content, is_free, price_cents,
            gumroad_url, is_published, is_featured
        } = req.body;

        const result = await pool.query(`
            UPDATE skills
            SET name = COALESCE($1, name),
                description = COALESCE($2, description),
                skill_content = COALESCE($3, skill_content),
                is_free = COALESCE($4, is_free),
                price_cents = $5,
                gumroad_url = $6,
                is_published = COALESCE($7, is_published),
                is_featured = COALESCE($8, is_featured),
                updated_at = NOW()
            WHERE id = $9
            RETURNING *
        `, [name, description, skill_content, is_free, price_cents, gumroad_url, is_published, is_featured, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Skill not found' });
        }

        res.json({ skill: result.rows[0] });
    } catch (error) {
        console.error('Error updating skill:', error);
        res.status(500).json({ error: 'Failed to update skill' });
    }
});

// DELETE /api/skills/admin/:id - Delete skill (admin only)
router.delete('/admin/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM skills WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Skill not found' });
        }

        res.json({ message: 'Skill deleted' });
    } catch (error) {
        console.error('Error deleting skill:', error);
        res.status(500).json({ error: 'Failed to delete skill' });
    }
});

// GET /api/skills/admin/all - List all skills including unpublished (admin only)
router.get('/admin/all', authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *
            FROM skills
            ORDER BY created_at DESC
        `);

        res.json({ skills: result.rows });
    } catch (error) {
        console.error('Error fetching all skills:', error);
        res.status(500).json({ error: 'Failed to fetch skills' });
    }
});

module.exports = router;
