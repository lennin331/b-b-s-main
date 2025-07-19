// Global state
let expenses = [];
let buddies = new Set();
let balances = {};

// DOM elements
const expenseForm = document.getElementById('expenseForm');
const buddiesList = document.getElementById('buddiesList');
const newBuddyInput = document.getElementById('newBuddy');
const addBuddyBtn = document.getElementById('addBuddyBtn');
const balancesList = document.getElementById('balancesList');
const expensesList = document.getElementById('expensesList');
const settleBtn = document.getElementById('settleBtn');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');
const settlementModal = document.getElementById('settlementModal');
const closeModal = document.getElementById('closeModal');
const settlementSteps = document.getElementById('settlementSteps');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
    updateUI();
    setupEventListeners();
});

// Event listeners setup
function setupEventListeners() {
    // Form submission
    expenseForm.addEventListener('submit', handleExpenseSubmit);
    
    // Add buddy
    addBuddyBtn.addEventListener('click', addBuddy);
    newBuddyInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addBuddy();
        }
    });
    
    // Quick actions
    settleBtn.addEventListener('click', showSettlement);
    exportBtn.addEventListener('click', exportSummary);
    clearBtn.addEventListener('click', clearAllData);
    
    // Modal
    closeModal.addEventListener('click', closeSettlementModal);
    settlementModal.addEventListener('click', function(e) {
        if (e.target === settlementModal) {
            closeSettlementModal();
        }
    });
}

// Add a new buddy
function addBuddy() {
    const buddyName = newBuddyInput.value.trim();
    if (buddyName && !buddies.has(buddyName)) {
        buddies.add(buddyName);
        newBuddyInput.value = '';
        updateBuddiesList();
        saveToLocalStorage();
    }
}

// Remove a buddy
function removeBuddy(buddyName) {
    buddies.delete(buddyName);
    updateBuddiesList();
    saveToLocalStorage();
}

// Update buddies list display
function updateBuddiesList() {
    buddiesList.innerHTML = '';
    buddies.forEach(buddy => {
        const buddyTag = document.createElement('div');
        buddyTag.className = 'buddy-tag';
        buddyTag.innerHTML = `
            ${buddy}
            <button onclick="removeBuddy('${buddy}')" title="Remove buddy">
                <i class="fas fa-times"></i>
            </button>
        `;
        buddiesList.appendChild(buddyTag);
    });
}

// Handle expense form submission
function handleExpenseSubmit(e) {
    e.preventDefault();
    
    const payer = document.getElementById('payer').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const description = document.getElementById('description').value.trim();
    
    if (!payer || !amount || !description) {
        alert('Please fill in all fields');
        return;
    }
    
    if (buddies.size === 0) {
        alert('Please add at least one buddy to split with');
        return;
    }
    
    // Add payer to buddies if not already there
    if (!buddies.has(payer)) {
        buddies.add(payer);
    }
    
    const expense = {
        id: Date.now(),
        payer,
        amount,
        description,
        buddies: Array.from(buddies),
        date: new Date().toISOString(),
        splitAmount: amount / buddies.size
    };
    
    expenses.push(expense);
    calculateBalances();
    updateUI();
    saveToLocalStorage();
    
    // Reset form
    expenseForm.reset();
    buddies.clear();
    updateBuddiesList();
}

// Calculate balances for all buddies
function calculateBalances() {
    balances = {};
    
    // Initialize balances
    expenses.forEach(expense => {
        expense.buddies.forEach(buddy => {
            if (!balances[buddy]) {
                balances[buddy] = 0;
            }
        });
    });
    
    // Calculate net amounts
    expenses.forEach(expense => {
        // Payer gets credited the full amount
        balances[expense.payer] += expense.amount;
        
        // Each buddy owes their share
        expense.buddies.forEach(buddy => {
            balances[buddy] -= expense.splitAmount;
        });
    });
}

// Update the UI
function updateUI() {
    updateBalancesList();
    updateExpensesList();
    updateActionButtons();
}

// Update balances list
function updateBalancesList() {
    if (Object.keys(balances).length === 0) {
        balancesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-coins"></i>
                <p>No expenses added yet</p>
                <small>Add your first expense to see balances</small>
            </div>
        `;
        return;
    }
    
    balancesList.innerHTML = '';
    
    Object.entries(balances)
        .sort(([,a], [,b]) => Math.abs(b) - Math.abs(a))
        .forEach(([buddy, balance]) => {
            const balanceItem = document.createElement('div');
            balanceItem.className = `balance-item ${balance > 0 ? 'positive' : balance < 0 ? 'negative' : ''}`;
            
            const balanceClass = balance > 0 ? 'positive' : balance < 0 ? 'negative' : '';
            const balanceText = balance > 0 ? `+₹${balance.toFixed(2)}` : 
                              balance < 0 ? `-₹${Math.abs(balance).toFixed(2)}` : 
                              '₹0.00';
            
            balanceItem.innerHTML = `
                <div class="balance-info">
                    <div class="balance-name">${buddy}</div>
                    <small>${balance > 0 ? 'Will receive' : balance < 0 ? 'Owes' : 'Settled'}</small>
                </div>
                <div class="balance-amount ${balanceClass}">${balanceText}</div>
            `;
            
            balancesList.appendChild(balanceItem);
        });
}

// Update expenses list
function updateExpensesList() {
    if (expenses.length === 0) {
        expensesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>No expenses yet</p>
                <small>Your expenses will appear here</small>
            </div>
        `;
        return;
    }
    
    expensesList.innerHTML = '';
    
    expenses.slice().reverse().forEach(expense => {
        const expenseItem = document.createElement('div');
        expenseItem.className = 'expense-item';
        
        const date = new Date(expense.date).toLocaleDateString();
        
        expenseItem.innerHTML = `
            <div class="expense-header">
                <div>
                    <div class="expense-title">${expense.description}</div>
                    <div class="expense-details">Paid by ${expense.payer} on ${date}</div>
                </div>
                <div class="expense-amount">₹${expense.amount.toFixed(2)}</div>
            </div>
            <div class="expense-split">
                Split between ${expense.buddies.length} buddies (₹${expense.splitAmount.toFixed(2)} each)
            </div>
        `;
        
        expensesList.appendChild(expenseItem);
    });
}

// Update action buttons state
function updateActionButtons() {
    const hasExpenses = expenses.length > 0;
    settleBtn.disabled = !hasExpenses;
    exportBtn.disabled = !hasExpenses;
    clearBtn.disabled = !hasExpenses;
}

// Show settlement modal
function showSettlement() {
    const settlements = calculateOptimalSettlements();
    
    if (settlements.length === 0) {
        alert('All debts are already settled!');
        return;
    }
    
    settlementSteps.innerHTML = '';
    
    settlements.forEach((settlement, index) => {
        const step = document.createElement('div');
        step.className = 'settlement-step';
        step.innerHTML = `
            <i class="fas fa-arrow-right"></i>
            <div class="settlement-info">
                <div><strong>${settlement.from}</strong> pays <strong>${settlement.to}</strong></div>
                <small>Step ${index + 1} of ${settlements.length}</small>
            </div>
            <div class="settlement-amount">₹${settlement.amount.toFixed(2)}</div>
        `;
        settlementSteps.appendChild(step);
    });
    
    settlementModal.style.display = 'block';
}

// Calculate optimal settlements
function calculateOptimalSettlements() {
    const settlements = [];
    const balancesCopy = { ...balances };
    
    // Separate debtors and creditors
    const debtors = Object.entries(balancesCopy)
        .filter(([, balance]) => balance < 0)
        .sort(([,a], [,b]) => a - b);
    
    const creditors = Object.entries(balancesCopy)
        .filter(([, balance]) => balance > 0)
        .sort(([,a], [,b]) => b - a);
    
    let debtorIndex = 0;
    let creditorIndex = 0;
    
    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
        const [debtor, debtAmount] = debtors[debtorIndex];
        const [creditor, creditAmount] = creditors[creditorIndex];
        
        const settlementAmount = Math.min(Math.abs(debtAmount), creditAmount);
        
        if (settlementAmount > 0.01) { // Avoid tiny amounts
            settlements.push({
                from: debtor,
                to: creditor,
                amount: settlementAmount
            });
            
            // Update balances
            debtors[debtorIndex][1] += settlementAmount;
            creditors[creditorIndex][1] -= settlementAmount;
            
            // Move to next if balance is settled
            if (Math.abs(debtors[debtorIndex][1]) < 0.01) {
                debtorIndex++;
            }
            if (creditors[creditorIndex][1] < 0.01) {
                creditorIndex++;
            }
        } else {
            break;
        }
    }
    
    return settlements;
}

// Close settlement modal
function closeSettlementModal() {
    settlementModal.style.display = 'none';
}

// Export summary
function exportSummary() {
    let summary = 'BrokeBuddieSplitter - Expense Summary\n';
    summary += '=====================================\n\n';
    
    // Expenses
    summary += 'EXPENSES:\n';
    summary += '---------\n';
    expenses.forEach((expense, index) => {
        const date = new Date(expense.date).toLocaleDateString();
        summary += `${index + 1}. ${expense.description}\n`;
        summary += `   Paid by: ${expense.payer}\n`;
        summary += `   Amount: ₹${expense.amount.toFixed(2)}\n`;
        summary += `   Split: ${expense.buddies.join(', ')}\n`;
        summary += `   Date: ${date}\n\n`;
    });
    
    // Balances
    summary += 'CURRENT BALANCES:\n';
    summary += '-----------------\n';
    Object.entries(balances)
        .sort(([,a], [,b]) => Math.abs(b) - Math.abs(a))
        .forEach(([buddy, balance]) => {
            const status = balance > 0 ? 'Will receive' : balance < 0 ? 'Owes' : 'Settled';
            summary += `${buddy}: ${status} ₹${Math.abs(balance).toFixed(2)}\n`;
        });
    
    // Create and download file
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'broke-buddie-splitter-summary.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Clear all data
function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
        expenses = [];
        buddies.clear();
        balances = {};
        updateUI();
        saveToLocalStorage();
    }
}

// Local storage functions
function saveToLocalStorage() {
    const data = {
        expenses,
        buddies: Array.from(buddies),
        balances
    };
    localStorage.setItem('brokeBuddieSplitter', JSON.stringify(data));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('brokeBuddieSplitter');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            expenses = data.expenses || [];
            buddies = new Set(data.buddies || []);
            balances = data.balances || {};
            calculateBalances();
        } catch (e) {
            console.error('Error loading saved data:', e);
        }
    }
}

// Utility function to format currency
function formatCurrency(amount) {
    return `₹${amount.toFixed(2)}`;
}

// Add some sample data for demo (optional)
function addSampleData() {
    if (expenses.length === 0) {
        // Add sample buddies
        ['Josh', 'Anand', 'Sid', 'Priya'].forEach(buddy => buddies.add(buddy));
        
        // Add sample expenses
        const sampleExpenses = [
            {
                id: Date.now() - 3000,
                payer: 'Josh',
                amount: 800,
                description: 'Pizza night',
                buddies: ['Josh', 'Anand', 'Sid', 'Priya'],
                date: new Date(Date.now() - 86400000).toISOString(),
                splitAmount: 200
            },
            {
                id: Date.now() - 2000,
                payer: 'Anand',
                amount: 1000,
                description: 'Netflix subscription',
                buddies: ['Anand', 'Josh', 'Sid'],
                date: new Date(Date.now() - 43200000).toISOString(),
                splitAmount: 333.33
            }
        ];
        
        expenses.push(...sampleExpenses);
        calculateBalances();
        updateUI();
        saveToLocalStorage();
    }
}

// Uncomment the line below to add sample data for demo
// addSampleData(); 