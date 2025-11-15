/**
 * Browsertime Pre-Script
 * Runs before each URL is tested to set up local storage and cookies
 */

module.exports = async function(context) {
  // Get the URL we're about to test
  const testUrl = context.url;

  // Check if this is a SciX URL
  if (testUrl && testUrl.includes('scixplorer.org')) {
    context.log.info('Setting local storage for SciX to dismiss banner...');

    try {
      // Navigate to the domain first (needed to set local storage)
      await context.selenium.driver.get('https://scixplorer.org');

      // Set the local storage key to dismiss the banner
      await context.selenium.driver.executeScript(
        `localStorage.setItem('last-sys-msg', '<p style="font-size: 1.25em;">&#127881 Please come celebrate our birthday! <a href="https://www.scixplorer.org/scixblog/scix-launch">SciX</a> has officially <a href="https://science.data.nasa.gov/features-events/scix-launch">launched</a> on September 29, 2025. Read more <a href="https://www.cfa.harvard.edu/news/new-nasa-backed-research-platform-scix-expands-open-science">here</a>! &#127881</p>');`
      );

      context.log.info('Local storage set successfully for SciX');
    } catch (e) {
      context.log.error('Failed to set local storage for SciX:', e);
    }
  }

  // Return to let browsertime continue with the actual test
  return;
};
