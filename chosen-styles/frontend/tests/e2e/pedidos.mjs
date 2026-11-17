/* Fluxo de pedido enviado (conta, confere na sacola, estoque e histórico).
 * Precisa de uma compilação com o número do WhatsApp configurado (o botão de finalizar fica bloqueado sem ele).
 * Uso: SITE_FILE=caminho/para/index.html node tests/e2e/pedidos.mjs
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(process.env.SITE_FILE || path.join(here, '../../dist/index.html'));
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => sessionStorage.setItem('cs:intro-seen', '1'));
const page = await ctx.newPage();
const errors = []; page.on('pageerror', e => errors.push(e.message));
const R = []; const ok = (n, c, d = '') => R.push((c ? 'OK    ' : 'FALHA ') + n + (d ? ' — ' + d : ''));
const sleep = ms => page.waitForTimeout(ms);
const EMAIL = 'maria@exemplo.com', PASS = 'senha-forte-123';

// 1. Criar conta (janela de conta)
await page.goto('file://' + file, { waitUntil: 'load' }); await sleep(700);
await page.evaluate(() => document.getElementById('acc-btn').click()); await sleep(600);
await page.locator('.acc-tabs [data-acc=signup]').click({ force: true }); await sleep(300);
await page.locator('#acc-signup input[name=fullname]').fill('Maria Silva');
await page.locator('#acc-signup input[name=email]').fill(EMAIL);
await page.locator('#acc-signup input[name=password]').fill(PASS);
await page.locator('#acc-signup button[type=submit]').click({ force: true }); await sleep(1500);
const logged = await page.evaluate(() => !document.getElementById('acc-session').hidden);
ok('conta criada e sessão iniciada', logged, logged ? '' : (await page.textContent('#acc-signup-error')).trim());
await page.evaluate(() => document.getElementById('acc-close') && document.getElementById('acc-close').click()); await sleep(400);

// 2. Comprar a peça (Black, tamanho P, estoque 1)
await page.goto('file://' + file + '#produto-essential-black', { waitUntil: 'load' }); await sleep(700);
await page.locator('#pv-info [data-pv-size]').nth(0).click({ force: true });
await page.locator('#pv-add').click({ force: true }); await sleep(2200);
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await sleep(800);
await page.locator('#cart-btn').click({ force: true }); await sleep(700);
await page.locator('input[name=pay][value=pix]').check({ force: true });
await page.locator('#signup-form input[name=fullname]').fill('Maria Silva');
await page.locator('#signup-form input[name=email]').fill(EMAIL);
await page.locator('#signup-form input[name=cep]').fill('74000000');
await page.locator('#review-btn').click(); await sleep(300);
await page.evaluate(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return { opener: null }; }; });
await page.locator('#confirm-btn').click({ force: true }); await sleep(600);
const opened = await page.evaluate(() => window.__opened);
ok('o WhatsApp é aberto com o pedido', opened.length === 1 && opened[0].startsWith('https://wa.me/5511999999999?text='), opened.length + ' janela(s)');
const sizeAfterSend = await page.locator('#pv-info [data-pv-size]').nth(0).isDisabled();
ok('na página já aberta, o tamanho P fica indisponível logo após o envio', sizeAfterSend);
const status = (await page.textContent('#confirm-status')).trim();
ok('mensagem de pedido enviado com sucesso', status.includes('Pedido enviado com sucesso'), status.slice(0, 60));

// 3. Sacola: confere na peça comprada, sem controles de quantidade e sem contar no total
const confere = await page.locator('#cart-items .sent-status').count();
const controles = await page.locator('#cart-items .cart-line.is-sent .qty').count();
ok('a peça comprada aparece com confere', confere === 1, confere + ' confere(s)');
ok('a peça enviada não tem controles de quantidade', controles === 0);
const badge = (await page.textContent('#cart-count')).trim();
ok('contador da sacola zera após o envio', badge === '0', 'contador=' + badge);
const orders = await page.evaluate(() => JSON.parse(localStorage.getItem('cs:orders') || '[]'));
ok('pedido registrado no navegador', orders.length === 1 && orders[0].status === 'enviado' && orders[0].items[0].size === 'P', orders.length + ' pedido(s)');

// 4. Conta: a compra aparece para o mesmo e-mail
await page.evaluate(() => document.getElementById('acc-btn').click()); await sleep(600);
const cardText = await page.evaluate(() => { const c = document.querySelector('#acc-orders .acc-order'); return c ? c.textContent : ''; });
ok('conta mostra "Compra enviada com sucesso"', cardText.includes('Compra enviada com sucesso'), cardText.slice(0, 60));
ok('conta mostra o item e o número do pedido', cardText.includes('Black') && cardText.includes(orders[0] && orders[0].id), '');

// 5. Nova compra da mesma peça: o estoque deste navegador já foi usado
await page.evaluate(() => document.getElementById('acc-close') && document.getElementById('acc-close').click()); await sleep(300);
await page.reload({ waitUntil: 'load' }); await sleep(700);
const sizeP = await page.locator('#pv-info [data-pv-size]').nth(0).isDisabled();
ok('tamanho P fica indisponível depois do envio', sizeP);

// 6. Remover a linha enviada não apaga o histórico da conta
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await sleep(700);
await page.locator('#cart-btn').click({ force: true }); await sleep(900);
await page.evaluate(() => document.querySelector('#cart-items [data-act=rm]').click()); await sleep(500);
const left = await page.locator('#cart-items li').count();
const emptyShown = await page.evaluate(() => !document.getElementById('cart-empty').hidden);
const hist = await page.evaluate(() => JSON.parse(localStorage.getItem('cs:orders') || '[]').length);
ok('remover a linha enviada esvazia a sacola', left === 0 && emptyShown, 'itens=' + left);
ok('histórico de pedidos é preservado', hist === 1);
ok('sem erros de página', errors.length === 0, errors.slice(0, 2).join(' | '));
console.log(R.join('\n'));
const fails = R.filter(r => r.startsWith('FALHA')).length;
console.log(`\n${R.length - fails} de ${R.length} verificações passaram.`);
await browser.close();
process.exit(fails ? 1 : 0);
