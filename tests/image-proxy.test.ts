import test from "node:test";
import assert from "node:assert/strict";
import { validateImageUrl, encodeBase64Url, ALLOWED_IMAGE_HOSTS } from "../src/lib/image-sanitize";
import { GET } from "../src/app/img/asset/[encoded]/route";
import { NextRequest } from "next/server";

test("validateImageUrl - blocks non-allowlisted hosts", () => {
  const result = validateImageUrl("https://evil.com/avatar.png");
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /not in allowlist/);
  }
});

test("validateImageUrl - blocks http:// insecure URLs", () => {
  const result = validateImageUrl("http://images.fotmob.com/image.png");
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.reason, "Non-HTTPS protocol");
  }
});

test("validateImageUrl - blocks IP literals and loopback/private hosts", () => {
  const ipv4 = validateImageUrl("https://192.168.1.1/test.png");
  assert.equal(ipv4.ok, false);
  if (!ipv4.ok) {
    assert.match(ipv4.reason, /IP literal blocked/);
  }

  const loopback = validateImageUrl("https://127.0.0.1/secret.png");
  assert.equal(loopback.ok, false);

  const cloudMetadata = validateImageUrl("https://169.254.169.254/latest/meta-data");
  assert.equal(cloudMetadata.ok, false);

  const localhost = validateImageUrl("https://localhost/test.png");
  assert.equal(localhost.ok, false);
});

test("validateImageUrl - blocks URLs with userinfo/credentials", () => {
  const result = validateImageUrl("https://user:pass@images.fotmob.com/logo.png");
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /Credentials not allowed/);
  }
});

test("validateImageUrl - allows whitelisted hosts", () => {
  const fotmob = validateImageUrl("https://images.fotmob.com/image_resources/playerimages/123.png");
  assert.equal(fotmob.ok, true);

  const tm = validateImageUrl("https://img.a.transfermarkt.technology/wappen/head/123.png");
  assert.equal(tm.ok, true);

  const apiSports = validateImageUrl("https://media.api-sports.io/football/players/123.png");
  assert.equal(apiSports.ok, true);
});

test("ALLOWED_IMAGE_HOSTS contains all known legitimate image hosts across DB, dataset, and src", () => {
  const knownHosts = [
    "images.fotmob.com",
    "img.a.transfermarkt.technology",
    "www.transfermarkt.co.uk",
    "www.transfermarkt.com",
    "tmssl.akamaized.net",
    "media.api-sports.io",
    "qqjpgehtutdmkkkxnefu.supabase.co",
  ];

  for (const host of knownHosts) {
    const isAllowed = ALLOWED_IMAGE_HOSTS.some(
      (allowed) => host === allowed || host.endsWith("." + allowed)
    );
    assert.equal(isAllowed, true, `Expected host ${host} to be allowed`);

    const result = validateImageUrl(`https://${host}/test.png`);
    assert.equal(result.ok, true, `Expected URL for ${host} to validate successfully`);
  }
});

test("GET /img/asset/[encoded] - returns neutral SVG for non-allowlisted host", async () => {
  const encoded = encodeBase64Url("https://attacker.com/malicious.jpg");
  const req = new NextRequest("http://localhost/img/asset/" + encoded);
  const res = await GET(req, { params: { encoded } });

  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "image/svg+xml; charset=utf-8");
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.equal(res.headers.get("content-security-policy"), "default-src 'none'; sandbox");
});

test("GET /img/asset/[encoded] - returns neutral SVG for http:// URL", async () => {
  const encoded = encodeBase64Url("http://images.fotmob.com/test.png");
  const req = new NextRequest("http://localhost/img/asset/" + encoded);
  const res = await GET(req, { params: { encoded } });

  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "image/svg+xml; charset=utf-8");
});

test("GET /img/asset/[encoded] - returns neutral SVG for IP literal", async () => {
  const encoded = encodeBase64Url("https://169.254.169.254/meta");
  const req = new NextRequest("http://localhost/img/asset/" + encoded);
  const res = await GET(req, { params: { encoded } });

  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "image/svg+xml; charset=utf-8");
});

test("GET /img/asset/[encoded] - blocks text/html response and redirect to blocked host", async () => {
  // Test with a mock global fetch intercepting the call
  const originalFetch = globalThis.fetch;
  try {
    // 1. Mock text/html response
    globalThis.fetch = async () => {
      return new Response("<html><script>alert(1)</script></html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      });
    };

    const encodedHtml = encodeBase64Url("https://images.fotmob.com/fake.html");
    const req1 = new NextRequest("http://localhost/img/asset/" + encodedHtml);
    const res1 = await GET(req1, { params: { encoded: encodedHtml } });
    assert.equal(res1.status, 200);
    assert.equal(res1.headers.get("content-type"), "image/svg+xml; charset=utf-8");

    // 2. Mock redirect to blocked host
    globalThis.fetch = async (url: any) => {
      if (String(url).includes("images.fotmob.com")) {
        return new Response(null, {
          status: 302,
          headers: { location: "https://evil.com/malicious.png" },
        });
      }
      return new Response("img", { status: 200, headers: { "content-type": "image/png" } });
    };

    const encodedRedirect = encodeBase64Url("https://images.fotmob.com/redirect-test");
    const req2 = new NextRequest("http://localhost/img/asset/" + encodedRedirect);
    const res2 = await GET(req2, { params: { encoded: encodedRedirect } });
    assert.equal(res2.status, 200);
    assert.equal(res2.headers.get("content-type"), "image/svg+xml; charset=utf-8");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
