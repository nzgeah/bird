import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
http.createServer((req,res)=>{
  let name; try {name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch {res.writeHead(400).end();return;}
  const target=path.resolve(root,'.'+(name==='/'?'/index.html':name));
  if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(target,(err,data)=>{if(err){res.writeHead(404).end('Not found');return;}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css'})[path.extname(target)]||'application/octet-stream');res.end(data);});
}).listen(4173,'127.0.0.1',()=>console.log('BIRD: http://127.0.0.1:4173'));

