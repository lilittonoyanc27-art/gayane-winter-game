import { useMemo, useState } from 'react';
import { Btn, Choices, Feedback, Instruction, Reward, SceneHeader, starsFor, type Fb } from '../components/UI';
import { WordTiles } from '../components/WordTiles';
import { Phrase, T } from '../core/translate';
import { useDraggable, useDropTarget } from '../core/dnd';
import { speak } from '../core/speech';
import { sfx } from '../core/sound';
import { markDifficult, useGame } from '../core/store';
import { levelIndex, p, type Level, type P } from '../core/types';
import { cap, fmtEuro, numEs, numHy, priceP, shuffle } from '../core/util';

interface Prod {
  id: string;
  icon: string;
  unit: P; // "una barra de pan"
  plural: (n: number) => P; // "dos barras de pan"
  price: number;
  fruit?: boolean;
}

const mk = (id: string, icon: string, price: number, one: [string, string], many: [string, string], hyName: string, fruit = false): Prod => ({
  id,
  icon,
  price,
  fruit,
  unit: p(one[0], `մեկ ${one[1]}`),
  plural: (n) => (n === 1 ? p(one[0], `մեկ ${one[1]}`) : p(`${numEs(n, many[0].startsWith('*f'))} ${many[0].replace('*f', '')}`, `${numHy(n)} ${many[1]}`)),
});

const PRODUCTS: Prod[] = [
  mk('pan', '🥖', 1.2, ['una barra de pan', 'բագետ հաց'], ['*fbarras de pan', 'բագետ հաց'], 'հաց'),
  mk('leche', '🥛', 0.95, ['un litro de leche', 'լիտր կաթ'], ['litros de leche', 'լիտր կաթ'], 'կաթ'),
  mk('chocolate', '🍫', 1.8, ['una tableta de chocolate', 'սալիկ շոկոլադ'], ['*ftabletas de chocolate', 'սալիկ շոկոլադ'], 'շոկոլադ'),
  mk('naranjas', '🍊', 2.5, ['un kilo de naranjas', 'կիլոգրամ նարինջ'], ['kilos de naranjas', 'կիլոգրամ նարինջ'], 'նարինջ', true),
  mk('manzanas', '🍎', 2, ['un kilo de manzanas', 'կիլոգրամ խնձոր'], ['kilos de manzanas', 'կիլոգրամ խնձոր'], 'խնձոր', true),
  mk('huevos', '🥚', 2.4, ['una docena de huevos', 'տասնյակ ձու'], ['*fdocenas de huevos', 'տասնյակ ձու'], 'ձու'),
  mk('queso', '🧀', 3.5, ['un trozo de queso', 'կտոր պանիր'], ['trozos de queso', 'կտոր պանիր'], 'պանիր'),
  mk('galletas', '🍪', 1.75, ['un paquete de galletas', 'տուփ թխվածքաբլիթ'], ['paquetes de galletas', 'տուփ թխվածքաբլիթ'], 'թխվածքաբլիթ'),
  mk('te', '🍵', 2.2, ['una caja de té', 'տուփ թեյ'], ['*fcajas de té', 'տուփ թեյ'], 'թեյ'),
  mk('miel', '🍯', 4.2, ['un tarro de miel', 'բանկա մեղր'], ['tarros de miel', 'բանկա մեղր'], 'մեղր'),
  mk('malvaviscos', '☁️', 1.6, ['una bolsa de malvaviscos', 'տոպրակ մարշմելոու'], ['*fbolsas de malvaviscos', 'տոպրակ մարշմելոու'], 'մարշմելոու'),
  mk('zanahorias', '🥕', 1.3, ['un kilo de zanahorias', 'կիլոգրամ գազար'], ['kilos de zanahorias', 'կիլոգրամ գազար'], 'գազար', true),
  mk('limones', '🍋', 1.5, ['un kilo de limones', 'կիլոգրամ կիտրոն'], ['kilos de limones', 'կիլոգրամ կիտրոն'], 'կիտրոն', true),
];
const prod = (id: string) => PRODUCTS.find((x) => x.id === id)!;

interface ListItem {
  id: string;
  n: number;
}
const LISTS: Record<Level, { items: ListItem[]; intro: P }[]> = {
  A1: [
    { items: [{ id: 'naranjas', n: 1 }, { id: 'pan', n: 1 }, { id: 'leche', n: 1 }, { id: 'chocolate', n: 1 }], intro: p('Hoy voy a comprar para el desayuno.', 'Այսօր գնումներ եմ անելու նախաճաշի համար։') },
    { items: [{ id: 'manzanas', n: 1 }, { id: 'galletas', n: 1 }, { id: 'te', n: 1 }], intro: p('Hoy vienen mis amigas a tomar el té.', 'Այսօր ընկերուհիներս գալիս են թեյի։') },
  ],
  A2: [{ items: [{ id: 'naranjas', n: 2 }, { id: 'leche', n: 2 }, { id: 'chocolate', n: 2 }, { id: 'malvaviscos', n: 1 }], intro: p('Voy a preparar chocolate caliente para toda la familia.', 'Ամբողջ ընտանիքի համար տաք շոկոլադ եմ պատրաստելու։') }],
  B1: [{ items: [{ id: 'zanahorias', n: 2 }, { id: 'huevos', n: 1 }, { id: 'queso', n: 1 }, { id: 'pan', n: 2 }, { id: 'miel', n: 1 }], intro: p('Este fin de semana cocino yo, así que necesito llenar la nevera.', 'Այս հանգստյան օրերին ես եմ ճաշ եփում, ուստի պետք է լցնեմ սառնարանը։') }],
  B2: [{ items: [{ id: 'limones', n: 2 }, { id: 'te', n: 2 }, { id: 'miel', n: 1 }, { id: 'galletas', n: 3 }, { id: 'huevos', n: 1 }], intro: p('Mi abuela me ha pedido que le haga la compra, porque con tanta nieve prefiere no salir de casa.', 'Տատիկս խնդրել է, որ իր համար գնումներ անեմ, քանի որ այսքան ձյան պատճառով նախընտրում է տնից դուրս չգալ։') }],
};

const WALLET = [20, 10, 5, 2, 1, 0.5, 0.2, 0.1];

function ProdCard({ pr, onAdd }: { pr: Prod; onAdd: () => void }) {
  const down = useDraggable({ kind: 'prod', id: pr.id }, { onTap: onAdd, ghost: <div className="ing-ghost">{pr.icon}</div> });
  return (
    <div className="prod">
      <div className="prod-icon drag-src" onPointerDown={down}>
        {pr.icon}
      </div>
      <T p={pr.unit} className="prod-name" />
      <span className="prod-price">{fmtEuro(pr.price)}</span>
    </div>
  );
}

function Money({ v, onTap }: { v: number; onTap: () => void }) {
  const down = useDraggable({ kind: 'money', id: String(v) }, { onTap });
  return (
    <div className={'money drag-src ' + (v >= 5 ? 'bill' : 'coin')} onPointerDown={down}>
      {v >= 1 ? v + ' €' : Math.round(v * 100) + ' c'}
    </div>
  );
}

type Phase = 'list' | 'counter' | 'shelves' | 'more' | 'bag' | 'pay' | 'change' | 'done';

export function Shop() {
  const level = useGame((s) => s.level);
  const list = useMemo(() => {
    const opts = LISTS[level];
    return opts[Math.floor(Math.random() * opts.length)];
  }, [level]);
  const [phase, setPhase] = useState<Phase>('list');
  const [basket, setBasket] = useState<Record<string, number>>({});
  const [bag, setBag] = useState(false);
  const [paid, setPaid] = useState<number[]>([]);
  const [fb, setFb] = useState<Fb | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [seller, setSeller] = useState<P>(p('¡Buenos días! ¿En qué puedo ayudarte?', 'Բարի լույս։ Ինչո՞վ կարող եմ օգնել։'));

  const fruitItem = list.items.find((i) => prod(i.id).fruit)!;
  const counterTarget = p(`Quiero ${prod(fruitItem.id).plural(fruitItem.n).es}, por favor.`, `Ուզում եմ ${prod(fruitItem.id).plural(fruitItem.n).hy}, խնդրում եմ։`);

  const total = Math.round((Object.entries(basket).reduce((a, [id, n]) => a + prod(id).price * n, 0) + (bag ? 0.1 : 0)) * 100) / 100;
  const paidSum = Math.round(paid.reduce((a, b) => a + b, 0) * 100) / 100;

  const err = (ph: P, extra?: P[]) => {
    setMistakes((m) => m + 1);
    markDifficult(ph, true);
    setFb({ ok: false, p: ph, extra });
  };

  const add = (id: string) => {
    sfx.drop();
    setBasket((b) => ({ ...b, [id]: (b[id] || 0) + 1 }));
    speak(p(`Pongo ${prod(id).unit.es} en la cesta.`, `Զամբյուղի մեջ եմ դնում ${prod(id).unit.hy}։`));
  };
  const remove = (id: string) => {
    sfx.pop();
    setBasket((b) => {
      const n = { ...b };
      n[id] = (n[id] || 0) - 1;
      if (n[id] <= 0) delete n[id];
      return n;
    });
  };
  const basketRef = useDropTarget('basket', (pl) => pl.kind === 'prod', (pl) => add(pl.id));
  const trayRef = useDropTarget('paytray', (pl) => pl.kind === 'money', (pl) => pay(Number(pl.id)));
  const pay = (v: number) => {
    sfx.coin();
    setPaid((x) => [...x, v]);
  };

  const sellerSay = (ph: P) => {
    setSeller(ph);
    speak(ph);
  };

  const goCheckout = () => {
    const missing = list.items.filter((i) => (basket[i.id] || 0) < i.n);
    const extra = Object.keys(basket).filter((id) => !list.items.some((i) => i.id === id));
    const tooMany = list.items.filter((i) => (basket[i.id] || 0) > i.n);
    if (missing.length) {
      const m = missing[0];
      const left = m.n - (basket[m.id] || 0);
      return err(p(`Te falta ${prod(m.id).plural(left).es}.`, `Պակասում է ${prod(m.id).plural(left).hy}։`));
    }
    if (extra.length || tooMany.length) {
      return err(p('Tienes en la cesta cosas que no están en tu lista. ¡Quítalas!', 'Զամբյուղում ունես բաներ, որոնք ցուցակում չկան։ Հանիր դրանք։'));
    }
    setFb(null);
    setPhase('more');
    sellerSay(p('¡Hola de nuevo! ¿Quieres algo más?', 'Կրկին բարև։ Ուրիշ ինչ-որ բան ուզո՞ւմ ես։'));
  };

  const changeDue = Math.round((paidSum - total) * 100) / 100;
  const changeOpts = useMemo(() => {
    if (changeDue <= 0) return [];
    const wrong1 = Math.round((changeDue + 1) * 100) / 100;
    const wrong2 = Math.max(0.1, Math.round((changeDue - 0.5) * 100) / 100);
    return shuffle([changeDue, wrong1, wrong2]);
  }, [changeDue, phase]);

  const confirmPay = () => {
    if (paidSum < total) {
      const f = Math.round((total - paidSum) * 100) / 100;
      return err(p(`Faltan ${priceP(f).es}.`, `Պակասում է ${priceP(f).hy}։`), [p(`Son ${priceP(total).es}.`, `Ընդամենը ${priceP(total).hy} է։`)]);
    }
    if (paidSum === total || levelIndex(level) === 0) {
      if (paidSum > total) sellerSay(p(`Aquí tienes el cambio: ${priceP(changeDue).es}. ¡Gracias y hasta luego!`, `Ահա մանրը՝ ${priceP(changeDue).hy}։ Շնորհակալություն և առայժմ։`));
      else sellerSay(p('¡Justo! Muchas gracias. ¡Hasta luego!', 'Ճիշտ է։ Շատ շնորհակալություն։ Առայժմ։'));
      setTimeout(() => setPhase('done'), 1800);
    } else {
      setPhase('change');
      sellerSay(p('Te doy el cambio. ¿Cuánto es?', 'Քեզ մանրը տամ։ Որքա՞ն է։'));
    }
  };

  const listView = (
    <div className="shop-list">
      <div className="sl-title">
        📝 <T p={p('Mi lista de la compra', 'Գնումների իմ ցուցակը')} />
      </div>
      {list.items.map((i) => {
        const have = basket[i.id] || 0;
        return (
          <div key={i.id} className={'sl-item ' + (have >= i.n ? 'ok' : '')}>
            <span>{prod(i.id).icon}</span>
            <T p={cap1(prod(i.id).plural(i.n))} />
            <span className="sl-have">{have >= i.n ? '✓' : `${have}/${i.n}`}</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="scene scene-shop">
      <SceneHeader title={p('Compras de invierno', 'Ձմեռային գնումներ')} icon="🛍️" />
      <div className="shop-top">
        <div className="seller">
          <div className="seller-face">👩🏻‍💼</div>
          <div className="seller-bubble pop-in" key={seller.es}>
            <Phrase p={seller} />
          </div>
        </div>
        {listView}
      </div>

      {phase === 'list' && (
        <div className="shop-panel">
          <Instruction p={list.intro} icon="🛒" />
          <Btn label={p('Entrar en la tienda', 'Մտնել խանութ')} icon="🚪" onClick={() => (setPhase('counter'), sellerSay(p('¡Buenos días! ¿En qué puedo ayudarte?', 'Բարի լույս։ Ինչո՞վ կարող եմ օգնել։')))} />
        </div>
      )}

      {phase === 'counter' && (
        <div className="shop-panel">
          <Instruction p={p('Estás en la frutería. Pide la fruta de tu lista: construye la frase.', 'Միրգ-բանջարեղենի բաժնում ես։ Խնդրիր ցուցակիդ միրգը՝ կազմիր նախադասությունը։')} icon="🍊" />
          <WordTiles
            target={counterTarget}
            extra={['quiero', 'dos', 'tres', 'gracias'].filter((w) => !counterTarget.es.toLowerCase().includes(w)).slice(0, 2)}
            showHint={levelIndex(level) < 2}
            onResult={(ok) => {
              if (ok) {
                sfx.success();
                setBasket((b) => ({ ...b, [fruitItem.id]: fruitItem.n }));
                sellerSay(p(`Aquí tienes ${prod(fruitItem.id).plural(fruitItem.n).es}. Ahora puedes coger lo demás de las estanterías.`, `Խնդրեմ՝ ${prod(fruitItem.id).plural(fruitItem.n).hy}։ Հիմա մնացածը կարող ես վերցնել դարակներից։`));
                setPhase('shelves');
              } else err(p('La frase no es correcta. Inténtalo otra vez.', 'Նախադասությունը ճիշտ չէ։ Կրկին փորձիր։'), [counterTarget]);
            }}
          />
          <div className="or-choose">
            <T p={p('…o elige una respuesta:', '…կամ ընտրիր պատասխան՝')} />
            <Choices
              options={[counterTarget, p('Quiero una mesa, por favor.', 'Սեղան եմ ուզում, խնդրում եմ։'), p('¿Dónde está la estación?', 'Որտե՞ղ է կայարանը։')]}
              onPick={(i) => {
                if (i === 0) {
                  sfx.success();
                  setMistakes((m) => m + 0.5);
                  setBasket((b) => ({ ...b, [fruitItem.id]: fruitItem.n }));
                  sellerSay(p(`Aquí tienes ${prod(fruitItem.id).plural(fruitItem.n).es}. Ahora coge lo demás de las estanterías.`, `Խնդրեմ՝ ${prod(fruitItem.id).plural(fruitItem.n).hy}։ Հիմա մնացածը վերցրու դարակներից։`));
                  setPhase('shelves');
                } else err(p('Eso no tiene sentido en una frutería.', 'Դա իմաստ չունի միրգ-բանջարեղենի խանութում։'));
              }}
            />
          </div>
        </div>
      )}

      {phase === 'shelves' && (
        <div className="shop-panel">
          <Instruction p={p('Toca o arrastra los productos de tu lista a la cesta.', 'Հպիր կամ քաշիր ցուցակիդ ապրանքները զամբյուղի մեջ։')} icon="🧺" />
          <div className="shelves">
            {PRODUCTS.map((pr) => (
              <ProdCard key={pr.id} pr={pr} onAdd={() => add(pr.id)} />
            ))}
          </div>
          <div className="basket" ref={basketRef}>
            <div className="basket-title">
              🧺 <T p={p('Mi cesta', 'Իմ զամբյուղը')} /> <span className="basket-hint hy-note">(հպիր՝ հանելու համար)</span>
            </div>
            <div className="basket-items">
              {Object.entries(basket).map(([id, n]) => (
                <button key={id} className="bitem" onClick={() => remove(id)}>
                  {prod(id).icon} × {n}
                </button>
              ))}
            </div>
          </div>
          <Btn label={p('Ir a la caja', 'Գնալ դրամարկղ')} icon="💳" onClick={goCheckout} />
        </div>
      )}

      {phase === 'more' && (
        <div className="shop-panel">
          <Choices
            options={[p('No, nada más, gracias.', 'Ոչ, ուրիշ ոչինչ, շնորհակալություն։'), p('Sí, quiero un coche rojo.', 'Այո, կարմիր մեքենա եմ ուզում։'), p('Hace frío hoy.', 'Այսօր ցուրտ է։')]}
            onPick={(i) => {
              if (i === 0) {
                setPhase('bag');
                sellerSay(p('Muy bien. ¿Necesitas una bolsa? Cuesta diez céntimos.', 'Շատ լավ։ Տոպրակ պե՞տք է։ Արժե տասը ցենտ։'));
              } else err(p('Mmm… La dependienta te pregunta si quieres algo más.', 'Մմմ… Վաճառողուհին հարցնում է՝ ուրիշ բան ուզո՞ւմ ես։'));
            }}
          />
        </div>
      )}

      {phase === 'bag' && (
        <div className="shop-panel">
          <Choices
            options={[p('Sí, una bolsa, por favor.', 'Այո, մեկ տոպրակ, խնդրում եմ։'), p('No, gracias, traigo mi bolsa.', 'Ոչ, շնորհակալություն, իմ տոպրակն ունեմ։')]}
            onPick={(i) => {
              const withBag = i === 0;
              setBag(withBag);
              const t = Math.round((total + (withBag && !bag ? 0.1 : 0)) * 100) / 100;
              setPhase('pay');
              sellerSay(p(`Son ${priceP(t).es}.`, `Ընդամենը ${priceP(t).hy} է։`));
            }}
          />
        </div>
      )}

      {(phase === 'pay' || phase === 'change') && (
        <div className="shop-panel">
          <Instruction p={p('Escucha el precio y paga con tu monedero.', 'Լսիր գինը և վճարիր դրամապանակիցդ։')} icon="💶" />
          <div className="receipt">
            {Object.entries(basket).map(([id, n]) => (
              <div key={id}>
                {prod(id).icon} {n} × {fmtEuro(prod(id).price)}
              </div>
            ))}
            {bag && <div>🛍️ 1 × {fmtEuro(0.1)}</div>}
            <div className="receipt-total">
              <T p={p('Total', 'Ընդամենը')} />: <b>{levelIndex(level) >= 2 ? '?? €' : fmtEuro(total)}</b>
            </div>
          </div>
          {phase === 'pay' && (
            <>
              <div className="wallet">
                {WALLET.map((v) => (
                  <Money key={v} v={v} onTap={() => pay(v)} />
                ))}
              </div>
              <div className="pay-tray" ref={trayRef}>
                <T p={p('Bandeja de pago', 'Վճարման սկուտեղ')} />: <b>{fmtEuro(paidSum)}</b>
                <button className="tool" onClick={() => setPaid([])}>
                  ↺
                </button>
              </div>
              <Btn label={p('Pagar', 'Վճարել')} icon="💳" onClick={confirmPay} disabled={paid.length === 0} />
            </>
          )}
          {phase === 'change' && (
            <Choices
              options={changeOpts.map((c) => cap1(priceP(c)))}
              onPick={(i) => {
                if (changeOpts[i] === changeDue) {
                  sellerSay(p(`¡Exacto! Aquí tienes ${priceP(changeDue).es}. ¡Hasta luego!`, `Ճիշտ է։ Ահա ${priceP(changeDue).hy}։ Առայժմ։`));
                  setTimeout(() => setPhase('done'), 1800);
                } else err(p(`No. Has pagado ${priceP(paidSum).es} y son ${priceP(total).es}.`, `Ոչ։ Վճարել ես ${priceP(paidSum).hy}, իսկ արժե ${priceP(total).hy}։`));
              }}
            />
          )}
        </div>
      )}

      <Feedback fb={fb} onClose={() => setFb(null)} />
      {phase === 'done' && (
        <Reward
          id={'shop:' + level}
          stars={starsFor(Math.ceil(mistakes))}
          message={p('¡Compra terminada! Ya tengo todo lo que necesito.', 'Գնումներն ավարտված են։ Արդեն ունեմ ամեն անհրաժեշտ բան։')}
          onAgain={() => location.reload()}
        />
      )}
    </div>
  );
}

function cap1(ph: P): P {
  return { es: cap(ph.es), hy: cap(ph.hy) };
}
void numHy;
