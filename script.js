// Global variables
let expenses = [];
let savedSettlements = JSON.parse(localStorage.getItem('brokeBuddiesSettlements')) || [];

// DOM elements
const addExpenseBtn = document.getElementById('addExpense');
const calculateSplitBtn = document.getElementById('calculateSplit');
const addParticipantBtn = document.getElementById('addParticipant');
const exportCSVBtn = document.getElementById('exportCSV');
const saveSettlementBtn = document.getElementById('saveSettlement');
const clearAllBtn = document.getElementById('clearAll');
const loadSettlementBtn = document.getElementById('loadSettlement');

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    addExpenseBtn.addEventListener('click', addExpense);
    calculateSplitBtn.addEventListener('click', calculateSplit);
    addParticipantBtn.addEventListener('click', addParticipantInput);
    
    // New action buttons
    exportCSVBtn.addEventListener('click', exportToCSV);
    saveSettlementBtn.addEventListener('click', saveSettlement);
    clearAllBtn.addEventListener('click', clearAllData);
    loadSettlementBtn.addEventListener('click', showLoadSettlementModal);
    
    // Initialize the app
    updateUI();
    updateSettlementsList();
});

// Add expense function
function addExpense() {
    const payer = document.getElementById('payer').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const description = document.getElementById('description').value.trim();
    
    // Validation
    if (!payer) {
        showMessage('Please enter who paid for the expense', 'error');
        return;
    }
    
    if (!amount || amount <= 0) {
        showMessage('Please enter a valid amount', 'error');
        return;
    }
    
    // Get participants
    const participants = getParticipants();
    if (participants.length === 0) {
        showMessage('Please add at least one participant', 'error');
        return;
    }
    
    // Create expense object
    const expense = {
        id: Date.now(),
        payer: payer,
        amount: amount,
        description: description || 'No description',
        participants: participants,
        date: new Date().toLocaleDateString()
    };
    
    // Add to expenses array
    expenses.push(expense);
    
    // Clear form
    clearForm();
    
    // Update UI
    updateUI();
    
    // Show success message
    showMessage('Expense added successfully!', 'success');
}

// Get participants from form
function getParticipants() {
    const participantInputs = document.querySelectorAll('.participant-input');
    const participants = [];
    
    participantInputs.forEach(input => {
        const name = input.value.trim();
        if (name) {
            participants.push(name);
        }
    });
    
    return participants;
}

// Clear form
function clearForm() {
    document.getElementById('payer').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('description').value = '';
    
    // Clear participant inputs
    const participantInputs = document.querySelectorAll('.participant-input');
    participantInputs.forEach(input => {
        input.value = '';
    });
    
    // Reset to 4 participants
    resetParticipantInputs();
}

// Add participant input
function addParticipantInput() {
    const participantsContainer = document.querySelector('.participants-input');
    const participantCount = participantsContainer.children.length;
    
    if (participantCount >= 10) {
        showMessage('Maximum 10 participants allowed', 'error');
        return;
    }
    
    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.className = 'participant-input';
    newInput.placeholder = `Person ${participantCount + 1}`;
    newInput.id = `participant${participantCount + 1}`;
    
    participantsContainer.appendChild(newInput);
    
    // Update grid columns for better layout
    if (participantCount % 2 === 1) {
        participantsContainer.style.gridTemplateColumns = '1fr 1fr 1fr';
    }
}

// Reset participant inputs to 4
function resetParticipantInputs() {
    const participantsContainer = document.querySelector('.participants-input');
    participantsContainer.innerHTML = '';
    
    for (let i = 1; i <= 4; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'participant-input';
        input.placeholder = `Person ${i}`;
        input.id = `participant${i}`;
        participantsContainer.appendChild(input);
    }
    
    participantsContainer.style.gridTemplateColumns = '1fr 1fr';
}



// Calculate split
function calculateSplit() {
    if (expenses.length === 0) {
        showMessage('No expenses to calculate', 'error');
        return;
    }
    
    const results = calculateExpenseSplit();
    displayResults(results);
}

// Calculate expense split
function calculateExpenseSplit() {
    const balances = {};
    const totalSpent = {};
    
    // Initialize balances
    const allParticipants = new Set();
    expenses.forEach(expense => {
        allParticipants.add(expense.payer);
        expense.participants.forEach(participant => {
            allParticipants.add(participant);
        });
    });
    
    allParticipants.forEach(participant => {
        balances[participant] = 0;
        totalSpent[participant] = 0;
    });
    
    // Calculate balances
    expenses.forEach(expense => {
        const payer = expense.payer;
        const amount = expense.amount;
        const participants = expense.participants;
        
        // Add what payer spent
        balances[payer] += amount;
        totalSpent[payer] += amount;
        
        // Calculate split (always equal)
        const perPerson = amount / participants.length;
        participants.forEach(participant => {
            balances[participant] -= perPerson;
        });
    });
    
    return { balances, totalSpent };
}

// Display results
function displayResults(results) {
    const { balances, totalSpent } = results;
    const resultsContainer = document.getElementById('resultsContainer');
    
    resultsContainer.innerHTML = '';
    
    // Create summary
    const summary = document.createElement('div');
    summary.className = 'result-item';
    summary.innerHTML = `
        <div class="result-person">
            <span><strong>Summary</strong></span>
            <span class="result-amount">₹${Object.values(totalSpent).reduce((a, b) => a + b, 0).toFixed(2)}</span>
        </div>
        <div class="result-breakdown">Total expenses across all participants</div>
    `;
    resultsContainer.appendChild(summary);
    
    // Display individual balances
    Object.keys(balances).forEach(participant => {
        const balance = balances[participant];
        const spent = totalSpent[participant];
        
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        let amountClass = 'neutral';
        let amountText = '';
        
        if (balance > 0.01) {
            amountClass = 'positive';
            amountText = `+₹${balance.toFixed(2)}`;
        } else if (balance < -0.01) {
            amountClass = 'negative';
            amountText = `-₹${Math.abs(balance).toFixed(2)}`;
        } else {
            amountText = '₹0.00';
        }
        
        resultItem.innerHTML = `
            <div class="result-person">
                <span><strong>${participant}</strong></span>
                <span class="result-amount ${amountClass}">${amountText}</span>
            </div>
                        <div class="result-breakdown">
                Spent: ₹${spent.toFixed(2)} |
                ${balance > 0.01 ? 'Owes money' : balance < -0.01 ? 'Gets money back' : 'All settled'}
            </div>
        `;
        
        resultsContainer.appendChild(resultItem);
    });
    
    // Add settle up suggestions
    addSettleUpSuggestions(balances);
}

// Add settle up suggestions
function addSettleUpSuggestions(balances) {
    const resultsContainer = document.getElementById('resultsContainer');
    
    // Find who owes and who gets money
    const debtors = Object.keys(balances).filter(p => balances[p] < -0.01);
    const creditors = Object.keys(balances).filter(p => balances[p] > 0.01);
    
    if (debtors.length > 0 && creditors.length > 0) {
        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.className = 'result-item';
        suggestionsDiv.style.borderLeft = '4px solid #38a169';
        
        suggestionsDiv.innerHTML = `
            <div class="result-person">
                <span><strong><i class="fas fa-lightbulb"></i> Settle Up Suggestions</strong></span>
            </div>
            <div class="result-breakdown">
                ${generateSettleUpSuggestions(debtors, creditors, balances)}
            </div>
        `;
        
        resultsContainer.appendChild(suggestionsDiv);
    }
}

// Generate settle up suggestions
function generateSettleUpSuggestions(debtors, creditors, balances) {
    let suggestions = [];
    
    debtors.forEach(debtor => {
        const debt = Math.abs(balances[debtor]);
        creditors.forEach(creditor => {
            const credit = balances[creditor];
            if (credit > 0.01) {
                const amount = Math.min(debt, credit);
                suggestions.push(`${debtor} should pay ${creditor} ₹${amount.toFixed(2)}`);
            }
        });
    });
    
    return suggestions.slice(0, 3).join('<br>');
}

// Update UI
function updateUI() {
    updateExpensesList();
    updateCalculateButton();
}

// Update expenses list
function updateExpensesList() {
    const expensesList = document.getElementById('expensesList');
    
    if (expenses.length === 0) {
        expensesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>No expenses added yet</p>
                <span>Add your first expense to get started!</span>
            </div>
        `;
        return;
    }
    
    expensesList.innerHTML = '';
    
    expenses.forEach(expense => {
        const expenseItem = document.createElement('div');
        expenseItem.className = 'expense-item';
        
        const participantsHtml = expense.participants.map(p => 
            `<span class="participant-tag">${p}</span>`
        ).join('');
        
        const perPersonAmount = expense.amount / expense.participants.length;
        const participantsWithAmounts = expense.participants.map(p => 
            `<span class="participant-tag">${p} (₹${perPersonAmount.toFixed(2)})</span>`
        ).join('');
        
        expenseItem.innerHTML = `
            <button class="delete-expense" onclick="deleteExpense(${expense.id})">
                <i class="fas fa-times"></i>
            </button>
            <div class="expense-header">
                <span class="expense-payer">${expense.payer}</span>
                <span class="expense-amount">₹${expense.amount.toFixed(2)}</span>
            </div>
            <div class="expense-description">${expense.description}</div>
            <div class="expense-participants">
                ${participantsWithAmounts}
            </div>
            <div style="font-size: 0.8rem; color: rgba(255, 255, 255, 0.6); margin-top: 8px;">
                Split Equally | Date: ${expense.date}
            </div>
        `;
        
        expensesList.appendChild(expenseItem);
    });
}

// Delete expense
function deleteExpense(id) {
    expenses = expenses.filter(expense => expense.id !== id);
    updateUI();
    showMessage('Expense deleted successfully!', 'success');
}

// Update calculate button
function updateCalculateButton() {
    const calculateBtn = document.getElementById('calculateSplit');
    const exportBtn = document.getElementById('exportCSV');
    const saveBtn = document.getElementById('saveSettlement');
    const clearBtn = document.getElementById('clearAll');
    
    const hasExpenses = expenses.length > 0;
    
    calculateBtn.disabled = !hasExpenses;
    exportBtn.disabled = !hasExpenses;
    saveBtn.disabled = !hasExpenses;
    clearBtn.disabled = !hasExpenses;
}

// Show message
function showMessage(text, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    // Insert at the top of the main content
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(message, mainContent.firstChild);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (message.parentNode) {
            message.remove();
        }
    }, 3000);
}

// Add some fun animations and interactions
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to cards
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Add input focus effects
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter to add expense
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            addExpense();
        }
        
        // Escape to close modal
        if (e.key === 'Escape') {
            closeModal();
        }
    });
});

// Add some sample data for demonstration (optional)
function addSampleData() {
    const sampleExpenses = [
        {
            id: Date.now() - 3000,
            payer: 'Alice',
            amount: 120.00,
            description: 'Dinner at Italian Restaurant',
            participants: ['Alice', 'Bob', 'Charlie', 'Diana'],
            splitType: 'equal',
            customSplit: null,
            date: new Date().toLocaleDateString()
        },
        {
            id: Date.now() - 2000,
            payer: 'Bob',
            amount: 45.00,
            description: 'Movie tickets',
            participants: ['Alice', 'Bob', 'Charlie'],
            splitType: 'equal',
            customSplit: null,
            date: new Date().toLocaleDateString()
        }
    ];
    
    expenses = sampleExpenses;
    updateUI();
}

// Uncomment the line below to add sample data for demonstration
addSampleData();

// Export to CSV function
function exportToCSV() {
    if (expenses.length === 0) {
        showMessage('No expenses to export', 'error');
        return;
    }
    
    // Create CSV content
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Add header
    csvContent += 'Date,Payer,Amount,Description,Participants,Per Person\n';
    
    // Add expense data
    expenses.forEach(expense => {
        const perPerson = expense.amount / expense.participants.length;
        const row = [
            expense.date,
            expense.payer,
            expense.amount.toFixed(2),
            `"${expense.description}"`,
            expense.participants.join(';'),
            perPerson.toFixed(2)
        ].join(',');
        csvContent += row + '\n';
    });
    
    // Add summary section
    csvContent += '\n';
    csvContent += 'Summary\n';
    csvContent += 'Person,Total Spent,Balance\n';
    
    const results = calculateExpenseSplit();
    Object.keys(results.balances).forEach(person => {
        const spent = results.totalSpent[person];
        const balance = results.balances[person];
        const row = [
            person,
            `₹${spent.toFixed(2)}`,
            `₹${balance.toFixed(2)}`
        ].join(',');
        csvContent += row + '\n';
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `broke-buddies-split-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showMessage('CSV exported successfully!', 'success');
}

// Save settlement function
function saveSettlement() {
    if (expenses.length === 0) {
        showMessage('No expenses to save', 'error');
        return;
    }
    
    const settlementName = prompt('Enter a name for this settlement:');
    if (!settlementName || settlementName.trim() === '') {
        return;
    }
    
    const settlement = {
        id: Date.now(),
        name: settlementName.trim(),
        date: new Date().toLocaleDateString(),
        expenses: [...expenses],
        results: calculateExpenseSplit()
    };
    
    savedSettlements.push(settlement);
    localStorage.setItem('brokeBuddiesSettlements', JSON.stringify(savedSettlements));
    
    updateSettlementsList();
    showMessage('Settlement saved successfully!', 'success');
}

// Clear all data function
function clearAllData() {
    const confirmClear = confirm('Are you sure you want to clear all expenses? This action cannot be undone.');
    if (confirmClear) {
        expenses = [];
        currentCustomSplit = {};
        updateUI();
        showMessage('All data cleared successfully!', 'success');
    }
}

// Show load settlement modal
function showLoadSettlementModal() {
    if (savedSettlements.length === 0) {
        showMessage('No saved settlements found', 'error');
        return;
    }
    
    // Create modal content
    const modalContent = `
        <div class="modal-header">
            <h3>Load Settlement</h3>
            <button class="close-btn" onclick="closeLoadModal()">&times;</button>
        </div>
        <div class="modal-body">
            <div class="settlements-load-list">
                ${savedSettlements.map(settlement => `
                    <div class="settlement-load-item" onclick="loadSettlement(${settlement.id})">
                        <div class="settlement-load-name">${settlement.name}</div>
                        <div class="settlement-load-date">${settlement.date}</div>
                        <div class="settlement-load-summary">${settlement.expenses.length} expenses, ₹${settlement.expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)} total</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Create and show modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'loadSettlementModal';
    modal.innerHTML = `
        <div class="modal-content">
            ${modalContent}
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeLoadModal();
        }
    });
}

// Close load modal
function closeLoadModal() {
    const modal = document.getElementById('loadSettlementModal');
    if (modal) {
        modal.remove();
    }
}

// Load settlement function
function loadSettlement(id) {
    const settlement = savedSettlements.find(s => s.id === id);
    if (settlement) {
        expenses = [...settlement.expenses];
        updateUI();
        closeLoadModal();
        showMessage(`Settlement "${settlement.name}" loaded successfully!`, 'success');
    }
}

// Delete settlement function
function deleteSettlement(id) {
    const confirmDelete = confirm('Are you sure you want to delete this settlement?');
    if (confirmDelete) {
        savedSettlements = savedSettlements.filter(s => s.id !== id);
        localStorage.setItem('brokeBuddiesSettlements', JSON.stringify(savedSettlements));
        updateSettlementsList();
        showMessage('Settlement deleted successfully!', 'success');
    }
}

// Update settlements list
function updateSettlementsList() {
    const settlementsList = document.getElementById('settlementsList');
    
    if (savedSettlements.length === 0) {
        settlementsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder"></i>
                <p>No saved settlements</p>
                <span>Save your first settlement to see it here!</span>
            </div>
        `;
        return;
    }
    
    settlementsList.innerHTML = '';
    
    savedSettlements.forEach(settlement => {
        const settlementItem = document.createElement('div');
        settlementItem.className = 'settlement-item';
        
        const totalAmount = settlement.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        
        settlementItem.innerHTML = `
            <button class="delete-settlement" onclick="deleteSettlement(${settlement.id})">
                <i class="fas fa-times"></i>
            </button>
            <div class="settlement-name">${settlement.name}</div>
            <div class="settlement-date">${settlement.date}</div>
            <div class="settlement-summary">${settlement.expenses.length} expenses • ₹${totalAmount.toFixed(2)} total</div>
        `;
        
        settlementItem.addEventListener('click', () => loadSettlement(settlement.id));
        settlementsList.appendChild(settlementItem);
    });
} 