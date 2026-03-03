let lastHTMLHash = "";
const imageModifiedTimes = new Map();
const cssModifiedTimes = new Map();

// Yksinkertainen hash funktio
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return hash;
}

// Tarkistaa HTML muutokset ja reloadaa vain jos muuttuu
async function checkHTML() {
    try {
        const res = await fetch('index.html', { cache: 'no-store' });
        const text = await res.text();
        const hash = simpleHash(text);

        if (lastHTMLHash && hash !== lastHTMLHash) {
            console.log("HTML muuttui → reload koko sivu");
            window.location.reload();
        }

        lastHTMLHash = hash;
    } catch (e) {
        console.error("HTML tarkistus epäonnistui:", e);
    }
}

// Päivittää kuvat vain jos tiedosto muuttuu
async function refreshImages() {
    const imgs = document.querySelectorAll('img');
    for (const img of imgs) {
        const src = img.src.split('?')[0];
        try {
            const res = await fetch(src, { method: 'HEAD', cache: 'no-store' });
            const lastMod = res.headers.get('Last-Modified');
            if (!lastMod) continue;

            const lastTime = imageModifiedTimes.get(img);
            if (lastTime !== lastMod) {
                img.src = src + '?v=' + Date.now();
                imageModifiedTimes.set(img, lastMod);
            }
        } catch (e) {
            console.error("Kuvan HEAD päivitys epäonnistui:", src, e);
        }
    }
}

// Päivittää CSS vain jos muuttuu
async function refreshCSS() {
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    for (const link of links) {
        const href = link.getAttribute('href').split('?')[0];
        try {
            const res = await fetch(href, { method: 'HEAD', cache: 'no-store' });
            const lastMod = res.headers.get('Last-Modified');
            if (!lastMod) continue;

            const lastTime = cssModifiedTimes.get(link);
            if (lastTime !== lastMod) {
                link.href = href + '?v=' + Date.now();
                cssModifiedTimes.set(link, lastMod);
            }
        } catch (e) {
            console.error("CSS HEAD päivitys epäonnistui:", href, e);
        }
    }
}

// Päälooppi – tarkistaa jatkuvasti, mutta vain oikeasti muuttuneet tiedostot
async function liveReloadLoop() {
    await checkHTML();
    await refreshCSS();
    await refreshImages();
    setTimeout(liveReloadLoop, 1000); // 1 sek välein lähes reaaliajassa
}

liveReloadLoop();
