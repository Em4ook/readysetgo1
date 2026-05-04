document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('product-form');
    const errorMessage = document.getElementById('error-message');

    form.addEventListener('submit', (e) => {
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

        // Create data object
        const productData = {
            name: productName,
            category: productCategory,
            features: productFeatures,
            tone: productTone,
            timestamp: new Date().toISOString()
        };

        // Log to console as required by Task 01
        console.log('✅ Успешно събрани данни от формата:', productData);
        console.log('Готови за изпращане към AI API в следващата задача.');
        
        // Visual feedback on the button
        const btn = document.getElementById('generate-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="btn-text">Данните са събрани (виж конзолата)</span><span class="btn-icon">✅</span>';
        btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
        }, 3000);
    });
});
