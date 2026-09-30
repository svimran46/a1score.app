async function test() {
  try {
    const res = await fetch("https://www.transfermarkt.com/liverpool-fc/startseite/verein/31/saison_id/2026", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Length:", text.length);
    console.log("Snippet:", text.substring(0, 300));
  } catch (e) {
    console.error("Fetch error:", e);
  }
}
test();
