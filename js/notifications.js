class NotificationManager {
    constructor() {
        this.notifications = this.getUniqueNotifications();
        this.init();
        this.initTopProducts();
        this.watchProductChanges();
    }

    getUniqueNotifications() {
        const stored = JSON.parse(localStorage.getItem('notifications')) || [];
        const now = new Date();
        const dayAgo = new Date(now - 24*60*60*1000);

        // Remove duplicates and old notifications
        const unique = stored.reduce((acc, notification) => {
            const notificationDate = new Date(notification.timestamp);
            const key = `${notification.message}-${notification.type}`;
            
            // Only keep notifications from last 24 hours
            if (notificationDate > dayAgo) {
                // Keep most recent if duplicate exists
                if (!acc[key] || new Date(acc[key].timestamp) < notificationDate) {
                    acc[key] = notification;
                }
            }
            return acc;
        }, {});

        // Convert back to array and sort by timestamp
        const notifications = Object.values(unique)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Update storage with cleaned notifications
        localStorage.setItem('notifications', JSON.stringify(notifications));
        
        return notifications;
    }

    init() {
        this.notificationBtn = document.getElementById('notification-btn');
        this.notificationList = document.getElementById('notification-list');
        this.notificationCount = document.getElementById('notification-count');
        this.dropdown = document.getElementById('notification-dropdown');

        this.setupEventListeners();
        this.checkLowStock();
        this.updateNotificationCount();
        this.renderNotifications();
    }

    initTopProducts() {
        this.topProductBtn = document.getElementById('top-product-btn');
        this.topProductDropdown = document.getElementById('top-product-dropdown');
        this.topProductList = document.getElementById('top-product-list');

        this.topProductBtn.addEventListener('click', () => {
            this.toggleTopProducts();
        });

        document.addEventListener('click', (e) => {
            if (!this.topProductBtn.contains(e.target) && !this.topProductDropdown.contains(e.target)) {
                this.topProductDropdown.classList.add('hidden');
            }
        });

        this.updateTopProducts();
    }

    toggleTopProducts() {
        this.topProductDropdown.classList.toggle('hidden');
    }

    updateTopProducts() {
        const sales = JSON.parse(localStorage.getItem('sales')) || [];
        const products = JSON.parse(localStorage.getItem('products')) || [];

        // Calculate product performance
        const productStats = {};
        sales.forEach(sale => {
            if (!productStats[sale.productId]) {
                productStats[sale.productId] = {
                    name: sale.productName,
                    totalSales: 0,
                    quantity: 0,
                    lastSale: sale.date
                };
            }
            productStats[sale.productId].totalSales += sale.amount;
            productStats[sale.productId].quantity += sale.quantity;
            productStats[sale.productId].lastSale = new Date(Math.max(
                new Date(productStats[sale.productId].lastSale),
                new Date(sale.date)
            ));
        });

        // Sort by total sales
        const topProducts = Object.values(productStats)
            .sort((a, b) => b.totalSales - a.totalSales)
            .slice(0, 5);

        // Single consistent header style
        const header = `
            <div class="p-4 border-b bg-gray-50">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <svg class="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                        <h3 class="text-lg font-semibold text-gray-900">Top Products</h3>
                    </div>
                    <span class="bg-teal-100 text-teal-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        Last 30 Days
                    </span>
                </div>
            </div>
        `;

        const productList = topProducts.map((product, index) => `
            <div class="p-4 border-b ${index === 0 ? 'bg-teal-50' : 'hover:bg-gray-50'} transition-colors">
                <div class="flex items-start gap-3">
                    <div class="flex-shrink-0">
                        <div class="p-2 ${index === 0 ? 'bg-teal-100' : 'bg-gray-100'} rounded-full">
                            ${index === 0 ? 
                                '<span class="text-xl">🏆</span>' : 
                                `<span class="text-sm font-bold ${
                                    index === 1 ? 'text-gray-600' : 
                                    index === 2 ? 'text-yellow-600' : 
                                    'text-gray-400'
                                }">#${index + 1}</span>`
                            }
                        </div>
                    </div>
                    <div class="flex-1">
                        <div class="flex justify-between items-start">
                            <h4 class="text-sm font-semibold ${index === 0 ? 'text-teal-700' : 'text-gray-900'}">${product.name}</h4>
                            <span class="text-xs font-medium text-teal-600">₹${product.totalSales.toLocaleString()}</span>
                        </div>
                        <div class="mt-2 grid grid-cols-2 gap-2">
                            <div class="bg-white rounded p-2 border border-gray-100">
                                <div class="text-xs text-gray-500">Units Sold</div>
                                <div class="font-semibold text-gray-700">${product.quantity}</div>
                            </div>
                            <div class="bg-white rounded p-2 border border-gray-100">
                                <div class="text-xs text-gray-500">Last Sale</div>
                                <div class="font-semibold text-gray-700">
                                    ${new Date(product.lastSale).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short'
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        this.topProductList.innerHTML = `
            ${header}
            <div class="max-h-[400px] overflow-y-auto custom-scrollbar">
                ${productList || '<div class="p-8 text-center text-gray-500">No sales data available</div>'}
            </div>
        `;
    }

    setupEventListeners() {
        this.notificationBtn.addEventListener('click', () => {
            this.toggleDropdown();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.notificationBtn.contains(e.target)) {
                this.dropdown.classList.add('hidden');
            }
        });
    }

    watchProductChanges() {
        // Watch for product changes in localStorage
        window.addEventListener('storage', (e) => {
            if (e.key === 'products' || e.key === 'sales') {
                this.checkLowStock();
                this.updateNotificationCount();
                this.renderNotifications();
                this.updateTopProducts();
            }
        });

        // Check for changes periodically
        setInterval(() => {
            this.checkLowStock();
            this.updateNotificationCount();
            this.renderNotifications();
            this.updateTopProducts();
        }, 5000); // Check every 5 seconds
    }

    updateNotifications() {
        const products = JSON.parse(localStorage.getItem('products')) || [];
        
        // Remove notifications for products that are no longer low in stock
        this.notifications = this.notifications.filter(notification => {
            const productName = notification.message.split(' is ')[0];
            const product = products.find(p => p.name === productName);
            return product && product.stock <= 10;
        });

        // Check for new low stock items
        this.checkLowStock();
        
        // Update storage and UI
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
        this.updateNotificationCount();
        this.renderNotifications();
    }

    checkLowStock() {
        const products = JSON.parse(localStorage.getItem('products')) || [];
        const currentTime = new Date().toISOString();

        products.forEach(product => {
            if (product.stock <= 10) {
                // Check if notification already exists
                const exists = this.notifications.some(n => 
                    n.message === `${product.name} is running low (${product.stock} units remaining)` &&
                    new Date(n.timestamp) > new Date(Date.now() - 24*60*60*1000)
                );

                if (!exists) {
                    const notification = {
                        id: Date.now() + Math.random(),
                        type: 'warning',
                        title: 'Low Stock Alert',
                        message: `${product.name} is running low (${product.stock} units remaining)`,
                        timestamp: currentTime
                    };
                    this.notifications.unshift(notification);
                    localStorage.setItem('notifications', JSON.stringify(this.notifications));
                }
            }
        });

        // Remove notifications for products that are no longer low in stock
        this.notifications = this.notifications.filter(notification => {
            const productName = notification.message.split(' is ')[0];
            const product = products.find(p => p.name === productName);
            return product && product.stock <= 10;
        });

        this.updateNotificationCount();
        this.renderNotifications();
    }

    addNotification(notification) {
        this.notifications.unshift(notification);
        // Keep only last 24 hours notifications
        this.notifications = this.notifications.filter(n => 
            new Date(n.timestamp) > new Date(Date.now() - 24*60*60*1000)
        );
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
        this.updateNotificationCount();
        this.renderNotifications();
    }

    toggleDropdown() {
        this.dropdown.classList.toggle('hidden');
    }

    updateNotificationCount() {
        this.notificationCount.textContent = this.notifications.length;
    }

    formatDetailedTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = (now - date) / 1000; // difference in seconds

        // Format absolute time
        const timeString = date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const dateString = date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });

        // Get priority class based on stock level
        const getPriorityClass = (message) => {
            const stock = parseInt(message.match(/\((\d+) units/)?.[1] || '0');
            if (stock <= 5) return 'text-red-600 font-semibold';
            if (stock <= 10) return 'text-yellow-600';
            return 'text-gray-600';
        };

        return `
            <div class="flex flex-col">
                <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-500">${dateString}</span>
                    <span class="text-xs text-gray-400">${timeString}</span>
                </div>
                <div class="text-xs text-gray-400 mt-1">
                    Stock update from ${date.toLocaleString('en-IN', { 
                        weekday: 'long', 
                        hour: '2-digit', 
                        minute: '2-digit'
                    })}
                </div>
            </div>
        `;
    }

    formatNotificationTime(timestamp) {
        const date = new Date(timestamp);
        return {
            date: date.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }),
            time: date.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit'
            })
        };
    }

    renderNotifications() {
        if (!this.notificationList) return;

        const header = `
            <div class="p-4 border-b bg-gray-50">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold">Stock Alerts</h3>
                    <span class="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        ${this.notifications.length} Active
                    </span>
                </div>
            </div>
        `;

        const notificationItems = this.notifications.map(notification => {
            const { date, time } = this.formatNotificationTime(notification.timestamp);
            const stockLevel = parseInt(notification.message.match(/\((\d+) units/)?.[1] || '0');
            const severityClass = stockLevel <= 5 ? 'bg-red-50 border-red-100' : 'bg-yellow-50 border-yellow-100';
            
            return `
                <div class="p-4 border-b ${severityClass} hover:bg-opacity-75 transition-colors">
                    <div class="flex items-start gap-3">
                        <div class="flex-shrink-0">
                            <div class="p-2 ${stockLevel <= 5 ? 'bg-red-100' : 'bg-yellow-100'} rounded-full">
                                <svg class="w-5 h-5 ${stockLevel <= 5 ? 'text-red-600' : 'text-yellow-600'}" 
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                                </svg>
                            </div>
                        </div>
                        <div class="flex-1">
                            <div class="flex justify-between items-start">
                                <h4 class="text-sm font-semibold text-gray-900">${notification.title}</h4>
                                <span class="text-xs font-medium text-gray-500">${time}</span>
                            </div>
                            <p class="mt-1 text-sm text-gray-600">${notification.message}</p>
                            <div class="mt-2 flex items-center text-xs text-gray-500">
                                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                                Stock level detected on ${date}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.notificationList.innerHTML = `
            ${header}
            <div class="max-h-[400px] overflow-y-auto custom-scrollbar">
                ${this.notifications.length ? notificationItems : 
                '<div class="p-8 text-center text-gray-500">No active stock alerts</div>'}
            </div>
        `;
    }

    timeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };
        
        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
            }
        }
        return 'Just now';
    }

    getNotificationIcon(type) {
        return type === 'warning' ? 'text-yellow-500' : 'text-blue-500';
    }
}

// Initialize notifications
document.addEventListener('DOMContentLoaded', () => {
    window.notificationManager = new NotificationManager();
});