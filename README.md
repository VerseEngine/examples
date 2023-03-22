VerseEngine examples.  
VerseEngine is a web-based metaverse engine on a P2P overlay network.

## Run

```bash
npx http-server -c-1 --gzip
```

## Example HTTPS

```
brew install mkcert
mkcert -install
mkdir cert
cd cert
mkcert localhost 127.0.0.1 192.168.10.2
cd ..
npx http-server -c-1 --gzip --ssl --key ./cert/localhost+2-key.pem --cert ./cert/localhost+2.pem
```

