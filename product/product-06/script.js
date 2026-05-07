document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('product-form');
    const errorMessage = document.getElementById('error-message');
    const generateBtn = document.getElementById('generate-btn');
    const btnText = generateBtn.querySelector('.btn-text');
    const btnIcon = generateBtn.querySelector('.btn-icon');
    const spinner = generateBtn.querySelector('.spinner');
    
    const shortDescContainer = document.getElementById('short-desc-container');
    const longDescContainer = document.getElementById('long-desc-container');
    const highlightsContainer = document.getElementById('highlights-container');
    const toastContainer = document.getElementById('toast-container');
    const historyListContainer = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history-btn');

    const STORAGE_KEY = 'ai_product_generator_history';
    const MAX_HISTORY_ITEMS = 30;
    
    let activeHistoryId = null;

    // Load history on start
    let historyState = loadHistory();
    renderHistory(historyState);

    // Copy to clipboard setup
    setupCopyButtons();

    // Inline Editing setup
    setupInlineEditing();

    // Clear History Button Setup
    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Сигурни ли сте, че искате да изчистите цялата история? Това действие е необратимо.')) {
            historyState = [];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(historyState));
            renderHistory(historyState);
            resetFormAndResults();
            showToast('Историята е изчистена успешно.', 'success');
        }
    });

    // Utility to show toasts
    function showToast(message, type = 'error') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span>${type === 'error' ? '❌' : '✅'}</span>
            <span>${message}</span>
        `;
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Hide error message initially
        errorMessage.classList.add('hidden');
        
        // Remove previous invalid classes
        const fields = form.querySelectorAll('input, textarea, select');
        fields.forEach(field => field.classList.remove('invalid-field'));

        // Collect data
        const productName = document.getElementById('product-name').value.trim();
        const productCategory = document.getElementById('product-category').value.trim();
        const productFeatures = document.getElementById('product-features').value.trim();
        const productTone = document.getElementById('product-tone').value;

        // Validate
        let isValid = true;

        if (!productName) {
            document.getElementById('product-name').classList.add('invalid-field');
            isValid = false;
        }
        if (!productCategory) {
            document.getElementById('product-category').classList.add('invalid-field');
            isValid = false;
        }
        if (!productFeatures) {
            document.getElementById('product-features').classList.add('invalid-field');
            isValid = false;
        }
        if (!productTone) {
            document.getElementById('product-tone').classList.add('invalid-field');
            isValid = false;
        }

        if (!isValid) {
            errorMessage.classList.remove('hidden');
            return;
        }

        // --- Loading State ---
        generateBtn.disabled = true;
        btnText.textContent = 'Генериране...';
        btnIcon.classList.add('hidden');
        spinner.classList.remove('hidden');
        
        // Add slightly dimmed effect to results while loading
        const resultCards = document.querySelectorAll('.result-card');
        resultCards.forEach(card => card.style.opacity = '0.5');

        // To test error handling, user can type 'error' in product name
        const simulateError = productName.toLowerCase() === 'error';

        try {
            // Simulated AI API Request
            const response = await simulateAIRequest({
                name: productName,
                category: productCategory,
                features: productFeatures,
                tone: productTone
            }, simulateError);

            // Parse response
            const parsedResponse = {
                shortDescription: parseMarkdown(response.shortDescription),
                longDescription: parseMarkdown(response.longDescription),
                highlights: parseList(response.highlights)
            };

            // Success: Parse and Render
            renderResults(parsedResponse);
            
            showToast('Успешно генерирано!', 'success');

            // Save to history (saving the PARSED response, so inline edits are preserved as HTML)
            const historyItem = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                input: {
                    name: productName,
                    category: productCategory,
                    features: productFeatures,
                    tone: productTone
                },
                result: parsedResponse
            };
            
            saveToHistory(historyItem);

        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            // Reset Loading State
            generateBtn.disabled = false;
            btnText.textContent = 'Генерирай описание';
            btnIcon.classList.remove('hidden');
            spinner.classList.add('hidden');
            resultCards.forEach(card => card.style.opacity = '1');
        }
    });

    function resetFormAndResults() {
        form.reset();
        activeHistoryId = null;
        
        [shortDescContainer, longDescContainer, highlightsContainer].forEach(el => {
            el.innerHTML = 'Тук ще се появи резултатът...';
            el.classList.add('placeholder-content');
        });
        
        document.querySelectorAll('.btn-copy').forEach(btn => btn.classList.add('hidden'));
    }

    const parseMarkdown = (text) => {
        if(!text) return '';
        let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return html;
    };
    
    const parseList = (text) => {
        if(!text) return '';
        const items = text.split('\n').filter(i => i.trim().length > 0);
        return '<ul>' + items.map(item => `<li>${parseMarkdown(item.replace(/^[-*]\s*/, ''))}</li>`).join('') + '</ul>';
    };

    // Render results
    function renderResults(result) {
        [shortDescContainer, longDescContainer, highlightsContainer].forEach(el => {
            el.classList.remove('placeholder-content');
        });

        // Use the pre-parsed values
        shortDescContainer.innerHTML = result.shortDescription;
        longDescContainer.innerHTML = result.longDescription;
        highlightsContainer.innerHTML = result.highlights;
        
        // Show copy buttons
        document.querySelectorAll('.btn-copy').forEach(btn => btn.classList.remove('hidden'));
    }

    // --- Inline Editing setup ---
    function setupInlineEditing() {
        const containers = [shortDescContainer, longDescContainer, highlightsContainer];
        
        containers.forEach(container => {
            container.addEventListener('input', () => {
                // If it's the placeholder, we shouldn't be saving anything.
                if (container.classList.contains('placeholder-content')) return;
                
                if (activeHistoryId) {
                    const item = historyState.find(i => i.id === activeHistoryId);
                    if (item) {
                        // Store the edited HTML directly back into the history state
                        if (container.id === 'short-desc-container') {
                            item.result.shortDescription = container.innerHTML;
                        } else if (container.id === 'long-desc-container') {
                            item.result.longDescription = container.innerHTML;
                        } else if (container.id === 'highlights-container') {
                            item.result.highlights = container.innerHTML;
                        }
                        
                        // Save changes seamlessly in the background
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(historyState));
                    }
                }
            });
            
            // To prevent rich-text styling messes when pasting, force plain text paste 
            // inside the contenteditable divs (optional but recommended for clean HTML)
            container.addEventListener('paste', (e) => {
                e.preventDefault();
                const text = (e.originalEvent || e).clipboardData.getData('text/plain');
                document.execCommand('insertText', false, text);
            });
        });
    }

    // --- Clipboard / Copy to Clipboard Functions ---
    function setupCopyButtons() {
        const copyBtns = document.querySelectorAll('.btn-copy');
        copyBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
                const targetId = btn.getAttribute('data-target');
                const targetElement = document.getElementById(targetId);
                
                if (!targetElement || targetElement.classList.contains('placeholder-content')) {
                    return;
                }
                
                // Use innerText to get clean plain text format
                const textToCopy = targetElement.innerText.trim();
                
                try {
                    await navigator.clipboard.writeText(textToCopy);
                    
                    // Visual feedback
                    const originalText = btn.querySelector('.copy-text').textContent;
                    const originalIcon = btn.querySelector('.copy-icon').textContent;
                    
                    btn.classList.add('copied');
                    btn.querySelector('.copy-text').textContent = 'Копирано!';
                    btn.querySelector('.copy-icon').textContent = '✅';
                    
                    setTimeout(() => {
                        btn.classList.remove('copied');
                        btn.querySelector('.copy-text').textContent = originalText;
                        btn.querySelector('.copy-icon').textContent = originalIcon;
                    }, 2000);
                    
                } catch (err) {
                    console.error('Failed to copy text: ', err);
                    showToast('Грешка при копиране. Проверете правата на браузъра.', 'error');
                }
            });
        });
    }

    // --- History Functions ---
    function loadHistory() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error parsing history from LocalStorage', e);
            return [];
        }
    }

    function saveToHistory(item) {
        // Add to beginning of array
        historyState.unshift(item);
        
        // Trim if too long
        if (historyState.length > MAX_HISTORY_ITEMS) {
            historyState = historyState.slice(0, MAX_HISTORY_ITEMS);
        }
        
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(historyState));
            activeHistoryId = item.id;
            renderHistory(historyState, activeHistoryId); // set this item as active
        } catch (e) {
            showToast('Грешка при запазване в историята (възможно надвишаване на лимита).', 'error');
        }
    }

    function deleteHistoryItem(id, e) {
        // Prevent click from propagating to the parent div and loading the item
        e.stopPropagation();
        
        historyState = historyState.filter(item => item.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(historyState));
        
        // If we deleted the currently active item, clear the form
        if (activeHistoryId === id) {
            resetFormAndResults();
        }
        
        renderHistory(historyState, activeHistoryId);
        showToast('Записът е изтрит.', 'success');
    }

    function renderHistory(historyArray, activeId = null) {
        historyListContainer.innerHTML = '';
        
        if (historyArray.length === 0) {
            historyListContainer.innerHTML = '<div class="empty-history">Все още нямате запазени описания.</div>';
            clearHistoryBtn.classList.add('hidden');
            return;
        }

        clearHistoryBtn.classList.remove('hidden');

        historyArray.forEach(item => {
            const date = new Date(item.timestamp);
            const dateString = date.toLocaleDateString('bg-BG') + ' ' + date.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
            
            const div = document.createElement('div');
            div.className = `history-item ${item.id === activeId ? 'active' : ''}`;
            div.innerHTML = `
                <div class="history-item-content">
                    <div class="history-item-title">${item.input.name}</div>
                    <div class="history-item-date">${dateString}</div>
                </div>
                <button type="button" class="btn-delete-item" title="Изтрий запис">🗑️</button>
            `;
            
            // Add event listeners
            div.addEventListener('click', () => loadHistoricalItem(item));
            
            const deleteBtn = div.querySelector('.btn-delete-item');
            deleteBtn.addEventListener('click', (e) => deleteHistoryItem(item.id, e));
            
            historyListContainer.appendChild(div);
        });
    }

    function loadHistoricalItem(item) {
        activeHistoryId = item.id;
        
        // Render history list to update active state
        renderHistory(historyState, activeHistoryId);
        
        // Populate inputs
        document.getElementById('product-name').value = item.input.name;
        document.getElementById('product-category').value = item.input.category;
        document.getElementById('product-features').value = item.input.features;
        document.getElementById('product-tone').value = item.input.tone;
        
        // Populate results
        renderResults(item.result);
        
        // Remove error classes if any
        form.querySelectorAll('input, textarea, select').forEach(f => f.classList.remove('invalid-field'));
        errorMessage.classList.add('hidden');
    }

    // Mock API Function
    function simulateAIRequest(data, fail = false) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (fail) {
                    reject(new Error('Възникна грешка при свързването със сървъра (AI API). Моля, опитайте отново.'));
                    return;
                }
                
                const toneMap = {
                    "продаващ": "възползвайте се от",
                    "професионален": "отличава се с",
                    "приятелски": "ще се влюбите в",
                    "забавен": "подгответе се за",
                    "луксозен": "ексклузивно изживяване с"
                };
                
                const hook = toneMap[data.tone] || "открийте";

                resolve({
                    shortDescription: `Това е изключителен продукт от категория "${data.category}". ${data.name} е създаден специално за вашите нужди и ${hook} неговите уникални качества.`,
                    
                    longDescription: `Представяме ви **${data.name}** – перфектното решение в категория "${data.category}". Съобразен изцяло с вашия стил, този продукт впечатлява със своите характеристики: ${data.features}.\n\nНие сме сигурни, че ще ${hook} този невероятен продукт, създаден с внимание към детайла и фокусиран върху това да ви достави максимално удовлетворение. Поръчайте сега и усетете разликата!`,
                    
                    highlights: `- Невероятен дизайн за **${data.name}**\n- Ключови характеристики: ${data.features}\n- Принадлежи към категория: ${data.category}\n- Висококачествена изработка`
                });
            }, 2500); // 2.5 second simulated delay
        });
    }
});
