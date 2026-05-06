const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs').promises;
const paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY || 'sk_test_1bc83307e5ae9d9e50ba99cd0c8c73393d519739');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize game history on server start
loadGameHistory();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Game multipliers
const multipliers = {
    1: 5,
    2: 5.5,
    3: 6,
    4: 7,
    5: 8,
    6: 10,
    7: 12,
    8: 15,
    9: 20,
    10: 25
};

// Helper functions for user management
const getUsers = async () => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'users.json'), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

const saveUsers = async (users) => {
    await fs.writeFile(path.join(__dirname, 'users.json'), JSON.stringify(users, null, 2));
};

const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Game history storage
let gameHistory = [];

// Load game history
async function loadGameHistory() {
    try {
        const data = await fs.readFile(path.join(__dirname, 'gameHistory.json'), 'utf8');
        gameHistory = JSON.parse(data);
    } catch (error) {
        gameHistory = [];
    }
}

// Save game history
async function saveGameHistory() {
    await fs.writeFile(path.join(__dirname, 'gameHistory.json'), JSON.stringify(gameHistory, null, 2));
}

// Admin credentials (in production, use proper authentication)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' // 'password' hashed
};

// Generate admin token
function generateAdminToken() {
    return Date.now().toString(36) + Math.random().toString(36);
}

// POST /register endpoint
app.post('/register', async (req, res) => {
    try {
        const { username, momoNumber, password } = req.body;

        // Validate input
        if (!username || !momoNumber || !password) {
            return res.status(400).json({
                error: 'Username, momo number, and password are required'
            });
        }

        if (username.length < 3) {
            return res.status(400).json({
                error: 'Username must be at least 3 characters long'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters long'
            });
        }

        // Get existing users
        const users = await getUsers();

        // Check for duplicate username
        const existingUser = users.find(user => user.username === username);
        if (existingUser) {
            return res.status(400).json({
                error: 'Username already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = {
            id: generateId(),
            username,
            momoNumber,
            password: hashedPassword,
            balance: 0
        };

        // Save user
        users.push(newUser);
        await saveUsers(users);

        // Return user without password
        const { password: _, ...userWithoutPassword } = newUser;

        res.status(201).json({
            message: 'User registered successfully',
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Error in /register endpoint:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// POST /login endpoint
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                error: 'Username and password are required'
            });
        }

        // Get users
        const users = await getUsers();

        // Find user
        const user = users.find(u => u.username === username);
        if (!user) {
            return res.status(401).json({
                error: 'Invalid username or password'
            });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Invalid username or password'
            });
        }

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            message: 'Login successful',
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Error in /login endpoint:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// POST /spin endpoint
app.post('/spin', async (req, res) => {
    try {
        const { selectedNumbers, stake, userId } = req.body;

        // Validate input
        if (!selectedNumbers || !Array.isArray(selectedNumbers) || selectedNumbers.length === 0) {
            return res.status(400).json({
                error: 'selectedNumbers is required and must be a non-empty array'
            });
        }

        if (!stake || isNaN(stake) || stake <= 0) {
            return res.status(400).json({
                error: 'stake is required and must be a positive number'
            });
        }

        if (!userId) {
            return res.status(400).json({
                error: 'userId is required'
            });
        }

        // Validate selected numbers (must be 1-10)
        const invalidNumbers = selectedNumbers.filter(num => num < 1 || num > 10);
        if (invalidNumbers.length > 0) {
            return res.status(400).json({
                error: 'selectedNumbers must contain only numbers between 1 and 10',
                invalidNumbers
            });
        }

        // Get users and find current user
        const users = await getUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        const user = users[userIndex];

        // Check if user has sufficient balance
        if (user.balance < stake) {
            return res.status(400).json({
                error: 'Insufficient balance',
                currentBalance: user.balance,
                requiredStake: stake
            });
        }

        // Generate random winning number (1-10)
        const winningNumber = Math.floor(Math.random() * 10) + 1;

        // Check if user won
        const isWin = selectedNumbers.includes(winningNumber);
        let payout = 0;

        if (isWin) {
            payout = stake * multipliers[winningNumber];
        }

        // Update user balance
        const newBalance = user.balance - stake + payout;
        users[userIndex].balance = newBalance;
        
        // Save updated users
        await saveUsers(users);

        // Track game history
        const gameRecord = {
            id: generateId(),
            userId: userId,
            username: user.username,
            selectedNumbers: selectedNumbers,
            stake: stake,
            winningNumber: winningNumber,
            result: isWin ? 'win' : 'lose',
            payout: payout,
            previousBalance: user.balance,
            newBalance: newBalance,
            timestamp: new Date().toISOString()
        };
        
        gameHistory.push(gameRecord);
        await saveGameHistory();

        // Return result with updated balance
        res.json({
            winningNumber,
            result: isWin ? 'win' : 'lose',
            payout: isWin ? payout : 0,
            stake,
            selectedNumbers,
            multiplier: isWin ? multipliers[winningNumber] : null,
            newBalance,
            previousBalance: user.balance
        });

    } catch (error) {
        console.error('Error in /spin endpoint:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// POST /verify-payment endpoint
app.post('/verify-payment', async (req, res) => {
    try {
        const { reference, userId } = req.body;

        if (!reference || !userId) {
            return res.status(400).json({
                error: 'Reference and userId are required'
            });
        }

        // Verify payment with Paystack
        const verification = await paystack.transaction.verify(reference);
        
        if (!verification.status) {
            return res.status(400).json({
                error: 'Payment verification failed',
                details: verification.message
            });
        }

        const payment = verification.data;

        // Check if payment was successful
        if (payment.status !== 'success') {
            return res.status(400).json({
                error: 'Payment was not successful',
                paymentStatus: payment.status
            });
        }

        // Check if payment has already been processed (optional - you might want to track this)
        const amount = payment.amount / 100; // Convert from kobo to GHC

        // Get users and update balance
        const users = await getUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        const user = users[userIndex];
        const previousBalance = user.balance;
        const newBalance = previousBalance + amount;
        
        // Update user balance
        users[userIndex].balance = newBalance;
        await saveUsers(users);

        // Return success with updated balance
        res.json({
            success: true,
            message: 'Payment verified and balance updated',
            amount,
            previousBalance,
            newBalance,
            paymentDetails: {
                reference: payment.reference,
                paid_at: payment.paid_at,
                channel: payment.channel
            }
        });

    } catch (error) {
        console.error('Error in /verify-payment endpoint:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

// POST /withdraw endpoint
app.post('/withdraw', async (req, res) => {
    try {
        const { userId, amount, momoNumber, notes } = req.body;

        if (!userId || !amount || !momoNumber) {
            return res.status(400).json({
                error: 'UserId, amount, and momoNumber are required'
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                error: 'Amount must be greater than 0'
            });
        }

        // Get users and find current user
        const users = await getUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        const user = users[userIndex];

        // Check if user has sufficient balance
        if (user.balance < amount) {
            return res.status(400).json({
                error: 'Insufficient balance',
                currentBalance: user.balance,
                requestedAmount: amount
            });
        }

        // Create withdrawal record
        const withdrawal = {
            id: generateId(),
            userId: userId,
            username: user.username,
            amount: amount,
            momoNumber: momoNumber,
            notes: notes || '',
            status: 'pending',
            previousBalance: user.balance,
            timestamp: new Date().toISOString()
        };

        // Deduct amount from user balance (will be restored if withdrawal fails)
        user.balance -= amount;
        await saveUsers(users);

        // Store withdrawal record (you might want to create a separate withdrawals.json file)
        // For now, we'll store it in a simple array or add to game history
        if (!gameHistory) gameHistory = [];
        gameHistory.push({
            ...withdrawal,
            type: 'withdrawal',
            result: 'pending'
        });
        await saveGameHistory();

        res.json({
            success: true,
            message: 'Withdrawal request submitted successfully',
            withdrawal: {
                id: withdrawal.id,
                amount: amount,
                status: 'pending',
                timestamp: withdrawal.timestamp
            },
            newBalance: user.balance
        });

    } catch (error) {
        console.error('Error in /withdraw endpoint:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// GET /api/multipliers endpoint (for frontend to get multipliers)
app.get('/api/multipliers', (req, res) => {
    res.json(multipliers);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Admin endpoints
// POST /admin/login
app.post('/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: 'Username and password are required'
            });
        }

        // Check admin credentials
        if (username !== ADMIN_CREDENTIALS.username) {
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, ADMIN_CREDENTIALS.password);
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        // Generate and return token
        const token = generateAdminToken();
        res.json({
            message: 'Login successful',
            token
        });

    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// Middleware to verify admin token
const verifyAdminToken = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({
            error: 'Admin token required'
        });
    }
    
    // In production, verify token against database or JWT
    // For demo, accept any token
    next();
};

// GET /admin/users
app.get('/admin/users', verifyAdminToken, async (req, res) => {
    try {
        const users = await getUsers();
        
        // Add game statistics to each user
        const usersWithStats = users.map(user => {
            const userGames = gameHistory.filter(game => game.userId === user.id);
            const totalWins = userGames.filter(game => game.result === 'win').length;
            const totalSpins = userGames.length;
            
            return {
                ...user,
                totalWins,
                totalSpins,
                password: undefined // Don't send password
            };
        });
        
        res.json(usersWithStats);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// GET /admin/game-history
app.get('/admin/game-history', verifyAdminToken, async (req, res) => {
    try {
        await loadGameHistory();
        
        // Add usernames to game history
        const users = await getUsers();
        const historyWithUsernames = gameHistory.map(game => {
            const user = users.find(u => u.id === game.userId);
            return {
                ...game,
                username: user ? user.username : 'Unknown'
            };
        });
        
        res.json(historyWithUsernames);
    } catch (error) {
        console.error('Get game history error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// GET /admin/statistics
app.get('/admin/statistics', verifyAdminToken, async (req, res) => {
    try {
        const users = await getUsers();
        await loadGameHistory();
        
        const totalUsers = users.length;
        const totalBalance = users.reduce((sum, user) => sum + user.balance, 0);
        const totalWins = gameHistory.filter(game => game.result === 'win').length;
        const totalSpins = gameHistory.length;
        
        res.json({
            totalUsers,
            totalBalance,
            totalWins,
            totalSpins
        });
    } catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// POST /admin/adjust-balance
app.post('/admin/adjust-balance', verifyAdminToken, async (req, res) => {
    try {
        const { userId, type, amount } = req.body;

        if (!userId || !type || amount <= 0) {
            return res.status(400).json({
                error: 'UserId, type, and amount are required'
            });
        }

        const users = await getUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        const user = users[userIndex];
        const previousBalance = user.balance;
        
        // Adjust balance based on type
        switch (type) {
            case 'add':
                user.balance += amount;
                break;
            case 'subtract':
                user.balance = Math.max(0, user.balance - amount);
                break;
            case 'set':
                user.balance = amount;
                break;
            default:
                return res.status(400).json({
                    error: 'Invalid type. Must be add, subtract, or set'
                });
        }
        
        await saveUsers(users);

        res.json({
            message: 'Balance adjusted successfully',
            previousBalance,
            newBalance: user.balance
        });

    } catch (error) {
        console.error('Adjust balance error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// Serve the frontend (optional - if you want to serve the HTML from the same server)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🎰 BONNYSINO Server is running on port ${PORT}`);
    console.log(`📍 Spin endpoint: http://localhost:${PORT}/spin`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`📍 Multipliers: http://localhost:${PORT}/api/multipliers`);
});

module.exports = app;
