document.addEventListener('DOMContentLoaded', () => {
    // --- 3D GLOBE ---
    const container = document.getElementById('canvas-container');
    if (container && typeof THREE !== 'undefined') {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);
        const globe = new THREE.Mesh(new THREE.SphereGeometry(5, 64, 64), new THREE.MeshBasicMaterial({ color: 0x00ff88, wireframe: true, transparent: true, opacity: 0.1 }));
        scene.add(globe);
        camera.position.z = 10;
        function animate() { requestAnimationFrame(animate); globe.rotation.y += 0.001; renderer.render(scene, camera); }
        animate();
    }

    // --- SHARED DATA ---
    let history = [];
    let statsCount = 0;
    let currentViewingCpf = null;

    function saveState() {
        localStorage.setItem('mundo_history', JSON.stringify(history));
        localStorage.setItem('mundo_stats', statsCount.toString());
    }

    function isValidCPF(strCPF) {
        let soma = 0; let resto; strCPF = strCPF.replace(/[^\d]+/g, '');
        if (strCPF.length !== 11 || /^(\d)\1{10}$/.test(strCPF)) return false;
        for (let i = 1; i <= 9; i++) soma = soma + parseInt(strCPF.substring(i - 1, i)) * (11 - i);
        resto = (soma * 10) % 11; if ((resto == 10) || (resto == 11)) resto = 0;
        if (resto != parseInt(strCPF.substring(9, 10))) return false;
        soma = 0; for (let i = 1; i <= 10; i++) soma = soma + parseInt(strCPF.substring(i - 1, i)) * (12 - i);
        resto = (soma * 10) % 11; if ((resto == 10) || (resto == 11)) resto = 0;
        if (resto != parseInt(strCPF.substring(10, 11))) return false;
        return true;
    }

    function updateSidebar() {
        const list = document.getElementById('historyList');
        const count = document.getElementById('statsCount');
        if (count) count.innerText = statsCount;
        if (list) {
            list.innerHTML = history.length === 0 ? '<p style="color: var(--text-dim); font-size: 0.7rem; font-style: italic;">Sem atendimentos recentes...</p>' : '';
            history.slice(0, 10).forEach(h => {
                const div = document.createElement('div');
                div.className = 'history-item';
                div.style.cssText = 'padding:0.6rem; background:rgba(255,255,255,0.03); border-radius:6px; font-size:0.65rem; cursor:pointer; margin-bottom:0.5rem;';
                div.onclick = () => loadData(h);
                const color = h.status === 'APROVADO' ? '#00ff88' : (h.status === 'NEGADO' ? '#ff4444' : '#ffa500');
                const vStatus = h.venda_status !== undefined ? h.venda_status : h.vendaStatus;
                div.innerHTML = `<div style="display:flex; justify-content:space-between"><span style="color:#fff; font-weight:600;">${h.name.split(' ')[0]}</span><span style="color:${color}; font-weight:800;">${h.score}</span></div><div style="color:var(--text-dim); font-size:0.6rem; margin-top:2px;">${vStatus || 'Em processo'}</div>`;
                list.appendChild(div);
            });
        }
    }

    function loadData(data) {
        const res = document.getElementById('results');
        if (!res) return;
        res.style.display = 'block';
        currentViewingCpf = data.cpf;
        
        const nameEl = document.getElementById('clientName');
        if (nameEl) nameEl.innerText = data.name;
        
        const birthDate = data.birth_date !== undefined ? data.birth_date : data.birthDate;
        const birthEl = document.getElementById('clientBirthDate');
        if (birthEl) birthEl.innerText = birthDate || 'N/A';
        
        const restrictionEl = document.getElementById('restrictionsList');
        const restrictionCard = document.getElementById('restrictionCard');
        if (restrictionEl) {
            restrictionEl.innerText = data.restriction;
            const hasRestriction = data.restriction && data.restriction.toUpperCase().includes('RESTRIÇÃO');
            if (restrictionCard) {
                if (hasRestriction) {
                    restrictionCard.style.background = 'rgba(255, 68, 68, 0.07)';
                    restrictionCard.style.borderColor = 'rgba(255, 68, 68, 0.3)';
                    restrictionEl.style.color = '#ff4444';
                } else {
                    restrictionCard.style.background = 'rgba(0, 255, 136, 0.07)';
                    restrictionCard.style.borderColor = 'rgba(0, 255, 136, 0.3)';
                    restrictionEl.style.color = '#00ff88';
                }
            }
        }
        
        const notesArea = document.getElementById('notesArea');
        if (notesArea) notesArea.value = data.notes || '';
        
        const scoreEl = document.getElementById('scoreValue');
        if (scoreEl) scoreEl.innerText = data.score;
        
        const scoreBarEl = document.getElementById('scoreBar');
        if (scoreBarEl) scoreBarEl.style.width = `${data.score / 10}%`;
        
        const creditEl = document.getElementById('creditValue');
        if (creditEl) {
            const credit = data.credit_limit !== undefined ? data.credit_limit : data.credit;
            creditEl.innerText = credit;
        }
        
        const interestEl = document.getElementById('interestRate');
        if (interestEl) {
            const interest = data.interest_rate !== undefined ? data.interest_rate : data.interest;
            interestEl.innerText = interest;
        }
        
        const badge = document.getElementById('statusBadge');
        if (badge) {
            badge.innerText = data.status;
            badge.style.color = data.status === 'APROVADO' ? '#00ff88' : (data.status === 'NEGADO' ? '#ff4444' : '#ffa500');
        }
        
        const vStatus = data.venda_status !== undefined ? data.venda_status : data.vendaStatus;
        updateStatusButtons(vStatus || 'Em processo');
    }

    function updateStatusButtons(currentStatus) {
        document.querySelectorAll('.status-btn').forEach(btn => {
            const isActive = btn.getAttribute('data-status') === currentStatus;
            btn.style.background = isActive ? 'var(--primary)' : 'rgba(255,255,255,0.05)';
            btn.style.color = isActive ? '#000' : '#fff';
            btn.onclick = () => {
                const item = history.find(h => h.cpf === currentViewingCpf);
                if (item) {
                    const newStatus = btn.getAttribute('data-status');
                    item.venda_status = newStatus;
                    item.vendaStatus = newStatus;
                    saveState();
                    updateStatusButtons(newStatus);
                    updateSidebar();
                    
                    if (item.id) {
                        fetch(`/consult/${item.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ venda_status: newStatus })
                        })
                        .then(res => res.json())
                        .then(updated => console.log('Venda status atualizado:', updated))
                        .catch(err => console.error('Erro ao atualizar venda status:', err));
                    }
                }
            };
        });
    }

    // --- CURRENCY MASKING ---
    function formatAsCurrency(input) {
        let value = input.value.replace(/\D/g, '');
        value = (value / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        input.value = 'R$ ' + value;
    }

    const moneyInputs = ['monthlyIncome', 'entryValue', 'propertyValue', 'targetPayment'];
    moneyInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.type = 'text'; // Change to text for masking
            el.addEventListener('input', () => formatAsCurrency(el));
        }
    });

    function cleanValue(valStr) {
        return parseFloat(valStr.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    }

    // --- INTEREST SYNC ---
    const configAnnualRate = document.getElementById('configAnnualRate');
    const configMonthlyRate = document.getElementById('configMonthlyRate');

    if (configAnnualRate && configMonthlyRate) {
        configAnnualRate.addEventListener('input', () => {
            const annual = parseFloat(configAnnualRate.value) / 100;
            const monthly = (Math.pow(1 + annual, 1 / 12) - 1) * 100;
            configMonthlyRate.value = monthly.toFixed(4);
        });
        configMonthlyRate.addEventListener('input', () => {
            const monthly = parseFloat(configMonthlyRate.value) / 100;
            const annual = (Math.pow(1 + monthly, 12) - 1) * 100;
            configAnnualRate.value = annual.toFixed(2);
        });
    }

    // --- FINANCIAL SIMULATOR ---
    const simulateBtn = document.getElementById('simulateBtn');
    if (simulateBtn) {
        simulateBtn.addEventListener('click', () => {
            const income = cleanValue(document.getElementById('monthlyIncome').value);
            const property = cleanValue(document.getElementById('propertyValue').value);
            const entry = cleanValue(document.getElementById('entryValue').value);
            const targetPay = cleanValue(document.getElementById('targetPayment').value);
            
            const annualRate = parseFloat(document.getElementById('configAnnualRate').value) / 100;
            const i = parseFloat(document.getElementById('configMonthlyRate').value) / 100;

            if (property <= 0 || income <= 0 || targetPay <= 0) return alert('Por favor, preencha a renda, valor do imóvel e o pagamento mensal desejado.');
            
            const neededCredit = property - entry;
            if (targetPay <= neededCredit * i) return alert('A parcela mínima deve ser maior que os juros (R$ ' + (neededCredit * i).toLocaleString('pt-BR') + ')');

            // 1. CÁLCULO PRINCIPAL: Tempo para a parcela desejada
            const finalTenureMonths = Math.ceil(-Math.log(1 - (neededCredit * i) / targetPay) / Math.log(1 + i));
            const years = Math.floor(finalTenureMonths / 12);
            const months = finalTenureMonths % 12;

            const resDiv = document.getElementById('simulationResult');
            resDiv.style.display = 'block';
            
            document.getElementById('calcTenure').innerText = `${years} anos ${months > 0 ? 'e ' + months + ' m' : ''}`;
            document.getElementById('monthlyInstallment').innerText = `R$ ${targetPay.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
            document.getElementById('financedAmount').innerText = `R$ ${neededCredit.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
            
            const labelStatus = document.getElementById('simStatus');
            const commitment = (targetPay / income) * 100;
            
            if (commitment > 35 || years > 35) {
                labelStatus.innerText = 'AVALIAÇÃO DE RISCO'; labelStatus.style.color = '#ff4444'; labelStatus.style.borderColor = '#ff4444';
            } else {
                labelStatus.innerText = 'PERFIL APROVADO'; labelStatus.style.color = '#00ff88'; labelStatus.style.borderColor = '#00ff88';
            }

            // 2. CÁLCULO DE ALTERNATIVAS (Sugestão do Corretor)
            const alternatives = [20, 35]; // Sugerir 20 anos e 35 anos fixos
            const altList = document.getElementById('alternativesList');
            altList.innerHTML = '';

            alternatives.forEach(altYears => {
                if (altYears === years) return; // Não sugerir o que já foi calculado

                const altMonths = altYears * 12;
                const altPMT = (neededCredit * i * Math.pow(1 + i, altMonths)) / (Math.pow(1 + i, altMonths) - 1);
                
                const div = document.createElement('div');
                div.style.cssText = 'background:rgba(255,255,255,0.02); padding:0.6rem; border-radius:8px; display:flex; justify-content:space-between; align-items:center; border:1px solid rgba(255,255,255,0.05);';
                div.innerHTML = `
                    <div style="font-size:0.65rem;">
                        <span style="color:var(--text-dim);">Em</span> <b style="color:#fff;">${altYears} anos:</b>
                    </div>
                    <div style="color:var(--primary); font-weight:800; font-size:0.75rem;">
                        R$ ${altPMT.toLocaleString('pt-BR', {minimumFractionDigits:2})}
                    </div>
                `;
                altList.appendChild(div);
            });
        });
    }

    // --- ACTIONS ---
    const consultBtn = document.getElementById('consultBtn');
    const cpfInput = document.getElementById('cpf');
    if (consultBtn && cpfInput) {
        // Format input mask 000.000.000-00
        cpfInput.addEventListener('input', () => {
            let v = cpfInput.value.replace(/\D/g, '');
            if (v.length > 11) v = v.slice(0, 11);
            if (v.length > 9) {
                v = v.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})$/, '$1.$2.$3-$4');
            } else if (v.length > 6) {
                v = v.replace(/^(\d{3})(\d{3})(\d{1,3})$/, '$1.$2.$3');
            } else if (v.length > 3) {
                v = v.replace(/^(\d{3})(\d{1,3})$/, '$1.$2');
            }
            cpfInput.value = v;
        });

        consultBtn.addEventListener('click', () => {
            const rawCpf = cpfInput.value.replace(/\D/g, '');
            if (!isValidCPF(rawCpf)) {
                cpfInput.style.borderColor = '#ff4444';
                alert('CPF INVÁLIDO.');
                return;
            }
            cpfInput.style.borderColor = 'var(--primary)';
            document.getElementById('loading').style.display = 'block';
            document.getElementById('results').style.display = 'none';
            consultBtn.disabled = true;

            fetch('/consult', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cpf: rawCpf })
            })
            .then(res => {
                if (!res.ok) throw new Error('Erro na requisição ao servidor.');
                return res.json();
            })
            .then(analysis => {
                history.unshift(analysis);
                statsCount++;
                saveState();
                loadData(analysis);
                updateSidebar();
                
                cpfInput.value = '';
            })
            .catch(err => {
                console.error(err);
                alert('Erro ao consultar CPF no servidor: ' + err.message);
            })
            .finally(() => {
                document.getElementById('loading').style.display = 'none';
                consultBtn.disabled = false;
            });
        });
    }

    const clearBtn = document.getElementById('clearHistoryBtn');
    if (clearBtn) {
        clearBtn.onclick = () => {
            if (confirm('Deseja limpar todos os registros? Isso também removerá as consultas do banco de dados.')) {
                const deletePromises = history.filter(h => h.id).map(h => 
                    fetch(`/consult/${h.id}`, { method: 'DELETE' }).catch(err => console.error(err))
                );
                Promise.all(deletePromises).then(() => {
                    history = [];
                    statsCount = 0;
                    saveState();
                    updateSidebar();
                    document.getElementById('results').style.display = 'none';
                    const fullTable = document.getElementById('fullHistoryTable');
                    if (fullTable) fullTable.innerHTML = '';
                    const emptyMsg = document.getElementById('emptyMessage');
                    if (emptyMsg) emptyMsg.style.display = 'block';
                    alert('Banco de dados local e histórico limpo com sucesso.');
                });
            }
        };
    }

    const saveNotesBtn = document.getElementById('saveNotesBtn');
    if (saveNotesBtn) {
        saveNotesBtn.onclick = () => {
            const notesAreaValue = document.getElementById('notesArea').value;
            const item = history.find(h => h.cpf === currentViewingCpf);
            if (item) {
                item.notes = notesAreaValue;
                saveState();
                
                if (item.id) {
                    fetch(`/consult/${item.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ notes: notesAreaValue })
                    })
                    .then(res => res.json())
                    .then(updated => alert('Anotação sincronizada no banco de dados!'))
                    .catch(e => {
                        console.error(e);
                        alert('Erro ao sincronizar com servidor, salvo localmente.');
                    });
                } else {
                    alert('Salvo localmente!');
                }
            }
        };
    }

    // --- APP INITIALIZATION FROM BACKEND ---
    function initApp() {
        fetch('/history')
        .then(res => res.json())
        .then(data => {
            history = data;
            statsCount = history.length;
            saveState();
            
            // Populate full history page table if exists
            const fullTable = document.getElementById('fullHistoryTable');
            const emptyMsg = document.getElementById('emptyMessage');
            if (fullTable) {
                fullTable.innerHTML = '';
                if (history.length === 0) {
                    if (emptyMsg) emptyMsg.style.display = 'block';
                } else {
                    if (emptyMsg) emptyMsg.style.display = 'none';
                    history.forEach(h => {
                        const tr = document.createElement('tr');
                        tr.style.cssText = 'border-bottom: 1px solid var(--glass-border);';
                        
                        const dateStr = new Date(h.created_at || Date.now()).toLocaleDateString('pt-BR');
                        const statusColor = h.status === 'APROVADO' ? '#00ff88' : (h.status === 'NEGADO' ? '#ff4444' : '#ffa500');
                        const cpfFormatted = h.cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
                        
                        tr.innerHTML = `
                            <td style="padding: 1rem; color: var(--text-dim);">${dateStr}</td>
                            <td style="padding: 1rem; color: #fff; font-weight: 600;">${h.name}</td>
                            <td style="padding: 1rem; color: var(--text-dim);">${cpfFormatted}</td>
                            <td style="padding: 1rem; color: var(--primary); font-weight: 800;">${h.score}</td>
                            <td style="padding: 1rem;"><span style="color: ${statusColor}; font-weight: 800;">${h.status}</span></td>
                        `;
                        fullTable.appendChild(tr);
                    });
                }
            }
            
            updateSidebar();
        })
        .catch(err => {
            console.error('Erro de conexão ao backend, carregando dados locais:', err);
            history = JSON.parse(localStorage.getItem('mundo_history')) || [];
            statsCount = parseInt(localStorage.getItem('mundo_stats')) || history.length;
            updateSidebar();
        });
    }

    initApp();
});
