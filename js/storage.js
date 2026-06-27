/**
 * Mundo+ Habitação - Storage Management
 */
const storage = {
    key: 'mundo_housing_sims',

    init: () => {
        if (!localStorage.getItem(storage.key)) {
            localStorage.setItem(storage.key, JSON.stringify([]));
        }
    },

    save: (simData) => {
        const sims = JSON.parse(localStorage.getItem(storage.key));
        sims.push({
            id: Date.now(),
            date: new Date().toISOString(),
            data: simData
        });
        localStorage.setItem(storage.key, JSON.stringify(sims));
    },

    getAll: () => {
        return JSON.parse(localStorage.getItem(storage.key));
    },

    clear: () => {
        localStorage.setItem(storage.key, JSON.stringify([]));
    }
};
