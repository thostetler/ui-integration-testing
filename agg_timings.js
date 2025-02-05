const fs = require('fs');
const readline = require('readline');
const { createObjectCsvWriter } = require('csv-writer');
const path = require('path');

// File paths
const inputFilePath = path.join(__dirname, 'perf-results/performance-log.txt');
const outputFilePath = path.join(__dirname, 'aggregated_averages.csv');

// Data structures to accumulate totals, counts, and run counts per test name
const averages = {};
const counts = {};
const runs = {};

// Function to process each timing line
const processItem = (timingJson) => {
  const { name, duration } = timingJson;
  const [app, testName, throttling, timingName] = name.split('.');

  // Build the keys
  const key = `${app}.${testName}.${throttling}.${timingName}`;
  const testKey = `${testName}`;

  // Initialize averages and counts if the key does not exist
  if (!averages[key]) {
    averages[key] = 0;
    counts[key] = 0;
  }

  // Add the duration to the cumulative sum and increase the count
  averages[key] += duration;
  counts[key] += 1;

  // Track the number of runs per test name and throttling type
  if (timingName === 'TTRL') {
    if (!runs[testKey]) {
      runs[testKey] = {};
    }
    if (!runs[testKey][throttling]) {
      runs[testKey][throttling] = { scix: 0, bbb: 0 };
    }
    runs[testKey][throttling][app] += 1;
  }
};

// Create read stream and process each line
const rl = readline.createInterface({
  input: fs.createReadStream(inputFilePath),
  crlfDelay: Infinity,
});

rl.on('line', (line) => {
  // Check if line is a timing line
  if (line.includes('name')) {
    const item = JSON.parse(line);

    if (item.name.includes('test-search') || item.name.includes('4x-slow-cpu')) {
      return;
    }

    processItem(item);
  }
});

rl.on('close', () => {
  // Dynamically generate headers based on the throttling types found
  const throttlingTypes = new Set(Object.keys(averages).map((key) => key.split('.')[2]));
  const headers = [
    { id: 'testName', title: 'Test Name' },
    ...Array.from(throttlingTypes).flatMap((throttling) => [
      { id: `scix_${throttling}_TTRL`, title: `scix_${throttling}_TTRL` },
      { id: `scix_${throttling}_TTSBI`, title: `scix_${throttling}_TTSBI` },
      { id: `scix_${throttling}_TTRS`, title: `scix_${throttling}_TTRS` },
      { id: `scix_${throttling}_TTRR`, title: `scix_${throttling}_TTRR` },
      { id: `bbb_${throttling}_TTRL`, title: `bbb_${throttling}_TTRL` },
      { id: `bbb_${throttling}_TTSBI`, title: `bbb_${throttling}_TTSBI` },
      { id: `bbb_${throttling}_TTRS`, title: `bbb_${throttling}_TTRS` },
      { id: `bbb_${throttling}_TTRR`, title: `bbb_${throttling}_TTRR` },
      { id: `scix_${throttling}_runCount`, title: `scix ${throttling} Number of Runs` },
      { id: `bbb_${throttling}_runCount`, title: `bbb ${throttling} Number of Runs` },
    ]),
  ];

  const csvWriter = createObjectCsvWriter({
    path: outputFilePath,
    header: headers,
  });

  const csvData = {};

  // Aggregate data by test name and throttling type
  Object.keys(averages).forEach((key) => {
    const [app, testName, throttling, timingName] = key.split('.');
    const testKey = `${testName}`;

    if (!csvData[testKey]) {
      csvData[testKey] = { testName: testName };
      // Initialize all timing and run count columns for each throttling type and app
      throttlingTypes.forEach((type) => {
        csvData[testKey][`scix_${type}_TTRL`] = null;
        csvData[testKey][`scix_${type}_TTSBI`] = null;
        csvData[testKey][`scix_${type}_TTRS`] = null;
        csvData[testKey][`scix_${type}_TTRR`] = null;
        csvData[testKey][`bbb_${type}_TTRL`] = null;
        csvData[testKey][`bbb_${type}_TTSBI`] = null;
        csvData[testKey][`bbb_${type}_TTRS`] = null;
        csvData[testKey][`bbb_${type}_TTRR`] = null;
        csvData[testKey][`scix_${type}_runCount`] = runs[testKey]?.[type]?.scix || 0;
        csvData[testKey][`bbb_${type}_runCount`] = runs[testKey]?.[type]?.bbb || 0;
      });
    }

    // Calculate the average duration for each timing type and assign to the correct column
    const average = averages[key] / counts[key];
    csvData[testKey][`${app}_${throttling}_${timingName}`] = average;
  });

  // Convert csvData to an array for writing to CSV
  const records = Object.values(csvData);

  csvWriter
    .writeRecords(records)
    .then(() => console.log('CSV file written successfully'))
    .catch((error) => console.error('Error writing CSV file', error));
});
