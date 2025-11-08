# Performance Comparison Report

**Generated:** 2025-11-06T19:20:00.634Z

**Baseline:** baseline/baseline-jan2025.jsonl
**Current:** baseline/baseline-nov2025.jsonl

## Summary

- ⚠️  **Regressions:** 6
- ⚡ **Major Improvements:** 31
- 🔻 **Slightly Slower:** 0
- 🔺 **Slightly Faster:** 19
- ➡️  **Unchanged:** 40
- 🆕 **New Tests:** 0
- ❌ **Removed Tests:** 0

## ⚠️ Regressions

| Test | Metric | Baseline Median | Current Median | Change | Status |
|------|--------|-----------------|----------------|--------|--------|
| scix.and-search.normal | FCP | 620ms | 778ms | +25.48% | ⚠️ REGRESSION |
| scix.bibcode-search.normal | FCP | 566ms | 716ms | +26.5% | ⚠️ REGRESSION |
| scix.first-author.normal | FCP | 636ms | 894ms | +40.57% | ⚠️ REGRESSION |
| scix.citations.normal | FCP | 728ms | 856ms | +17.58% | ⚠️ REGRESSION |
| scix.title-keyword.normal | FCP | 626ms | 842ms | +34.5% | ⚠️ REGRESSION |
| scix.abstract-keyword.normal | FCP | 680ms | 926ms | +36.18% | ⚠️ REGRESSION |

## ⚡ Major Improvements

| Test | Metric | Baseline Median | Current Median | Change | Status |
|------|--------|-----------------|----------------|--------|--------|
| scix.year-range.normal | TTSBI | 2822.8ms | 2371.6ms | -15.98% | ✅ IMPROVED |
| scix.year-range.normal | TTFB | 144.6ms | 84.4ms | -41.63% | ✅ IMPROVED |
| scix.and-search.normal | TTSBI | 2769.2ms | 2367.1ms | -14.52% | ✅ IMPROVED |
| scix.and-search.normal | TTFB | 156.3ms | 85.8ms | -45.11% | ✅ IMPROVED |
| scix.bibcode-search.normal | TTSBI | 2654.1ms | 2263.4ms | -14.72% | ✅ IMPROVED |
| scix.bibcode-search.normal | TTFB | 150.8ms | 83.1ms | -44.89% | ✅ IMPROVED |
| scix.first-author.normal | TTFB | 153.2ms | 86ms | -43.86% | ✅ IMPROVED |
| scix.citations.normal | TTSBI | 2868.7ms | 2439.3ms | -14.97% | ✅ IMPROVED |
| scix.citations.normal | TTFB | 151.9ms | 81.6ms | -46.28% | ✅ IMPROVED |
| scix.title-keyword.normal | TTSBI | 2797.2ms | 2446.8ms | -12.53% | ✅ IMPROVED |
| scix.title-keyword.normal | TTFB | 147.1ms | 82.1ms | -44.19% | ✅ IMPROVED |
| scix.abstract-keyword.normal | TTSBI | 2880.2ms | 2454.7ms | -14.77% | ✅ IMPROVED |
| scix.abstract-keyword.normal | TTFB | 154.7ms | 83.6ms | -45.96% | ✅ IMPROVED |
| scix.full-text.normal | TTSBI | 2829.1ms | 2447.2ms | -13.5% | ✅ IMPROVED |
| scix.full-text.normal | TTFB | 152.1ms | 81.4ms | -46.48% | ✅ IMPROVED |
| scix.bibcode-search.6x-cpu | TTFB | 150.6ms | 79.2ms | -47.41% | ✅ IMPROVED |
| scix.year-range.6x-cpu | FCP | 1308ms | 900ms | -31.19% | ✅ IMPROVED |
| scix.year-range.6x-cpu | TTFB | 150.5ms | 85.8ms | -42.99% | ✅ IMPROVED |
| scix.title-keyword.6x-cpu | TTFB | 152.8ms | 81.3ms | -46.79% | ✅ IMPROVED |
| scix.abstract-keyword.6x-cpu | TTFB | 151.3ms | 79.3ms | -47.59% | ✅ IMPROVED |
| scix.first-author.6x-cpu | TTFB | 149.4ms | 82.6ms | -44.71% | ✅ IMPROVED |
| scix.citations.6x-cpu | TTFB | 156.9ms | 85.1ms | -45.76% | ✅ IMPROVED |
| scix.and-search.6x-cpu | TTFB | 149.6ms | 81.9ms | -45.25% | ✅ IMPROVED |
| scix.full-text.6x-cpu | TTFB | 151.1ms | 81.6ms | -46% | ✅ IMPROVED |
| scix.year-range.6x-cpu | TTRS | 22042.5ms | 19618.5ms | -11% | ✅ IMPROVED |
| scix.title-keyword.6x-cpu | TTRS | 22101.7ms | 19473ms | -11.89% | ✅ IMPROVED |
| scix.citations.6x-cpu | TTRS | 23105.4ms | 20666.8ms | -10.55% | ✅ IMPROVED |
| scix.and-search.6x-cpu | TTRR | 4707.8ms | 3547.7ms | -24.64% | ✅ IMPROVED |
| scix.full-text.6x-cpu | TTRS | 22533.6ms | 20038.4ms | -11.07% | ✅ IMPROVED |
| scix.first-author.6x-cpu | TTRR | 5348.2ms | 3098.7ms | -42.06% | ✅ IMPROVED |
| scix.title-keyword.6x-cpu | TTRR | 6053.7ms | 1741.4ms | -71.23% | ✅ IMPROVED |

## 📊 Minor Changes (Not Statistically Significant)

| Test | Metric | Baseline Median | Current Median | Change |
|------|--------|-----------------|----------------|--------|
| scix.year-range.normal | TTRL | 6891.2ms | 6304ms | 🔺 -8.52% |
| scix.and-search.normal | TTRL | 6795.9ms | 6342ms | 🔺 -6.68% |
| scix.and-search.normal | TTRR | 1169.1ms | 1098.1ms | 🔺 -6.07% |
| scix.bibcode-search.normal | TTRL | 5966.4ms | 5502.5ms | 🔺 -7.78% |
| scix.first-author.normal | TTSBI | 2824ms | 2561.2ms | 🔺 -9.31% |
| scix.first-author.normal | TTRL | 7011.6ms | 6634.3ms | 🔺 -5.38% |
| scix.citations.normal | TTRL | 7384.4ms | 6804.9ms | 🔺 -7.85% |
| scix.citations.normal | TTRR | 1324.9ms | 1207ms | 🔺 -8.9% |
| scix.title-keyword.normal | TTRL | 6970.6ms | 6523.3ms | 🔺 -6.42% |
| scix.title-keyword.normal | TTRR | 1365.7ms | 1235ms | 🔺 -9.57% |
| scix.abstract-keyword.normal | TTRL | 7235.3ms | 6693.3ms | 🔺 -7.49% |
| scix.abstract-keyword.normal | TTRR | 1420.1ms | 1346.3ms | 🔺 -5.2% |
| scix.full-text.normal | TTRL | 7067.3ms | 6647.6ms | 🔺 -5.94% |
| scix.and-search.6x-cpu | TTRS | 20364.6ms | 18812.3ms | 🔺 -7.62% |
| scix.title-keyword.6x-cpu | TTRL | 38607.1ms | 36661.8ms | 🔺 -5.04% |
| scix.abstract-keyword.6x-cpu | TTRS | 22784.6ms | 20533ms | 🔺 -9.88% |
| scix.abstract-keyword.6x-cpu | TTRL | 39193.3ms | 37172.5ms | 🔺 -5.16% |
| scix.first-author.6x-cpu | TTRS | 21783ms | 19805.4ms | 🔺 -9.08% |
| scix.full-text.6x-cpu | TTRL | 39310.2ms | 36926.3ms | 🔺 -6.06% |

## 📈 Detailed Statistics

| Test | Metric | Baseline (median ± σ) | Current (median ± σ) | P95 Change | Sample Sizes |
|------|--------|-----------------------|----------------------|------------|--------------|
| scix.year-range.normal | TTSBI | 2822.8ms ± 438.5ms | 2371.6ms ± 351ms | -21.2% | 104 → 120 |
| scix.year-range.normal | FCP | 696ms ± 236.9ms | 760ms ± 255.4ms | +3.4% | 104 → 120 |
| scix.year-range.normal | TTFB | 144.6ms ± 52.3ms | 84.4ms ± 33ms | -35.8% | 104 → 120 |
| scix.year-range.normal | TTRS | 2593.2ms ± 397.8ms | 2468.2ms ± 414.8ms | +2.2% | 104 → 120 |
| scix.year-range.normal | TTRL | 6891.2ms ± 699.1ms | 6304ms ± 598.1ms | -7.8% | 104 → 120 |
| scix.year-range.normal | TTRR | 1149.1ms ± 175.5ms | 1204.1ms ± 174ms | -3.3% | 104 → 120 |
| scix.and-search.normal | TTSBI | 2769.2ms ± 442.8ms | 2367.1ms ± 312.9ms | -17% | 104 → 120 |
| scix.and-search.normal | FCP | 620ms ± 214.6ms | 778ms ± 226.5ms | +12.3% | 104 → 120 |
| scix.and-search.normal | TTFB | 156.3ms ± 56.5ms | 85.8ms ± 24.3ms | -53.4% | 104 → 120 |
| scix.and-search.normal | TTRS | 2636.7ms ± 454.2ms | 2526.5ms ± 409.9ms | -1.7% | 104 → 120 |
| scix.and-search.normal | TTRL | 6795.9ms ± 761.6ms | 6342ms ± 595.4ms | -9.1% | 104 → 120 |
| scix.and-search.normal | TTRR | 1169.1ms ± 151.8ms | 1098.1ms ± 131.7ms | -9.8% | 104 → 120 |
| scix.bibcode-search.normal | TTSBI | 2654.1ms ± 370.8ms | 2263.4ms ± 405.4ms | -9.3% | 104 → 121 |
| scix.bibcode-search.normal | FCP | 566ms ± 172.6ms | 716ms ± 269.5ms | +13.4% | 104 → 120 |
| scix.bibcode-search.normal | TTFB | 150.8ms ± 55.4ms | 83.1ms ± 31.3ms | -41.3% | 104 → 120 |
| scix.bibcode-search.normal | TTRS | 1780.3ms ± 347.3ms | 1706.1ms ± 363.6ms | -0.5% | 104 → 120 |
| scix.bibcode-search.normal | TTRL | 5966.4ms ± 666.4ms | 5502.5ms ± 641.4ms | -3.9% | 104 → 120 |
| scix.bibcode-search.normal | TTRR | 1140.4ms ± 142.4ms | 1121.2ms ± 144ms | -5.1% | 104 → 120 |
| scix.first-author.normal | TTSBI | 2824ms ± 384.3ms | 2561.2ms ± 395.7ms | -9.7% | 105 → 120 |
| scix.first-author.normal | FCP | 636ms ± 214.5ms | 894ms ± 273.8ms | +25.4% | 105 → 120 |
| scix.first-author.normal | TTFB | 153.2ms ± 57.6ms | 86ms ± 41.1ms | -45.4% | 105 → 120 |
| scix.first-author.normal | TTRS | 2793.8ms ± 441ms | 2706.3ms ± 439.4ms | -5.2% | 104 → 120 |
| scix.first-author.normal | TTRL | 7011.6ms ± 734.4ms | 6634.3ms ± 743.7ms | -5.5% | 104 → 120 |
| scix.first-author.normal | TTRR | 1253ms ± 177.7ms | 1205.1ms ± 205.8ms | +0.1% | 104 → 120 |
| scix.citations.normal | TTSBI | 2868.7ms ± 426.7ms | 2439.3ms ± 434.5ms | -8.8% | 104 → 120 |
| scix.citations.normal | FCP | 728ms ± 231.9ms | 856ms ± 271.7ms | +14% | 104 → 120 |
| scix.citations.normal | TTFB | 151.9ms ± 64.5ms | 81.6ms ± 16.2ms | -61.7% | 104 → 120 |
| scix.citations.normal | TTRS | 3002.7ms ± 483.6ms | 2908.4ms ± 444.9ms | -5.7% | 104 → 120 |
| scix.citations.normal | TTRL | 7384.4ms ± 830.4ms | 6804.9ms ± 682.9ms | -10.4% | 104 → 120 |
| scix.citations.normal | TTRR | 1324.9ms ± 266.3ms | 1207ms ± 201ms | -4.7% | 104 → 120 |
| scix.title-keyword.normal | TTSBI | 2797.2ms ± 379.2ms | 2446.8ms ± 364.2ms | -14.6% | 104 → 120 |
| scix.title-keyword.normal | FCP | 626ms ± 241.4ms | 842ms ± 264.1ms | +15.3% | 104 → 120 |
| scix.title-keyword.normal | TTFB | 147.1ms ± 72.5ms | 82.1ms ± 34.9ms | -51.1% | 104 → 120 |
| scix.title-keyword.normal | TTRS | 2740.2ms ± 448.7ms | 2624.7ms ± 431.5ms | -5.3% | 104 → 120 |
| scix.title-keyword.normal | TTRL | 6970.6ms ± 694.8ms | 6523.3ms ± 680.1ms | -8.5% | 104 → 120 |
| scix.title-keyword.normal | TTRR | 1365.7ms ± 195.4ms | 1235ms ± 186ms | -9.6% | 104 → 120 |
| scix.abstract-keyword.normal | TTSBI | 2880.2ms ± 416.1ms | 2454.7ms ± 376ms | -13.3% | 104 → 120 |
| scix.abstract-keyword.normal | FCP | 680ms ± 285.6ms | 926ms ± 292.2ms | +6% | 104 → 120 |
| scix.abstract-keyword.normal | TTFB | 154.7ms ± 56.9ms | 83.6ms ± 38.9ms | -37.8% | 104 → 120 |
| scix.abstract-keyword.normal | TTRS | 2906.4ms ± 434.7ms | 2769.2ms ± 430.7ms | -2.5% | 104 → 120 |
| scix.abstract-keyword.normal | TTRL | 7235.3ms ± 701.7ms | 6693.3ms ± 659.2ms | -8.8% | 104 → 120 |
| scix.abstract-keyword.normal | TTRR | 1420.1ms ± 270.9ms | 1346.3ms ± 201.5ms | -6.7% | 104 → 120 |
| scix.full-text.normal | TTSBI | 2829.1ms ± 450.5ms | 2447.2ms ± 388.3ms | -11.6% | 104 → 120 |
| scix.full-text.normal | FCP | 606ms ± 263.7ms | 756ms ± 247.1ms | -1.7% | 104 → 119 |
| scix.full-text.normal | TTFB | 152.1ms ± 51ms | 81.4ms ± 28.8ms | -53.6% | 104 → 119 |
| scix.full-text.normal | TTRS | 2869.2ms ± 405.4ms | 2784.8ms ± 515.1ms | +6.1% | 104 → 119 |
| scix.full-text.normal | TTRL | 7067.3ms ± 698.8ms | 6647.6ms ± 772.1ms | -1.6% | 104 → 119 |
| scix.full-text.normal | TTRR | 1385.6ms ± 241.1ms | 1312ms ± 269.1ms | +3% | 104 → 119 |
| scix.bibcode-search.6x-cpu | TTSBI | 13263.8ms ± 1535.2ms | 13421.4ms ± 1580.9ms | +1.2% | 125 → 149 |
| scix.bibcode-search.6x-cpu | FCP | 992ms ± 208ms | 780ms ± 674ms | +101.2% | 125 → 149 |
| scix.bibcode-search.6x-cpu | TTFB | 150.6ms ± 61.7ms | 79.2ms ± 29.4ms | -44.2% | 125 → 149 |
| scix.bibcode-search.6x-cpu | TTRS | 14303.6ms ± 2100.4ms | 13673.1ms ± 2087.7ms | -5.4% | 125 → 148 |
| scix.bibcode-search.6x-cpu | TTRL | 31416.3ms ± 2540.6ms | 31330.3ms ± 3218.7ms | -0.8% | 125 → 148 |
| scix.bibcode-search.6x-cpu | TTRR | 4517ms ± 732.6ms | 4046.6ms ± 1425.8ms | +26.8% | 116 → 125 |
| scix.year-range.6x-cpu | TTSBI | 13624.1ms ± 1712ms | 13889.2ms ± 1661.5ms | -3.4% | 206 → 236 |
| scix.year-range.6x-cpu | FCP | 1308ms ± 768.8ms | 900ms ± 1093.2ms | +31.8% | 205 → 235 |
| scix.year-range.6x-cpu | TTFB | 150.5ms ± 62.3ms | 85.8ms ± 25.8ms | -49.1% | 205 → 235 |
| scix.title-keyword.6x-cpu | TTSBI | 13057.2ms ± 1548.8ms | 13476.3ms ± 1674.7ms | +2.6% | 205 → 236 |
| scix.title-keyword.6x-cpu | FCP | 1074ms ± 489.3ms | 826ms ± 803.6ms | +106.2% | 204 → 236 |
| scix.title-keyword.6x-cpu | TTFB | 152.8ms ± 87.2ms | 81.3ms ± 23.2ms | -54.7% | 204 → 236 |
| scix.abstract-keyword.6x-cpu | TTSBI | 13170.1ms ± 1899.6ms | 13543ms ± 1604.2ms | -6.4% | 204 → 233 |
| scix.abstract-keyword.6x-cpu | FCP | 1072ms ± 638.7ms | 818ms ± 889.3ms | +56% | 204 → 232 |
| scix.abstract-keyword.6x-cpu | TTFB | 151.3ms ± 71.2ms | 79.3ms ± 23.2ms | -55% | 204 → 232 |
| scix.first-author.6x-cpu | TTSBI | 13408.6ms ± 1585.6ms | 13770.8ms ± 1615.2ms | +3.3% | 205 → 235 |
| scix.first-author.6x-cpu | FCP | 1060ms ± 362.9ms | 844ms ± 855.3ms | +91.1% | 205 → 235 |
| scix.first-author.6x-cpu | TTFB | 149.4ms ± 68.1ms | 82.6ms ± 29.1ms | -52.7% | 205 → 235 |
| scix.citations.6x-cpu | TTSBI | 13379.5ms ± 1565.2ms | 13905.2ms ± 1741.4ms | +2.9% | 201 → 235 |
| scix.citations.6x-cpu | FCP | 1124ms ± 675.2ms | 824ms ± 977.9ms | +44.7% | 200 → 234 |
| scix.citations.6x-cpu | TTFB | 156.9ms ± 64.8ms | 85.1ms ± 25ms | -55.3% | 200 → 234 |
| scix.and-search.6x-cpu | TTSBI | 13189.1ms ± 1520.6ms | 13691.2ms ± 1636.3ms | +1.7% | 203 → 234 |
| scix.and-search.6x-cpu | FCP | 1058ms ± 360.1ms | 832ms ± 634.1ms | +74.7% | 202 → 233 |
| scix.and-search.6x-cpu | TTFB | 149.6ms ± 64.2ms | 81.9ms ± 22.8ms | -51.5% | 202 → 233 |
| scix.full-text.6x-cpu | TTSBI | 13448.3ms ± 1676.7ms | 13589.6ms ± 1727.6ms | +2.5% | 204 → 233 |
| scix.full-text.6x-cpu | FCP | 1052ms ± 653.1ms | 888ms ± 1066.9ms | +69.9% | 203 → 231 |
| scix.full-text.6x-cpu | TTFB | 151.1ms ± 67.6ms | 81.6ms ± 30.1ms | -52.8% | 203 → 231 |
| scix.and-search.6x-cpu | TTRS | 20364.6ms ± 2193ms | 18812.3ms ± 2263.9ms | -9.6% | 159 → 181 |
| scix.and-search.6x-cpu | TTRL | 37470.9ms ± 2362.1ms | 36435.3ms ± 3202.1ms | -2.6% | 159 → 181 |
| scix.year-range.6x-cpu | TTRS | 22042.5ms ± 2176.2ms | 19618.5ms ± 2396.5ms | -9.1% | 138 → 129 |
| scix.year-range.6x-cpu | TTRL | 38669.4ms ± 2604.4ms | 37065.7ms ± 3461.1ms | -5.5% | 138 → 129 |
| scix.title-keyword.6x-cpu | TTRS | 22101.7ms ± 2178.6ms | 19473ms ± 2425.4ms | -13.9% | 130 → 103 |
| scix.title-keyword.6x-cpu | TTRL | 38607.1ms ± 2298.9ms | 36661.8ms ± 3538.7ms | -7.2% | 130 → 103 |
| scix.abstract-keyword.6x-cpu | TTRS | 22784.6ms ± 2502.5ms | 20533ms ± 2761.7ms | -16.6% | 70 → 66 |
| scix.abstract-keyword.6x-cpu | TTRL | 39193.3ms ± 2564.9ms | 37172.5ms ± 4268ms | -6.4% | 70 → 66 |
| scix.citations.6x-cpu | TTRS | 23105.4ms ± 2162.2ms | 20666.8ms ± 3283.8ms | -12.2% | 51 → 49 |
| scix.citations.6x-cpu | TTRL | 39410.7ms ± 2303.7ms | 37812ms ± 5151.9ms | -3% | 51 → 49 |
| scix.and-search.6x-cpu | TTRR | 4707.8ms ± 668.8ms | 3547.7ms ± 860.2ms | -40.1% | 9 → 5 |
| scix.first-author.6x-cpu | TTRS | 21783ms ± 2532.1ms | 19805.4ms ± 2357.7ms | -12.2% | 119 → 111 |
| scix.first-author.6x-cpu | TTRL | 38884.4ms ± 2569.4ms | 37096.4ms ± 3387.3ms | -5.2% | 119 → 111 |
| scix.full-text.6x-cpu | TTRS | 22533.6ms ± 2170.6ms | 20038.4ms ± 2647.8ms | -11.6% | 96 → 90 |
| scix.full-text.6x-cpu | TTRL | 39310.2ms ± 2350.1ms | 36926.3ms ± 3928.6ms | -5.2% | 96 → 90 |
| scix.year-range.6x-cpu | TTRR | 4314.5ms ± 962.5ms | 5865.2ms ± 3584.9ms | +81.3% | 7 → 4 |
| scix.abstract-keyword.6x-cpu | TTRR | 5710.2ms ± 0ms | 4545.6ms ± 2774.3ms | +28.2% | 1 → 2 |
| scix.citations.6x-cpu | TTRR | 6150.6ms ± 0ms | 3854.4ms ± 2622.1ms | +22.7% | 1 → 3 |
| scix.first-author.6x-cpu | TTRR | 5348.2ms ± 0ms | 3098.7ms ± 1345.4ms | -16.9% | 1 → 2 |
| scix.title-keyword.6x-cpu | TTRR | 6053.7ms ± 0ms | 1741.4ms ± 0ms | -71.2% | 1 → 1 |
| scix.full-text.6x-cpu | TTRR | 6213ms ± 0ms | 4085ms ± 2422.4ms | +4.7% | 1 → 2 |
