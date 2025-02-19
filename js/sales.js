document.addEventListener('DOMContentLoaded', function() {
    class SalesManager {
        constructor() {
            this.sales = JSON.parse(localStorage.getItem('sales')) || [];
            this.products = JSON.parse(localStorage.getItem('products')) || [];
            this.form = document.getElementById('salesForm');
            this.tableBody = document.getElementById('salesTableBody');
            this.productSelect = document.querySelector('.product-select');
            this.initializeForm();
            this.setupEventListeners();
            this.renderSales();
            this.updateStats();
        }

        initializeForm() {
            // Populate product dropdown with improved UI
            this.productSelect.innerHTML = `
                <option value="">Select a product</option>
                ${this.products.map(p => {
                    const stockStatus = this.getStockStatus(p.stock);
                    return `
                        <option value="${p.id}" 
                                data-price="${p.price}" 
                                data-stock="${p.stock}"
                                ${p.stock <= 0 ? 'disabled' : ''}
                                class="product-option ${stockStatus.class}"
                        >
                            ${p.name} 
                            <span class="price-tag">₹${p.price.toLocaleString('en-IN')}</span>
                            <span class="stock-tag">[${p.stock}]</span>
                            ${stockStatus.badge}
                        </option>
                    `;
                }).join('')}
            `;

            // Add enhanced styles for the dropdown
            const style = document.createElement('style');
            style.textContent = `
                .product-select {
                    padding: 0.875rem 1rem;
                    border: 2px solid var(--gray-200);
                    border-radius: 0.75rem;
                    font-size: 1rem;
                    width: 100%;
                    min-width: 300px;
                    background: white;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 1rem center;
                    background-size: 1.5em 1.5em;
                }

                .product-select:hover {
                    border-color: var(--primary);
                }

                .product-select:focus {
                    border-color: var(--primary);
                    box-shadow: 0 0 0 3px var(--primary-light);
                    outline: none;
                }

                .product-select option {
                    padding: 1rem;
                    margin: 0.5rem;
                    border-radius: 0.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .product-select option:not(:disabled) {
                    background: white;
                }

                .product-select option:disabled {
                    background: var(--gray-50);
                    color: var(--gray-400);
                    font-style: italic;
                }

                .price-tag {
                    display: inline-block;
                    padding: 0.25rem 0.75rem;
                    background: var(--primary-light);
                    color: var(--primary);
                    border-radius: 1rem;
                    font-weight: 500;
                    margin: 0 0.5rem;
                    letter-spacing: 0.02em;
                }

                .stock-tag {
                    display: inline-block;
                    padding: 0.25rem 0.75rem;
                    background: var(--gray-100);
                    color: var(--gray-600);
                    border-radius: 1rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    margin-left: 0.5rem;
                    letter-spacing: 0.02em;
                }

                .stock-badge {
                    float: right;
                    padding: 0.25rem 0.75rem;
                    border-radius: 1rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    margin-left: auto;
                }

                .stock-badge.warning {
                    background: #FEF3C7;
                    color: #92400E;
                }

                .stock-badge.critical {
                    background: #FECACA;
                    color: #991B1B;
                }

                .stock-badge.out {
                    background: #F3F4F6;
                    color: #6B7280;
                }

                /* Add hover effects */
                .product-select option:hover:not(:disabled) {
                    background: var(--gray-50);
                }

                /* First option styling */
                .product-select option:first-child {
                    font-weight: 500;
                    color: var(--gray-400);
                    border-bottom: 1px solid var(--gray-200);
                }
            `;
            document.head.appendChild(style);
        }

        getStockStatus(stock) {
            if (stock === 0) {
                return {
                    class: 'out-of-stock',
                    badge: '<span class="stock-badge out">Out of Stock</span>'
                };
            }
            if (stock <= 5) {
                return {
                    class: 'critical-stock',
                    badge: '<span class="stock-badge critical">Very Low Stock</span>'
                };
            }
            if (stock <= 10) {
                return {
                    class: 'low-stock',
                    badge: '<span class="stock-badge warning">Low Stock</span>'
                };
            }
            return {
                class: 'normal-stock',
                badge: ''
            };
        }

        setupEventListeners() {
            // Form submission
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSale();
            });

            // Delete and edit handlers
            this.tableBody.addEventListener('click', (e) => {
                const salesId = e.target.closest('tr')?.dataset.id;
                if (!salesId) return;

                if (e.target.closest('.delete-btn')) {
                    this.deleteSale(salesId);
                }
                if (e.target.closest('.edit-btn')) {
                    this.editSale(salesId);
                }
            });
        }

        handleSale() {
            try {
                const formData = new FormData(this.form);
                const productId = formData.get('product');
                const quantity = parseInt(formData.get('quantity'));
                
                const product = this.products.find(p => p.id.toString() === productId);
                if (!product) {
                    this.showError('Product not found');
                    return;
                }

                if (product.stock < quantity) {
                    this.showError(`Only ${product.stock} units available`);
                    return;
                }

                const saleAmount = parseFloat(product.price) * quantity;
                
                const sale = {
                    id: Date.now().toString(),
                    productId: product.id,
                    productName: product.name,
                    quantity: quantity,
                    amount: saleAmount,
                    price: parseFloat(product.price),
                    date: new Date().toISOString()
                };

                // Update stock
                product.stock -= quantity;
                this.products = this.products.map(p => 
                    p.id === product.id ? product : p
                );
                localStorage.setItem('products', JSON.stringify(this.products));

                // Save sale
                this.sales.unshift(sale);
                localStorage.setItem('sales', JSON.stringify(this.sales));

                // Update UI
                this.form.reset();
                this.renderSales();
                this.updateStats();
                this.showSuccess('Sale recorded successfully');

            } catch (error) {
                console.error('Error handling sale:', error);
                this.showError('Failed to process sale');
            }
        }

        renderSales() {
            this.tableBody.innerHTML = this.sales.map(sale => `
                <tr data-id="${sale.id}">
                    <td>${sale.productName}</td>
                    <td>${sale.quantity}</td>
                    <td>${this.formatPrice(sale.amount)}</td>
                    <td>
                        <div class="date-time">
                            <span class="date">${this.formatDate(sale.date)}</span>
                            <span class="time">${this.formatTime(sale.date)}</span>
                        </div>
                    </td>
                    <td class="action-cell">
                        <div class="action-buttons">
                            <button class="action-btn edit-btn">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete-btn">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        updateStats() {
            try {
                // Get today and yesterday dates
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);

                // Calculate stats for today and yesterday
                const todaySales = this.sales.filter(sale => new Date(sale.date) >= today);
                const yesterdaySales = this.sales.filter(sale => {
                    const saleDate = new Date(sale.date);
                    return saleDate >= yesterday && saleDate < today;
                });

                // Calculate totals
                const stats = {
                    total: {
                        amount: this.sales.reduce((sum, sale) => sum + (sale.amount || 0), 0),
                        today: todaySales.reduce((sum, sale) => sum + (sale.amount || 0), 0),
                        yesterday: yesterdaySales.reduce((sum, sale) => sum + (sale.amount || 0), 0)
                    },
                    items: {
                        total: this.sales.reduce((sum, sale) => sum + (sale.quantity || 0), 0),
                        today: todaySales.reduce((sum, sale) => sum + (sale.quantity || 0), 0),
                        yesterday: yesterdaySales.reduce((sum, sale) => sum + (sale.quantity || 0), 0)
                    }
                };

                // Calculate percentage changes
                const calculateChange = (current, previous) => {
                    if (previous === 0) {
                        return current > 0 ? '+100' : '0';
                    }
                    const change = ((current - previous) / previous * 100).toFixed(1);
                    return change >= 0 ? `+${change}` : change;
                };

                // Update UI elements - with error checking
                const totalSalesElement = document.querySelector('[data-stat="total-sales"]');
                const itemsSoldElement = document.querySelector('[data-stat="items-sold"]');

                if (totalSalesElement) {
                    totalSalesElement.textContent = this.formatPrice(stats.total.amount);
                    const totalSalesChange = totalSalesElement.nextElementSibling;
                    if (totalSalesChange) {
                        const changeValue = calculateChange(stats.total.today, stats.total.yesterday);
                        totalSalesChange.textContent = `${changeValue}% from yesterday`;
                        this.updateTrendIndicator(totalSalesChange, changeValue);
                    }
                }

                if (itemsSoldElement) {
                    itemsSoldElement.textContent = stats.items.total;
                    const itemsSoldChange = itemsSoldElement.nextElementSibling;
                    if (itemsSoldChange) {
                        const changeValue = calculateChange(stats.items.today, stats.items.yesterday);
                        itemsSoldChange.textContent = `${changeValue}% from yesterday`;
                        this.updateTrendIndicator(itemsSoldChange, changeValue);
                    }
                }

                // Update top product
                const topProduct = this.getTopProduct();
                if (topProduct) {
                    const topProductElement = document.querySelector('[data-stat="top-product-sales"]');
                    const topProductName = document.querySelector('[data-stat="top-product-name"]');
                    
                    if (topProductElement && topProductName) {
                        topProductElement.textContent = this.formatPrice(topProduct.totalAmount);
                        topProductName.textContent = `${topProduct.name} (${topProduct.quantity} units)`;
                    }
                }

            } catch (error) {
                console.error('Error updating stats:', error);
                // Don't show error to user, just log it
            }
        }

        updateTrendIndicator(element, value) {
            if (!element) return;
            
            element.classList.remove('trend-up', 'trend-down', 'trend-neutral');
            const numericValue = parseFloat(value);
            
            if (numericValue > 0) {
                element.classList.add('trend-up');
                element.innerHTML = `<i class="fas fa-arrow-up"></i> ${element.textContent}`;
            } else if (numericValue < 0) {
                element.classList.add('trend-down');
                element.innerHTML = `<i class="fas fa-arrow-down"></i> ${element.textContent}`;
            } else {
                element.classList.add('trend-neutral');
            }
        }

        getTopProduct() {
            try {
                // Group sales by product
                const productSales = this.sales.reduce((acc, sale) => {
                    const productId = sale.productId;
                    if (!acc[productId]) {
                        acc[productId] = {
                            id: productId,
                            name: sale.productName,
                            totalAmount: 0,
                            quantity: 0,
                            transactions: 0
                        };
                    }
                    
                    acc[productId].totalAmount += parseFloat(sale.amount) || 0;
                    acc[productId].quantity += parseInt(sale.quantity) || 0;
                    acc[productId].transactions += 1;
                    
                    return acc;
                }, {});

                // Find product with highest total sales amount
                const topProduct = Object.values(productSales)
                    .sort((a, b) => b.totalAmount - a.totalAmount)[0];

                return topProduct || null;
            } catch (error) {
                console.error('Error calculating top product:', error);
                return null;
            }
        }

        deleteSale(saleId) {
            const sale = this.sales.find(s => s.id.toString() === saleId);
            if (!sale) return;

            // Restore stock
            const product = this.products.find(p => p.id === sale.productId);
            if (product) {
                product.stock += sale.quantity;
                localStorage.setItem('products', JSON.stringify(this.products));
            }

            // Remove sale
            this.sales = this.sales.filter(s => s.id.toString() !== saleId);
            localStorage.setItem('sales', JSON.stringify(this.sales));

            this.renderSales();
            this.updateStats();
            this.showSuccess('Sale deleted successfully');
        }

        formatPrice(amount) {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR'
            }).format(amount);
        }

        formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }

        formatTime(dateString) {
            return new Date(dateString).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        showSuccess(message) {
            // Implement toast notification
            alert(message); // Temporary
        }

        showError(message) {
            // Implement error notification
            alert(message); // Temporary
        }
    }

    // Initialize Sales Manager
    const salesManager = new SalesManager();
    // Make salesManager globally accessible
    window.salesManager = salesManager;
});

// Add styles to document
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateX(-10px); }
        to { opacity: 1; transform: translateX(0); }
    }

    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }

    .product-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .product-id {
        font-size: 0.75rem;
        color: var(--gray-500);
    }

    .quantity-badge {
        background: var(--primary-light);
        color: var(--primary);
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-weight: 500;
    }

    .amount {
        font-weight: 600;
        color: var(--gray-800);
    }

    .action-buttons {
        display: flex;
        gap: 0.5rem;
        opacity: 0.7;
        transition: opacity 0.2s;
    }

    tr:hover .action-buttons {
        opacity: 1;
    }

    .pulse {
        animation: pulse 0.3s ease-in-out;
    }
`;

document.head.appendChild(style);