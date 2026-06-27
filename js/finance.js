/**
 * Mundo+ Habitação - Technical Finance Engine
 */
const Finance_Engine = {
    // Annual -> Monthly (Compound)
    toMonthlyRate: (annualRate) => {
        return Math.pow(1 + (annualRate / 100), 1 / 12) - 1;
    },

    // PRICE: Calculate Present Value (Financed Amount)
    calculatePV: (pmt, rate, n) => {
        return pmt * ((1 - Math.pow(1 + rate, -n)) / rate);
    },

    // PRICE: Calculate Installment
    calculatePMT_Price: (pv, rate, n) => {
        return (pv * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
    },

    // SAC: Calculate First Installment (Highest)
    calculatePMT_Sac: (pv, rate, n) => {
        const amort = pv / n;
        const interest = pv * rate;
        return amort + interest;
    },

    // SAC: Calculate Last Installment (Lowest)
    calculatePMT_Sac_Last: (pv, rate, n) => {
        const amort = pv / n;
        const interest = amort * rate;
        return amort + interest;
    },

    checkCommitment: (pmt, income) => {
        if (!income || income <= 0) return 0;
        return (pmt / income) * 100;
    }
};
