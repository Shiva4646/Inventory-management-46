document.addEventListener("DOMContentLoaded", function () {
    console.log("Stock Management System Loaded");

    // Initialize Chart
    const ctx = document.getElementById('sales-chart')?.getContext('2d');
    if (ctx) {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Product A', 'Product B', 'Product C'],
                datasets: [{
                    label: 'Units Sold',
                    data: [12, 19, 7],
                    backgroundColor: ['#4a90e2', '#f39c12', '#e74c3c'],
                    borderWidth: 1
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
    }
});
