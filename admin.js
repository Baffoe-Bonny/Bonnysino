// Admin Dashboard JavaScript
let adminToken = null;
let usersData = [];
let gameHistory = [];

// DOM Elements
const adminLoginModal = document.getElementById('adminLoginModal');
const adminDashboard = document.getElementById('adminDashboard');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminUserDisplay = document.getElementById('adminUserDisplay');
const logoutBtn = document.getElementById('logoutBtn');

// Statistics elements
const totalUsers = document.getElementById('totalUsers');
const totalBalance = document.getElementById('totalBalance');
const totalWins = document.getElementById('totalWins');
const totalSpins = document.getElementById('totalSpins');

// Table and modals
const usersTableBody = document.getElementById('usersTableBody');
const refreshUsersBtn = document.getElementById('refreshUsersBtn');
const recentActivity = document.getElementById('recentActivity');
const userDetailsModal = document.getElementById('userDetailsModal');
const balanceModal = document.getElementById('balanceModal');

// Check if admin is logged in
function checkAdminAuth() {
    const token = localStorage.getItem('bonnysino_admin_token');
    const username = localStorage.getItem('bonnysino_admin_user');
    
    if (token && username) {
        adminToken = token;
        adminUserDisplay.textContent = username;
        showAdminDashboard();
        loadDashboardData();
    }
}

// Admin login
async function adminLogin(username, password) {
    try {
        const response = await fetch('http://localhost:3000/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            adminToken = data.token;
            localStorage.setItem('bonnysino_admin_token', adminToken);
            localStorage.setItem('bonnysino_admin_user', username);
            
            adminUserDisplay.textContent = username;
            showAdminDashboard();
            loadDashboardData();
            
            showMessage('Login successful!', 'success');
        } else {
            showMessage(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Admin login error:', error);
        showMessage('Failed to connect to server', 'error');
    }
}

// Admin logout
function adminLogout() {
    adminToken = null;
    localStorage.removeItem('bonnysino_admin_token');
    localStorage.removeItem('bonnysino_admin_user');
    
    hideAdminDashboard();
    showMessage('Logged out successfully', 'success');
}

// Show/hide dashboard
function showAdminDashboard() {
    adminLoginModal.classList.add('hidden');
    adminDashboard.classList.remove('hidden');
}

function hideAdminDashboard() {
    adminDashboard.classList.add('hidden');
    adminLoginModal.classList.remove('hidden');
}

// Load dashboard data
async function loadDashboardData() {
    await Promise.all([
        loadUsers(),
        loadGameHistory(),
        loadStatistics()
    ]);
    updateRecentActivity();
}

// Load users
async function loadUsers() {
    try {
        const response = await fetch('http://localhost:3000/admin/users', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        if (response.ok) {
            usersData = await response.json();
            renderUsersTable();
            updateStatistics();
        } else {
            showMessage('Failed to load users', 'error');
        }
    } catch (error) {
        console.error('Load users error:', error);
        showMessage('Failed to connect to server', 'error');
    }
}

// Load game history
async function loadGameHistory() {
    try {
        const response = await fetch('http://localhost:3000/admin/game-history', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        if (response.ok) {
            gameHistory = await response.json();
            updateStatistics();
        }
    } catch (error) {
        console.error('Load game history error:', error);
    }
}

// Load statistics
async function loadStatistics() {
    try {
        const response = await fetch('http://localhost:3000/admin/statistics', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        if (response.ok) {
            const stats = await response.json();
            totalUsers.textContent = stats.totalUsers;
            totalBalance.textContent = `${stats.totalBalance.toFixed(2)} GHC`;
            totalWins.textContent = stats.totalWins;
            totalSpins.textContent = stats.totalSpins;
        }
    } catch (error) {
        console.error('Load statistics error:', error);
    }
}

// Render users table
function renderUsersTable() {
    usersTableBody.innerHTML = '';
    
    usersData.forEach(user => {
        const row = document.createElement('tr');
        row.className = 'user-row';
        
        const winRate = user.totalSpins > 0 ? ((user.totalWins / user.totalSpins) * 100).toFixed(1) : 0;
        
        row.innerHTML = `
            <td class="p-3 text-yellow-300 font-semibold">${user.username}</td>
            <td class="p-3 text-gray-300">${user.momoNumber || 'N/A'}</td>
            <td class="p-3 text-green-400 font-bold">${user.balance.toFixed(2)} GHC</td>
            <td class="p-3 text-blue-400">${user.totalSpins || 0}</td>
            <td class="p-3 text-yellow-400">${user.totalWins || 0}</td>
            <td class="p-3 text-gray-300">${winRate}%</td>
            <td class="p-3">
                <button onclick="viewUserDetails('${user.id}')" class="text-yellow-400 hover:text-yellow-300 mr-2">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="showBalanceModal('${user.id}')" class="text-green-400 hover:text-green-300">
                    <i class="fas fa-wallet"></i>
                </button>
            </td>
        `;
        
        usersTableBody.appendChild(row);
    });
}

// Update statistics
function updateStatistics() {
    const totalUsersCount = usersData.length;
    const totalBal = usersData.reduce((sum, user) => sum + user.balance, 0);
    const totalWinsCount = gameHistory.filter(game => game.result === 'win').length;
    const totalSpinsCount = gameHistory.length;
    
    totalUsers.textContent = totalUsersCount;
    totalBalance.textContent = `${totalBal.toFixed(2)} GHC`;
    totalWins.textContent = totalWinsCount;
    totalSpins.textContent = totalSpinsCount;
}

// Update recent activity
function updateRecentActivity() {
    recentActivity.innerHTML = '';
    
    const recentGames = gameHistory.slice(-10).reverse();
    
    if (recentGames.length === 0) {
        recentActivity.innerHTML = '<p class="text-gray-400 text-center">No recent activity</p>';
        return;
    }
    
    recentGames.forEach(game => {
        const activityDiv = document.createElement('div');
        activityDiv.className = 'bg-gray-800 p-3 rounded-lg';
        
        const resultClass = game.result === 'win' ? 'text-green-400' : 'text-red-400';
        const resultIcon = game.result === 'win' ? 'fa-trophy' : 'fa-times-circle';
        
        activityDiv.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <span class="text-yellow-300 font-semibold">${game.username}</span>
                    <span class="text-gray-400 ml-2">spun ${game.stake} GHC</span>
                </div>
                <div class="${resultClass}">
                    <i class="fas ${resultIcon} mr-1"></i>
                    ${game.result === 'win' ? `Won ${game.payout} GHC` : 'Lost'}
                </div>
            </div>
            <div class="text-xs text-gray-500 mt-1">
                ${new Date(game.timestamp).toLocaleString()}
            </div>
        `;
        
        recentActivity.appendChild(activityDiv);
    });
}

// View user details
function viewUserDetails(userId) {
    const user = usersData.find(u => u.id === userId);
    if (!user) return;
    
    const userGames = gameHistory.filter(game => game.userId === userId);
    const winRate = user.totalSpins > 0 ? ((user.totalWins / user.totalSpins) * 100).toFixed(1) : 0;
    
    const userDetailsContent = document.getElementById('userDetailsContent');
    userDetailsContent.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h3 class="text-yellow-400 font-bold mb-4">User Information</h3>
                <div class="space-y-2">
                    <p><span class="text-gray-400">Username:</span> <span class="text-yellow-300">${user.username}</span></p>
                    <p><span class="text-gray-400">MoMo Number:</span> <span class="text-yellow-300">${user.momoNumber || 'N/A'}</span></p>
                    <p><span class="text-gray-400">Current Balance:</span> <span class="text-green-400 font-bold">${user.balance.toFixed(2)} GHC</span></p>
                    <p><span class="text-gray-400">Total Spins:</span> <span class="text-blue-400">${user.totalSpins || 0}</span></p>
                    <p><span class="text-gray-400">Total Wins:</span> <span class="text-yellow-400">${user.totalWins || 0}</span></p>
                    <p><span class="text-gray-400">Win Rate:</span> <span class="text-yellow-300">${winRate}%</span></p>
                </div>
            </div>
            
            <div>
                <h3 class="text-yellow-400 font-bold mb-4">Recent Games</h3>
                <div class="space-y-2 max-h-64 overflow-y-auto">
                    ${userGames.slice(-10).reverse().map(game => `
                        <div class="bg-gray-800 p-2 rounded">
                            <div class="flex justify-between">
                                <span class="text-gray-400">${new Date(game.timestamp).toLocaleString()}</span>
                                <span class="${game.result === 'win' ? 'text-green-400' : 'text-red-400'}">
                                    ${game.result === 'win' ? `+${game.payout}` : `-${game.stake}`} GHC
                                </span>
                            </div>
                        </div>
                    `).join('') || '<p class="text-gray-400">No games played</p>'}
                </div>
            </div>
        </div>
    `;
    
    userDetailsModal.classList.remove('hidden');
}

// Show balance adjustment modal
function showBalanceModal(userId) {
    const user = usersData.find(u => u.id === userId);
    if (!user) return;
    
    document.getElementById('balanceUser').value = user.username;
    document.getElementById('currentBalance').value = `${user.balance.toFixed(2)} GHC`;
    document.getElementById('balanceModal').dataset.userId = userId;
    
    balanceModal.classList.remove('hidden');
}

// Adjust user balance
async function adjustBalance(userId, type, amount) {
    try {
        const response = await fetch('http://localhost:3000/admin/adjust-balance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ userId, type, amount })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Balance adjusted successfully', 'success');
            balanceModal.classList.add('hidden');
            loadUsers(); // Refresh users data
        } else {
            showMessage(data.error || 'Failed to adjust balance', 'error');
        }
    } catch (error) {
        console.error('Adjust balance error:', error);
        showMessage('Failed to connect to server', 'error');
    }
}

// Show message (same as main app)
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-semibold z-50 ${
        type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        document.body.removeChild(messageDiv);
    }, 3000);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    
    // Admin login form
    adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;
        
        adminLogin(username, password);
    });
    
    // Logout
    logoutBtn.addEventListener('click', adminLogout);
    
    // Refresh users
    refreshUsersBtn.addEventListener('click', loadUsers);
    
    // Close modals
    document.getElementById('closeUserDetailsModal').addEventListener('click', () => {
        userDetailsModal.classList.add('hidden');
    });
    
    document.getElementById('cancelBalanceBtn').addEventListener('click', () => {
        balanceModal.classList.add('hidden');
    });
    
    // Balance adjustment form
    document.getElementById('balanceForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const userId = balanceModal.dataset.userId;
        const type = document.getElementById('adjustmentType').value;
        const amount = parseFloat(document.getElementById('adjustmentAmount').value);
        
        if (amount <= 0) {
            showMessage('Please enter a valid amount', 'error');
            return;
        }
        
        adjustBalance(userId, type, amount);
    });
});
