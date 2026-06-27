/**
 * Mundo+ Habitação - Charts Integration
 */
const charts = {
    dist: null,
    gauge: null,

    update: (data) => {
        charts.renderDistribution(data);
        charts.renderGauge(data.commitment);
    },

    renderDistribution: (data) => {
        const ctx = document.getElementById('chartDistribution').getContext('2d');
        if (charts.dist) charts.dist.destroy();

        charts.dist = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Entrada', 'FGTS', 'Subsídio', 'Financiamento'],
                datasets: [{
                    data: [data.details.entry, data.details.fgts, data.subsidio, data.finalPV],
                    backgroundColor: ['#8b5cf6', '#3b82f6', '#00ff88', '#161a22'],
                    borderWidth: 0,
                    hoverOffset: 20
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Outfit' } } }
                }
            }
        });
    },

    renderGauge: (commitment) => {
        const ctx = document.getElementById('chartCommitment').getContext('2d');
        if (charts.gauge) charts.gauge.destroy();

        const color = commitment > 40 ? '#ef4444' : (commitment > 30 ? '#f59e0b' : '#00ff88');

        charts.gauge = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [commitment, 100 - commitment],
                    backgroundColor: [color, '#161a22'],
                    circumference: 180,
                    rotation: 270,
                    borderWidth: 0,
                    cutout: '80%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
        
        document.getElementById('commitmentValue').innerText = commitment + '%';
        document.getElementById('commitmentValue').style.color = color;
    }
};
