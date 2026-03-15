/* (c) 2026 suuronenveeti. Licensed under GPLv3. Credit: https://github.com/suuronenveeti */
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

            if (type === "html" || type === "js") {
                location.reload();
                return;
            }

            if (type === "css" && element) {
                element.href = file + "?v=" + Date.now();
            }

            if (type === "img" && element) {
                element.src = file + "?v=" + Date.now();
            }

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

    await checkFile(getCurrentHTML(), "html");

    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        const file = link.getAttribute("href").split("?")[0];
        checkFile(file, "css", link);
    });

    document.querySelectorAll('script[src]').forEach(script => {
        const file = script.getAttribute("src").split("?")[0];
        checkFile(file, "js");
    });

    document.querySelectorAll('img').forEach(img => {
        const file = img.getAttribute("src").split("?")[0];
        checkFile(file, "img", img);
    });

    document.querySelectorAll('video').forEach(video => {
        const file = video.getAttribute("src")?.split("?")[0];
        if (file) checkFile(file, "video", video);
    });

    setTimeout(loop, 1000);
}

loop();
