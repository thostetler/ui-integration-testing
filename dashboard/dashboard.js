// Dashboard state management
const state = {
    rawData: [],
    filteredData: [],
    filters: {
        app: 'all',
        throttle: 'all',
        metric: 'all',
        searchText: ''
    },
    charts: {
        overview: null,
        distribution: null,
        comparison: null,
        trends: null
    }
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadDefaultData();
});

// Event Listeners
function initializeEventListeners() {
    // Load data button
    document.getElementById('loadDataBtn').addEventListener('click', loadData);

    // Filter chips
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', handleFilterClick);
    });

    // Search input
    document.getElementById('searchTest').addEventListener('input', handleSearch);

    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', handleTabSwitch);
    });

    // Comparison controls
    document.getElementById('generateComparisonBtn').addEventListener('click', generateComparison);
    document.getElementById('compareRunsBtn').addEventListener('click', showComparisonModal);
    document.getElementById('exportCSVBtn').addEventListener('click', exportToCSV);
}

// Load default data on page load
async function loadDefaultData() {
    try {
        await loadData();
    } catch (error) {
        console.error('Error loading default data:', error);
        showNotification('Click "Load Data" to view performance results', 'info');
    }
}

// Load data from selected source
async function loadData() {
    const source = document.getElementById('dataSource').value;
    const loadBtn = document.getElementById('loadDataBtn');

    loadBtn.textContent = 'Loading...';
    loadBtn.disabled = true;

    try {
        let data;
        switch (source) {
            case 'performance-results':
                data = await loadPerformanceResults();
                break;
            case 'aggregated-csv':
                data = await loadAggregatedCSV();
                break;
            case 'performance-log':
                data = await loadPerformanceLog();
                break;
        }

        state.rawData = data;
        state.filteredData = data;

        updateDashboard();
        showNotification('Data loaded successfully!', 'success');
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Error loading data: ' + error.message, 'error');
    } finally {
        loadBtn.textContent = 'Load Data';
        loadBtn.disabled = false;
    }
}

// Load performance-results.json
async function loadPerformanceResults() {
    const response = await fetch('../perf-results/performance-results.json');
    if (!response.ok) throw new Error('Failed to load performance results');

    const data = await response.json();
    return parsePerformanceResults(data);
}

// Load aggregated CSV
async function loadAggregatedCSV() {
    const response = await fetch('../aggregated_averages.csv');
    if (!response.ok) throw new Error('Failed to load aggregated CSV');

    const text = await response.text();
    return parseAggregatedCSV(text);
}

// Load performance log (JSONL)
async function loadPerformanceLog() {
    const response = await fetch('../perf-results/performance-log.txt');
    if (!response.ok) throw new Error('Failed to load performance log');

    const text = await response.text();
    return parsePerformanceLog(text);
}

// Parse performance-results.json
function parsePerformanceResults(data) {
    return data.map(item => {
        // Parse test name: "scix.bibcode-search.normal.TTRL"
        const parts = item.name.split('.');
        const app = parts[0];
        const testName = parts.slice(1, -2).join('.');
        const throttle = parts[parts.length - 2];
        const metric = parts[parts.length - 1];

        return {
            testName,
            app,
            throttle,
            metric,
            avgTime: item.avgTime,
            sem: item.sem,
            repeats: item.repeats,
            minValue: item.minValue,
            maxValue: item.maxValue,
            earliestTime: item.earliestTime,
            latestTime: item.latestTime,
            fullName: item.name
        };
    });
}

// Parse aggregated CSV
function parseAggregatedCSV(csvText) {
    const results = Papa.parse(csvText, { header: true });
    const data = [];

    results.data.forEach(row => {
        const testName = row['Test Name'];
        if (!testName) return;

        // Parse each metric column
        Object.keys(row).forEach(col => {
            if (col === 'Test Name') return;

            const match = col.match(/^(\w+)_([^_]+)_(\w+)$/);
            if (match) {
                const [, app, throttle, metric] = match;
                const value = parseFloat(row[col]);

                if (!isNaN(value)) {
                    data.push({
                        testName,
                        app,
                        throttle,
                        metric,
                        avgTime: value,
                        sem: null,
                        repeats: parseInt(row[`${app} ${throttle} Number of Runs`]) || 0,
                        minValue: null,
                        maxValue: null,
                        fullName: `${app}.${testName}.${throttle}.${metric}`
                    });
                }
            }
        });
    });

    return data;
}

// Parse performance log (JSONL)
function parsePerformanceLog(logText) {
    const lines = logText.trim().split('\n');
    const aggregated = {};

    lines.forEach(line => {
        try {
            const entry = JSON.parse(line);
            const key = entry.name;

            if (!aggregated[key]) {
                aggregated[key] = {
                    durations: [],
                    name: entry.name
                };
            }

            aggregated[key].durations.push(entry.duration);
        } catch (error) {
            console.error('Error parsing log line:', error);
        }
    });

    // Convert to standard format
    return Object.values(aggregated).map(item => {
        const parts = item.name.split('.');
        const app = parts[0];
        const testName = parts.slice(1, -2).join('.');
        const throttle = parts[parts.length - 2];
        const metric = parts[parts.length - 1];

        const durations = item.durations;
        const avgTime = durations.reduce((a, b) => a + b, 0) / durations.length;
        const minValue = Math.min(...durations);
        const maxValue = Math.max(...durations);

        return {
            testName,
            app,
            throttle,
            metric,
            avgTime: Math.round(avgTime),
            sem: null,
            repeats: durations.length,
            minValue,
            maxValue,
            fullName: item.name
        };
    });
}

// Filter handling
function handleFilterClick(event) {
    const chip = event.target;
    const filterType = chip.dataset.filter;
    const value = chip.dataset.value;

    // Remove active class from siblings
    chip.parentElement.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');

    // Update filter state
    state.filters[filterType] = value;

    // Apply filters
    applyFilters();
}

function handleSearch(event) {
    state.filters.searchText = event.target.value.toLowerCase();
    applyFilters();
}

function applyFilters() {
    state.filteredData = state.rawData.filter(item => {
        // App filter
        if (state.filters.app !== 'all' && item.app !== state.filters.app) {
            return false;
        }

        // Throttle filter
        if (state.filters.throttle !== 'all' && item.throttle !== state.filters.throttle) {
            return false;
        }

        // Metric filter
        if (state.filters.metric !== 'all' && item.metric !== state.filters.metric) {
            return false;
        }

        // Search filter
        if (state.filters.searchText && !item.testName.toLowerCase().includes(state.filters.searchText)) {
            return false;
        }

        return true;
    });

    updateDashboard();
}

// Update dashboard with filtered data
function updateDashboard() {
    updateStatistics();
    updateOverviewChart();
    updateDistributionChart();
    updateDetailsTable();
    updateComparisonOptions();
}

// Update statistics cards
function updateStatistics() {
    const data = state.filteredData;

    // Total unique tests
    const uniqueTests = new Set(data.map(d => d.testName)).size;
    document.getElementById('totalTests').textContent = uniqueTests;

    // Average TTRL
    const ttrlData = data.filter(d => d.metric === 'TTRL');
    const avgTTRL = ttrlData.length > 0
        ? Math.round(ttrlData.reduce((sum, d) => sum + d.avgTime, 0) / ttrlData.length)
        : 0;
    document.getElementById('avgTTRL').textContent = `${avgTTRL}ms`;

    // Average TTRS
    const ttrsData = data.filter(d => d.metric === 'TTRS');
    const avgTTRS = ttrsData.length > 0
        ? Math.round(ttrsData.reduce((sum, d) => sum + d.avgTime, 0) / ttrsData.length)
        : 0;
    document.getElementById('avgTTRS').textContent = `${avgTTRS}ms`;

    // Total runs
    const totalRuns = data.reduce((sum, d) => sum + (d.repeats || 0), 0);
    document.getElementById('totalRuns').textContent = totalRuns.toLocaleString();
}

// Update overview chart
function updateOverviewChart() {
    const ctx = document.getElementById('overviewChart').getContext('2d');

    // Group data by test name and metric
    const groupedData = {};
    state.filteredData.forEach(item => {
        const key = `${item.testName}`;
        if (!groupedData[key]) {
            groupedData[key] = { TTRL: 0, TTSBI: 0, TTRS: 0, TTRR: 0, count: 0 };
        }
        if (item.metric in groupedData[key]) {
            groupedData[key][item.metric] += item.avgTime;
            groupedData[key].count++;
        }
    });

    // Get top 15 tests by TTRL
    const sortedTests = Object.entries(groupedData)
        .sort((a, b) => b[1].TTRL - a[1].TTRL)
        .slice(0, 15);

    const labels = sortedTests.map(([name]) => name);
    const datasets = [
        {
            label: 'TTRL (Time to Results from Load)',
            data: sortedTests.map(([, data]) => data.TTRL / (data.count / 4 || 1)),
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2
        },
        {
            label: 'TTSBI (Time to Search Bar Interactive)',
            data: sortedTests.map(([, data]) => data.TTSBI / (data.count / 4 || 1)),
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 2
        },
        {
            label: 'TTRS (Time to Results from Search)',
            data: sortedTests.map(([, data]) => data.TTRS / (data.count / 4 || 1)),
            backgroundColor: 'rgba(245, 158, 11, 0.7)',
            borderColor: 'rgba(245, 158, 11, 1)',
            borderWidth: 2
        },
        {
            label: 'TTRR (Time to Results from Refinement)',
            data: sortedTests.map(([, data]) => data.TTRR / (data.count / 4 || 1)),
            backgroundColor: 'rgba(239, 68, 68, 0.7)',
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 2
        }
    ];

    if (state.charts.overview) {
        state.charts.overview.destroy();
    }

    state.charts.overview = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'top' },
                title: {
                    display: true,
                    text: 'Top 15 Tests by Performance Metrics (Average across all runs)'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Time (ms)' }
                },
                x: {
                    ticks: { maxRotation: 45, minRotation: 45 }
                }
            }
        }
    });
}

// Update distribution chart
function updateDistributionChart() {
    const ctx = document.getElementById('distributionChart').getContext('2d');

    // Count tests by metric
    const metricCounts = {};
    state.filteredData.forEach(item => {
        metricCounts[item.metric] = (metricCounts[item.metric] || 0) + 1;
    });

    const labels = Object.keys(metricCounts);
    const data = Object.values(metricCounts);

    if (state.charts.distribution) {
        state.charts.distribution.destroy();
    }

    state.charts.distribution = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'right' },
                title: {
                    display: true,
                    text: 'Test Distribution by Metric Type'
                }
            }
        }
    });
}

// Update details table
function updateDetailsTable() {
    const tbody = document.getElementById('detailsTableBody');
    tbody.innerHTML = '';

    state.filteredData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.testName}</td>
            <td>${item.app.toUpperCase()}</td>
            <td>${item.throttle}</td>
            <td><strong>${item.metric}</strong></td>
            <td>${item.avgTime.toFixed(0)}</td>
            <td>${item.sem ? item.sem.toFixed(0) : '-'}</td>
            <td>${item.minValue ? item.minValue.toFixed(0) : '-'}</td>
            <td>${item.maxValue ? item.maxValue.toFixed(0) : '-'}</td>
            <td>${item.repeats || '-'}</td>
        `;
        tbody.appendChild(row);
    });
}

// Update comparison options
function updateComparisonOptions() {
    const select = document.getElementById('compareTests');
    select.innerHTML = '';

    const uniqueTests = [...new Set(state.filteredData.map(d => d.fullName))];
    uniqueTests.forEach(test => {
        const option = document.createElement('option');
        option.value = test;
        option.textContent = test;
        select.appendChild(option);
    });
}

// Generate comparison chart
function generateComparison() {
    const selectedTests = Array.from(document.getElementById('compareTests').selectedOptions)
        .map(opt => opt.value);
    const metric = document.getElementById('compareMetric').value;

    if (selectedTests.length === 0) {
        showNotification('Please select tests to compare', 'warning');
        return;
    }

    const ctx = document.getElementById('comparisonChart').getContext('2d');

    // Get data for selected tests
    const compareData = state.rawData.filter(item =>
        selectedTests.includes(item.fullName) && item.metric === metric
    );

    const labels = compareData.map(d => d.fullName);
    const avgTimes = compareData.map(d => d.avgTime);
    const errors = compareData.map(d => d.sem || 0);

    if (state.charts.comparison) {
        state.charts.comparison.destroy();
    }

    state.charts.comparison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: `${metric} (ms)`,
                data: avgTimes,
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2,
                errorBars: {
                    plus: errors,
                    minus: errors
                }
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
                title: {
                    display: true,
                    text: `Comparison of ${metric} across selected tests`
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Time (ms)' }
                },
                x: {
                    ticks: { maxRotation: 45, minRotation: 45 }
                }
            }
        }
    });

    showNotification('Comparison chart generated!', 'success');
}

// Tab switching
function handleTabSwitch(event) {
    const targetTab = event.target.dataset.tab;

    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(targetTab).classList.add('active');

    // Generate trends chart when switching to trends tab
    if (targetTab === 'trends') {
        updateTrendsChart();
    }
}

// Update trends chart
function updateTrendsChart() {
    const ctx = document.getElementById('trendsChart').getContext('2d');

    // Group by test and sort by time
    const testsWithTime = state.filteredData.filter(d => d.earliestTime);

    // Get unique tests
    const testNames = [...new Set(testsWithTime.map(d => d.testName))].slice(0, 10);

    const datasets = testNames.map((testName, index) => {
        const testData = testsWithTime
            .filter(d => d.testName === testName && d.metric === 'TTRL')
            .sort((a, b) => new Date(a.earliestTime) - new Date(b.earliestTime));

        return {
            label: testName,
            data: testData.map(d => ({
                x: d.earliestTime,
                y: d.avgTime
            })),
            borderColor: `hsl(${index * 360 / testNames.length}, 70%, 50%)`,
            backgroundColor: `hsla(${index * 360 / testNames.length}, 70%, 50%, 0.1)`,
            borderWidth: 2,
            tension: 0.4
        };
    });

    if (state.charts.trends) {
        state.charts.trends.destroy();
    }

    state.charts.trends = new Chart(ctx, {
        type: 'line',
        data: { datasets },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'right' },
                title: {
                    display: true,
                    text: 'Performance Trends Over Time (TTRL)'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Time (ms)' }
                },
                x: {
                    type: 'time',
                    time: { unit: 'hour' },
                    title: { display: true, text: 'Time' }
                }
            }
        }
    });
}

// Show comparison modal
function showComparisonModal() {
    showNotification('Select multiple tests from the list and click "Generate Comparison"', 'info');
    document.querySelector('[data-tab="comparison"]').click();
}

// Export to CSV
function exportToCSV() {
    const headers = ['Test Name', 'App', 'Throttle', 'Metric', 'Avg Time (ms)', 'SEM', 'Min', 'Max', 'Runs'];
    const rows = state.filteredData.map(item => [
        item.testName,
        item.app,
        item.throttle,
        item.metric,
        item.avgTime.toFixed(0),
        item.sem ? item.sem.toFixed(0) : '',
        item.minValue ? item.minValue.toFixed(0) : '',
        item.maxValue ? item.maxValue.toFixed(0) : '',
        item.repeats || ''
    ]);

    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-export-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showNotification('CSV exported successfully!', 'success');
}

// Show notification
function showNotification(message, type = 'info') {
    // Simple alert for now - can be enhanced with a proper notification system
    console.log(`[${type.toUpperCase()}] ${message}`);

    // You could implement a toast notification here
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };

    // Create a simple toast
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add CSS animations for toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);
