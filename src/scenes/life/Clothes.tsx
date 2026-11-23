import { useMemo, useState } from 'react';
import { Btn, Feedback, Instruction, type Fb } from '../../components/UI';
import { Talk, type TNode } from '../../components/Talk';
import { Person, LOOKS } from '../../components/Person';
import { Gayane, type ClothId } from '../../components/Gayane';
import { Drag, Drop } from '../../components/DnD';
import { Pay, type Mission } from '../../components/Life';
import { T, Phrase } from '../../core/translate';
import { sfx } from '../../core/sound';
import { p, type P } from '../../core/types';
import { fmtEuro, pick } from '../../core/util';
import { Finish, LifeGrid, MissionGame, type Done } from './common';

const MISSIONS: Mission[] = [
  { id: 'comprar', icon: '🧥', title: p('Comprar ropa', 'Հագուստ գնել'), desc: p('Elige, pruébate la talla correcta y paga.', 'Ընտրիր, փորձիր ճիշտ չափսը և վճարիր։') },
  { id: 'devolver', icon: '↩️', title: p('Devolver una compra', 'Վերադարձնել գնումը'), desc: p('El tique, el motivo y el reembolso.', 'Կտրոնը, պատճառը և գումարի վերադարձը։') },
];
type Item = { id: ClothId; name: P; art: string; artHy: string; price: number; color: string; fem: boolean };
const ITEMS: Item[] = [
  { id: 'chaqueta', name: p('chaqueta azul marino', 'մուգ կապույտ բաճկոն'), art: 'una chaqueta', artHy: 'բաճկոն', price: 69, color: '#1f2b46', fem: true },
  { id: 'vestido', name: p('vestido rosa empolvado', 'փոշեվարդագույն զգեստ'), art: 'un vestido', artHy: 'զգեստ', price: 55, color: '#c9a0a3', fem: false },
  { id: 'jersey', name: p('jersey granate', 'մուգ կարմիր սվիտեր'), art: 'un jersey', artHy: 'սվիտեր', price: 39, color: '#6e1a33', fem: false },
  { id: 'falda', name: p('falda midi', 'միդի կիսաշրջազգեստ'), art: 'una falda', artHy: 'կիսաշրջազգեստ', price: 45, color: '#8f2648', fem: true },
  { id: 'abrigo', name: p('abrigo beige', 'բեժ վերարկու'), art: 'un abrigo', artHy: 'վերարկու', price: 129, color: '#d8bc9a', fem: false },
];
const GOALS: { item: ClothId; t: P }[] = [
  { item: 'chaqueta', t: p('Mañana tienes una reunión importante. Busca una chaqueta elegante.', 'Վաղը կարևոր հանդիպում ունես։ Փնտրիր նրբագեղ բաճկոն։') },
  { item: 'vestido', t: p('Una amiga se casa el sábado. Busca un vestido.', 'Ընկերուհիդ շաբաթ օրը ամուսնանում է։ Փնտրիր զգեստ։') },
  { item: 'abrigo', t: p('Hace frío y tu abrigo es viejo. Busca un abrigo nuevo.', 'Ցուրտ է, և վերարկուդ հին է։ Փնտրիր նոր վերարկու։') },
];
const SIZES = ['S', 'M', 'L'] as const;

export function Clothes() {
  return (
    <MissionGame game="clothes" title={p('En una tienda de ropa', 'Հագուստի խանութում')} icon="🛍️" missions={MISSIONS}
      intro={<div className="place-intro"><Phrase p={p('Gayane usa la talla M. Hoy va de compras a una tienda del centro.', 'Գայանեն կրում է M չափս։ Այսօր գնումների է գնում կենտրոնի մի խանութ։')} /></div>}
      render={(id, done) => (id === 'comprar' ? <Buy done={done} /> : <Return done={done} />)} />
  );
}

function Shop({ children, fitting }: { children?: React.ReactNode; fitting?: React.ReactNode }) {
  return (
    <div className="boutique">
      <div className="bq-wall"><span className="bq-sign">ATELIER · MODA</span></div>
      <div className="bq-staff"><Person look={LOOKS.dependienta} /></div>
      {fitting}
      {children}
    </div>
  );
}

function Buy({ done }: { done: Done }) {
  const goal = useMemo(() => pick(GOALS), []);
  const [phase, setPhase] = useState<'greet' | 'choose' | 'try' | 'ask' | 'pay' | 'end'>('greet');
  const [item, setItem] = useState<Item | null>(null);
  const [size, setSize] = useState<(typeof SIZES)[number] | null>(null);
  const [fb, setFb] = useState<Fb | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  const fit = size === 'M' ? 'ok' : size === 'S' ? 'small' : 'big';
  const adj = (f: 'small' | 'big') => (item?.fem ? (f === 'small' ? 'pequeña' : 'grande') : f === 'small' ? 'pequeño' : 'grande');
  const greet: TNode[] = [
    { id: 's', who: 'd', line: p('Buenos días. ¿Puedo ayudarle en algo?', 'Բարի լույս։ Կարո՞ղ եմ ինչ-որ բանով օգնել։'), opts: [
      { p: p('Sí, gracias. Estoy buscando ropa para una ocasión especial.', 'Այո, շնորհակալություն։ Հատուկ առիթի համար հագուստ եմ փնտրում։') },
      { p: p('Solo estoy mirando, gracias.', 'Պարզապես նայում եմ, շնորհակալություն։'), reply: p('Muy bien. Si necesita algo, me avisa.', 'Շատ լավ։ Եթե ինչ-որ բան պետք լինի, ասեք։') },
      { p: p('Dame un vestido.', 'Զգեստ տուր։'), ok: false, reply: p('Con mucho gusto, pero… ¿qué tipo de vestido busca?', 'Սիրով, բայց… ինչպիսի՞ զգեստ եք փնտրում։') },
    ] },
  ];
  const ask = (): TNode[] => {
    const f = fit as 'small' | 'big';
    const want = f === 'small' ? 'más grande' : 'más pequeña';
    const wantHy = f === 'small' ? 'ավելի մեծ' : 'ավելի փոքր';
    return [
      { id: 's', who: 'd', line: p('¿Qué tal le queda?', 'Ինչպե՞ս է նստում։'), opts: [
        { p: p(`Me queda un poco ${adj(f)}. ¿Tiene una talla ${want}?`, `Մի քիչ ${f === 'small' ? 'փոքր' : 'մեծ'} է։ ${wantHy[0].toUpperCase() + wantHy.slice(1)} չափս ունե՞ք։`), next: 'r' },
        { p: p('Me queda perfecto.', 'Կատարյալ նստում է։'), ok: false, reply: p('Mmm… a mí me parece que no es su talla. ¿Quiere probarse otra?', 'Մմ… ինձ թվում է՝ ձեր չափսը չէ։ Ուզո՞ւմ եք մեկ ուրիշը փորձել։') },
      ] },
      { id: 'r', who: 'd', line: p('Ahora mismo le traigo la M.', 'Հենց հիմա կբերեմ M-ը։'), effect: 'sizeM' },
    ];
  };
  const payT: TNode[] = [
    { id: 's', who: 'd', line: p(`¿Se lo lleva? Son ${item ? item.price : 0} euros.`, `Վերցնո՞ւմ եք։ ${item ? item.price : 0} եվրո է։`), opts: [
      { p: p('Sí, me lo llevo. ¿Puedo pagar con tarjeta?', 'Այո, վերցնում եմ։ Կարո՞ղ եմ քարտով վճարել։'), reply: p('Claro que sí.', 'Իհարկե։') },
      { p: p('Sí. ¿Me lo podría envolver para regalo?', 'Այո։ Կարո՞ղ եք նվերի համար փաթեթավորել։'), lv: 'A2', reply: p('Por supuesto, sin coste adicional.', 'Իհարկե, առանց լրացուցիչ վճարի։') },
      { p: p('¿Hay descuento?', 'Զեղչ կա՞։'), lv: 'B1', reply: p('Esta semana no, lo siento. Pero con la tarjeta de la tienda acumula puntos.', 'Այս շաբաթ՝ ոչ, ցավոք։ Բայց խանութի քարտով միավորներ եք կուտակում։') },
    ] },
  ];
  const wear: ClothId[] = item ? (item.id === 'vestido' ? ['vestido'] : item.id === 'falda' ? ['falda', 'camiseta'] : [item.id, 'pantalones']) : ['jersey', 'pantalones'];
  return (
    <div className="mission-play">
      <Instruction p={goal.t} icon="🎯" auto={phase === 'greet'} />
      <LifeGrid art={
        <Shop fitting={phase === 'try' || phase === 'ask' ? (
          <div className="fitting pop-in"><div className="fit-curtain" /><div className={'fit-girl fit-' + fit}><Gayane wear={wear} mood={fit === 'ok' ? 'happy' : 'think'} /></div><span className="fit-size">{size}</span></div>
        ) : undefined}>
          <div className="rack">
            {ITEMS.map((it) => (
              <button key={it.id} className={'hanger ' + (item?.id === it.id ? 'on' : '')} disabled={phase !== 'choose'} onClick={() => { sfx.click(); setItem(it); setSize(null); }}>
                <span className="hg-hook" /><span className="hg-cloth" style={{ background: it.color }} /><T p={it.name} /><b>{fmtEuro(it.price)}</b>
              </button>
            ))}
          </div>
        </Shop>
      }>
        {phase === 'greet' && <Talk nodes={greet} people={{ d: { name: p('Dependienta', 'Վաճառողուհի'), icon: '🛍️' } }} onEnd={(m) => (setMistakes(m), setPhase('choose'))} />}
        {phase === 'choose' && (
          <div className="task-box pop-in">
            <Instruction p={p('Elige la prenda y la talla, y ve al probador.', 'Ընտրիր հագուստը և չափսը, ապա գնա հանդերձափոխարան։')} icon="👗" auto={false} />
            <div className="size-row">{SIZES.map((s) => <button key={s} className={'lchip ' + (size === s ? 'on' : '')} onClick={() => setSize(s)}>{s}</button>)}</div>
            <Btn label={p('Ir al probador', 'Գնալ հանդերձափոխարան')} icon="🚪" disabled={!item || !size} onClick={() => {
              if (item!.id !== goal.item) { setMistakes((m) => m + 1); setFb({ ok: false, p: p(`Es bonito, pero hoy buscas ${ITEMS.find((x) => x.id === goal.item)!.art}.`, `Գեղեցիկ է, բայց այսօր ${ITEMS.find((x) => x.id === goal.item)!.artHy} ես փնտրում։`) }); return; }
              sfx.whoosh(); setPhase('try');
            }} />
          </div>
        )}
        {phase === 'try' && (
          <div className="task-box pop-in">
            <Phrase p={fit === 'ok' ? p('¡Me queda perfecta! Es mi talla.', 'Կատարյալ նստում է։ Իմ չափսն է։') : fit === 'small' ? p(`Uf… me queda ${adj('small')}.`, 'Ուֆ… փոքր է ինձ։') : p(`Me queda ${adj('big')}.`, 'Մեծ է ինձ։')} />
            <Btn label={fit === 'ok' ? p('Ir a la caja', 'Գնալ դրամարկղ') : p('Hablar con la dependienta', 'Խոսել վաճառողուհու հետ')} icon="→" onClick={() => setPhase(fit === 'ok' ? 'pay' : 'ask')} />
          </div>
        )}
        {phase === 'ask' && <Talk nodes={ask()} people={{ d: { name: p('Dependienta', 'Վաճառողուհի'), icon: '🛍️' } }} onEffect={(e) => e === 'sizeM' && setSize('M')} onEnd={(m) => { setMistakes((x) => x + m); setSize('M'); setPhase('try'); }} />}
        {phase === 'pay' && (
          <>
            <Talk nodes={payT} people={{ d: { name: p('Dependienta', 'Վաճառողուհի'), icon: '🛍️' } }} onEnd={(m) => (setMistakes((x) => x + m), setPhase('end'))} />
          </>
        )}
        {phase === 'end' && item && <Pay total={item.price} onPaid={() => setFinished(true)} />}
      </LifeGrid>
      <Feedback fb={fb} onClose={() => setFb(null)} />
      {finished && <Finish done={done} mistakes={mistakes} msg={p('¡Compra hecha! Te queda perfecto.', 'Գնումը կատարված է։ Կատարյալ նստում է։')} />}
    </div>
  );
}

function Return({ done }: { done: Done }) {
  const [phase, setPhase] = useState<'talk1' | 'tique' | 'talk2'>('talk1');
  const [desk, setDesk] = useState<string[]>([]);
  const [fb, setFb] = useState<Fb | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  const give = (id: string) => {
    if (id !== 'tique') { setMistakes((m) => m + 1); setFb({ ok: false, p: p('Eso no hace falta. Necesito el tique de compra.', 'Դա պետք չէ։ Ինձ պետք է գնման կտրոնը։') }); return; }
    sfx.drop(); setDesk((d) => [...d, '🧾']); setPhase('talk2');
  };
  const t1: TNode[] = [
    { id: 's', who: 'd', line: p('Buenas tardes. ¿En qué puedo ayudarle?', 'Բարի օր։ Ինչո՞վ կարող եմ օգնել։'), opts: [
      { p: p('Buenas tardes. Quisiera devolver este jersey. Me queda grande.', 'Բարի օր։ Կցանկանայի վերադարձնել այս սվիտերը։ Մեծ է ինձ։') },
      { p: p('Compré este jersey la semana pasada, pero no me queda bien. ¿Lo puedo devolver?', 'Անցյալ շաբաթ եմ գնել այս սվիտերը, բայց լավ չի նստում։ Կարո՞ղ եմ վերադարձնել։'), lv: 'A2' },
      { p: p('Este jersey es feo.', 'Այս սվիտերը տգեղ է։'), ok: false, reply: p('Vaya… ¿quiere devolverlo o cambiarlo?', 'Ափսոս… ուզում եք վերադարձնե՞լ, թե՞ փոխել։') },
    ], next: 't' },
    { id: 't', who: 'd', line: p('Claro. ¿Tiene el tique de compra?', 'Իհարկե։ Գնման կտրոնն ունե՞ք։'), opts: [{ p: p('Sí, aquí lo tengo.', 'Այո, ահա այն։') }, { p: p('Sí, un momento, que lo busco en el bolso.', 'Այո, մի րոպե, պայուսակումս փնտրեմ։') }] },
  ];
  const t2: TNode[] = [
    { id: 's', who: 'd', line: p('Perfecto, está dentro del plazo de treinta días. ¿Prefiere el reembolso o cambiarlo por otra talla?', 'Կատարյալ է, երեսուն օրվա ժամկետում է։ Նախընտրում եք գումարի վերադա՞րձ, թե՞ փոխել այլ չափսով։'), opts: [
      { p: p('Prefiero el reembolso, por favor.', 'Նախընտրում եմ գումարի վերադարձ, խնդրում եմ։'), reply: p('Se lo devuelvo en la misma tarjeta. En unos días lo verá en su cuenta.', 'Կվերադարձնեմ նույն քարտին։ Մի քանի օրից կտեսնեք ձեր հաշվում։') },
      { p: p('Lo cambio por una talla M, si la tienen.', 'Կփոխեմ M չափսով, եթե ունեք։'), reply: p('Sí, aquí tiene la M. ¿Quiere probársela?', 'Այո, ահա M-ը։ Ուզո՞ւմ եք փորձել։') },
      { p: p('¿Y si lo cambio por otro color?', 'Իսկ եթե փոխեմ այլ գույնով։'), lv: 'B1', reply: p('También es posible: lo tenemos en azul marino y en beige.', 'Դա նույնպես հնարավոր է՝ ունենք մուգ կապույտ և բեժ։') },
    ], next: 'e' },
    { id: 'e', who: 'd', line: p('Ya está. ¿Necesita algo más?', 'Պատրաստ է։ Էլի ինչ-որ բան պե՞տք է։'), opts: [{ p: p('No, eso es todo. Muchas gracias.', 'Ոչ, այսքանը։ Շատ շնորհակալություն։') }] },
  ];
  return (
    <div className="mission-play">
      <LifeGrid art={<Shop><Drop id="caja" className={'bq-counter ' + (phase === 'tique' ? 'want' : '')} accept={(pl) => pl.kind === 'ret' && phase === 'tique'} onDrop={(pl) => give(pl.id)}><T p={p('Caja', 'Դրամարկղ')} /> <span>👚 {desk.join(' ')}</span></Drop></Shop>}>
        {phase === 'talk1' && <Talk nodes={t1} people={{ d: { name: p('Dependienta', 'Վաճառողուհի'), icon: '🛍️' } }} onEnd={(m) => (setMistakes(m), setPhase('tique'))} />}
        {phase === 'tique' && <div className="task-box pop-in"><Instruction p={p('Busca el tique en el bolso y déjalo en la caja.', 'Գտիր կտրոնը պայուսակում և դիր դրամարկղի վրա։')} icon="🧾" />
          <div className="bag-items">{[{ id: 'llaves', i: '🔑', n: p('las llaves', 'բանալիները') }, { id: 'tique', i: '🧾', n: p('el tique de compra', 'գնման կտրոնը') }, { id: 'pintalabios', i: '💄', n: p('el pintalabios', 'շրթներկը') }, { id: 'tarjeta', i: '🎫', n: p('una tarjeta de visita', 'այցեքարտ') }].map((x) => <Drag key={x.id} kind="ret" id={x.id} className="bag-item" onTap={() => give(x.id)}><span className="bi-icon">{x.i}</span><T p={x.n} /></Drag>)}</div></div>}
        {phase === 'talk2' && <Talk nodes={t2} people={{ d: { name: p('Dependienta', 'Վաճառողուհի'), icon: '🛍️' } }} onEnd={(m) => { setMistakes((x) => x + m); setFinished(true); }} />}
      </LifeGrid>
      <Feedback fb={fb} onClose={() => setFb(null)} />
      {finished && <Finish done={done} mistakes={mistakes} msg={p('Devolución hecha sin problemas.', 'Վերադարձը կատարվեց առանց խնդիրների։')} />}
    </div>
  );
}
