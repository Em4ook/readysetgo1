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

            // Success: Parse and Render
            // Remove placeholder styling
            [shortDescContainer, longDescContainer, highlightsContainer].forEach(el => {
                el.classList.remove('placeholder-content');
            });

            // Parse simple markdown (e.g., bullet points and bold)
            const parseMarkdown = (text) => {
                if(!text) return '';
                // Simple bold
                let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                // Simple newlines to <br> for plain text areas
                return html;
            };
            
            const parseList = (text) => {
                if(!text) return '';
                const items = text.split('\n').filter(i => i.trim().length > 0);
                return '<ul>' + items.map(item => `<li>${parseMarkdown(item.replace(/^[-*]\s*/, ''))}</li>`).join('') + '</ul>';
            };

            shortDescContainer.innerHTML = parseMarkdown(response.shortDescription);
            longDescContainer.innerHTML = parseMarkdown(response.longDescription);
            highlightsContainer.innerHTML = parseList(response.highlights);
            
            showToast('Успешно генерирано!', 'success');

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
