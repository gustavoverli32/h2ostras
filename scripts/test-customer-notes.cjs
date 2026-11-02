const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const html = fs.readFileSync(path.join(__dirname, '..', 'h2ostras-erp.html'), 'utf8');
function between(start, end) {
  const a = html.indexOf(start), b = html.indexOf(end, a);
  assert(a >= 0 && b > a, 'Trecho da aplicação não encontrado');
  return html.slice(a, b);
}
// Exercise the actual persistence functions and confirmation submit handler.
const logic = between('function commit(next)', 'function table(')
  + between('function removeCustomerNote(', 'function openCustomerNote(')
  + between("document.addEventListener('submit'", "document.addEventListener('input'");
const fixture = {
  clients: [
    { id: 'a', interactions: [
      { id: 'one', kind: 'Contato', text: 'Texto repetido' },
      { id: 'two', kind: 'Ocorrência operacional', text: 'Texto repetido' }
    ], profileHistory: [{ text: 'Cadastro atualizado' }] },
    { id: 'b', interactions: [{ id: 'three', kind: 'Contato', text: 'Outro cliente' }] }
  ],
  orders: [{ id: 'sale', client: 'a', history: [{ to: 'Entregue' }] }],
  payments: [{ id: 'payment', amount: 100 }]
};
function setup(failStorage = false) {
  let saved, handler;
  const error = { textContent: '' };
  const context = vm.createContext({
    structuredClone,
    initial: structuredClone(fixture),
    localStorage: { setItem(_key, value) { if (failStorage) throw Error('Quota'); saved = value; } },
    document: { addEventListener(type, fn) { assert.equal(type, 'submit'); handler = fn; } },
    $: selector => selector === '#deleteNoteError' ? error : { focus() {} }
  });
  vm.runInContext(`let db=initial, storageError='', pendingNoteDeletion=null;
    const KEY='test', client=id=>db.clients.find(c=>c.id===id);
    let rendered=0, messages=[];
    function notify(text){messages.push(text)}
    function render(){rendered++}
    function closeEditor(){pendingNoteDeletion=null}
    ${logic}`, context);
  return {
    run: code => vm.runInContext(code, context),
    submit: () => handler({ preventDefault() {}, target: { id: 'deleteCustomerNoteForm' } }),
    db: () => JSON.parse(vm.runInContext('JSON.stringify(db)', context)),
    saved: () => saved && JSON.parse(saved), error
  };
}
const valid = setup();
valid.submit();
assert.deepEqual(valid.db(), fixture, 'Sem seleção confirmada não pode excluir');
assert.equal(valid.run("removeCustomerNote('b','one')"), false);
assert.deepEqual(valid.db(), fixture, 'ID de outro cliente não pode excluir');
valid.run("pendingNoteDeletion={clientId:'a',noteId:'one'}");
valid.submit();
const expected = structuredClone(fixture);
expected.clients[0].interactions.shift();
assert.deepEqual(valid.db(), expected, 'Excluir apenas o ID selecionado, preservando outros registros');
assert.deepEqual(valid.saved(), expected, 'Exclusão deve persistir após recarregar os dados');
assert.equal(valid.run('pendingNoteDeletion'), null);
assert.equal(valid.run('rendered'), 1);
assert.equal(valid.run('messages.at(-1)'), 'Registro excluído.');
valid.submit();
assert.deepEqual(valid.db(), expected, 'Submissão repetida não pode excluir outro registro');

const failed = setup(true);
failed.run("pendingNoteDeletion={clientId:'a',noteId:'two'}");
failed.submit();
assert.deepEqual(failed.db(), fixture, 'Falha ao salvar não pode remover o registro em memória');
assert.match(failed.error.textContent, /Não foi possível excluir/);
assert.equal(failed.run('rendered'), 0);
assert.equal(failed.run('pendingNoteDeletion.noteId'), 'two');
console.log('Exclusão confirmada: isolamento por cliente/ID, persistência, repetição e falha de armazenamento aprovados.');
