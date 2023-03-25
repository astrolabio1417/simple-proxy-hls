/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npx wrangler dev src/index.js` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npx wrangler publish src/index.js --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const pathnames = url.pathname.split("/").filter((a) => a);
        const pathLength = pathnames.length;

        if (pathLength === 1) {
            const url = atob(pathnames[0], "base64");
            const splitUrl = url.split("/");
            splitUrl.splice(splitUrl.length - 1, 1);
            const masterUrl = splitUrl.join("/");

            const response = await fetch(url, {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
                },
            });
            const contentType = response.headers.get("Content-Type");
            console.log("====================================");
            console.log(response.status, contentType);
            console.log("====================================");
            const videoContentType = [
                "video/mp2t",
                "image/jpg",
                "text/css",
                "font/ttf",
                "text/vtt",
                "text/srt",
                "font/woff",
                "text/html",
                "text/javascript",
                "image/svg+xml",
                "image/x-icon",
            ];

            if (videoContentType.includes(contentType)) {
                console.log("====================================");
                console.log("video!");
                console.log("====================================");
                const videoRepsonse = new Response(response.body, {
                    status: response.status,
                    headers: corsHeaders,
                });
                const requiredVideoHeaders = [
                    "Accept-Ranges",
                    "Content-Length",
                    "Content-Type",
                ];
                requiredVideoHeaders.forEach((header) => {
                    const headerValue = response.headers.get(header);
                    if (!headerValue) return;
                    videoRepsonse.headers.append(header, headerValue);
                });
                return videoRepsonse;
            }

            if (contentType !== "application/vnd.apple.mpegurl") {
                return new Response("error!");
            }

            let text = await response.text();

            if (text.startsWith("#EXTM3U")) {
                const splitLines = text.split("\n").filter((a) => a);
                splitLines.forEach((lineText, index) => {
                    if (lineText.startsWith("#EXT")) return;
                    splitLines[index] = masterUrl + "/" + lineText;
                    splitLines[index] = btoa(splitLines[index]);
                });
                text = splitLines.join("\n");
            }

            const r = new Response(text, {
                status: response.status,
                headers: corsHeaders,
            });

            const requiredHeaders = [
                "content-type",
                "vary",
                "Accept-Ranges",
                "Content-Length",
            ];

            requiredHeaders.forEach((header) => {
                r.headers.append(header, response.headers[header] ?? "");
            });

            return r;
        }

        return new Response(
            JSON.stringify({ pathname: url.pathname, length: pathLength })
        );
    },
};
