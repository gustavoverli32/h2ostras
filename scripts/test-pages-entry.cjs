const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../docs/index.html'),'utf8');
assert.equal(html,fs.readFileSync(path.join(__dirname,'../docs/404.html'),'utf8'));
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
function run({saved=null,blocked=false,pathname='/h2ostras/',hash='#agenda'}={}){
  const elements={};let redirected=null,download=null,blob=null,mutations=0;
  const element=id=>elements[id]??=( {hidden:true,textContent:'',addEventListener(type,fn){this[type]=fn}} );
  const context={location:{pathname,hash,replace:url=>redirected=url},localStorage:{getItem(key){assert.equal(key,'h2ostras.erp.v5');if(blocked)throw Error('blocked');return saved},setItem(){mutations++},removeItem(){mutations++}},document:{querySelector:element,body:{append(){}},createElement(){return {click(){download=this.download},remove(){}}}},Blob:class{constructor(parts){blob=parts.join('')}},URL:{createObjectURL:()=> 'blob:local-test',revokeObjectURL(){}},setTimeout:fn=>fn()};
  vm.runInNewContext(script,context);
  return {elements,redirected,download:()=>download,blob:()=>blob,mutations:()=>mutations};
}
assert.equal(run().redirected,'https://h2ostras-operacao.gustavoverli.chatgpt.site/login#agenda');
assert.equal(run({pathname:'/h2ostras/developer.html'}).redirected,'https://h2ostras-operacao.gustavoverli.chatgpt.site/desenvolvedor');
assert.equal(run({hash:'#cliente/c1'}).redirected,'https://h2ostras-operacao.gustavoverli.chatgpt.site/login#cliente/c1');
assert.equal(run({hash:'#https://other.example'}).redirected,'https://h2ostras-operacao.gustavoverli.chatgpt.site/login#atendimento');
const raw=JSON.stringify({clients:[{id:'test-only',name:'Demonstração'}]});const recovery=run({saved:raw});
assert.equal(recovery.redirected,null);assert.equal(recovery.elements['#backup'].hidden,false);assert.equal(recovery.elements['#localNote'].hidden,false);
recovery.elements['#backup'].click();assert.equal(recovery.blob(),raw);assert.equal(recovery.download(),'h2ostras-cadastros-endereco-antigo.json');assert.equal(recovery.mutations(),0);
assert.equal(run({blocked:true}).redirected,null);
assert.ok(!html.includes('fetch('));console.log('Entrada Pages aprovada: destino correto, rotas, cópia local e preservação dos cadastros.');
