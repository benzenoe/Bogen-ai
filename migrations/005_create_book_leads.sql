-- Book companion page email captures
CREATE TABLE IF NOT EXISTS book_leads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  opted_in BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_book_leads_email ON book_leads(email);
CREATE INDEX idx_book_leads_resource ON book_leads(resource);
