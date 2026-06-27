/**
 * Mundo+ Habitação - Core Calculator Brain
 */
const calculator = {
    
    // Main Orchestrator for the Simulation
    run: (state) => {
        const { customer, property, params } = state;
        
        // 1. MCMV Enquadramento
        const faixa = MCMV_Engine.getFaixa(customer.income);
        const subsidio = MCMV_Engine.getSubsidio(customer.income);

        // 2. Financial Params
        const annualRate = params.annualRate;
        const monthlyRate = Finance_Engine.toMonthlyRate(annualRate);
        const n = params.years * 12;

        // 3. Financial Calculation (Fixed Tenure Rule)
        // If they provided a target PMT, calculate how much PV they can get
        // But if they provided a property price, we need to check if that PMT covers it.
        const maxPV = Finance_Engine.calculatePV(params.targetPmt, monthlyRate, n);
        
        // Needed Finance = Price - Entry - FGTS - Subsidio
        const neededPV = property.value - property.entry - property.fgts - subsidio;
        
        // Result Logic
        let status = 'APROVADO';
        let warning = '';
        let finalPV = neededPV;
        let finalPMT = params.targetPmt;

        // Logic check: Does the target PMT cover the needed PV in the fixed timeframe?
        if (neededPV > maxPV) {
            status = 'REPROVADO';
            warning = "Não foi possível enquadrar esta proposta mantendo o prazo contratado de " + params.years + " anos.";
            finalPV = maxPV;
        }

        // Check income commitment
        const commitment = Finance_Engine.checkCommitment(finalPMT, customer.income);
        if (commitment > 30 && commitment <= 40) status = 'ATENÇÃO';
        if (commitment > 40) status = 'REPROVADO';

        return {
            faixa,
            subsidio,
            neededPV,
            maxPV,
            finalPV,
            finalPMT,
            commitment: commitment.toFixed(2),
            status,
            warning,
            tenure: n,
            years: params.years,
            details: {
                propertyValue: property.value,
                entry: property.entry,
                fgts: property.fgts,
                costs: property.value * 0.04 // Estimativa ITBI + Registro 4%
            }
        };
    },

    cleanMoney: (val) => {
        return parseFloat(val.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    }
};
