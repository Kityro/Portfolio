/**
 * Mundo+ Habitação - App Orchestrator
 */
const app = {
    // Current Simulation Data State
    state: {
        customer: {},
        property: {},
        params: {},
        results: {}
    },

    init: () => {
        console.log("Mundo+ Habitação Initialized");
        // Start storage check
        storage.init();
    },

    // Bridge for UI to trigger calculation
    triggerCalculation: () => {
        // 1. Gather all data
        app.gatherData();
        
        // 2. Run simulation engine
        const simulation = calculator.run(app.state);
        
        // 3. Render dashboard
        ui.renderDashboard(simulation);
        
        // 4. Update charts
        charts.update(simulation);
    },

    gatherData: () => {
        const incomeM = calculator.cleanMoney(document.getElementById('incomeMain').value);
        const incomeJ = calculator.cleanMoney(document.getElementById('incomeJoint').value);

        app.state.customer = {
            name: document.getElementById('custName').value,
            income: incomeM + incomeJ,
            dependents: parseInt(document.getElementById('dependents').value)
        };

        app.state.property = {
            value: calculator.cleanMoney(document.getElementById('propValue').value),
            entry: calculator.cleanMoney(document.getElementById('entryValue').value),
            fgts: calculator.cleanMoney(document.getElementById('fgtsValue').value)
        };

        app.state.params = {
            years: parseInt(document.getElementById('financeYears').value),
            targetPmt: calculator.cleanMoney(document.getElementById('targetPmt').value),
            annualRate: parseFloat(document.getElementById('annualIneterest').value)
        };
    },

    triggerCalculation: () => {
        app.gatherData();
        const results = calculator.run(app.state);
        
        // Add income to results for display
        results.customerIncome = app.state.customer.income;
        
        UI.renderDashboard(results);
        charts.update(results);
        storage.save({ ...app.state, results });
    },

    prevStep: () => {
        if (UI.currentStep > 1) {
            document.getElementById(`step${UI.currentStep}`).classList.remove('active');
            UI.currentStep--;
            document.getElementById(`step${UI.currentStep}`).classList.add('active');
            
            document.querySelectorAll('.step').forEach(s => {
                if (parseInt(s.getAttribute('data-step')) > UI.currentStep) s.classList.remove('active');
            });
        }
    },

    nextStep: () => {
        UI.nextStep();
    }
};

// Start the app
window.onload = app.init;
