(function () {
  function loadMaster() {
    var request = new XMLHttpRequest();
    request.open('GET', 'static/data/musics.json?v=4', false);
    request.send(null);

    if ((request.status >= 200 && request.status < 300) || request.status === 0) {
      return JSON.parse(request.responseText);
    }

    throw new Error('Polaris master JSON load failed: ' + request.status);
  }

  try {
    window.POLARIS_MASTER = loadMaster();
  } catch (error) {
    console.error(error);
    window.POLARIS_MASTER = window.POLARIS_MASTER || {};
  }
})();
