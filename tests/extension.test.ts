// @vitest-environment node
import {it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
function worker() {
 let session:unknown={access_token:'expired',refresh_token:'refresh',expires_at:1};
 let handler:(message:unknown,sender:unknown,reply:(value:unknown)=>void)=>void;
 const fetch=vi.fn(async (url:string)=>new Response(JSON.stringify(url.endsWith('/api/config')?{supabaseUrl:'https://project.supabase.co',supabaseAnonKey:'public'}:{access_token:'renewed',refresh_token:'next-refresh',expires_at:9999999999}),{status:200}));
 const chrome={storage:{local:{get:async()=>({wantio_session:session}),set:async(value:{wantio_session:unknown})=>{session=value.wantio_session;},remove:async()=>{session=null;}}},runtime:{onMessage:{addListener:(fn:typeof handler)=>{handler=fn;}}}};
 runInNewContext(readFileSync('chrome-extension/background.js','utf8'),{chrome,fetch,atob});
 return {send:(message:unknown,sender:unknown={})=>new Promise<unknown>(resolve=>handler(message,sender,resolve)),fetch};
}
it('refreshes an expired extension session once for simultaneous requests',async()=>{
 const w=worker();const results=await Promise.all([w.send({type:'GET_SESSION'}),w.send({type:'GET_SESSION'})]);
 expect(results).toEqual([{access_token:'renewed',refresh_token:'next-refresh',expires_at:9999999999},{access_token:'renewed',refresh_token:'next-refresh',expires_at:9999999999}]);
 expect(w.fetch.mock.calls.filter(([url])=>url.includes('/auth/v1/token'))).toHaveLength(1);
});
it('rejects session handoff outside the first-party sign-in page',async()=>{
 const w=worker();expect(await w.send({type:'AUTH_TOKEN',access_token:'forged',refresh_token:'forged'},{tab:{url:'https://other.example/auth/extension'}})).toEqual({error:'Unexpected sign-in page.'});
});
