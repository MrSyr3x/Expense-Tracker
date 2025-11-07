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
            <div class="transaction-content">
                <div class="transaction-left">
                    <span class="transaction-icon">${typeEmoji}</span>
                    <div class="transaction-info">
                        <div class="transaction-category">
                            <span class="category-emoji">${categoryIcon}</span>
                            <span class="category-name">${transaction.category}</span>
                        </div>
                        <div class="transaction-date">${transaction.date}</div>
                    </div>
                </div>
                <div class="transaction-right">
                    <span class="transaction-amount ${amountClass}">${sign}${formattedAmount}</span>
                    <button class="delete-btn" data-id="${transaction.id}">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `;

        transactionList.appendChild(listItem);
    });

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    updateSummary();
}

function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveToLocalStorage();
    renderTransactions();
}

function addTransaction(e) {
    e.preventDefault();

    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const type = document.getElementById('type').value;
    const date = dateInput.value;

    if (!description || !amount || !category || !type || !date) {
        if (errorMessageEl) {
            errorMessageEl.textContent = 'Please fill all fields!';
            errorMessageEl.classList.remove('d-none');
        }
        return;
    }

    if (errorMessageEl) {
        errorMessageEl.classList.add('d-none');
    }

    const transaction = {
        id: Date.now(),
        description,
        amount,
        category,
        type,
        date
    };

    transactions.unshift(transaction);
    saveToLocalStorage();
    renderTransactions();

    transactionForm.reset();
    if (dateDisplayText) dateDisplayText.textContent = 'No Date Selected';
}

function saveToLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('transactions');
    if (saved) {
        transactions = JSON.parse(saved);
        renderTransactions();
    }
}

if (transactionForm) {
    transactionForm.addEventListener('submit', addTransaction);
}

if (transactionList) {
    transactionList.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            const id = parseInt(deleteBtn.dataset.id);
            deleteTransaction(id);
        }
    });
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

const dateInputElement = document.getElementById('date');
const dateContainer = document.getElementById('date-input-visual');

if (dateContainer && dateInputElement) {
    dateContainer.addEventListener('click', () => {
        dateInputElement.click();
        if (dateInputElement.showPicker) {
            dateInputElement.showPicker();
        }
    });
}

window.addEventListener('load', loadFromLocalStorage);
