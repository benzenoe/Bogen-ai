-- Speaker inquiry captures from book companion page
CREATE TABLE IF NOT EXISTS speaker_inquiries (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  message TEXT DEFAULT '',
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_speaker_inquiries_email ON speaker_inquiries(email);
CREATE INDEX idx_speaker_inquiries_status ON speaker_inquiries(status);
