/**
 * Mundo+ Habitação - Input Validation
 */
const Validation = {
    step1: () => {
        const name = document.getElementById('custName').value;
        const income = calculator.cleanMoney(document.getElementById('incomeMain').value);
        if (name.length < 3) return "Nome inválido";
        if (income <= 0) return "Informe a renda principal";
        return true;
    },
    
    step2: () => {
        const prop = calculator.cleanMoney(document.getElementById('propValue').value);
        if (prop <= 0) return "Informe o valor do imóvel";
        return true;
    }
};
