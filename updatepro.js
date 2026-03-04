let fileTimes = new Map();

function getCurrentHTML() {
    return location.pathname.split("/").pop() || "index.html";
}

async function checkFile(file, type, element = null) {
    try {
        const res = await fetch(file, { method: "HEAD", cache: "no-store" });
        const lastMod = res.headers.get("Last-Modified");
        if (!lastMod) return;

        const old = fileTimes.get(file);

        if (old && old !== lastMod) {
            console.log("Muuttui:", file);

            // HTML ja JS → turvallinen reload
            if (type === "html" || type === "js") {
                location.reload();
                return;
            }

            // CSS → päivitä ilman reloadia
            if (type === "css" && element) {
                element.href = file + "?v=" + Date.now();
            }

            // Kuva → päivitä
            if (type === "img" && element) {
                element.src = file + "?v=" + Date.now();
            }

            // Video → päivitä ja säilytä toistoaika
            if (type === "video" && element) {
                const currentTime = element.currentTime;
                const wasPlaying = !element.paused;

                element.src = file + "?v=" + Date.now();
                element.load();

                element.addEventListener("loadedmetadata", () => {
                    element.currentTime = currentTime;
                    if (wasPlaying) element.play();
                }, { once: true });
            }
        }

        fileTimes.set(file, lastMod);

    } catch (e) {
        console.warn("Tarkistus epäonnistui:", file);
    }
}

async function loop() {

    // HTML
    await checkFile(getCurrentHTML(), "html");

    // CSS
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        const file = link.getAttribute("href").split("?")[0];
        checkFile(file, "css", link);
    });

    // JS
    document.querySelectorAll('script[src]').forEach(script => {
        const file = script.getAttribute("src").split("?")[0];
        checkFile(file, "js");
    });

    // Kuvat
    document.querySelectorAll('img').forEach(img => {
        const file = img.getAttribute("src").split("?")[0];
        checkFile(file, "img", img);
    });

    // Videot
    document.querySelectorAll('video').forEach(video => {
        const file = video.getAttribute("src")?.split("?")[0];
        if (file) checkFile(file, "video", video);
    });

    setTimeout(loop, 1000);
}

loop();
