// Amplitude Analytics - Resteeped Web
// Platform: "web" to differentiate from mobile app
(function() {
  var API_KEY = '6fd906d7c65b96543a683b332461044b';

  // Load Amplitude Browser SDK via CDN
  var script = document.createElement('script');
  script.src = 'https://cdn.amplitude.com/libs/analytics-browser-2.11.0-min.js.gz';
  script.onload = function() {
    amplitude.init(API_KEY, undefined, {
      autocapture: {
        pageViews: true,
        sessions: true,
        formInteractions: true,
        fileDownloads: true
      }
    });

    // Set platform to differentiate from mobile app
    var identify = new amplitude.Identify();
    identify.set('platform', 'web');
    identify.set('source', 'resteeped.com');
    amplitude.identify(identify);

    // Track page view with extra context
    amplitude.track('Page Viewed', {
      platform: 'web',
      page_path: window.location.pathname,
      page_title: document.title,
      referrer: document.referrer || undefined
    });
  };
  document.head.appendChild(script);
})();

  // Track App Store CTA clicks
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a[href*="apps.apple.com"]');
    if (link) {
      amplitude.track('App Store CTA Clicked', {
        platform: 'web',
        page_path: window.location.pathname,
        page_title: document.title,
        link_text: (link.textContent || '').trim().substring(0, 100),
        link_url: link.href
      });
    }
  });
