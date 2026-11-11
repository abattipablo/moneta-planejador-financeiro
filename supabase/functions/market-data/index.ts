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

async function requestBcbSeries(code: number, lastValues: number, attempt: number) {
  const url = new URL(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados/ultimos/${lastValues}`);
  url.searchParams.set("formato", "json");
  url.searchParams.set("_moneta", `${Date.now()}-${attempt}`);

  return await fetch(url, {
    cache: "no-store",
    headers: {
      "Accept": "application/json",
      "Cache-Control": "no-cache, no-store, max-age=0",
      "Pragma": "no-cache",
      "User-Agent": "Moneta/1.0",
    },
  });
}

async function fetchBcbSeries(code: number, lastValues: number) {
  let response = await requestBcbSeries(code, lastValues, 1);

  // 304 só indica que um cache tentou reaproveitar a resposta, então repetimos com uma URL nova.
  if (response.status === 304) {
    response = await requestBcbSeries(code, lastValues, 2);
  }

  if (!response.ok) {
    throw new Error(`Banco Central recusou a série ${code} (HTTP ${response.status}).`);
  }

  return await response.json();
}

async function fetchIpcaFromIbge() {
  const url = "https://apisidra.ibge.gov.br/values/t/1737/n1/all/v/2265/p/last%201";
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "Moneta/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`IBGE recusou a consulta do IPCA (HTTP ${response.status}).`);
  }

  const data = await response.json();
  const latestValue = Array.isArray(data) ? data[1] : null;

  if (!latestValue || !Number.isFinite(Number(latestValue.V))) {
    throw new Error("O IBGE não retornou um valor válido para o IPCA.");
  }

  return {
    value: Number(latestValue.V),
    referenceDate: latestValue.D3N,
  };
}

async function getMacroIndicators() {
  // O serviço público do BCB pode limitar consultas paralelas do mesmo endereço.
  const selicData = await fetchBcbSeries(432, 1);
  const cdiData = await fetchBcbSeries(12, 1);
  const ipcaData = await fetchIpcaFromIbge();

  const selic = Number(String(selicData.at(-1)?.valor ?? "0").replace(",", "."));
  const cdiDaily = Number(String(cdiData.at(-1)?.valor ?? "0").replace(",", "."));
  const cdiAnnual = (Math.pow(1 + cdiDaily / 100, 252) - 1) * 100;

  return {
    indicators: [
      { key: "selic", name: "Selic meta", value: selic, unit: "% a.a.", referenceDate: selicData.at(-1)?.data },
      { key: "cdi", name: "CDI", value: cdiAnnual, unit: "% a.a.", referenceDate: cdiData.at(-1)?.data },
      { key: "ipca", name: "IPCA acumulado", value: ipcaData.value, unit: "12 meses", referenceDate: ipcaData.referenceDate },
    ],
    source: "Banco Central do Brasil e IBGE",
    updatedAt: new Date().toISOString(),
  };
}

async function getYahooDividends(tickers: string[], startDate?: string) {
  const start = startDate
    ? Math.floor(new Date(`${startDate}T00:00:00Z`).getTime() / 1000)
    : Math.floor(new Date("2000-01-01T00:00:00Z").getTime() / 1000);
  const end = Math.floor(Date.now() / 1000) + 86400;
  const events = [];
  const errors = [];

  for (const ticker of tickers) {
    const yahooTicker = `${ticker}.SA`;
    const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooTicker)}`);
    url.searchParams.set("period1", String(start));
    url.searchParams.set("period2", String(end));
    url.searchParams.set("interval", "1d");
    url.searchParams.set("events", "div");

    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 Moneta/1.0" },
    });

    if (!response.ok) {
      errors.push({ ticker, message: "Não foi possível consultar os dividendos." });
      continue;
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];
    const dividends = Object.values(result?.events?.dividends ?? {}) as Array<{
      amount: number;
      date: number;
    }>;

    dividends.forEach((dividend) => {
      const eventDate = new Date(dividend.date * 1000).toISOString().slice(0, 10);
      events.push({
        externalId: `yahoo-${ticker}-${dividend.date}`,
        ticker,
        eventDate,
        amountPerUnit: Number(dividend.amount),
        source: "Yahoo Finance",
      });
    });
  }

  return { events, errors, updatedAt: new Date().toISOString() };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Método não permitido." }, 405);

  try {
    const body = await request.json();

    if (body.action === "macro") {
      return jsonResponse(await getMacroIndicators());
    }

    if (body.action === "dividends") {
      const tickers = [...new Set(
        (Array.isArray(body.tickers) ? body.tickers : [])
          .filter((ticker): ticker is string => typeof ticker === "string")
          .map((ticker) => ticker.trim().toUpperCase())
          .filter((ticker) => /^[A-Z0-9]{4,12}$/.test(ticker)),
      )].slice(0, 20);

      if (tickers.length === 0) return jsonResponse({ error: "Informe ao menos um ticker válido." }, 400);
      return jsonResponse(await getYahooDividends(tickers, body.startDate));
    }

    return jsonResponse({ error: "Ação inválida." }, 400);
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Não foi possível consultar os dados de mercado.";
    console.error("market-data error:", message);
    return jsonResponse({ error: message }, 500);
  }
});
