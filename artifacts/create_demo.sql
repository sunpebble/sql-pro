CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    display_name TEXT,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    category TEXT
);

CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    status TEXT DEFAULT 'pending',
    total DECIMAL(10,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

INSERT INTO users (username, email, display_name, role) VALUES
('john_doe', 'john@example.com', 'John Doe', 'admin'),
('jane_smith', 'jane@example.com', 'Jane Smith', 'user'),
('bob_wilson', 'bob@example.com', 'Bob Wilson', 'user'),
('alice_chen', 'alice@example.com', 'Alice Chen', 'moderator'),
('mike_brown', 'mike@example.com', 'Mike Brown', 'user');

INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic devices'),
('Computers', 'Desktop and laptops'),
('Accessories', 'Computer accessories'),
('Books', 'Physical and digital books');

INSERT INTO products (name, description, price, stock, category) VALUES
('MacBook Pro 14', 'Apple M3 Pro chip', 1999.00, 25, 'Computers'),
('Magic Keyboard', 'Wireless keyboard', 199.00, 150, 'Accessories'),
('USB-C Hub', '7-in-1 adapter', 49.99, 300, 'Accessories'),
('Wireless Mouse', 'Ergonomic mouse', 79.00, 200, 'Accessories'),
('4K Monitor', 'Professional display', 599.00, 45, 'Electronics'),
('Programming in Rust', 'Rust guide', 49.99, 100, 'Books'),
('Database Design', 'SQL patterns', 39.99, 75, 'Books'),
('Mechanical Keyboard', 'RGB keyboard', 149.00, 80, 'Accessories');

INSERT INTO orders (user_id, status, total) VALUES
(1, 'completed', 2248.00),
(2, 'shipped', 248.99),
(3, 'pending', 599.00),
(1, 'completed', 89.98),
(4, 'processing', 1999.00);

CREATE VIEW order_summary AS
SELECT o.id, u.display_name as customer, o.status, o.total, o.created_at
FROM orders o JOIN users u ON o.user_id = u.id;
