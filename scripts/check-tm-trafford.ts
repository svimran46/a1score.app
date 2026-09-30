import fetch from "node-fetch";

const TM_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.transfermarkt.com/",
};

async function main() {
  const url = "https://www.transfermarkt.com/james-trafford/profil/spieler/566799";
  const res = await fetch(url, { headers: TM_HEADERS });
  if (res.ok) {
    const html = await res.text();
    const clubMatch = html.match(/class="data-header__club">[\s\S]*?<a[^>]*title="([^"]+)"/i) ||
                      html.match(/Aktueller Verein:[\s\S]*?<a[^>]*title="([^"]+)"/i) ||
                      html.match(/Current club:[\s\S]*?<a[^>]*title="([^"]+)"/i) ||
                      html.match(/itemprop="affiliation">([^<]+)<\/span>/i);
    console.log("TM James Trafford club match:", clubMatch?.[1]);
    const headerDetails = html.match(/class="data-header__details">([\s\S]*?)<\/div>/i);
    if (headerDetails) {
      console.log("Header details text:", headerDetails[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
    }
  } else {
    console.log("TM fetch failed:", res.status);
  }
}

main().catch(console.error);
