const unrestricted = new URL(self.location.href).searchParams.get("unrestricted") === "true"
const root = new URL("./", self.location.href)

const gist_id_regexp = /^[0-9a-f]{32}$/
const version_regexp = /^[0-9a-f]{40}|[0-9a-f]{64}$/

const safe_owners = ["0RIM0"]

const short_cache = 1000 * 60 * 60 * 24
const long_cache = 1000 * 60 * 60 * 24 * 365

self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", (event) => event.waitUntil(clients.claim()))

self.addEventListener("fetch", (event) => {
	const url = new URL(event.request.url)

	// gist path
	// {root}/{gist_id}/{filename}
	// {root}/{gist_id}/{version}/{filename}

	if (!url.pathname.startsWith(root.pathname)) return
	const parts = url.pathname.slice(root.pathname.length).split("/")
	const [gist_id, version, filename] = parts.length === 2
		? [parts[0], null, parts[1]]
		: parts.length === 3
			? parts
			: []

	if (!gist_id_regexp.test(gist_id)) return

	event.respondWith(
		Promise.try(async () => {
			const gist_res = await getFile(`https://api.github.com/gists/${gist_id}`, { cache_ms: short_cache })
			if (gist_res.status !== 200) return mkHTMLRes(gist_res.status)

			const gist = await gist_res.json()

			// 他人の Gist はデフォルトでは許可しない
			// unrestricted を付けたら無制限
			if (!unrestricted && !safe_owners.includes(gist.owner.login)) {
				return mkHTMLRes(403)
			}

			if (version) {
				// 過去版にのみあるファイルの可能性もあるので、現在の同名ファイルの URL からバージョンだけ変えるのではなく
				// 現在のバージョンの任意のファイルの URL からバージョンとファイル名を変えて URL を作る
				// content-type は現在のバージョンに同名ファイルがないと取得できないので拡張子から作る
				const url = new URL(Object.values(gist.files)[0].raw_url)
				url.pathname = url.pathname.split("/").with(-2, version).with(-1, filename)
				const res = await getFile(url.href, { content_type: autoType(filename), cache_ms: long_cache })
				return res.status === 200 ? res : mkHTMLRes(res.status)
			} else {
				const file = gist.files[filename]
				if (!file) {
					return mkHTMLRes(404)
				} else if (!file.truncated) {
					return new Response(file.content, { headers: { "Content-Type": file.type } })
				} else {
					const res = await getFile(file.raw_url, { content_type: file.type, cache_ms: long_cache })
					return res.status === 200 ? res : mkHTMLRes(res.status)
				}
			}
		})
	)
})

const autoType = (filename) => {
	const ext = filename.split(".").at(-1)
	return {
		"txt": "text/plain",
		"html": "text/html",
		"htm": "text/html",
		"css": "text/css",
		"js": "application/javascript",
		"cjs": "application/javascript",
		"mjs": "application/javascript",
		"ts": "video/mp2t",
		"tsx": "text/jsx",
		"json": "application/json",
		"yaml": "text/yaml",
		"yml": "text/yaml",
		"toml": "application/toml",
		"xml": "application/xml",
		"ini": "text/plain",
		"csv": "text/csv",
		"md": "text/markdown",
		"png": "image/png",
		"jpg": "image/jpeg",
		"jpeg": "image/jpeg",
		"gif": "image/gif",
		"webp": "image/webp",
		"avif": "image/avif",
		"bmp": "image/bmp",
		"tif": "image/tiff",
		"tiff": "image/tiff",
		"ico": "image/x-icon",
		"svg": "image/svg+xml",
		"pdf": "application/pdf",
		"zip": "application/zip",
		"mp3": "audio/mpeg",
		"wav": "audio/wav",
		"mp4": "video/mp4",
		"webm": "video/webm",
		"woff": "font/woff",
		"woff2": "font/woff2",
		"ttf": "font/ttf",
		"otf": "font/otf",
		"sh": "application/x-sh",
		"py": "text/x-python",
		"rb": "text/x-ruby",
		"php": "application/x-httpd-php",
		"sql": "application/sql",
		"wasm": "application/wasm",
		"tar": "application/x-tar",
		"gz": "application/gzip",
		"7z": "application/x-7z-compressed",
		"rar": "application/x-rar-compressed",
		"rtf": "application/rtf",
		"mov": "video/quicktime",
		"avi": "video/x-msvideo",
		"ogv": "video/ogg",
		"oga": "audio/ogg",
		"ogg": "audio/ogg",
	}[ext]
}

const getFile = async (url, { content_type, cache_ms }) => {
	const cache = await caches.open("cache")
	let res = await cache.match(url)

	if (res) {
		const cached_at = +res.headers.get("x-cached-at")
		if (Date.now() - cached_at > cache_ms) {
			await cache.delete(url)
			res = null
		}
	}

	if (!res) {
		const actual_res = await fetch(url)
		if (actual_res.status !== 200) return actual_res

		// header をカスタムして Response を作り直す
		const headers = new Headers(actual_res.headers)
		headers.set("x-cached-at", String(Date.now()))
		if (content_type) {
			headers.set("content-type", content_type)
		}

		res = new Response(actual_res.body, {
			status: actual_res.status,
			statusText: actual_res.statusText,
			headers: headers
		})

		await cache.put(url, res.clone())
	}

	return res
}

const mkHTMLRes = (status) => {
	return new Response(mkHTML(status), { status, headers: { "Content-Type": "text/html" } })
}

const mkHTML = (status) => `
<!doctype html>
<style>
body {
	margin: 0;
	width: 100vw;
	height: 100vh;
	display: grid;
	justify-items: center;
	align-items: center;
	font-size: 28px;
	font-weight: bold;
}
</style>
<main>${status}</main>
`
