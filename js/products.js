document.addEventListener('DOMContentLoaded', function() {
    class ProductManager {
        constructor() {
            this.products = JSON.parse(localStorage.getItem('products')) || [];
            this.form = document.getElementById('productForm');
            this.tableBody = document.getElementById('productTableBody');
            this.searchInput = document.querySelector('.search-input');
            this.imageInput = document.querySelector('input[type="file"]');
            this.imagePreview = document.querySelector('.image-preview');
            this.bindEvents();
            this.bindImageEvents();
            this.renderProducts();
            this.updateStats();
        }

        bindEvents() {
            // Form submission
            this.form.addEventListener('submit', this.handleFormSubmission.bind(this));

            // Search functionality
            this.searchInput?.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                this.filterProducts(query);
            });

            // Table actions
            this.tableBody.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;
                
                const row = btn.closest('tr');
                const id = row.dataset.id;

                if (btn.classList.contains('edit-btn')) this.editProduct(id);
                if (btn.classList.contains('delete-btn')) this.deleteProduct(id);
            });
        }

        bindImageEvents() {
            const imageInput = document.getElementById('imageInput');
            const fileNameDisplay = document.querySelector('.selected-file-name');
            const hiddenInput = document.querySelector('input[name="image"]');

            imageInput?.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    fileNameDisplay.textContent = file.name;
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        hiddenInput.value = e.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        validateProduct(product) {
            if (!product.name?.trim() || !product.category) {
                alert('Name and category are required');
                return false;
            }
            if (isNaN(product.price) || product.price < 0) {
                alert('Please enter a valid price');
                return false;
            }
            if (isNaN(product.stock) || product.stock < 0) {
                alert('Please enter a valid stock quantity');
                return false;
            }
            
            // Check for duplicate names only when adding new product
            const form = document.getElementById('productForm');
            const isEditing = form.dataset.editing;
            
            if (!isEditing) {
                const isDuplicate = this.products.some(p => 
                    p.name.toLowerCase() === product.name.toLowerCase()
                );
                
                if (isDuplicate) {
                    alert('A product with this name already exists');
                    return false;
                }
            }
            
            return true;
        }

        addProduct(productData) {
            try {
                // Check for duplicates again before adding
                if (this.products.some(p => p.name.toLowerCase() === productData.name.toLowerCase())) {
                    alert('Product already exists');
                    return false;
                }
                
                const product = {
                    id: Date.now().toString(),
                    ...productData,
                    dateAdded: new Date().toISOString()
                };
                
                this.products.unshift(product);
                this.saveData();
                this.renderProducts();
                this.updateStats(); // Add stats update
                return true;
            } catch (error) {
                console.error('Error adding product:', error);
                return false;
            }
        }

        editProduct(id) {
            try {
                const product = this.products.find(p => p.id === id);
                if (!product) throw new Error('Product not found');

                const form = document.getElementById('productForm');
                
                // Set form to editing mode
                form.dataset.editing = id;
                
                // Populate form fields
                form.name.value = product.name;
                form.category.value = product.category;
                form.price.value = product.price;
                form.stock.value = product.stock;
                
                // Handle image
                const hiddenImageInput = form.querySelector('input[name="image"]');
                const fileNameDisplay = form.querySelector('.selected-file-name');
                
                if (product.image) {
                    hiddenImageInput.value = product.image;
                    fileNameDisplay.textContent = 'Current image selected';
                } else {
                    hiddenImageInput.value = '';
                    fileNameDisplay.textContent = '';
                }
                
                // Update submit button and scroll to form
                const submitBtn = form.querySelector('button[type="submit"]');
                submitBtn.textContent = 'Update Product';
                form.scrollIntoView({ behavior: 'smooth' });

                console.log('Product loaded for editing:', product);
            } catch (error) {
                console.error('Error editing product:', error);
                alert('Failed to load product for editing');
            }
        }

        updateProduct(formData) {
            try {
                const form = document.getElementById('productForm');
                const id = form.dataset.editing;
                
                if (!id) return false;
    
                const index = this.products.findIndex(p => p.id === id);
                if (index === -1) return false;
    
                // Update product while preserving critical data
                this.products[index] = {
                    ...this.products[index],           // Keep existing data
                    name: formData.name,
                    category: formData.category,
                    price: formData.price,
                    stock: formData.stock,
                    image: formData.image || this.products[index].image,
                    lastUpdated: new Date().toISOString(),
                    id: id                             // Ensure ID is preserved
                };
    
                this.saveData();
                return true;
            } catch (error) {
                console.error('Error updating product:', error);
                return false;
            }
        }

        deleteProduct(id) {
            if (!confirm('Are you sure?')) return;
            this.products = this.products.filter(p => p.id !== id);
            this.saveData();
            this.renderProducts();
            this.updateStats(); // Add stats update
        }

        filterProducts(query) {
            const filtered = this.products.filter(p => 
                p.name.toLowerCase().includes(query) ||
                p.category.toLowerCase().includes(query)
            );
            this.renderProducts(filtered);
        }

        formatPrice(price) {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR'
            }).format(price);
        }

        saveData() {
            localStorage.setItem('products', JSON.stringify(this.products));
        }

        renderProducts(products = this.products) {
            this.tableBody.innerHTML = products.map(p => `
                <tr data-id="${p.id}">
                    <td class="product-image-cell">
                        <div class="product-image-container">
                            <img src="${p.image}" 
                                 alt="${p.name}" 
                                 class="product-image"
                                 onerror="this.src='placeholder.jpg'">
                        </div>
                        <span class="product-name">${p.name}</span>
                    </td>
                    <td>${p.category}</td>
                    <td>${this.formatPrice(p.price)}</td>
                    <td>${p.stock}</td>
                    <td>
                        <button class="action-btn edit-btn">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        updateStats() {
            try {
                // Get yesterday's date
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);

                const stats = {
                    totalProducts: {
                        current: this.products.length,
                        yesterday: this.products.filter(p => new Date(p.dateAdded) < today && new Date(p.dateAdded) >= yesterday).length
                    },
                    lowStock: {
                        current: this.products.filter(p => p.stock <= 10).length,
                        yesterday: this.products.filter(p => 
                            p.stock <= 10 && 
                            new Date(p.dateAdded) < today && 
                            new Date(p.dateAdded) >= yesterday
                        ).length
                    },
                    totalValue: {
                        current: this.products.reduce((sum, p) => sum + (p.price * p.stock), 0),
                        yesterday: this.products
                            .filter(p => new Date(p.dateAdded) < today && new Date(p.dateAdded) >= yesterday)
                            .reduce((sum, p) => sum + (p.price * p.stock), 0)
                    }
                };

                // Calculate percentage changes
                const calculateChange = (current, yesterday) => {
                    if (yesterday === 0) {
                        if (current === 0) return '0% from yesterday';
                        return '100% from yesterday';
                    }
                    const percentChange = ((current - yesterday) / yesterday * 100).toFixed(1);
                    const trend = current >= yesterday ? 'up' : 'down';
                    return {
                        text: `${Math.abs(percentChange)}% from yesterday`,
                        trend: trend
                    };
                };

                // Update stats display
                const elements = {
                    totalProducts: {
                        value: document.querySelector('[data-stat="total-products"]'),
                        change: document.querySelector('[data-stat="monthly-change"]')
                    },
                    lowStock: {
                        value: document.querySelector('[data-stat="low-stock"]'),
                        change: document.querySelector('[data-stat="low-stock"]').nextElementSibling
                    },
                    totalValue: {
                        value: document.querySelector('[data-stat="total-value"]'),
                        change: document.querySelector('[data-stat="total-value"]').nextElementSibling
                    }
                };

                // Update total products
                const totalChange = calculateChange(stats.totalProducts.current, stats.totalProducts.yesterday);
                elements.totalProducts.value.textContent = stats.totalProducts.current;
                elements.totalProducts.change.textContent = totalChange.text;
                elements.totalProducts.change.setAttribute('data-trend', totalChange.trend);

                // Update low stock
                const lowChange = calculateChange(stats.lowStock.current, stats.lowStock.yesterday);
                elements.lowStock.value.textContent = stats.lowStock.current;
                elements.lowStock.change.textContent = lowChange.text;
                elements.lowStock.change.setAttribute('data-trend', lowChange.trend);

                // Update total value
                const valueChange = calculateChange(stats.totalValue.current, stats.totalValue.yesterday);
                elements.totalValue.value.textContent = this.formatPrice(stats.totalValue.current);
                elements.totalValue.change.textContent = valueChange.text;
                elements.totalValue.change.setAttribute('data-trend', valueChange.trend);

                // Add trend icons
                document.querySelectorAll('[data-trend]').forEach(element => {
                    const trend = element.getAttribute('data-trend');
                    if (trend === 'up' || trend === 'down') {
                        element.innerHTML = `
                            <i class="fas fa-arrow-${trend} mr-1"></i>
                            ${element.textContent}
                        `;
                    }
                });

            } catch (error) {
                console.error('Error updating stats:', error);
            }
        }

        updateTrendIndicators(stats) {
            const updateTrend = (element, current, yesterday) => {
                if (!element) return;
                
                const trend = current > yesterday ? 'up' : current < yesterday ? 'down' : '';
                if (trend) {
                    element.setAttribute('data-trend', trend);
                    element.innerHTML = `
                        <i class="fas fa-arrow-${trend} mr-1"></i>
                        ${element.textContent}
                    `;
                }
            };

            // Update trend indicators for each stat
            updateTrend(
                document.querySelector('[data-stat="monthly-change"]'),
                stats.totalProducts.current,
                stats.totalProducts.yesterday
            );

            updateTrend(
                document.querySelector('[data-stat="low-stock"]').nextElementSibling,
                stats.lowStock.current,
                stats.lowStock.yesterday
            );

            updateTrend(
                document.querySelector('[data-stat="total-value"]').nextElementSibling,
                stats.totalValue.current,
                stats.totalValue.yesterday
            );
        }

        handleFormSubmission(e) {
            e.preventDefault();
            
            try {
                const form = e.target;
                const formData = {
                    name: form.name.value.trim(),
                    category: form.category.value,
                    price: parseFloat(form.price.value),
                    stock: parseInt(form.stock.value),
                    image: form.querySelector('input[name="image"]').value || null
                };

                // Validate form data
                if (!this.validateProduct(formData)) {
                    return;
                }

                const isEditing = form.dataset.editing;
                let success = false;

                if (isEditing) {
                    const productId = form.dataset.editing;
                    const index = this.products.findIndex(p => p.id === productId);
                    
                    if (index === -1) {
                        throw new Error('Product not found');
                    }

                    // Update existing product
                    this.products[index] = {
                        ...this.products[index], // Keep existing data
                        name: formData.name,
                        category: formData.category,
                        price: formData.price,
                        stock: formData.stock,
                        image: formData.image || this.products[index].image,
                        lastUpdated: new Date().toISOString()
                    };

                    success = true;
                } else {
                    // Add new product
                    const newProduct = {
                        id: Date.now().toString(),
                        ...formData,
                        dateAdded: new Date().toISOString()
                    };
                    
                    this.products.unshift(newProduct);
                    success = true;
                }

                if (success) {
                    // Save data
                    this.saveData();
                    
                    // Reset form
                    form.reset();
                    form.querySelector('.selected-file-name').textContent = '';
                    form.querySelector('button[type="submit"]').textContent = 'Add Product';
                    delete form.dataset.editing;
                    
                    // Update UI
                    this.renderProducts();
                    this.updateStats();
                    
                    // Show success message
                    alert(isEditing ? 'Product updated successfully' : 'Product added successfully');
                }
            } catch (error) {
                console.error('Error handling form submission:', error);
                alert('An error occurred. Please try again.');
            }
        }

        setupEventListeners() {
            const form = document.getElementById('productForm');
            form.addEventListener('submit', this.handleFormSubmission.bind(this));

            this.tableBody.addEventListener('click', (e) => {
                const btn = e.target.closest('.action-btn');
                if (!btn) return;

                const tr = btn.closest('tr');
                const id = tr.dataset.id;

                if (btn.classList.contains('edit-btn')) {
                    this.editProduct(id);
                } else if (btn.classList.contains('delete-btn')) {
                    this.deleteProduct(id);
                }
            });
        }
    }

    new ProductManager();
});
