const cert = Deno.readTextFileSync("./localhost.crt");
const key = Deno.readTextFileSync("./localhost.key");
const hostname = "localhost";
const port = 4434;
const wtPort = 4433;

const options = {
  hostname,
  port,
  cert,
  key,
} as const satisfies (Deno.TcpListenOptions & Deno.TlsCertifiedKeyPem);

function handler(req: Request): Response {
  const url = new URL(req.url);
  console.debug(`Request received: ${url.pathname}`);
  if (url.pathname === "/" || url.pathname === "/index.html") {
    console.log(`Respond index.html`);
    const index = Deno.readTextFileSync("./index.html");
    return new Response(index, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
      status: 200,
    });
  }
  console.log(`${url.pathname} not found`);
  return new Response(null, {
    status: 404,
  });
}

// static server
Deno.serve(
  options,
  handler,
);
console.log(
  `Static https server listening on https://${hostname}:${port}`,
);

// webtransport server
const wtServer = new Deno.QuicEndpoint({
  hostname,
  port: wtPort,
});
const listener = wtServer.listen({
  alpnProtocols: ["h3"],
  cert,
  key,
});
console.log(
  `WebTransport server listening on https://${hostname}:${wtPort}`,
);

async function handleWebTransport(
  wt: WebTransport,
): Promise<WebTransportCloseInfo> {
  const textEncoder = new TextEncoder();
  await Deno.stdout.write(textEncoder.encode("Waiting wt.ready..."));
  await wt.ready;
  await Deno.stdout.write(textEncoder.encode("ok\n"));

  // ping/pong
  for await (const { readable, writable } of wt.incomingBidirectionalStreams) {
    for await (const value of readable.pipeThrough(new TextDecoderStream())) {
      console.log(`Received value: ${value}`);
      const writer = writable.getWriter();
      await writer.write(textEncoder.encode(`Pong: ${value}`));
      writer.releaseLock();
      console.log(`Sent back value: Pong: ${value}`);
      break;
    }
    break;
  }

  return wt.closed;
}

while (true) {
  try {
    const conn = await listener.accept();
    console.log(
      "New quic connection established",
      conn.remoteAddr.hostname,
      conn.remoteAddr.port,
    );

    const wt = await Deno.upgradeWebTransport(conn);
    console.log("connection upgraded to WebTransport");

    handleWebTransport(wt).then((info) => {
      console.log(
        "WebTransport connection closed",
        info.closeCode,
        info.reason,
      );
    }).catch((error) => {
      console.error("WebTransport error", error);
    });
  } catch (quicError) {
    console.error("got QUIC Error", quicError);
  }
}
