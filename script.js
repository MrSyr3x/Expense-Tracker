// Initialize Lucide icons (must be called once the file is loaded)
window.addEventListener('load', () => {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
});

// Array to store all transaction objects
let transactions = []; 

// DOM Element Selectors
const transactionForm = document.getElementById('transaction-form');
const transactionList = document.getElementById('transaction-list');
const dateInput = document.getElementById('date'); // The functional, hidden input
const dateDisplayText = document.getElementById('date-display-text'); // The visible text span
const totalIncomeEl = document.getElementById('total-income');
const totalExpensesEl = document.getElementById('total-expenses');
const netIncomeEl = document.getElementById('net-income');
const netIncomeBoxEl = netIncomeEl ? netIncomeEl.closest('.summary-box') : null;
const errorMessageEl = document.getElementById('error-message');
const noTransactionsEl = document.getElementById('no-transactions');
const statusMessageEl = document.getElementById('financial-status-message');
const modeToggleBtn = document.getElementById('mode-toggle-btn');
const body = document.body;

// Emoji mapping for category icons (makes the list expressive)
const categoryEmojis = {
    'Salary': '💵',
    'Food': '🍕',
    'Transportation': '🚌',
    'Entertainment': '🎮',
    'Tech': '💻',
    'Bills': '🏠',
    'Other': '💡'
};

// --- Currency Formatting Function (Indian Rupee: ₹) ---

/**
 * Formats a number into the Indian Rupee currency format (₹ symbol, Lakh/Crore grouping).
 * @param {number} amount - The numerical amount.
 * @returns {string} The formatted currency string (e.g., "₹1,23,456.78").
 */
function formatRupee(amount) {
    // Use Intl.NumberFormat for correct Indian grouping (Lakh/Crore) and Rupee symbol
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}


// --- Core Functions ---

/**
 * Updates the Total Income, Total Expenses, and Net Income displays.
 * Also updates the expressive status message.
 */
function updateSummary() {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const netIncome = totalIncome - totalExpenses;

    // Display calculations using the new formatRupee function
    if (totalIncomeEl) totalIncomeEl.textContent = formatRupee(totalIncome);
    if (totalExpensesEl) totalExpensesEl.textContent = formatRupee(totalExpenses);
    if (netIncomeEl) netIncomeEl.textContent = formatRupee(netIncome);
    
    // Style Net Income based on value and expressive status message
    if (netIncomeBoxEl && statusMessageEl) {
        netIncomeBoxEl.classList.remove('negative');
        
        const rootStyles = getComputedStyle(document.documentElement);
        
        if (netIncome < 0) {
            netIncomeBoxEl.classList.add('negative');
            statusMessageEl.innerHTML = "Status: **Caution!** It's time to review those expenses. 🚨";
            statusMessageEl.style.borderColor = rootStyles.getPropertyValue('--expense-color');
        } else if (netIncome === 0) {
            statusMessageEl.innerHTML = "Status: **Balanced!** Your books are perfectly aligned. ⚖️";
            statusMessageEl.style.borderColor = rootStyles.getPropertyValue('--net-income-color');
        } else {
            statusMessageEl.innerHTML = "Status: **Looking great!** Keep up the brilliant budgeting. 🚀";
            statusMessageEl.style.borderColor = rootStyles.getPropertyValue('--income-color');
        }
    }
}

/**
 * Renders the list of transactions to the UI.
 */
function renderTransactions() {
    if (!transactionList) return; 
    
    transactionList.innerHTML = ''; // Clear existing list
    
    if (transactions.length === 0) {
        if (noTransactionsEl) noTransactionsEl.classList.remove('d-none');
    } else {
        if (noTransactionsEl) noTransactionsEl.classList.add('d-none');
    }

    // Sort by date (newest first)
    const sortedTransactions = transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedTransactions.forEach(transaction => {
        const isIncome = transaction.type === 'income';
        const sign = isIncome ? '' : '-'; // Sign is now handled by formatRupee for the amount, but we keep it for context if needed.
        const amountClass = isIncome ? 'income-text' : 'expense-text';
        const typeEmoji = isIncome ? '✅' : '🔴';
        const categoryIcon = categoryEmojis[transaction.category] || '🏷️';
        
        const listItem = document.createElement('li');
        listItem.classList.add('transaction-item');
        listItem.setAttribute('data-id', transaction.id);

        // Format the amount using the new function
        const formattedAmount = formatRupee(transaction.amount);

        // The transaction amount is now prefixed with the sign for visual clarity (e.g. + ₹1,000.00)
        listItem.innerHTML = `
            <div class="transaction-details">
                <div class="description-line">
                    <span class="item-description">
                        <span class="type-emoji">${typeEmoji}</span> ${transaction.description}
                    </span>
                    <span class="item-category">${categoryIcon} ${transaction.category}</span>
                </div>
                <span class="item-date">Date: ${transaction.date}</span>
            </div>
            <div class="d-flex align-items-center">
                <span class="transaction-amount ${amountClass}">
                    ${sign} ${formattedAmount}
                </span>
                <button class="btn btn-sm btn-delete ms-3" data-id="${transaction.id}">
                    <i data-lucide="trash-2" style="width: 1rem; height: 1rem;"></i>
                </button>
            </div>
        `;
        
        transactionList.appendChild(listItem);
    });
    
    updateSummary();
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons(); // Re-create lucide icons for newly added elements
    }
}

/**
 * Implements basic input validation and displays messages.
 */
function validateInput(date, description, category, amount) {
    if (!date || !description.trim() || !category || isNaN(amount) || amount <= 0) {
        if (errorMessageEl) {
            errorMessageEl.innerHTML = "🚫 **Validation Error!** Please ensure all fields are filled correctly, and amount is a positive number.";
            errorMessageEl.classList.remove('d-none');
        }
        return false;
    }
    if (errorMessageEl) {
        errorMessageEl.textContent = "";
        errorMessageEl.classList.add('d-none');
    }
    return true;
}

/**
 * Handles the submission of the transaction form.
 */
function addTransaction(e) {
    e.preventDefault();

    // Minor fix: split(' ')[0] to correctly extract value before emoji if category was modified.
    const date = dateInput.value;
    const description = document.getElementById('description').value;
    const category = document.getElementById('category').value.split(' ')[0]; 
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value.split(' ')[0]; 

    // Validate inputs
    if (!validateInput(date, description, category, amount)) {
        return;
    }

    const newTransaction = {
        id: Date.now(),
        date,
        description,
        category,
        amount,
        type
    };

    transactions.push(newTransaction);
    renderTransactions(); 
    
    transactionForm.reset(); 
    if (dateDisplayText) dateDisplayText.textContent = 'No Date Selected'; // Reset display text
    saveToLocalStorage(); 
}

/**
 * Implements deletion of a transaction.
 */
function deleteTransaction(id) {
    const idNumber = parseInt(id);
    transactions = transactions.filter(t => t.id !== idNumber);
    renderTransactions();
    saveToLocalStorage();
}

/**
 * Sets the application theme and saves the preference.
 */
function setTheme(theme) {
    const modeIcon = document.getElementById('mode-icon');
    if (theme === 'light') {
        body.classList.add('theme-light');
        body.classList.remove('theme-dark');
        // Ensure Lucide icon is set correctly for light mode (Moon for dark theme switch)
        if (modeIcon) modeIcon.setAttribute('data-lucide', 'moon'); 
        localStorage.setItem('catpuccinTheme', 'light');
    } else {
        body.classList.add('theme-dark');
        body.classList.remove('theme-light');
        // Ensure Lucide icon is set correctly for dark mode (Sun for light theme switch)
        if (modeIcon) modeIcon.setAttribute('data-lucide', 'sun');
        localStorage.setItem('catpuccinTheme', 'dark');
    }
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
    // Re-render summary to update expressive status border color
    updateSummary(); 
}

/**
 * Toggles the theme between light and dark.
 */
function toggleTheme() {
    const currentTheme = body.classList.contains('theme-light') ? 'light' : 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

// --- Persistence (Local Storage) & Initialization ---

/**
 * Loads transactions and theme from local storage on startup.
 */
function loadFromLocalStorage() {
    const savedTransactions = localStorage.getItem('catpuccinTransactions');
    if (savedTransactions) {
        try {
            transactions = JSON.parse(savedTransactions);
        } catch (e) {
            console.error("Could not parse transactions from local storage:", e);
            transactions = [];
        }
    }
    // Load theme setting FIRST, then render transactions
    const savedTheme = localStorage.getItem('catpuccinTheme') || 'dark';
    setTheme(savedTheme);
    // Render transactions (which calls updateSummary)
    renderTransactions();
}

/**
 * Saves the current transactions array to local storage.
 */
function saveToLocalStorage() {
    localStorage.setItem('catpuccinTransactions', JSON.stringify(transactions));
}

// --- Event Listeners ---

if (transactionForm) {
    transactionForm.addEventListener('submit', addTransaction);
}

if (transactionList) {
    transactionList.addEventListener('click', (e) => {
        const deleteButton = e.target.closest('.btn-delete');
        if (deleteButton) {
            const id = deleteButton.getAttribute('data-id');
            deleteTransaction(id);
        }
    });
}

if (modeToggleBtn) {
    modeToggleBtn.addEventListener('click', toggleTheme);
}

if (dateInput && dateDisplayText) {
    dateInput.addEventListener('change', () => {
        if (dateInput.value) {
            dateDisplayText.textContent = dateInput.value;
        } else {
            dateDisplayText.textContent = 'No Date Selected';
        }
    });
}


// Initialize the application when the DOM is fully loaded
window.addEventListener('load', loadFromLocalStorage);