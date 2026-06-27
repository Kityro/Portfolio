/**
 * Mundo+ Habitação - UI Controller
 */
const UI = {
    // Current active step
    currentStep: 1,

    init: () => {
        UI.setupListeners();
        UI.applyMasks();
    },

    setupListeners: () => {
        // Tab switching
        document.querySelectorAll('.nav-menu li').forEach(li => {
            li.onclick = () => UI.switchTab(li.getAttribute('data-tab'));
        });
    },

    switchTab: (tabId) => {
        document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));
        document.querySelectorAll('.nav-menu li').forEach(li => li.classList.remove('active'));
        
        document.getElementById(`${tabId}View`).classList.add('active');
        document.querySelector(`.nav-menu li[data-tab="${tabId}"]`).classList.add('active');
    },

    nextStep: () => {
        if (UI.currentStep < 4) {
            document.getElementById(`step${UI.currentStep}`).classList.remove('active');
            UI.currentStep++;
            document.getElementById(`step${UI.currentStep}`).classList.add('active');
            
            // Update stepper visual
            document.querySelectorAll('.step').forEach(s => {
                if (parseInt(s.getAttribute('data-step')) === UI.currentStep) s.classList.add('active');
            });
        }
    },

    applyMasks: () => {
        // Simple currency and CPF masks
        document.querySelectorAll('.mask-money').forEach(input => {
            input.oninput = (e) => {
                let v = e.target.value.replace(/\D/g, '');
                v = (v / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                e.target.value = 'R$ ' + v;
            };
        });

        document.querySelectorAll('.mask-cpf').forEach(input => {
            input.oninput = (e) => {
                let v = e.target.value.replace(/\D/g, '');
                if (v.length > 11) v = v.substring(0, 11);
                v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
                e.target.value = v;
            };
        });
    },

    showLoading: () => {
        document.getElementById('simulationResult').innerHTML = "Calculando...";
    },

    renderDashboard: (data) => {
        // Switch to Dashboard Tab
        UI.switchTab('dashboard'); // Actually, Step 4 is the dashboard
        document.getElementById('step3').classList.remove('active');
        document.getElementById('step4').classList.add('active');

        // Populate Cards
        document.getElementById('resIncome').innerText = 'R$ ' + data.customerIncome.toLocaleString('pt-BR', {minimumFractionDigits: 2});
        document.getElementById('resFaixa').innerText = data.faixa === 0 ? 'FORA DO PROGRAMA' : 'FAIXA ' + data.faixa;
        document.getElementById('resSubsidio').innerText = 'R$ ' + data.subsidio.toLocaleString('pt-BR', {minimumFractionDigits: 2});
        document.getElementById('resCredit').innerText = 'R$ ' + data.finalPV.toLocaleString('pt-BR', {minimumFractionDigits: 2});
        
        // Status & Conclusion
        const badge = document.getElementById('statusBadge');
        const conclusion = document.getElementById('resConclusion');
        const warning = document.getElementById('resWarning');

        conclusion.innerText = data.status;
        warning.innerText = data.warning || "";
        
        badge.className = 'status-indicator';
        if (data.status === 'APROVADO') badge.classList.add('status-approved');
        if (data.status === 'ATENÇÃO') badge.classList.add('status-warning');
        if (data.status === 'REPROVADO') badge.classList.add('status-rejected');
        badge.innerText = data.status;

        // Details
        document.getElementById('detPmt').innerText = 'R$ ' + data.finalPMT.toLocaleString('pt-BR', {minimumFractionDigits: 2});
        document.getElementById('detTenure').innerText = data.tenure + ' meses (' + data.years + ' anos)';
        document.getElementById('detCosts').innerText = 'R$ ' + data.details.costs.toLocaleString('pt-BR', {minimumFractionDigits: 2});
    }
};

UI.init();
