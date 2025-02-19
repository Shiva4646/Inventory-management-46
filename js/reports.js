document.addEventListener('DOMContentLoaded', function() {
    // Get data from localStorage
    const products = JSON.parse(localStorage.getItem('products')) || [];
    const sales = JSON.parse(localStorage.getItem('sales')) || [];

    // Calculate Statistics
    const stats = {
        totalSales: sales.reduce((sum, sale) => sum + sale.amount, 0),
        totalProducts: products.length,
        lowStockItems: products.filter(p => p.stock <= 10).length,
        
        // Monthly calculations
        monthlySales: calculateMonthlySales(sales),
        monthlyGrowth: calculateMonthlyGrowth(sales),
        
        // Product statistics
        productPerformance: calculateProductPerformance(sales, products),
        stockLevels: calculateStockLevels(products)
    };

    // Update Stats Cards
    updateStatsDisplay(stats);

    // Sales Trend Chart
    const salesChart = initializeSalesChart();

    // Auto refresh every 5 minutes
    setInterval(updateSalesChart, 300000);

    // Stock Levels Chart
    const stockCtx = document.getElementById('stockChart').getContext('2d');
    new Chart(stockCtx, {
        type: 'bar',
        data: {
            labels: stats.stockLevels.map(item => item.name),
            datasets: [{
                label: 'Current Stock',
                data: stats.stockLevels.map(item => item.stock),
                backgroundColor: stats.stockLevels.map(item => 
                    item.stock <= 10 ? 'rgba(220, 38, 38, 0.7)' :
                    item.stock <= 20 ? 'rgba(251, 191, 36, 0.7)' :
                    'rgba(15, 118, 110, 0.7)'
                ),
                borderColor: stats.stockLevels.map(item => 
                    item.stock <= 10 ? '#DC2626' :
                    item.stock <= 20 ? '#F59E0B' :
                    '#0F766E'
                ),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });

    // Populate table with sample data
    const tableBody = document.getElementById('report-table-body');
    const sampleData = [
        { product: 'Product A', stock: 65, sales: '₹12,500', status: 'In Stock' },
        { product: 'Product B', stock: 45, sales: '₹8,900', status: 'In Stock' },
        { product: 'Product C', stock: 30, sales: '₹15,200', status: 'Low Stock' },
        { product: 'Product D', stock: 85, sales: '₹20,100', status: 'In Stock' },
        { product: 'Product E', stock: 55, sales: '₹11,300', status: 'Warning' }
    ];

    sampleData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${item.product}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${item.stock} units</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${item.sales}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${item.status === 'In Stock' ? 'bg-green-100 text-green-800' : 
                      item.status === 'Low Stock' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'}">
                    ${item.status}
                </span>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Handle Generate Report button
    document.getElementById('generate-sales-report').addEventListener('click', function() {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        const period = document.getElementById('report-period').value;
        
        updateChartWithDateRange(salesChart, startDate, endDate, period);
        updateDetailedReport(startDate, endDate);
    });

    // Get input elements
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const periodSelect = document.getElementById('report-period');

    // Auto-update function
    function autoUpdateChart() {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        const period = periodSelect.value;

        if (startDate && endDate) {
            if (new Date(startDate) <= new Date(endDate)) {
                const sales = JSON.parse(localStorage.getItem('sales')) || [];
                const filteredSales = sales.filter(sale => {
                    const saleDate = new Date(sale.date);
                    return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
                });

                const groupedData = groupSalesByPeriod(filteredSales, period);
                salesChart.data.labels = groupedData.labels;
                salesChart.data.datasets[0].data = groupedData.values;
                salesChart.update();
            }
        }
    }

    // Add event listeners
    endDateInput.addEventListener('change', autoUpdateChart);
    startDateInput.addEventListener('change', () => {
        if (endDateInput.value) autoUpdateChart();
    });
    periodSelect.addEventListener('change', autoUpdateChart);

    // Helper Functions
    function calculateMonthlySales(sales) {
        return sales.reduce((acc, sale) => {
            const date = new Date(sale.date);
            const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
            acc[monthYear] = (acc[monthYear] || 0) + sale.amount;
            return acc;
        }, {});
    }

    function calculateMonthlyGrowth(sales) {
        const monthly = calculateMonthlySales(sales);
        const months = Object.keys(monthly);
        if (months.length < 2) return 0;
        
        const currentMonth = monthly[months[months.length - 1]];
        const lastMonth = monthly[months[months.length - 2]];
        return lastMonth ? ((currentMonth - lastMonth) / lastMonth * 100).toFixed(1) : 0;
    }

    function calculateProductPerformance(sales, products) {
        return products.map(product => {
            const productSales = sales.filter(sale => sale.productId === product.id);
            return {
                name: product.name,
                totalSales: productSales.reduce((sum, sale) => sum + sale.amount, 0),
                quantity: productSales.reduce((sum, sale) => sum + sale.quantity, 0)
            };
        }).sort((a, b) => b.totalSales - a.totalSales);
    }

    function calculateStockLevels(products) {
        return products
            .map(product => ({
                name: product.name,
                stock: product.stock
            }))
            .sort((a, b) => a.stock - b.stock)
            .slice(0, 10); // Top 10 products by stock level
    }

    function updateStatsDisplay(stats) {
        try {
            // Calculate growth percentage
            const now = new Date();
            const currentMonth = now.getMonth();
            const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            
            const currentMonthSales = Object.entries(stats.monthlySales)
                .filter(([key]) => key.includes(now.toLocaleString('default', { month: 'short' })))
                .reduce((sum, [_, value]) => sum + value, 0);
    
            const previousMonthSales = Object.entries(stats.monthlySales)
                .filter(([key]) => {
                    const date = new Date();
                    date.setMonth(previousMonth);
                    return key.includes(date.toLocaleString('default', { month: 'short' }));
                })
                .reduce((sum, [_, value]) => sum + value, 0);
    
            // Calculate percentage change
            const percentageChange = previousMonthSales === 0 
                ? (currentMonthSales > 0 ? 100 : 0)
                : ((currentMonthSales - previousMonthSales) / previousMonthSales * 100).toFixed(1);
    
            // Update stats cards
            document.querySelector('.text-3xl.text-teal-600').textContent = 
                '₹' + stats.totalSales.toLocaleString();
    
            // Update the trend indicator
            const trendIndicator = document.querySelector('.text-sm');
            const isPositive = percentageChange >= 0;
            
            trendIndicator.className = `text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`;
            trendIndicator.innerHTML = `
                ${isPositive ? '↑' : '↓'} ${Math.abs(percentageChange)}% from last month
            `;
    
            // Update other stats
            document.querySelectorAll('.text-3xl.font-bold')[1].textContent = 
                stats.totalProducts;
            document.querySelector('.text-3xl.text-red-600').textContent = 
                stats.lowStockItems;
    
        } catch (error) {
            console.error('Error updating stats display:', error);
        }
    }

    function getMonthlyTrends() {
        const sales = JSON.parse(localStorage.getItem('sales')) || [];
        const monthlyData = {};
        
        // Get last 6 months including today
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Include full current day
        
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today);
            d.setMonth(d.getMonth() - i);
            const monthYear = d.toLocaleString('default', { month: 'short', year: '2-digit' });
            monthlyData[monthYear] = 0;
        }

        // Calculate sales including today
        sales.forEach(sale => {
            const date = new Date(sale.date);
            const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' });
            if (monthlyData.hasOwnProperty(monthYear)) {
                monthlyData[monthYear] += sale.amount;
            }
        });

        return {
            labels: Object.keys(monthlyData),
            values: Object.values(monthlyData)
        };
    }

    // Update chart data
    function updateSalesChart() {
        const trends = getMonthlyTrends();
        salesChart.data.labels = trends.labels;
        salesChart.data.datasets[0].data = trends.values;
        salesChart.update();
    }

    function initializeSalesChart() {
        const salesCtx = document.getElementById('salesChart').getContext('2d');
        const salesChart = new Chart(salesCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Sales Trend',
                    data: [],
                    fill: false,
                    borderColor: '#0F766E',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => '₹' + value.toLocaleString()
                        }
                    }
                }
            }
        });

        // Load default 6-month data
        loadDefaultData(salesChart);

        // Add event listener for date filter
        document.getElementById('generate-sales-report').addEventListener('click', () => {
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;
            const period = document.getElementById('report-period').value;
            
            if (startDate && endDate) {
                updateChartWithDateRange(salesChart, startDate, endDate, period);
            }
        });

        return salesChart;
    }

    function loadDefaultData(chart) {
        const sales = JSON.parse(localStorage.getItem('sales')) || [];
        const sixMonthsData = getLast6MonthsData(sales);
        
        chart.data.labels = sixMonthsData.labels;
        chart.data.datasets[0].data = sixMonthsData.values;
        chart.update();
    }

    function getLast6MonthsData(sales) {
        const monthlyData = {};
        
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthYear = d.toLocaleString('default', { month: 'short', year: '2-digit' });
            monthlyData[monthYear] = 0;
        }

        sales.forEach(sale => {
            const date = new Date(sale.date);
            const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' });
            if (monthlyData.hasOwnProperty(monthYear)) {
                monthlyData[monthYear] += sale.amount;
            }
        });

        return {
            labels: Object.keys(monthlyData),
            values: Object.values(monthlyData)
        };
    }

    function groupSalesByPeriod(sales, period) {
        const groupedData = {};
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        // Initialize with current period
        switch(period) {
            case 'daily':
                for(let i = 0; i < 24; i++) {
                    const hour = i.toString().padStart(2, '0');
                    groupedData[`${hour}:00`] = 0;
                }
                break;
                
            case 'weekly':
                for(let i = 0; i < 7; i++) {
                    const day = new Date(today);
                    day.setDate(day.getDate() - day.getDay() + i);
                    groupedData[day.toLocaleDateString('en-US', { weekday: 'short' })] = 0;
                }
                break;
                
            case 'monthly':
                const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                for(let i = 1; i <= daysInMonth; i++) {
                    groupedData[`${i}`] = 0;
                }
                break;
        }

        // Aggregate sales including today
        sales.forEach(sale => {
            const date = new Date(sale.date);
            let key;
            
            switch(period) {
                case 'daily':
                    key = date.getHours().toString().padStart(2, '0') + ':00';
                    break;
                case 'weekly':
                    key = date.toLocaleDateString('en-US', { weekday: 'short' });
                    break;
                case 'monthly':
                    key = date.getDate().toString();
                    break;
            }
            
            if (groupedData.hasOwnProperty(key)) {
                groupedData[key] += sale.amount;
            }
        });

        return {
            labels: Object.keys(groupedData),
            values: Object.values(groupedData)
        };
    }

    function updateChartWithDateRange(chart, startDate, endDate, period) {
        const sales = JSON.parse(localStorage.getItem('sales')) || [];
        const filteredSales = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
        });

        const groupedData = groupSalesByPeriod(filteredSales, period);
        
        // Calculate total sales and max value for the period
        const totalSales = filteredSales.reduce((sum, sale) => sum + sale.amount, 0);
        const maxValue = Math.max(...groupedData.values, 0);
        
        // Configure y-axis based on period and total sales
        const yAxisConfig = {
            daily: {
                max: Math.ceil(totalSales / 24) * 2, // Double the average hourly sales
                steps: 6,
                padding: 0.2
            },
            weekly: {
                max: Math.ceil(totalSales / 7) * 1.5, // 1.5x the average daily sales
                steps: 8,
                padding: 0.15
            },
            monthly: {
                max: totalSales * 1.2, // 20% more than total monthly sales
                steps: 10,
                padding: 0.1
            }
        };

        const config = yAxisConfig[period];
        const suggestedMax = Math.max(maxValue * (1 + config.padding), config.max);
        const stepSize = Math.ceil(suggestedMax / config.steps);

        chart.options = {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: suggestedMax,
                    ticks: {
                        stepSize: stepSize,
                        callback: value => '₹' + value.toLocaleString(),
                        font: { size: 11 }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.1)',
                        drawBorder: false
                    }
                }
            }
        };

        chart.data.labels = groupedData.labels;
        chart.data.datasets[0].data = groupedData.values;
        chart.update('active');
    }

    function updateDetailedReport(startDate, endDate) {
        const sales = JSON.parse(localStorage.getItem('sales')) || [];
        const products = JSON.parse(localStorage.getItem('products')) || [];
        const tableBody = document.getElementById('report-table-body');
        
        tableBody.innerHTML = '';

        // Filter sales by date range
        const filteredSales = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
        });

        // Calculate metrics for each product
        const productStats = products.map(product => {
            const productSales = filteredSales.filter(sale => sale.productId === product.id);
            const totalRevenue = productSales.reduce((sum, sale) => sum + sale.amount, 0);
            const totalQuantity = productSales.reduce((sum, sale) => sum + sale.quantity, 0);
            
            return {
                id: product.id,
                name: product.name,
                stock: product.stock,
                revenue: totalRevenue,
                soldQuantity: totalQuantity,
                status: product.stock <= 10 ? 'Low Stock' : 
                        product.stock <= 20 ? 'Warning' : 'In Stock'
            };
        }).sort((a, b) => b.revenue - a.revenue);

        // Update table with product stats
        productStats.forEach(stat => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition-colors';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${stat.name}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${stat.stock} units</div>
                    <div class="text-xs text-gray-500">${stat.soldQuantity} sold</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">₹${stat.revenue.toLocaleString()}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${stat.status === 'In Stock' ? 'bg-green-100 text-green-800' : 
                        stat.status === 'Low Stock' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'}">
                        ${stat.status}
                    </span>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Update summary stats
        document.querySelector('.text-3xl.text-teal-600').textContent = 
            '₹' + productStats.reduce((sum, stat) => sum + stat.revenue, 0).toLocaleString();
        document.querySelectorAll('.text-3xl.font-bold')[1].textContent = products.length;
        document.querySelector('.text-3xl.text-red-600').textContent = 
            productStats.filter(stat => stat.status === 'Low Stock').length;
    }

    // Add event listeners for auto-update
    document.getElementById('start-date').addEventListener('change', function() {
        const endDate = document.getElementById('end-date').value;
        if (endDate) updateDetailedReport(this.value, endDate);
    });

    document.getElementById('end-date').addEventListener('change', function() {
        const startDate = document.getElementById('start-date').value;
        if (startDate) updateDetailedReport(startDate, this.value);
    });

    // Add event listeners
    document.addEventListener('DOMContentLoaded', function() {
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        const periodSelect = document.getElementById('report-period');
    
        function updateReports() {
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;
            const period = periodSelect.value;
    
            if (startDate && endDate) {
                updateChartWithDateRange(salesChart, startDate, endDate, period);
                updateDetailedReport(startDate, endDate);
            }
        }
    
        // Auto-update on date changes
        startDateInput.addEventListener('change', updateReports);
        endDateInput.addEventListener('change', updateReports);
        periodSelect.addEventListener('change', updateReports);
    });

    // Set default dates
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    startDateInput.value = start.toISOString().split('T')[0];
    endDateInput.value = end.toISOString().split('T')[0];

    // Initial update
    updateDetailedReport(startDateInput.value, endDateInput.value);

    // Event listeners
    startDateInput.addEventListener('change', () => {
        updateDetailedReport(startDateInput.value, endDateInput.value);
    });
    
    endDateInput.addEventListener('change', () => {
        updateDetailedReport(startDateInput.value, endDateInput.value);
    });
    
    periodSelect.addEventListener('change', () => {
        updateDetailedReport(startDateInput.value, endDateInput.value);
    });

    document.getElementById('generate-sales-report').addEventListener('click', () => {
        updateDetailedReport(startDateInput.value, endDateInput.value);
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // Initialize elements
    const salesChart = initializeSalesChart();
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const periodSelect = document.getElementById('report-period');
    const tableBody = document.getElementById('report-table-body');

    // Set default date range to include today
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    startDateInput.value = thirtyDaysAgo.toISOString().split('T')[0];
    endDateInput.value = today.toISOString().split('T')[0];

    function updateAllReports() {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        const period = periodSelect.value;

        if (startDate && endDate) {
            // Update chart
            updateChartWithDateRange(salesChart, startDate, endDate, period);
            // Update table
            updateDetailedReport(startDate, endDate);
            // Update stats
            updateStats(startDate, endDate);
        }
    }

    // Initial load
    updateAllReports();

    // Event listeners
    startDateInput.addEventListener('change', updateAllReports);
    endDateInput.addEventListener('change', updateAllReports);
    periodSelect.addEventListener('change', updateAllReports);
    document.getElementById('generate-sales-report').addEventListener('click', updateAllReports);

    // Auto refresh every minute
    setInterval(updateAllReports, 60000);
});

function updateStats(startDate, endDate) {
    const sales = JSON.parse(localStorage.getItem('sales')) || [];
    const products = JSON.parse(localStorage.getItem('products')) || [];
    
    // Calculate total sales from all sales data
    const totalSales = sales.reduce((sum, sale) => sum + sale.amount, 0);
    
    // Calculate filtered period sales
    const filteredSales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
    });
    
    const periodSales = filteredSales.reduce((sum, sale) => sum + sale.amount, 0);
    
    // Update stats display
    const statsDisplay = {
        totalSales: totalSales,
        totalProducts: products.length,
        lowStockItems: products.filter(p => p.stock <= 10).length,
        periodSales: periodSales
    };

    // Update UI elements
    document.querySelector('.text-3xl.text-teal-600').textContent = 
        '₹' + statsDisplay.totalSales.toLocaleString();
    document.querySelectorAll('.text-3xl.font-bold')[1].textContent = 
        statsDisplay.totalProducts;
    document.querySelector('.text-3xl.text-red-600').textContent = 
        statsDisplay.lowStockItems;

    return statsDisplay;
}

// Update event listeners
document.addEventListener('DOMContentLoaded', function() {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    function updateAllStats() {
        updateStats(startDateInput.value, endDateInput.value);
    }

    // Initial update
    updateAllStats();

    // Add listeners
    startDateInput.addEventListener('change', updateAllStats);
    endDateInput.addEventListener('change', updateAllStats);
    document.getElementById('generate-sales-report').addEventListener('click', updateAllStats);

    // Auto refresh every minute
    setInterval(updateAllStats, 60000);
});

// Table enhancement functionality
function enhanceProductTable() {
    const tableBody = document.getElementById('report-table-body');
    const searchInput = document.getElementById('table-search');
    const filterSelect = document.getElementById('table-filter');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const showingCount = document.getElementById('showing-count');
    const totalCount = document.getElementById('total-count');

    let currentPage = 1;
    const itemsPerPage = 10;
    let currentSort = { column: 'name', direction: 'asc' };
    let filteredData = [];
    
    // Initialize sort icons
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.dataset.sort;
            if (currentSort.column === column) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort = { column, direction: 'asc' };
            }
            
            // Update sort icons
            document.querySelectorAll('.sort-icon').forEach(icon => {
                icon.textContent = '↕';
            });
            th.querySelector('.sort-icon').textContent = currentSort.direction === 'asc' ? '↑' : '↓';
            
            renderTable();
        });
    });

    // Search and filter functionality
    searchInput.addEventListener('input', () => {
        currentPage = 1;
        renderTable();
    });

    filterSelect.addEventListener('change', () => {
        currentPage = 1;
        renderTable();
    });

    // Pagination
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const maxPage = Math.ceil(filteredData.length / itemsPerPage);
        if (currentPage < maxPage) {
            currentPage++;
            renderTable();
        }
    });

    function renderTable() {
        const products = JSON.parse(localStorage.getItem('products')) || [];
        const sales = JSON.parse(localStorage.getItem('sales')) || [];

        // Filter data
        filteredData = products.map(product => {
            const productSales = sales.filter(sale => sale.productId === product.id);
            const totalSales = productSales.reduce((sum, sale) => sum + sale.amount, 0);
            const status = product.stock <= 10 ? 'Low Stock' : 
                          product.stock <= 20 ? 'Warning' : 'In Stock';
            
            return {
                id: product.id,
                name: product.name,
                stock: product.stock,
                sales: totalSales,
                status
            };
        }).filter(item => {
            const searchTerm = searchInput.value.toLowerCase();
            const filterValue = filterSelect.value;
            
            const matchesSearch = item.name.toLowerCase().includes(searchTerm);
            const matchesFilter = filterValue === 'all' || 
                                (filterValue === 'low-stock' && item.status === 'Low Stock') ||
                                (filterValue === 'warning' && item.status === 'Warning') ||
                                (filterValue === 'in-stock' && item.status === 'In Stock');
            
            return matchesSearch && matchesFilter;
        });

        // Sort data
        filteredData.sort((a, b) => {
            const direction = currentSort.direction === 'asc' ? 1 : -1;
            switch (currentSort.column) {
                case 'name':
                    return direction * a.name.localeCompare(b.name);
                case 'stock':
                    return direction * (a.stock - b.stock);
                case 'sales':
                    return direction * (a.sales - b.sales);
                case 'status':
                    return direction * a.status.localeCompare(b.status);
                default:
                    return 0;
            }
        });

        // Paginate data
        const start = (currentPage - 1) * itemsPerPage;
        const paginatedData = filteredData.slice(start, start + itemsPerPage);

        // Update table
        tableBody.innerHTML = paginatedData.map(item => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${item.name}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${item.stock} units</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">₹${item.sales.toLocaleString()}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${item.status === 'In Stock' ? 'bg-green-100 text-green-800' : 
                          item.status === 'Low Stock' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}">
                        ${item.status}
                    </span>
                </td>
            </tr>
        `).join('');

        // Update pagination info
        showingCount.textContent = Math.min(filteredData.length, currentPage * itemsPerPage);
        totalCount.textContent = filteredData.length;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage >= Math.ceil(filteredData.length / itemsPerPage);
    }

    // Initial render
    renderTable();
}

// Call the enhancement function after DOM is loaded
document.addEventListener('DOMContentLoaded', enhanceProductTable);