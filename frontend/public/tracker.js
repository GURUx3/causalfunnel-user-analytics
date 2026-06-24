// User Analytics Tracker Script

(function () {

  var SESSION_KEY = 'ua_session_id';
  var apiUrl = window.USER_ANALYTICS_ENDPOINT || 'http://localhost:5000/api/events';

  // generate a random session id
  function generateSessionId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    // backup method if randomUUID is not supported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      var v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // check localStorage for existing session, otherwise create new one
  function getSessionId() {
    try {
      var id = localStorage.getItem(SESSION_KEY);
      if (id) {
        return id;
      }

      id = generateSessionId();
      localStorage.setItem(SESSION_KEY, id);
      return id;
    } catch (e) {
      return generateSessionId();
    }
  }

  function getPageUrl() {
    return window.location.pathname + window.location.search;
  }

  // post event to backend api
  function sendEvent(data) {
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      keepalive: true
    }).catch(function () {
      // dont break the website if api fails
    });
  }

  function trackPageView(sessionId) {
    var eventData = {
      sessionId: sessionId,
      eventType: 'page_view',
      pageUrl: getPageUrl(),
      timestamp: new Date().toISOString()
    };
    sendEvent(eventData);
  }

  function trackClick(sessionId, e) {
    var eventData = {
      sessionId: sessionId,
      eventType: 'click',
      pageUrl: getPageUrl(),
      timestamp: new Date().toISOString(),
      x: e.clientX,
      y: e.clientY
    };
    sendEvent(eventData);
  }

  function init() {
    var sessionId = getSessionId();

    // track when user lands on page
    trackPageView(sessionId);

    // track every click on the page
    document.addEventListener('click', function (e) {
      trackClick(sessionId, e);
    });
  }

  // run after dom is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
