class InventoryManager {
    constructor() {
        this.products = JSON.parse(localStorage.getItem('products')) || [];
        this.setupEventListeners();
        this.updateInventoryStats();
        this.renderInventoryTable();
    }

    setupEventListeners() {
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterProducts(e.target.value);
        });

        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.filterProducts(document.getElementById('searchInput').value, e.target.value);
        });

        document.getElementById('addProductBtn').addEventListener('click', () => {
            window.location.href = 'products.html?action=add';
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            console.log('Export button clicked');
            this.exportInventory();
        });

        document.getElementById('printBtn').addEventListener('click', () => {
            window.print();
        });
    }

    updateInventoryStats() {
        const stats = {
            total: this.products.length,
            lowStock: this.products.filter(p => p.stock <= 10 && p.stock > 0).length,
            outOfStock: this.products.filter(p => p.stock === 0).length,
            totalValue: this.products.reduce((sum, p) => sum + (p.price * p.stock), 0)
        };

        document.getElementById('totalProducts').textContent = stats.total;
        document.getElementById('lowStockItems').textContent = stats.lowStock;
        document.getElementById('outOfStock').textContent = stats.outOfStock;
        document.getElementById('totalValue').textContent = 
            '₹' + stats.totalValue.toLocaleString('en-IN');
    }

    renderInventoryTable(filteredProducts = this.products) {
        const tbody = document.getElementById('inventoryTableBody');
        tbody.innerHTML = filteredProducts.map(product => `
            <tr>
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <div class="h-10 w-10 flex-shrink-0">
                            <img class="h-10 w-10 rounded-full" src="${product.image || 'placeholder.jpg'}" alt="">
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${product.name}</div>
                            <div class="text-sm text-gray-500">#${product.id}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">${product.category}</td>
                <td class="px-6 py-4 text-sm text-gray-500">${product.stock}</td>
                <td class="px-6 py-4 text-sm text-gray-500">₹${product.price}</td>
                <td class="px-6 py-4">
                    ${this.getStatusBadge(product.stock)}
                </td>
            </tr>
        `).join('');
    }

    getStatusBadge(stock) {
        if (stock === 0) {
            return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                Out of Stock
            </span>`;
        } else if (stock <= 10) {
            return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                Low Stock
            </span>`;
        }
        return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            In Stock
        </span>`;
    }

    filterProducts(searchTerm = '', category = '') {
        let filtered = this.products;
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(term) || 
                p.id.toString().includes(term)
            );
        }
        
        if (category) {
            filtered = filtered.filter(p => p.category === category);
        }
        
        this.renderInventoryTable(filtered);
    }

    exportInventory() {
        try {
            // Create worksheet data
            const wsData = [
                ['Product ID', 'Product Name', 'Category', 'Stock', 'Price', 'Status', 'Total Value'],
                ...this.products.map(p => [
                    p.id,
                    p.name,
                    p.category,
                    p.stock,
                    `₹${p.price.toFixed(2)}`,
                    this.getStockStatus(p.stock),
                    `₹${(p.price * p.stock).toFixed(2)}`
                ])
            ];

            // Create a new workbook
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(wsData);

            // Style the worksheet
            ws['!cols'] = [
                { wch: 10 },  // Product ID
                { wch: 30 },  // Product Name
                { wch: 15 },  // Category
                { wch: 10 },  // Stock
                { wch: 12 },  // Price
                { wch: 15 },  // Status
                { wch: 15 }   // Total Value
            ];

            // Add the worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Inventory Report');

            // Save the file
            const fileName = `inventory-report-${new Date().toISOString().slice(0,10)}.xlsx`;
            XLSX.writeFile(wb, fileName);

            console.log('Excel file exported successfully');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            alert('Failed to export inventory. Please try again.');
        }
    }

    getStockStatus(stock) {
        if (stock === 0) return 'Out of Stock';
        if (stock <= 10) return 'Low Stock';
        return 'In Stock';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.inventoryManager = new InventoryManager();
});