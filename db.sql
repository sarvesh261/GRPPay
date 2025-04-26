-- Create Users table
CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,
    password VARCHAR(100) NOT NULL,
    balance DECIMAL(10,2) DEFAULT 10.00
);

-- Create Groups table
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    by VARCHAR(50) REFERENCES users(user_id)
);

-- Create Members table
CREATE TABLE members (
    id INT REFERENCES groups(id),
    member_user VARCHAR(50) REFERENCES users(user_id),
    PRIMARY KEY (id, member_user)
);

-- Create Items table
CREATE TABLE items (
    item_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL
);

-- Create Transactions table
CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    group_id INT REFERENCES groups(id),
    purchaser_id VARCHAR(50) REFERENCES users(user_id),
    item_id INT REFERENCES items(item_id),
    quantity INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Items
INSERT INTO items (item_id, name, price) VALUES
(1, 'Sandwich', 45.00),
(2, 'Burger', 60.00),
(3, 'Pizza', 120.00),
(4, 'French Fries', 40.00),
(5, 'Cold Coffee', 50.00),
(6, 'Ice Cream', 35.00),
(7, 'Pasta', 80.00),
(8, 'Noodles', 70.00),
(9, 'Samosa', 15.00),
(10, 'Tea', 12.00);

-- Insert Users with random balances between 8 and 11
INSERT INTO users (user_id, password, balance) VALUES
('Sarvesh', 'psg123', 8.00),
('Nivetha', 'psg123', 10.00),
('Sanmia', 'psg123', 9.00),
('Shivram', 'psg123', 11.00),
('Raghav', 'psg123', 8.00),
('Karthika', 'psg123', 10.00),
('Harshini', 'psg123', 9.00),
('Kartheepan', 'psg123', 8.00),
('Ronick', 'psg123', 10.00),
('Mohit', 'psg123', 9.00);
