const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');
const path = require('path');

// File paths
const inputFilePath = path.join(__dirname, 'perf-results/performance-results.json');
const outputFilePath = path.join(__dirname, 'aggregated_averages.csv');

// Read JSON data
const rawData = fs.readFileSync(inputFilePath);
const data = JSON.parse(rawData);

// Prepare a structure to hold aggregated averages
const averages = {};

// Extract and aggregate average timings
data.forEach(item => {
  const [app, testName, throttling, timingName] = item.name.split('.');

  // Create a unique column name for each combination of app, throttling, and timing stage
  const columnName = `${app}_${throttling}_${timingName}`;

  // Initialize test name entry if it doesn't exist
  if (!averages[testName]) {
    averages[testName] = {};
  }

  // Store the average time for this combination
  averages[testName][columnName] = item.avgTime;
});

// Determine all unique column names (app-throttling-timing combinations)
const allColumns = Array.from(
  new Set(data.map(item => {
    const [app, , throttling, timingName] = item.name.split('.');
    return `${app}_${throttling}_${timingName}`;
  }))
);

// Create CSV headers
const headers = [{ id: 'test_name', title: 'Test Name' }];
allColumns.forEach(col => headers.push({ id: col, title: col }));

// Prepare data for CSV writing
const csvData = Object.entries(averages).map(([testName, times]) => {
  const row = { test_name: testName };
  allColumns.forEach(col => {
    row[col] = times[col] || ''; // Use empty string if timing data is missing
  });
  return row;
});

// Write to CSV
const csvWriter = createObjectCsvWriter({
  path: outputFilePath,
  header: headers
});

csvWriter.writeRecords(csvData)
.then(() => {
  console.log(`Aggregated data successfully written to ${outputFilePath}`);
})
.catch(error => {
  console.error('Error writing CSV file:', error);
});
