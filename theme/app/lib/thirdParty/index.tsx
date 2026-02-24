export const initBazaarVoice = () => {
  let isLoaded = false;
  const readyQueue: any[] = [];
  window.crl8 = window.crl8 || {};
  window.crl8.ready = (fn) => (isLoaded ? fn() : readyQueue.push(fn));
  window.crl8.pixel =
    window.crl8.pixel ||
    function (this: any, ...args: any[]) {
      (this.q as any[]).push(args);
    };
  window.crl8.pixel.q = window.crl8.pixel.q || [];

  // Once the script is loaded
  isLoaded = true;
  readyQueue.forEach((fn) => fn());
};

export const JME622SizeChart = `window.sizeCharts = function(div_id) {
  var x = document.getElementById(div_id);
  if (x.style.display === "block") {
      x.style.display = "none";
  } else {
      x.style.display = "block";
  }
};
`;

export const initReferralCandy = () => {
  let isLoaded = false;
  const readyQueue: any[] = [];
  window.crl8 = window.crl8 || {};
  window.crl8.ready = (fn) => (isLoaded ? fn() : readyQueue.push(fn));
  window.crl8.pixel =
    window.crl8.pixel ||
    function (this: any, ...args: any[]) {
      (this.q as any[]).push(args);
    };
  window.crl8.pixel.q = window.crl8.pixel.q || [];

  // Once the script is loaded
  isLoaded = true;
  readyQueue.forEach((fn) => fn());
};
