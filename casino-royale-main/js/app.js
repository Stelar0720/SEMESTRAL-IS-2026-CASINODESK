/**
 * CasinoDesk UI Prototype - Application Logic
 */

// ==================== State Management ====================
const state = {
    currentUser: 'operador',
    currentPage: 'operaciones',
    buyinStep: 1,
    transactions: [
        { hora: '22:48', tipo: 'Buy-in', cliente: 'L. Espinosa', hash: 'a91c...f0e3', monto: '$2,500', status: 'green' },
        { hora: '22:31', tipo: 'Buy-in', cliente: 'R. Mendoza', hash: '3c98...a5d1', monto: '$850', status: 'green' },
        { hora: '22:14', tipo: 'Cash-out', cliente: 'M. Saavedra', hash: '7d4e...91ba', monto: '$3,000', status: 'green' },
        { hora: '21:52', tipo: 'Buy-in', cliente: 'R. Mendoza', hash: '3c98...a5d1', monto: '$6,000', status: 'yellow' },
        { hora: '21:33', tipo: 'Cash-out', cliente: 'A. Villanueva', hash: '50a1...b9cc', monto: '$4,200', status: 'yellow' }
    ]
};

// ==================== Clock ====================
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const clockEl = document.getElementById('clock');
    if (clockEl) {
        clockEl.textContent = `${hours}:${minutes}`;
    }
}

setInterval(updateClock, 1000);
updateClock();

// ==================== Login ====================
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('loginUser').value;
            const pass = document.getElementById('loginPass').value;
            
            if (user && pass) {
                document.getElementById('loginPage').classList.add('hidden');
                document.getElementById('mainApp').classList.remove('hidden');
                renderTransactions();
            }
        });
    }
});

// ==================== Navigation ====================
function showPage(pageName) {
    state.currentPage = pageName;
    
    // Update sidebar active state
    document.querySelectorAll('.sidebar__item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageName) {
            item.classList.add('active');
        }
    });
    
    // Show/hide content based on page
    // For prototype, all content is in main-content area
}

// ==================== Modal Management ====================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        
        // Reset buy-in modal state
        if (modalId === 'buyinModal') {
            resetBuyinModal();
        }
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', handleModalKeys);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.removeEventListener('keydown', handleModalKeys);
    }
}

function handleModalKeys(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
    
    // F1 for Buy-in, F2 for Cash-out
    if (e.key === 'F1') {
        e.preventDefault();
        closeModal('cashoutModal');
        openModal('buyinModal');
    }
    if (e.key === 'F2') {
        e.preventDefault();
        closeModal('buyinModal');
        openModal('cashoutModal');
    }
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
        }
    });
});

// ==================== Buy-in Flow ====================
function resetBuyinModal() {
    state.buyinStep = 1;
    document.getElementById('buyinStep1').classList.remove('hidden');
    document.getElementById('buyinStep2').classList.add('hidden');
    document.getElementById('buyinStep3').classList.add('hidden');
    document.getElementById('buyinBack').style.display = 'none';
    document.getElementById('buyinNext').textContent = 'Continuar';
    
    // Reset inputs
    document.getElementById('buyinMonto').value = '';
    document.getElementById('buyinKycWarning').classList.add('hidden');
}

function handleStep1() {
    const monto = parseCurrency(document.getElementById('buyinMonto').value);
    
    if (!monto || monto <= 0) {
        document.getElementById('buyinMonto').style.borderColor = 'var(--status-red)';
        return;
    }
    
    document.getElementById('buyinMonto').style.borderColor = '';
    
    if (monto >= 2000) {
        document.getElementById('buyinKycWarning').classList.remove('hidden');
    }
    
    document.getElementById('confirmMonto').textContent = formatCurrencyDisplay(monto);
    document.getElementById('confirmInstr').textContent = getSelectedRadio('buyinInstr') || 'Efectivo';
    document.getElementById('confirmCliente').textContent = document.getElementById('buyinNombre').value || 'Cliente';
    
    if (monto >= 2000) {
        state.buyinStep = 2;
        document.getElementById('buyinStep1').classList.add('hidden');
        document.getElementById('buyinStep2').classList.remove('hidden');
        document.getElementById('buyinBack').style.display = 'block';
    } else {
        state.buyinStep = 3;
        document.getElementById('buyinStep1').classList.add('hidden');
        document.getElementById('buyinStep3').classList.remove('hidden');
        document.getElementById('buyinBack').style.display = 'block';
        document.getElementById('buyinNext').textContent = 'Entregar fichas y registrar';
    }
}

function handleStep2() {
    const doc = document.getElementById('buyinDoc').value;
    const nombre = document.getElementById('buyinNombre').value;
    
    if (!doc || !nombre) {
        if (!doc) document.getElementById('buyinDoc').style.borderColor = 'var(--status-red)';
        if (!nombre) document.getElementById('buyinNombre').style.borderColor = 'var(--status-red)';
        return;
    }
    
    document.getElementById('buyinDoc').style.borderColor = '';
    document.getElementById('buyinNombre').style.borderColor = '';
    document.getElementById('confirmCliente').textContent = nombre;
    
    state.buyinStep = 3;
    document.getElementById('buyinStep2').classList.add('hidden');
    document.getElementById('buyinStep3').classList.remove('hidden');
    document.getElementById('buyinNext').textContent = 'Entregar fichas y registrar';
}

function handleStep3() {
    const monto = parseCurrency(document.getElementById('buyinMonto').value);
    const cliente = document.getElementById('buyinNombre').value || 'Cliente';
    const hash = document.getElementById('buyinHash')?.value || generateHash();
    
    addTransaction({
        hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        tipo: 'Buy-in',
        cliente: cliente.split(' ').slice(0, 2).join(' '),
        hash: hash,
        monto: formatCurrencyDisplay(monto),
        status: 'green'
    });
    
    closeModal('buyinModal');
    setTimeout(() => openModal('receiptModal'), 300);
}

function buyinNext() {
    switch (state.buyinStep) {
        case 1: handleStep1(); break;
        case 2: handleStep2(); break;
        case 3: handleStep3(); break;
    }
}

function buyinBack() {
    const step = state.buyinStep;
    
    if (step === 2) {
        state.buyinStep = 1;
        document.getElementById('buyinStep2').classList.add('hidden');
        document.getElementById('buyinStep1').classList.remove('hidden');
        document.getElementById('buyinBack').style.display = 'none';
    } else if (step === 3) {
        const monto = parseCurrency(document.getElementById('buyinMonto').value);
        
        if (monto >= 2000) {
            state.buyinStep = 2;
            document.getElementById('buyinStep3').classList.add('hidden');
            document.getElementById('buyinStep2').classList.remove('hidden');
        } else {
            state.buyinStep = 1;
            document.getElementById('buyinStep3').classList.add('hidden');
            document.getElementById('buyinStep1').classList.remove('hidden');
            document.getElementById('buyinBack').style.display = 'none';
        }
    }
}

// ==================== Currency Formatting ====================
function formatCurrency(input) {
    let value = input.value.replace(/[^\d]/g, '');
    if (value) {
        value = Number.parseInt(value).toLocaleString('es-ES');
        input.value = '$ ' + value;
    }
}

function parseCurrency(value) {
    if (!value) return 0;
    const cleaned = value.replace(/[$.]/g, '').replace(/\s/g, '');
    return Number.parseInt(cleaned) || 0;
}

function formatCurrencyDisplay(value) {
    return '$ ' + value.toLocaleString('es-ES');
}

// ==================== Helper Functions ====================
function getSelectedRadio(name) {
    const selected = document.querySelector(`input[name="${name}"]:checked`);
    return selected ? selected.value : null;
}

function generateHash() {
    const chars = '0123456789abcdef';
    let hash = '';
    for (let i = 0; i < 8; i++) {
        hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hash.slice(0, 4) + '...' + hash.slice(-4);
}

function addTransaction(tx) {
    state.transactions.unshift(tx);
    renderTransactions();
}

function statusLabel(status) {
    if (status === 'green') return 'verde';
    if (status === 'yellow') return 'alerta';
    return 'bloqueado';
}

function renderTransactions() {
    const tbody = document.getElementById('transactionsTable');
    if (!tbody) return;
    
    tbody.innerHTML = state.transactions.map(tx => `
        <tr>
            <td class="font-mono">${tx.hora}</td>
            <td>${tx.tipo}</td>
            <td>
                ${tx.cliente}
                <div class="table__hash">${tx.hash}</div>
            </td>
            <td class="table__monto">${tx.monto}</td>
            <td>
                <span class="badge badge--${tx.status}">${statusLabel(tx.status)}</span>
            </td>
        </tr>
    `).join('');
}

// ==================== User Switching (Prototype) ====================
function switchUser(role) {
    state.currentUser = role;
    
    // In a real app, this would navigate to a different page
    // For prototype, we just show an alert
    if (role === 'oficial') {
        alert('Vista del Oficial de Cumplimiento - En desarrollo');
    }
}

// ==================== Hash Generation on Document Input ====================
document.addEventListener('DOMContentLoaded', () => {
    const docInput = document.getElementById('buyinDoc');
    if (docInput) {
        docInput.addEventListener('input', () => {
            const hashInput = document.getElementById('buyinHash');
            if (hashInput) {
                hashInput.value = generateHash();
            }
        });
    }
});

// ==================== Keyboard Shortcuts ====================
document.addEventListener('keydown', (e) => {
    // Only if no modal is open and no input is focused
    if (document.querySelectorAll('.modal-overlay.active').length > 0) return;
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
    
    if (e.key === 'F1') {
        e.preventDefault();
        openModal('buyinModal');
    }
    if (e.key === 'F2') {
        e.preventDefault();
        openModal('cashoutModal');
    }
});

// ==================== Print Functionality ====================
function printReceipt() {
    globalThis.print();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderTransactions();
});