(() => {
  const submitButton = document.getElementById("submitBtn");
  if (!submitButton) return;

  submitButton.addEventListener("click", () => {
    const destinations = (submitButton.dataset.destinations || "")
      .split(",")
      .map((destination) => destination.trim())
      .filter((destination) => {
        try {
          const url = new URL(destination);
          return url.protocol === "https:" || url.protocol === "http:";
        } catch {
          return false;
        }
      });

    if (destinations.length === 0) return;

    const destination = destinations[Math.floor(Math.random() * destinations.length)];
    window.location.assign(destination);
  });
})();
