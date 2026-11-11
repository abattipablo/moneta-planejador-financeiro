import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Método não permitido." }, 405);
  }

  const token = Deno.env.get("BRAPI_TOKEN");

  if (!token) {
    return jsonResponse({ error: "A integração com a brapi não foi configurada." }, 500);
  }

  try {
    const body = await request.json();
    const receivedTickers = Array.isArray(body.tickers)
      ? body.tickers
      : [body.ticker];

    const tickers = [...new Set(
      receivedTickers
        .filter((ticker): ticker is string => typeof ticker === "string")
        .map((ticker) => ticker.trim().toUpperCase())
        .filter((ticker) => /^[A-Z0-9]{4,12}$/.test(ticker)),
    )].slice(0, 20);

    if (tickers.length === 0) {
      return jsonResponse({ error: "Informe ao menos um ticker válido." }, 400);
    }

    const quotes = [];
    const errors = [];

    // O plano gratuito permite uma requisição simultânea, então consultamos em sequência.
    for (const ticker of tickers) {
      const url = new URL("https://brapi.dev/api/v2/stocks/quote");
      url.searchParams.set("symbols", ticker);

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok || !data.results?.[0]) {
        errors.push({
          ticker,
          message: data.message ?? "Ativo não encontrado.",
          status: response.status,
        });
        continue;
      }

      const result = data.results[0];
      const quote = result.data ?? result;

      quotes.push({
        requestedTicker: ticker,
        ticker: result.symbol ?? quote.symbol ?? ticker,
        name: quote.longName ?? quote.shortName ?? ticker,
        shortName: quote.shortName ?? quote.longName ?? ticker,
        currency: quote.currency ?? "BRL",
        price: Number(quote.regularMarketPrice ?? 0),
        change: Number(quote.regularMarketChange ?? 0),
        changePercent: Number(quote.regularMarketChangePercent ?? 0),
        logoUrl: quote.logoUrl ?? quote.logourl ?? null,
        updatedAt: quote.regularMarketTime ?? new Date().toISOString(),
      });
    }

    return jsonResponse({ quotes, errors });
  } catch {
    return jsonResponse({ error: "Não foi possível consultar as cotações." }, 500);
  }
});
