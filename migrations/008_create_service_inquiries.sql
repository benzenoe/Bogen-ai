-- Service inquiry captures from Find Your AI Solution quiz
CREATE TABLE IF NOT EXISTS service_inquiries (
  id SERIAL PRIMARY KEY,
  industry VARCHAR(100) NOT NULL,
  challenge TEXT NOT NULL,
  team_size VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_service_inquiries_email ON service_inquiries(email);
CREATE INDEX idx_service_inquiries_status ON service_inquiries(status);
