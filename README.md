# deno-webtransport-sample

deno 2.4.5 WebTransport connection sample

**NOTICE: deno on Windows or macOS is not tested.**

## Requirements

- Windows 11
  - WSL2(Ubuntu 24.04 LTS)
- [mkcert](https://github.com/FiloSottile/mkcert)
- [deno 2.4.5](https://deno.com/)
- [Google Chrome](https://www.google.com/chrome/)

First, you MUST enable
[WebTransport Developer Mode](chrome://flags/#webtransport-developer-mode) to
accept self-signed certificate on WebTransport.

Second, you MUST change WSL networking mode to `mirrored`. You can change in
`WSL Settings` app or `%USERPROFILE%/.wslconfig`. See
[Advanced settings configuration in WSL](https://learn.microsoft.com/windows/wsl/wsl-config).

Then, `wsl --shutdown` and `wsl` to go inside.

```sh
# Install mkcert.exe
$ winget.exe install --id FiloSottile.mkcert
$ mkcert.exe -install
```

```sh
# Install deno
$ curl -fsSL https://deno.land/install.sh | sh
$ deno --version
deno 2.4.5 (stable, release, x86_64-unknown-linux-gnu)
v8 13.7.152.14-rusty
typescript 5.8.3
```

```sh
$ git clone https://github.com/yamayuski/deno-webtransport-sample.git
$ cd deno-webtransport-sample

# Generate local-only valid cert
$ mkcert.exe -cert-file localhost.crt -key-file localhost.key localhost 127.0.0.1

# Run servers
$ deno run dev
```

open https://localhost:4434

You can see the log.

![](./sample.png)

## Known issue

### The server shows `WebTransport error [Error: timed out]`

QUIC connections use keep alive for reconnection. So the client closes
connection but the server keeps the connection until timeout. It may not be
error.

### `Failed to establish a connection to https://localhost:4433/: net::ERR_QUIC_PROTOCOL_ERROR.QUIC_NETWORK_IDLE_TIMEOUT (No recent network activity after 4010560us. Timeout:4s num_undecryptable_packets: 0 {}).` in console

You may not use `localhost` to connect because of udp forwarding in WSL?

### `Failed to connect to WebTransport server: WebTransportError: Opening handshake failed.` in console

You may use self-signed certificate. Current Google Chrome version requires a
known certificate root when WebTransport Developer Mode is disabled.

### Firefox is not working

TODO
