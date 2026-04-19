self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", (event) => event.waitUntil(clients.claim()))

self.addEventListener("fetch", (event) => {
	const url = new URL(event.request.url)
	const path = url.pathname

	if (path.includes("test")) {
		if (path.endsWith(".html")) {
			const text = `<script src="test.js"></script><link rel="stylesheet" href="test.css"><h1>見出し</h1><p>本文</p>`
			event.respondWith(new Response(text, {
				headers: { "Content-Type": "text/html" }
			}))
		} else if (path.endsWith(".css")) {
			const text = `p { color: red }`
			event.respondWith(new Response(text, {
				headers: { "Content-Type": "text/css" }
			}))
		} else if (path.endsWith(".js")) {
			const text = `console.log("js")`
			event.respondWith(new Response(text, {
				headers: { "Content-Type": "application/javascript" }
			}))
		}
	}
})
