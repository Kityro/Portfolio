/**
 * Mundo+ Habitação - MCMV Rules Engine
 */
const MCMV_Engine = {
    // Configurable Subsidies
    subsidios: {
        faixa1: 55000,
        faixa2: 35000,
        faixa3: 15000,
        faixa4: 0
    },

    // Bracket Classification (2024 Rules)
    getFaixa: (rendaFam) => {
        if (rendaFam <= 3200) return 1;
        if (rendaFam <= 5000) return 2;
        if (rendaFam <= 9600) return 3;
        if (rendaFam <= 13000) return 4;
        return 0; // Acima do programa
    },

    getSubsidio: (rendaFam) => {
        const f = MCMV_Engine.getFaixa(rendaFam);
        if (f === 1) return MCMV_Engine.subsidios.faixa1;
        if (f === 2) return MCMV_Engine.subsidios.faixa2;
        if (f === 3) return MCMV_Engine.subsidios.faixa3;
        return 0;
    }
};
