window.addEventListener('load', () => {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
});

let transactions = [];

const transactionForm = document.getElementById('transaction-form');
const transactionList = document.getElementById('transaction-list');
const dateInput = document.getElementById('date');
const dateDisplayText = document.getElementById('date-display-text');
const totalIncomeEl = document.getElementById('total-income');
const totalExpensesEl = document.getElementById('total-expenses');
const netIncomeEl = document.getElementById('net-income');
const netIncomeBoxEl = netIncomeEl ? netIncomeEl.closest('.summary-box') : null;
const errorMessageEl = document.getElementById('error-message');
const noTransactionsEl = document.getElementById('no-transactions');
const statusMessageEl = document.getElementById('financial-status-message');
const modeToggleBtn = document.getElementById('mode-toggle-btn');
const body = document.body;

const categoryEmojis = {
    'Salary': '💵',
    'Food': '🍕',
    'Transportation': '🚌',
    'Entertainment': '🎮',
    'Tech': '💻',
    'Bills': '🏠',
    'Other': '💡'
};

function formatRupee(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function updateSummary() {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const netIncome = totalIncome - totalExpenses;

    if (totalIncomeEl) totalIncomeEl.textContent = formatRupee(totalIncome);
    if (totalExpensesEl) totalExpensesEl.textContent = formatRupee(totalExpenses);
    if (netIncomeEl) netIncomeEl.textContent = formatRupee(netIncome);
    
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

function renderTransactions() {
    if (!transactionList) return; 
    
    transactionList.innerHTML = '';
    
    if (transactions.length === 0) {
        if (noTransactionsEl) noTransactionsEl.classList.remove('d-none');
    } else {
        if (noTransactionsEl) noTransactionsEl.classList.add('d-none');
    }

    const sortedTransactions = transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedTransactions.forEach(transaction => {
        const isIncome = transaction.type === 'income';
        const sign = isIncome ? '' : '-';
        const amountClass = isIncome ? 'income-text' : 'expense-text';
        const typeEmoji = isIncome ? '✅' : '🔴';
        const categoryIcon = categoryEmojis[transaction.category] || '🏷️';
        
        const listItem = document.createElement('li');
        listItem.classList.add('transaction-item');
        listItem.setAttribute('data-id', transaction.id);

        const formattedAmount = formatRupee(transaction.amount);

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
        lucide.createIcons();
    }
}

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

function addTransaction(e) {
    e.preventDefault();

    const date = dateInput.value;
    const description = document.getElementById('description').value;
    const category = document.getElementById('category').value.split(' ')[0]; 
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value.split(' ')[0]; 

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
    if (dateDisplayText) dateDisplayText.textContent = 'No Date Selected'; 
    saveToLocalStorage(); 
}

function deleteTransaction(id) {
    const idNumber = parseInt(id);
    transactions = transactions.filter(t => t.id !== idNumber);
    renderTransactions();
    saveToLocalStorage();
}

function setTheme(theme) {
    const modeIcon = document.getElementById('mode-icon');
    if (theme === 'light') {
        body.classList.add('theme-light');
        body.classList.remove('theme-dark');
        if (modeIcon) modeIcon.setAttribute('data-lucide', 'moon'); 
        localStorage.setItem('catpuccinTheme', 'light');
    } else {
        body.classList.add('theme-dark');
        body.classList.remove('theme-light');
        if (modeIcon) modeIcon.setAttribute('data-lucide', 'sun');
        localStorage.setItem('catpuccinTheme', 'dark');
    }
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
    updateSummary(); 
}

function toggleTheme() {
    const currentTheme = body.classList.contains('theme-light') ? 'light' : 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

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
    const savedTheme = localStorage.getItem('catpuccinTheme') || 'dark';
    setTheme(savedTheme);
    renderTransactions();
}

function saveToLocalStorage() {
    localStorage.setItem('catpuccinTransactions', JSON.stringify(transactions));
}

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

window.addEventListener('load', loadFromLocalStorage);