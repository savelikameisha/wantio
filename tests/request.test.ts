// @vitest-environment node
import {it,expect} from 'vitest';
import {readJson,RequestSizeError} from '@/lib/server/request';
it('rejects an oversized body even without content-length',async()=>{
 const request=new Request('https://wantio.example/api/items',{method:'POST',body:JSON.stringify({name:'a'.repeat(20001)})});
 expect(request.headers.has('content-length')).toBe(false);
 await expect(readJson(request)).rejects.toBeInstanceOf(RequestSizeError);
});
it('reads an ordinary JSON request',async()=>{
 await expect(readJson(new Request('https://wantio.example',{method:'POST',body:'{"name":"Chair"}'}))).resolves.toEqual({name:'Chair'});
});
