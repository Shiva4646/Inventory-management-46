const sampleData = {
    products: [
        { id: 1, name: 'Product 1', stock: 15, price: 1000, category: 'Electronics' },
        { id: 2, name: 'Product 2', stock: 5, price: 2000, category: 'Electronics' },
        { id: 3, name: 'Product 3', stock: 25, price: 1500, category: 'Clothing' }
    ],
    sales: [
        { id: 1, productName: 'Product 1', amount: 2000, quantity: 2, date: new Date().toISOString() },
        { id: 2, productName: 'Product 2', amount: 4000, quantity: 2, date: new Date(Date.now() - 86400000).toISOString() }
    ]
};

// Initialize sample data if not present
if (!localStorage.getItem('products')) {
    localStorage.setItem('products', JSON.stringify(sampleData.products));
}
if (!localStorage.getItem('sales')) {
    localStorage.setItem('sales', JSON.stringify(sampleData.sales));
}

class DashboardManager {
    constructor() {
        this.chartColors = {
            primary: '#0F766E',
            success: '#059669',
            warning: '#F59E0B',
            danger: '#DC2626',
            primaryLight: 'rgba(15, 118, 110, 0.1)'
        };

        // Initialize in this order
        this.initializeData();
        this.setupEventListeners();
        this.setupQuickActions(); // Make sure this is called
        this.renderDashboard();
    }

    initializeData() {
        try {
            // Load data from localStorage
            this.products = JSON.parse(localStorage.getItem('products')) || [];
            this.sales = JSON.parse(localStorage.getItem('sales')) || [];

            // Initialize with sample data if empty
            if (this.products.length === 0 && this.sales.length === 0) {
                this.initializeSampleData();
            }

            console.log('Data loaded successfully');
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    initializeSampleData() {
        const sampleData = {
            products: [
                { id: 1, name: 'Product 1', stock: 15, price: 1000, category: 'Electronics' },
                { id: 2, name: 'Product 2', stock: 5, price: 2000, category: 'Electronics' },
                { id: 3, name: 'Product 3', stock: 25, price: 1500, category: 'Clothing' }
            ],
            sales: [
                { 
                    id: 1, 
                    productId: 1,
                    productName: 'Product 1', 
                    amount: 2000, 
                    quantity: 2, 
                    date: new Date().toISOString() 
                },
                { 
                    id: 2, 
                    productId: 2,
                    productName: 'Product 2', 
                    amount: 4000, 
                    quantity: 2, 
                    date: new Date(Date.now() - 86400000).toISOString() 
                }
            ]
        };

        this.products = sampleData.products;
        this.sales = sampleData.sales;
        localStorage.setItem('products', JSON.stringify(this.products));
        localStorage.setItem('sales', JSON.stringify(this.sales));
    }

    setupEventListeners() {
        try {
            // Sales chart range selector
            const rangeSelector = document.getElementById('salesTrendRange');
            if (rangeSelector) {
                rangeSelector.addEventListener('change', (e) => {
                    const days = parseInt(e.target.value);
                    if (!isNaN(days)) {
                        this.updateSalesChart(days);
                    }
                });
            }

            // Add test data button (for development)
            const addTestBtn = document.getElementById('addTestData');
            if (addTestBtn) {
                addTestBtn.addEventListener('click', () => this.addTestSale());
            }

            // Auto refresh every 5 minutes
            setInterval(() => this.refreshDashboard(), 300000);

            // Listen for storage changes
            window.addEventListener('storage', (e) => {
                if (e.key === 'products' || e.key === 'sales') {
                    this.refreshDashboard();
                }
            });

            // Stock chart refresh button
            const refreshStockBtn = document.getElementById('refreshStockChart');
            if (refreshStockBtn) {
                refreshStockBtn.addEventListener('click', () => {
                    this.renderStockOverviewChart();
                    this.updateStockCounts();
                });
            }

            // Refresh activity feed every minute
            setInterval(() => this.renderRecentActivity(), 60000);

        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }

    setupQuickActions() {
        try {
            const quickActions = document.querySelectorAll('.quick-action-btn');
            if (!quickActions.length) {
                console.warn('No quick action buttons found');
                return;
            }

            quickActions.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const action = e.currentTarget.dataset.action;
                    console.log('Quick action clicked:', action);

                    switch(action) {
                        case 'addProduct':
                            window.location.href = 'products.html';
                            break;
                        case 'newSale':
                            window.location.href = 'sales.html';
                            break;
                        case 'viewReports':
                            window.location.href = 'reports.html';
                            break;
                        case 'manageInventory':
                            window.location.href = 'inventory.html'; // Updated this line
                            break;
                        default:
                            console.warn('Unknown action:', action);
                    }
                });
            });

            console.log('Quick actions initialized successfully');
        } catch (error) {
            console.error('Error setting up quick actions:', error);
            this.showError('Failed to initialize quick actions');
        }
    }

    refreshDashboard() {
        this.initializeData();
        this.renderDashboard();
    }

    renderDashboard() {
        try {
            console.log('Rendering dashboard...');
            const metrics = this.calculateMetrics();
            
            if (!metrics) {
                throw new Error('Failed to calculate metrics');
            }

            this.updateDashboardCards(metrics);
            this.renderSalesChart(); // Make sure this is called
            this.renderStockOverviewChart();
            this.renderTopProducts();
            this.renderRecentActivity();
            this.renderStockAlerts();

            console.log('Dashboard rendered successfully');
        } catch (error) {
            console.error('Error rendering dashboard:', error);
            this.showError('Failed to render dashboard');
        }
    }

    updateDashboardCards(metrics) {
        try {
            // Revenue Card
            const revenueCard = document.querySelector('#revenue-card');
            if (revenueCard) {
                revenueCard.innerHTML = `
                    <div class="flex items-center justify-between mb-4">
                        <span class="text-gray-500">Total Revenue</span>
                        <span class="bg-teal-100 text-teal-800 px-2 py-1 rounded-full text-xs">
                            ${metrics.sales.today} sales today
                        </span>
                    </div>
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-2xl font-bold text-gray-800">
                                ${this.formatCurrency(metrics.revenue.total)}
                            </h3>
                            <span class="text-sm ${metrics.revenue.growth >= 0 ? 'stat-trend-up' : 'stat-trend-down'}">
                                <i class="fas fa-arrow-${metrics.revenue.growth >= 0 ? 'up' : 'down'} mr-1"></i>
                                ${Math.abs(metrics.revenue.growth)}% from yesterday
                            </span>
                        </div>
                        <div class="bg-teal-100 p-3 rounded-lg">
                            <i class="fas fa-rupee-sign text-teal-600 text-xl"></i>
                        </div>
                    </div>
                `;
            }

            // Products Card
            const productsCard = document.getElementById('products-card');
            if (productsCard) {
                productsCard.innerHTML = `
                    <div class="flex items-center justify-between mb-4">
                        <span class="text-gray-500">Total Products</span>
                        <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">In Stock</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-2xl font-bold text-gray-800">${metrics.products.total}</h3>
                            <span class="text-sm text-gray-500">
                                <i class="fas fa-box mr-1"></i>
                                ${metrics.products.totalStock} units
                            </span>
                        </div>
                        <div class="bg-blue-100 p-3 rounded-lg">
                            <i class="fas fa-cube text-blue-600 text-xl"></i>
                        </div>
                    </div>
                `;
            }

            // Sales Card
            const salesCard = document.getElementById('sales-card');
            if (salesCard) {
                salesCard.innerHTML = `
                    <div class="flex items-center justify-between mb-4">
                        <span class="text-gray-500">Recent Sales</span>
                        <span class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Today</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-2xl font-bold text-gray-800">${metrics.sales.today}</h3>
                            <span class="text-sm ${metrics.sales.growth >= 0 ? 'stat-trend-up' : 'stat-trend-down'}">
                                <i class="fas fa-arrow-${metrics.sales.growth >= 0 ? 'up' : 'down'} mr-1"></i>
                                ${Math.abs(metrics.sales.growth)}% from yesterday
                            </span>
                        </div>
                        <div class="bg-green-100 p-3 rounded-lg">
                            <i class="fas fa-shopping-cart text-green-600 text-xl"></i>
                        </div>
                    </div>
                `;
            }

            // Stock Card
            const stockCard = document.getElementById('stock-card');
            if (stockCard) {
                stockCard.innerHTML = `
                    <div class="flex items-center justify-between mb-4">
                        <span class="text-gray-500">Low Stock Items</span>
                        <span class="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                            ${metrics.stock.criticalStock > 0 ? 'Critical' : 'Alert'}
                        </span>
                    </div>
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-2xl font-bold text-gray-800">${metrics.stock.lowStock}</h3>
                            <span class="text-sm text-red-500">
                                <i class="fas fa-exclamation-triangle mr-1"></i>
                                ${metrics.stock.criticalStock} critical
                            </span>
                        </div>
                        <div class="bg-red-100 p-3 rounded-lg">
                            <i class="fas fa-exclamation-circle text-red-600 text-xl"></i>
                        </div>
                    </div>
                `;
            }

            console.log('Dashboard cards updated successfully');
        } catch (error) {
            console.error('Error updating dashboard cards:', error);
            this.showError('Failed to update dashboard cards');
        }
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    updateTrendIndicator(id, isPositive) {
        const element = document.getElementById(id);
        if (!element) return;

        element.className = `text-sm ${isPositive ? 'stat-trend-up' : 'stat-trend-down'}`;
        const icon = element.querySelector('i');
        if (icon) {
            icon.className = `fas fa-arrow-${isPositive ? 'up' : 'down'} mr-1`;
        }
    }

    calculateMetrics() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const metrics = {
                revenue: this.calculateRevenueMetrics(today, yesterday),
                products: this.calculateProductMetrics(),
                sales: this.calculateSalesMetrics(today, yesterday),
                stock: this.calculateStockMetrics()
            };

            return metrics;
        } catch (error) {
            console.error('Error calculating metrics:', error);
            return null;
        }
    }

    calculateRevenueMetrics(today, yesterday) {
        const todaySales = this.sales.filter(sale => new Date(sale.date) >= today);
        const yesterdaySales = this.sales.filter(sale => new Date(sale.date) >= yesterday && new Date(sale.date) < today);

        return {
            total: this.sales.reduce((sum, sale) => sum + sale.amount, 0),
            today: todaySales.reduce((sum, sale) => sum + sale.amount, 0),
            yesterday: yesterdaySales.reduce((sum, sale) => sum + sale.amount, 0),
            growth: yesterdaySales.length ? 
                ((todaySales.reduce((sum, sale) => sum + sale.amount, 0) - 
                  yesterdaySales.reduce((sum, sale) => sum + sale.amount, 0)) / 
                 yesterdaySales.reduce((sum, sale) => sum + sale.amount, 0) * 100).toFixed(1) : 0
        };
    }

    calculateProductMetrics() {
        const criticalStock = this.products.filter(p => p.stock <= 5).length;
        const warningStock = this.products.filter(p => p.stock > 5 && p.stock <= 10).length;
        const totalStock = this.products.reduce((sum, p) => sum + p.stock, 0);
        const totalValue = this.products.reduce((sum, p) => sum + (p.price * p.stock), 0);

        const categories = this.products.reduce((acc, product) => {
            acc[product.category] = (acc[product.category] || 0) + 1;
            return acc;
        }, {});

        return {
            total: this.products.length,
            criticalStock,
            warningStock,
            totalStock,
            totalValue,
            categories
        };
    }

    calculateSalesMetrics(today, yesterday) {
        const todaySales = this.sales.filter(sale => new Date(sale.date) >= today);
        const yesterdaySales = this.sales.filter(sale => new Date(sale.date) >= yesterday && new Date(sale.date) < today);

        const productSales = this.sales.reduce((acc, sale) => {
            if (!acc[sale.productId]) {
                acc[sale.productId] = {
                    name: sale.productName,
                    revenue: 0,
                    quantity: 0
                };
            }
            acc[sale.productId].revenue += sale.amount;
            acc[sale.productId].quantity += sale.quantity;
            return acc;
        }, {});

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        return {
            total: this.sales.length,
            today: todaySales.length,
            yesterday: yesterdaySales.length,
            growth: yesterdaySales.length ? 
                ((todaySales.length - yesterdaySales.length) / yesterdaySales.length * 100).toFixed(1) : 0,
            averageValue: this.sales.length ? 
                this.sales.reduce((sum, sale) => sum + sale.amount, 0) / this.sales.length : 0,
            topProducts
        };
    }

    calculateStockMetrics() {
        const criticalStock = this.products.filter(p => p.stock <= 5).length;
        const warningStock = this.products.filter(p => p.stock > 5 && p.stock <= 10).length;

        return {
            lowStock: criticalStock + warningStock,
            criticalStock,
            warningStock,
            reorderNeeded: this.products.filter(p => p.stock <= 10).length
        };
    }

    renderCharts() {
        this.renderSalesChart();
        this.renderStockOverviewChart();
        this.renderCategoryChart();
    }

    getSalesChartData(days = 7) {
        try {
            const dates = [];
            const values = [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (let i = days - 1; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);

                // Format date based on range
                const dateLabel = date.toLocaleDateString('en-IN', {
                    weekday: days <= 7 ? 'short' : undefined,
                    day: days > 7 ? 'numeric' : undefined,
                    month: days > 7 ? 'short' : undefined
                });
                dates.push(dateLabel);

                // Get sales for this day
                const dayTotal = this.sales
                    .filter(sale => {
                        const saleDate = new Date(sale.date);
                        saleDate.setHours(0, 0, 0, 0);
                        return saleDate.getTime() === date.getTime();
                    })
                    .reduce((sum, sale) => sum + sale.amount, 0);

                values.push(dayTotal);
            }

            return { dates, values };
        } catch (error) {
            console.error('Error getting sales chart data:', error);
            return { dates: [], values: [] };
        }
    }

    renderSalesChart() {
        try {
            const ctx = document.getElementById('salesTrendChart')?.getContext('2d');
            if (!ctx) {
                console.error('Sales trend chart canvas not found');
                return;
            }

            // Destroy existing chart if it exists
            if (this.salesChart) {
                this.salesChart.destroy();
            }

            const { dates, values } = this.getSalesChartData();

            // Create gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(15, 118, 110, 0.2)');
            gradient.addColorStop(1, 'rgba(15, 118, 110, 0)');

            this.salesChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [{
                        label: 'Daily Sales',
                        data: values,
                        borderColor: this.chartColors.primary,
                        backgroundColor: gradient,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: this.chartColors.primary,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            callbacks: {
                                label: function(context) {
                                    return `Sales: ₹${context.parsed.y.toLocaleString()}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: {
                                    size: 12
                                }
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            },
                            ticks: {
                                callback: value => `₹${value.toLocaleString()}`,
                                font: {
                                    size: 12
                                }
                            }
                        }
                    }
                }
            });

            console.log('Sales chart rendered successfully');
        } catch (error) {
            console.error('Error rendering sales chart:', error);
            this.showError('Failed to render sales trend chart');
        }
    }

    renderCategoryChart() {
        const ctx = document.getElementById('categoryChart')?.getContext('2d');
        if (!ctx) return;

        const categoryData = this.getCategoryData();

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categoryData.labels,
                datasets: [{
                    data: categoryData.values,
                    backgroundColor: [
                        this.chartColors.primary,
                        this.chartColors.success,
                        this.chartColors.warning,
                        this.chartColors.danger
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    renderStockOverviewChart() {
        try {
            const ctx = document.getElementById('stockOverviewChart')?.getContext('2d');
            if (!ctx) return;

            if (this.stockChart) {
                this.stockChart.destroy();
            }

            const stockData = this.calculateStockLevels();
            
            // Get product names for each category
            const healthyNames = stockData.details.healthy.map(p => p.name).join(', ');
            const lowNames = stockData.details.low.map(p => p.name).join(', ');
            const criticalNames = stockData.details.critical.map(p => p.name).join(', ');

            this.stockChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Healthy Stock', 'Low Stock', 'Critical Stock'],
                    datasets: [{
                        data: [stockData.healthy, stockData.low, stockData.critical],
                        backgroundColor: [
                            this.chartColors.success,
                            this.chartColors.warning,
                            this.chartColors.danger
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                usePointStyle: true,
                                padding: 20,
                                font: { size: 12 }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const label = context.label || '';
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    let productNames = '';
                                    
                                    // Add product names based on category
                                    switch(label) {
                                        case 'Healthy Stock':
                                            productNames = healthyNames || 'No products';
                                            break;
                                        case 'Low Stock':
                                            productNames = lowNames || 'No products';
                                            break;
                                        case 'Critical Stock':
                                            productNames = criticalNames || 'No products';
                                            break;
                                    }

                                    return [
                                        `${label}: ${value} items (${percentage}%)`,
                                        `Products: ${productNames}`
                                    ];
                                }
                            }
                        }
                    }
                }
            });

            // Update the counters with product names
            document.getElementById('healthyStockCount').innerHTML = `
                ${stockData.healthy}<br>
                <span class="text-xs text-gray-500">${healthyNames || 'No products'}</span>
            `;
            document.getElementById('lowStockCount').innerHTML = `
                ${stockData.low}<br>
                <span class="text-xs text-gray-500">${lowNames || 'No products'}</span>
            `;
            document.getElementById('criticalStockCount').innerHTML = `
                ${stockData.critical}<br>
                <span class="text-xs text-gray-500">${criticalNames || 'No products'}</span>
            `;

        } catch (error) {
            console.error('Error rendering stock overview chart:', error);
            this.showError('Failed to render stock overview chart');
        }
    }

    updateStockLists(stockGroups) {
        try {
            // Update Healthy Stock List
            const healthyList = document.getElementById('healthyStockList');
            if (healthyList) {
                healthyList.innerHTML = this.generateStockList(stockGroups.healthy, 'text-green-600');
            }

            // Update Low Stock List
            const lowList = document.getElementById('lowStockList');
            if (lowList) {
                lowList.innerHTML = this.generateStockList(stockGroups.low, 'text-yellow-600');
            }

            // Update Critical Stock List
            const criticalList = document.getElementById('criticalStockList');
            if (criticalList) {
                criticalList.innerHTML = this.generateStockList(stockGroups.critical, 'text-red-600');
            }
        } catch (error) {
            console.error('Error updating stock lists:', error);
            this.showError('Failed to update stock lists');
        }
    }

    generateStockList(products, textColorClass) {
        if (!products.length) {
            return '<div class="text-center text-gray-500 py-2">No items</div>';
        }

        return products.map(product => `
            <div class="flex justify-between items-center py-2 px-3 hover:bg-gray-50 rounded-lg">
                <span class="font-medium text-gray-800">${product.name}</span>
                <span class="${textColorClass}">${product.stock} units</span>
            </div>
        `).join('');
    }

    renderTopProducts() {
        const container = document.getElementById('top-products');
        if (!container) return;

        const topProducts = this.getTopProducts();
        
        container.innerHTML = `
            <div class="bg-white rounded-xl shadow-md p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Top Products</h3>
                <div class="space-y-4">
                    ${topProducts.map(product => `
                        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p class="font-medium text-gray-900">${product.name}</p>
                                <p class="text-sm text-gray-500">${product.quantity} units sold</p>
                            </div>
                            <p class="font-medium text-teal-600">
                                ${this.formatCurrency(product.revenue)}
                            </p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderRecentTransactions() {
        const container = document.getElementById('recent-transactions');
        if (!container) return;

        const recentSales = this.sales
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        container.innerHTML = `
            <div class="bg-white rounded-xl shadow-md p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h3>
                <div class="space-y-4">
                    ${recentSales.map(sale => `
                        <div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p class="font-medium text-gray-900">${sale.productName}</p>
                                <p class="text-sm text-gray-500">
                                    ${this.formatDate(sale.date)}
                                </p>
                            </div>
                            <p class="font-medium text-teal-600">
                                ${this.formatCurrency(sale.amount)}
                            </p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderStockAlerts() {
        const container = document.getElementById('stock-alerts');
        if (!container) return;

        const lowStockItems = this.products
            .filter(p => p.stock <= 10)
            .sort((a, b) => a.stock - b.stock);

        container.innerHTML = `
            <div class="bg-white rounded-xl shadow-md p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Low Stock Alerts</h3>
                <div class="space-y-4">
                    ${lowStockItems.map(product => `
                        <div class="flex justify-between items-center p-4 
                            ${product.stock <= 5 ? 'bg-red-50' : 'bg-yellow-50'} rounded-lg">
                            <div>
                                <p class="font-medium text-gray-900">${product.name}</p>
                                <p class="text-sm ${product.stock <= 5 ? 'text-red-600' : 'text-yellow-600'}">
                                    ${product.stock} units left
                                </p>
                            </div>
                            <button onclick="dashboardManager.handleReorder('${product.id}')"
                                    class="px-3 py-1 text-sm text-teal-600 border border-teal-600 
                                           rounded hover:bg-teal-50">
                                Reorder
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderRecentActivity() {
        try {
            const container = document.querySelector('.lg\\:col-span-2 .space-y-3'); // Updated selector
            if (!container) {
                console.error('Recent activity container not found');
                return;
            }
    
            // Combine sales and stock changes into activities
            const activities = [];
    
            // Add sales activities
            this.sales.forEach(sale => {
                activities.push({
                    type: 'sale',
                    icon: 'fa-shopping-bag',
                    iconBg: 'bg-teal-100',
                    iconColor: 'text-teal-600',
                    title: 'New sale recorded',
                    description: `${sale.productName} - ${sale.quantity} units`,
                    date: new Date(sale.date)
                });
            });
    
            // Add low stock alerts
            this.products
                .filter(product => product.stock <= 5)
                .forEach(product => {
                    activities.push({
                        type: 'alert',
                        icon: 'fa-exclamation-triangle',
                        iconBg: 'bg-red-100',
                        iconColor: 'text-red-600',
                        title: 'Low stock alert',
                        description: `${product.name} - ${product.stock} units left`,
                        date: new Date() // Current date for alerts
                    });
                });
    
            // Sort activities by date (most recent first) and take last 4
            const recentActivities = activities
                .sort((a, b) => b.date - a.date)
                .slice(0, 4);
    
            if (recentActivities.length === 0) {
                container.innerHTML = `
                    <div class="text-center text-gray-500 py-4">
                        No recent activity
                    </div>
                `;
                return;
            }
    
            container.innerHTML = recentActivities.map(activity => `
                <div class="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div class="${activity.iconBg} p-2 rounded-full mr-3">
                        <i class="fas ${activity.icon} ${activity.iconColor}"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-800">${activity.title}</p>
                        <p class="text-xs text-gray-500">${activity.description}</p>
                    </div>
                    <span class="ml-2 text-xs text-gray-500">${this.formatTimeAgo(activity.date)}</span>
                </div>
            `).join('');
    
        } catch (error) {
            console.error('Error rendering recent activity:', error);
            this.showError('Failed to update recent activity');
        }
    }
    
    // Add this utility method for formatting time differences
    formatTimeAgo(date) {
        try {
            const now = new Date();
            const diffInSeconds = Math.floor((now - date) / 1000);
    
            if (diffInSeconds < 60) {
                return 'Just now';
            } else if (diffInSeconds < 3600) {
                const minutes = Math.floor(diffInSeconds / 60);
                return `${minutes} ${minutes === 1 ? 'min' : 'mins'} ago`;
            } else if (diffInSeconds < 86400) {
                const hours = Math.floor(diffInSeconds / 3600);
                return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
            } else {
                const days = Math.floor(diffInSeconds / 86400);
                return `${days} ${days === 1 ? 'day' : 'days'} ago`;
            }
        } catch (error) {
            console.error('Error formatting time:', error);
            return 'Unknown time';
        }
    }

    // Utility methods...
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    createGradient(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(15, 118, 110, 0.2)');
        gradient.addColorStop(1, 'rgba(15, 118, 110, 0)');
        return gradient;
    }

    getChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `Sales: ${this.formatCurrency(context.parsed.y)}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => this.formatCurrency(value)
                    }
                }
            }
        };
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded';
        errorDiv.innerHTML = `
            <strong class="font-bold">Error!</strong>
            <span class="block sm:inline">${message}</span>
        `;
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }

    getSalesData() {
        try {
            const dates = [];
            const values = [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Get last 7 days of sales
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);

                // Format date for display
                dates.push(date.toLocaleDateString('en-IN', { weekday: 'short' }));

                // Calculate total sales for this day
                const dayTotal = this.sales
                    .filter(sale => {
                        const saleDate = new Date(sale.date);
                        saleDate.setHours(0, 0, 0, 0);
                        return saleDate.getTime() === date.getTime();
                    })
                    .reduce((sum, sale) => sum + sale.amount, 0);

                values.push(dayTotal);
            }

            return { labels: dates, values };
        } catch (error) {
            console.error('Error getting sales data:', error);
            return { labels: [], values: [] };
        }
    }

    getCategoryData() {
        try {
            const categories = {};
            this.products.forEach(product => {
                categories[product.category] = (categories[product.category] || 0) + 1;
            });

            return {
                labels: Object.keys(categories),
                values: Object.values(categories)
            };
        } catch (error) {
            console.error('Error getting category data:', error);
            return { labels: [], values: [] };
        }
    }

    getTopProducts() {
        try {
            const productSales = {};
            
            // Calculate sales for each product
            this.sales.forEach(sale => {
                if (!productSales[sale.productId]) {
                    productSales[sale.productId] = {
                        name: sale.productName,
                        quantity: 0,
                        revenue: 0
                    };
                }
                productSales[sale.productId].quantity += sale.quantity;
                productSales[sale.productId].revenue += sale.amount;
            });

            // Sort by revenue and get top 5
            return Object.values(productSales)
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5);
        } catch (error) {
            console.error('Error getting top products:', error);
            return [];
        }
    }

    updateSalesChart(days) {
        try {
            if (!this.salesChart) {
                console.error('Sales chart not initialized');
                return;
            }

            const { dates, values } = this.getSalesChartData(days);
            
            this.salesChart.data.labels = dates;
            this.salesChart.data.datasets[0].data = values;
            this.salesChart.update('none');

            console.log('Sales chart updated successfully');
        } catch (error) {
            console.error('Error updating sales chart:', error);
            this.showError('Failed to update sales trend chart');
        }
    }

    // Add this helper method for testing
    addTestSale() {
        try {
            const sale = {
                id: Date.now(),
                productId: 1,
                productName: 'Test Product',
                amount: Math.floor(Math.random() * 5000) + 1000,
                quantity: Math.floor(Math.random() * 5) + 1,
                date: new Date().toISOString()
            };

            this.sales.push(sale);
            localStorage.setItem('sales', JSON.stringify(this.sales));
            this.refreshDashboard();
            
            console.log('Test sale added successfully');
        } catch (error) {
            console.error('Error adding test sale:', error);
        }
    }

    // Add this new method to update stock counts
    updateStockCounts() {
        try {
            const stockLevels = {
                healthy: this.products.filter(p => p.stock > 10),
                low: this.products.filter(p => p.stock > 5 && p.stock <= 10),
                critical: this.products.filter(p => p.stock <= 5)
            };

            // Update counts
            this.updateElement('healthyStockCount', stockLevels.healthy.length);
            this.updateElement('lowStockCount', stockLevels.low.length);
            this.updateElement('criticalStockCount', stockLevels.critical.length);

            // Update product names
            const updateNames = (elementId, products) => {
                const element = document.getElementById(elementId);
                if (element) {
                    element.innerHTML = products.length ? products
                        .map(p => `<div class="py-1">${p.name} (${p.stock})</div>`)
                        .join('') : '<div class="py-1">No items</div>';
                }
            };

            updateNames('healthyStockNames', stockLevels.healthy);
            updateNames('lowStockNames', stockLevels.low);
            updateNames('criticalStockNames', stockLevels.critical);

        } catch (error) {
            console.error('Error updating stock counts:', error);
            this.showError('Failed to update stock information');
        }
    }

    initializeStockChart() {
        try {
            const ctx = document.getElementById('stockOverviewChart')?.getContext('2d');
            if (!ctx) {
                throw new Error('Stock overview chart canvas not found');
            }

            // Calculate stock levels
            const stockData = this.calculateStockLevels();

            // Create the chart
            this.stockChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Healthy Stock', 'Low Stock', 'Critical Stock'],
                    datasets: [{
                        data: [stockData.healthy, stockData.low, stockData.critical],
                        backgroundColor: [
                            this.chartColors.success,
                            this.chartColors.warning,
                            this.chartColors.danger
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '75%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                usePointStyle: true,
                                padding: 20,
                                font: { size: 12 }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const label = context.label || '';
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${label}: ${value} items (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });

            // Add center text
            this.updateChartCenterText(stockData.total);

        } catch (error) {
            console.error('Failed to initialize stock chart:', error);
            this.showError('Could not load stock overview chart');
        }
    }

    calculateStockLevels() {
        try {
            // Group products by stock level
            const stockGroups = {
                healthy: [],
                low: [],
                critical: []
            };

            this.products.forEach(product => {
                if (product.stock > 10) {
                    stockGroups.healthy.push(product);
                } else if (product.stock > 5) {
                    stockGroups.low.push(product);
                } else {
                    stockGroups.critical.push(product);
                }
            });

            return {
                healthy: stockGroups.healthy.length,
                low: stockGroups.low.length,
                critical: stockGroups.critical.length,
                total: this.products.length,
                details: stockGroups // Include full product details
            };
        } catch (error) {
            console.error('Error calculating stock levels:', error);
            return {
                healthy: 0,
                low: 0,
                critical: 0,
                total: 0,
                details: { healthy: [], low: [], critical: [] }
            };
        }
    }

    updateChartCenterText(total) {
        const centerText = {
            id: 'centerText',
            afterDatasetsDraw(chart) {
                const { ctx, data } = chart;
                const centerX = chart.getDatasetMeta(0).data[0].x;
                const centerY = chart.getDatasetMeta(0).data[0].y;

                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Total number
                ctx.font = 'bold 24px Inter';
                ctx.fillStyle = '#1F2937';
                ctx.fillText(total, centerX, centerY - 10);
                
                // Label
                ctx.font = '14px Inter';
                ctx.fillStyle = '#6B7280';
                ctx.fillText('Total Items', centerX, centerY + 10);
                
                ctx.restore();
            }
        };

        this.stockChart.options.plugins.centerText = centerText;
        this.stockChart.update();
    }

    updateStockOverview() {
        try {
            const stockData = this.calculateStockLevels();

            // Update chart data
            if (this.stockChart) {
                this.stockChart.data.datasets[0].data = [
                    stockData.healthy,
                    stockData.low,
                    stockData.critical
                ];
                this.stockChart.update();
                this.updateChartCenterText(stockData.total);
            }

            // Update counters and lists
            const updateStockSection = (level, items) => {
                const countElement = document.getElementById(`${level}StockCount`);
                const listElement = document.getElementById(`${level}StockList`);
                
                if (countElement) {
                    countElement.textContent = items.length;
                }
                
                if (listElement) {
                    listElement.innerHTML = items.length > 0 ? items
                        .map(item => `
                            <div class="flex justify-between items-center py-1 px-2">
                                <span class="font-medium">${item.name}</span>
                                <span class="text-sm">${item.stock} units</span>
                            </div>
                        `).join('') : '<div class="text-center text-gray-500 py-2">No items</div>';
                }
            };

            // Update each stock section
            updateStockSection('healthy', stockData.details.healthy);
            updateStockSection('low', stockData.details.low);
            updateStockSection('critical', stockData.details.critical);

            console.log('Stock overview updated successfully');
        } catch (error) {
            console.error('Failed to update stock overview:', error);
            this.showError('Could not update stock overview');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('Initializing dashboard...');
        window.dashboardManager = new DashboardManager();
        console.log('Dashboard initialized successfully');
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        // Show user-friendly error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'p-4 m-4 bg-red-100 border border-red-400 text-red-700 rounded';
        errorMessage.textContent = 'Failed to load dashboard. Please refresh the page.';
        document.body.prepend(errorMessage);
    }
});

