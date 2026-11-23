import { p, type Level, type P } from '../core/types';

export interface Word {
  e: string;
  w: P;
  pl?: string; // Spanish plural for counting games
  plHy?: string;
  level: Level;
}

export const VOCAB: Word[] = [
  { e: '⛄', w: p('el muñeco de nieve', 'ձնեմարդ'), pl: 'muñecos de nieve', plHy: 'ձնեմարդ', level: 'A1' },
  { e: '🎄', w: p('el árbol de Navidad', 'տոնածառ'), pl: 'árboles', plHy: 'տոնածառ', level: 'A1' },
  { e: '🎁', w: p('el regalo', 'նվեր'), pl: 'regalos', plHy: 'նվեր', level: 'A1' },
  { e: '🧣', w: p('la bufanda', 'շարֆ'), level: 'A1' },
  { e: '🧤', w: p('los guantes', 'ձեռնոցներ'), level: 'A1' },
  { e: '🧥', w: p('el abrigo', 'վերարկու'), level: 'A1' },
  { e: '👢', w: p('las botas', 'երկարաճիտ կոշիկներ'), level: 'A1' },
  { e: '🍫', w: p('el chocolate', 'շոկոլադ'), level: 'A1' },
  { e: '☕', w: p('la taza', 'բաժակ'), pl: 'tazas', plHy: 'բաժակ', level: 'A1' },
  { e: '🍪', w: p('la galleta', 'թխվածքաբլիթ'), pl: 'galletas', plHy: 'թխվածքաբլիթ', level: 'A1' },
  { e: '⭐', w: p('la estrella', 'աստղ'), pl: 'estrellas', plHy: 'աստղ', level: 'A1' },
  { e: '🐈', w: p('el gato', 'կատու'), pl: 'gatos', plHy: 'կատու', level: 'A1' },
  { e: '🐕', w: p('el perro', 'շուն'), pl: 'perros', plHy: 'շուն', level: 'A1' },
  { e: '🍞', w: p('el pan', 'հաց'), level: 'A1' },
  { e: '🥛', w: p('la leche', 'կաթ'), level: 'A1' },
  { e: '🍎', w: p('la manzana', 'խնձոր'), pl: 'manzanas', plHy: 'խնձոր', level: 'A1' },
  { e: '🏠', w: p('la casa', 'տուն'), pl: 'casas', plHy: 'տուն', level: 'A1' },
  { e: '☀️', w: p('el sol', 'արև'), level: 'A1' },
  { e: '🕯️', w: p('la vela', 'մոմ'), pl: 'velas', plHy: 'մոմ', level: 'A1' },
  { e: '🛷', w: p('el trineo', 'սահնակ'), pl: 'trineos', plHy: 'սահնակ', level: 'A2' },
  { e: '🎿', w: p('los esquís', 'դահուկներ'), level: 'A2' },
  { e: '⛸️', w: p('los patines', 'չմուշկներ'), level: 'A2' },
  { e: '🔔', w: p('la campana', 'զանգակ'), pl: 'campanas', plHy: 'զանգակ', level: 'A2' },
  { e: '🧦', w: p('los calcetines', 'գուլպաներ'), level: 'A2' },
  { e: '🌙', w: p('la luna', 'լուսին'), level: 'A2' },
  { e: '🏔️', w: p('la montaña', 'լեռ'), pl: 'montañas', plHy: 'լեռ', level: 'A2' },
  { e: '🐧', w: p('el pingüino', 'պինգվին'), pl: 'pingüinos', plHy: 'պինգվին', level: 'A2' },
  { e: '🌡️', w: p('el termómetro', 'ջերմաչափ'), level: 'A2' },
  { e: '☁️', w: p('la nube', 'ամպ'), pl: 'nubes', plHy: 'ամպ', level: 'A2' },
  { e: '🧊', w: p('el hielo', 'սառույց'), level: 'A2' },
  { e: '🔥', w: p('el fuego', 'կրակ'), level: 'A2' },
  { e: '🦌', w: p('el ciervo', 'եղնիկ'), pl: 'ciervos', plHy: 'եղնիկ', level: 'B1' },
  { e: '🐿️', w: p('la ardilla', 'սկյուռ'), pl: 'ardillas', plHy: 'սկյուռ', level: 'B1' },
  { e: '🦉', w: p('el búho', 'բու'), pl: 'búhos', plHy: 'բու', level: 'B1' },
  { e: '🎀', w: p('el lazo', 'ժապավեն'), level: 'B1' },
  { e: '🌰', w: p('las castañas', 'շագանակներ'), level: 'B1' },
  { e: '🧶', w: p('el ovillo de lana', 'բրդե թելի կծիկ'), level: 'B1' },
  { e: '🎆', w: p('los fuegos artificiales', 'հրավառություն'), level: 'B2' },
  { e: '🥂', w: p('el brindis', 'կենաց'), level: 'B2' },
  { e: '🍇', w: p('las uvas', 'խաղող'), level: 'B2' },
  { e: '👑', w: p('la corona', 'թագ'), level: 'B2' },
  { e: '🪵', w: p('la leña', 'վառելափայտ'), level: 'B2' },
];

export interface DlgItem {
  level: Level;
  lines: (P | null)[]; // null = missing line
  who: string[];
  options: P[];
  answer: number;
}

export const DIALOGS: DlgItem[] = [
  { level: 'A1', who: ['A', 'B', 'A'], lines: [p('¡Hola! ¿Qué tal?', 'Բարև։ Ինչպե՞ս ես։'), null, p('Yo también, gracias.', 'Ես էլ, շնորհակալություն։')], options: [p('Muy bien, ¿y tú?', 'Շատ լավ, իսկ դու՞։'), p('Me llamo Ana.', 'Իմ անունը Աննա է։'), p('Son las tres.', 'Ժամը երեքն է։')], answer: 0 },
  { level: 'A1', who: ['A', 'B', 'A'], lines: [p('¿Quieres un chocolate caliente?', 'Տաք շոկոլադ ուզո՞ւմ ես։'), null, p('¡Aquí tienes!', 'Խնդրեմ։')], options: [p('Sí, por favor.', 'Այո, խնդրում եմ։'), p('Tengo veinte años.', 'Քսան տարեկան եմ։'), p('Hace sol.', 'Արևոտ է։')], answer: 0 },
  { level: 'A1', who: ['A', 'B', 'A'], lines: [p('¿Qué tiempo hace hoy?', 'Ինչպիսի՞ եղանակ է այսօր։'), null, p('Entonces me pongo el abrigo.', 'Ուրեմն վերարկուս կհագնեմ։')], options: [p('Hace mucho frío.', 'Շատ ցուրտ է։'), p('Me gusta el té.', 'Թեյ եմ սիրում։'), p('Mi gato es blanco.', 'Կատուս սպիտակ է։')], answer: 0 },
  { level: 'A2', who: ['A', 'B', 'A'], lines: [p('¿Qué hiciste el fin de semana?', 'Ի՞նչ արեցիր հանգստյան օրերին։'), null, p('¡Qué divertido! ¿Te caíste?', 'Ինչ զվարճալի է։ Ընկա՞ր։')], options: [p('Fui a esquiar con mis amigas.', 'Ընկերուհիներիս հետ դահուկ քշելու գնացի։'), p('Voy a esquiar mañana.', 'Վաղը դահուկ քշելու եմ գնալու։'), p('No me gusta el invierno.', 'Ձմեռը չեմ սիրում։')], answer: 0 },
  { level: 'A2', who: ['A', 'B', 'A'], lines: [p('Perdone, ¿dónde está la parada del autobús?', 'Ներեցեք, որտե՞ղ է ավտոբուսի կանգառը։'), null, p('Muchas gracias.', 'Շատ շնորհակալություն։')], options: [p('Al final de la calle, a la derecha.', 'Փողոցի վերջում՝ աջ կողմում։'), p('Son las cinco y media.', 'Ժամը հինգն անց կես է։'), p('Me encanta el autobús.', 'Ավտոբուսը շատ եմ սիրում։')], answer: 0 },
  { level: 'A2', who: ['A', 'B', 'A'], lines: [p('¿Has probado las galletas de mi abuela?', 'Փորձե՞լ ես տատիկիս թխվածքաբլիթները։'), null, p('Pues tienes que probarlas, ¡están buenísimas!', 'Ուրեմն պետք է փորձես, շատ համեղ են։')], options: [p('No, todavía no las he probado.', 'Ոչ, դեռ չեմ փորձել։'), p('Sí, mañana.', 'Այո, վաղը։'), p('No, las probé ayer.', 'Ոչ, երեկ փորձեցի։')], answer: 0 },
  { level: 'B1', who: ['A', 'B', 'A'], lines: [p('Si mañana nieva, ¿vienes a la montaña?', 'Եթե վաղը ձյուն գա, կգա՞ս լեռներ։'), null, p('Vale, te llamo por la mañana para confirmar.', 'Լավ, առավոտյան կզանգեմ քեզ՝ հաստատելու համար։')], options: [p('Depende de cómo me encuentre, pero creo que sí.', 'Կախված է նրանից, թե ինչպես կզգամ, բայց կարծում եմ՝ այո։'), p('Ayer fui a la montaña.', 'Երեկ լեռներ գնացի։'), p('Nieva mucho en la montaña.', 'Լեռներում շատ ձյուն է գալիս։')], answer: 0 },
  { level: 'B1', who: ['A', 'B', 'A'], lines: [p('Te veo un poco preocupada. ¿Qué te pasa?', 'Քեզ մի քիչ մտահոգված եմ տեսնում։ Ի՞նչ է պատահել։'), null, p('Tranquila, seguro que te sale muy bien.', 'Հանգիստ, համոզված եմ՝ շատ լավ կստացվի։')], options: [p('Es que mañana tengo un examen de español.', 'Բանն այն է, որ վաղը իսպաներենի քննություն ունեմ։'), p('Estoy muy contenta.', 'Շատ ուրախ եմ։'), p('Me gusta tu jersey.', 'Սվիտերդ ինձ դուր է գալիս։')], answer: 0 },
  { level: 'B2', who: ['A', 'B', 'A'], lines: [p('¿Te importaría cerrar la ventana? Entra mucho frío.', 'Դեմ չե՞ս լինի փակել պատուհանը։ Շատ ցուրտ է ներս մտնում։'), null, p('Gracias, eres un sol.', 'Շնորհակալություն, դու հրաշք ես։')], options: [p('En absoluto, ahora mismo la cierro.', 'Բնավ, հենց հիմա կփակեմ։'), p('Sí, me importa mucho el frío.', 'Այո, ցուրտը շատ է ինձ հետաքրքրում։'), p('La ventana es muy grande.', 'Պատուհանը շատ մեծ է։')], answer: 0 },
  { level: 'B2', who: ['A', 'B', 'A'], lines: [p('Ojalá hubiéramos reservado antes la casa rural.', 'Երանի ավելի շուտ ամրագրած լինեինք գյուղական տունը։'), null, p('Sí, la próxima vez lo haremos con más tiempo.', 'Այո, հաջորդ անգամ ավելի շուտ կանենք։')], options: [p('Ya, ahora está todo completo por las fiestas.', 'Այո, հիմա տոների պատճառով ամեն ինչ զբաղված է։'), p('Reservo la casa ayer.', 'Երեկ ամրագրում եմ տունը։'), p('Me encantan las casas.', 'Տները շատ եմ սիրում։')], answer: 0 },
];

export const ORDER_SENT: { level: Level; p: P }[] = [
  { level: 'A1', p: p('Hace mucho frío hoy.', 'Այսօր շատ ցուրտ է։') },
  { level: 'A1', p: p('Tengo que ponerme un abrigo.', 'Ես պետք է վերարկու հագնեմ։') },
  { level: 'A1', p: p('Me gusta el chocolate caliente.', 'Ինձ դուր է գալիս տաք շոկոլադը։') },
  { level: 'A1', p: p('Mi casa es pequeña y bonita.', 'Իմ տունը փոքր է և գեղեցիկ։') },
  { level: 'A1', p: p('Hoy está nevando en la ciudad.', 'Այսօր քաղաքում ձյուն է գալիս։') },
  { level: 'A2', p: p('Voy a preparar chocolate caliente.', 'Ես պատրաստվում եմ տաք շոկոլադ պատրաստել։') },
  { level: 'A2', p: p('Ayer fui al parque con mi amiga.', 'Երեկ ընկերուհուս հետ այգի գնացի։') },
  { level: 'A2', p: p('Esta mañana me he levantado temprano.', 'Այս առավոտ վաղ եմ արթնացել։') },
  { level: 'A2', p: p('Primero preparo el desayuno y después me visto.', 'Նախ պատրաստում եմ նախաճաշը, հետո հագնվում եմ։') },
  { level: 'B1', p: p('Cuando era pequeña me encantaba la nieve.', 'Երբ փոքր էի, ձյունը շատ էի սիրում։') },
  { level: 'B1', p: p('Si hace buen tiempo iremos a la montaña.', 'Եթե եղանակը լավ լինի, լեռներ կգնանք։') },
  { level: 'B1', p: p('Espero que te guste mi regalo.', 'Հուսով եմ՝ նվերս քեզ դուր կգա։') },
  { level: 'B2', p: p('Si hubiera nevado más habríamos ido a esquiar.', 'Եթե ավելի շատ ձյուն եկած լիներ, դահուկ քշելու կգնայինք։') },
  { level: 'B2', p: p('Aunque haga frío saldremos a ver las luces.', 'Թեկուզ ցուրտ լինի, դուրս կգանք լույսերը տեսնելու։') },
  { level: 'B2', p: p('No creo que la tienda esté abierta tan tarde.', 'Չեմ կարծում, որ խանութն այդքան ուշ բաց լինի։') },
];

export interface ErrItem {
  level: Level;
  words: string[];
  wrong: number;
  options: string[]; // first = correct
  full: P; // corrected sentence
  rule: P;
}
const w = (s: string) => s.split(' ');
export const ERRORS: ErrItem[] = [
  { level: 'A1', words: w('La niña está muy contento.'), wrong: 4, options: ['contenta.', 'contentos.', 'contentas.'], full: p('La niña está muy contenta.', 'Աղջիկը շատ ուրախ է։'), rule: p('«Niña» es femenino: contenta.', '«Niña»-ն իգական սեռի է՝ contenta։') },
  { level: 'A1', words: w('Yo tiene mucho frío.'), wrong: 1, options: ['tengo', 'tienes', 'tenemos'], full: p('Yo tengo mucho frío.', 'Ես շատ եմ մրսում։'), rule: p('Con «yo» el verbo es «tengo».', '«Yo»-ի հետ բայը «tengo» է։') },
  { level: 'A1', words: w('El nieve es muy blanca.'), wrong: 0, options: ['La', 'Los', 'Un'], full: p('La nieve es muy blanca.', 'Ձյունը շատ սպիտակ է։'), rule: p('«Nieve» es femenino: la nieve.', '«Nieve»-ն իգական սեռի է՝ la nieve։') },
  { level: 'A1', words: w('Los guantes es rojos.'), wrong: 2, options: ['son', 'está', 'eres'], full: p('Los guantes son rojos.', 'Ձեռնոցները կարմիր են։'), rule: p('Plural: «son».', 'Հոգնակի՝ «son»։') },
  { level: 'A2', words: w('Ayer voy al parque con Lucía.'), wrong: 1, options: ['fui', 'iré', 'iba'], full: p('Ayer fui al parque con Lucía.', 'Երեկ Լուսիայի հետ այգի գնացի։'), rule: p('«Ayer» pide el pretérito indefinido: fui.', '«Ayer»-ը պահանջում է անցյալ կատարյալ՝ fui։') },
  { level: 'A2', words: w('Me gusta los gatos blancos.'), wrong: 1, options: ['gustan', 'gustas', 'gusté'], full: p('Me gustan los gatos blancos.', 'Ինձ դուր են գալիս սպիտակ կատուները։'), rule: p('«Los gatos» es plural: me gustan.', '«Los gatos»-ը հոգնակի է՝ me gustan։') },
  { level: 'A2', words: w('Hoy he comí mucho chocolate.'), wrong: 2, options: ['comido', 'como', 'comer'], full: p('Hoy he comido mucho chocolate.', 'Այսօր շատ շոկոլադ եմ կերել։'), rule: p('Pretérito perfecto: haber + participio (comido).', 'Ներկա վաղակատար՝ haber + դերբայ (comido)։') },
  { level: 'A2', words: w('Hay mucho gente en la calle.'), wrong: 1, options: ['mucha', 'muchos', 'muchas'], full: p('Hay mucha gente en la calle.', 'Փողոցում շատ մարդ կա։'), rule: p('«Gente» es femenino singular: mucha gente.', '«Gente»-ն իգական եզակի է՝ mucha gente։') },
  { level: 'B1', words: w('Cuando era pequeña, jugué siempre en la nieve.'), wrong: 3, options: ['jugaba', 'juego', 'jugaré'], full: p('Cuando era pequeña, jugaba siempre en la nieve.', 'Երբ փոքր էի, միշտ ձյան մեջ էի խաղում։'), rule: p('Hábitos del pasado: imperfecto (jugaba).', 'Անցյալի սովորություններ՝ անցյալ անկատար (jugaba)։') },
  { level: 'B1', words: w('Busco a alguien que sabe esquiar.'), wrong: 4, options: ['sepa', 'supo', 'sabía'], full: p('Busco a alguien que sepa esquiar.', 'Փնտրում եմ մեկին, ով կարողանա դահուկ քշել։'), rule: p('Persona desconocida o hipotética: subjuntivo (sepa).', 'Անհայտ կամ ենթադրյալ անձ՝ ըղձական (sepa)։') },
  { level: 'B1', words: w('Es importante que llevas guantes.'), wrong: 3, options: ['lleves', 'llevar', 'llevabas'], full: p('Es importante que lleves guantes.', 'Կարևոր է, որ ձեռնոցներ կրես։'), rule: p('«Es importante que» + subjuntivo.', '«Es importante que» + ըղձական։') },
  { level: 'B2', words: w('Si tendría tiempo, haría un muñeco de nieve.'), wrong: 1, options: ['tuviera', 'tengo', 'tendré'], full: p('Si tuviera tiempo, haría un muñeco de nieve.', 'Եթե ժամանակ ունենայի, ձնեմարդ կսարքեի։'), rule: p('Condicional irreal: si + imperfecto de subjuntivo.', 'Անիրական պայման՝ si + անցյալ ըղձական։') },
  { level: 'B2', words: w('Me alegro de que vienes a la fiesta.'), wrong: 4, options: ['vengas', 'vendrás', 'venías'], full: p('Me alegro de que vengas a la fiesta.', 'Ուրախ եմ, որ գալիս ես խնջույքի։'), rule: p('Emoción + que + subjuntivo.', 'Զգացմունք + que + ըղձական։') },
  { level: 'B2', words: w('Ojalá nieva mucho mañana.'), wrong: 1, options: ['nieve', 'nevará', 'nevaba'], full: p('Ojalá nieve mucho mañana.', 'Երանի վաղը շատ ձյուն գա։'), rule: p('«Ojalá» va con subjuntivo.', '«Ojalá»-ն օգտագործվում է ըղձականի հետ։') },
];

export interface Sit {
  level: Level;
  sit: P;
  options: P[];
  best: number;
  why: P;
}
export const SITUATIONS: Sit[] = [
  { level: 'A1', sit: p('Tu amiga está triste porque no puede ir a la montaña.', 'Ընկերուհիդ տխուր է, որովհետև չի կարող լեռներ գնալ։'), options: [p('La invito a tomar un chocolate caliente.', 'Նրան հրավիրում եմ տաք շոկոլադ խմելու։'), p('Le digo que no me importa.', 'Ասում եմ, որ ինձ չի հետաքրքրում։'), p('Me voy sin decir nada.', 'Գնում եմ՝ ոչինչ չասելով։')], best: 0, why: p('Es un gesto bonito para animarla.', 'Դա գեղեցիկ քայլ է՝ նրան ոգևորելու համար։') },
  { level: 'A1', sit: p('Hace mucho frío y quieres salir a pasear.', 'Շատ ցուրտ է, և ուզում ես զբոսնել։'), options: [p('Me pongo el abrigo, el gorro y los guantes.', 'Հագնում եմ վերարկուն, գլխարկը և ձեռնոցները։'), p('Salgo en camiseta.', 'Դուրս եմ գալիս շապիկով։'), p('Me pongo las sandalias.', 'Սանդալներ եմ հագնում։')], best: 0, why: p('Con frío hay que abrigarse bien.', 'Ցրտին պետք է լավ տաք հագնվել։') },
  { level: 'A2', sit: p('En el café, el camarero te trae un té, pero tú pediste un chocolate.', 'Սրճարանում մատուցողը քեզ թեյ է բերում, բայց դու շոկոլադ էիր պատվիրել։'), options: [p('Perdone, yo había pedido un chocolate caliente.', 'Ներեցեք, ես տաք շոկոլադ էի պատվիրել։'), p('¡Esto está fatal! ¡Qué mal servicio!', 'Սա սարսափելի է։ Ինչ վատ սպասարկում է։'), p('No digo nada y me voy.', 'Ոչինչ չեմ ասում և գնում եմ։')], best: 0, why: p('Es educado y claro.', 'Դա քաղաքավարի է և պարզ։') },
  { level: 'A2', sit: p('Tus amigas llegan en diez minutos y la casa está desordenada.', 'Ընկերուհիներդ տասը րոպեից գալիս են, իսկ տունն անկարգ է։'), options: [p('Recojo rápidamente el salón.', 'Արագ հավաքում եմ հյուրասենյակը։'), p('Cancelo la visita.', 'Չեղարկում եմ այցը։'), p('Me echo una siesta.', 'Մի քիչ ննջում եմ։')], best: 0, why: p('Diez minutos son suficientes para ordenar un poco.', 'Տասը րոպեն բավական է մի քիչ կարգի բերելու համար։') },
  { level: 'A2', sit: p('Encuentras unos guantes en la calle.', 'Փողոցում ձեռնոցներ ես գտնում։'), options: [p('Los dejo en un lugar visible, por si su dueño vuelve.', 'Դնում եմ տեսանելի տեղում, եթե տերը վերադառնա։'), p('Los tiro a la basura.', 'Նետում եմ աղբարկղը։'), p('Me los pongo y me los quedo.', 'Հագնում եմ և ինձ եմ պահում։')], best: 0, why: p('Así el dueño puede encontrarlos.', 'Այդպես տերը կարող է գտնել դրանք։') },
  { level: 'B1', sit: p('Tu vecina mayor tiene que ir a la farmacia, pero la calle está llena de hielo.', 'Տարեց հարևանուհիդ պետք է դեղատուն գնա, բայց փողոցը սառցակալած է։'), options: [p('Me ofrezco a ir yo a la farmacia por ella.', 'Առաջարկում եմ ինքս գնալ դեղատուն նրա փոխարեն։'), p('Le digo que tenga cuidado y cierro la puerta.', 'Ասում եմ, որ զգույշ լինի, և փակում եմ դուռը։'), p('Le recomiendo que corra para no tener frío.', 'Խորհուրդ եմ տալիս վազել, որ չմրսի։')], best: 0, why: p('Ayudar a los vecinos hace el invierno más cálido.', 'Հարևաններին օգնելը ձմեռն ավելի ջերմ է դարձնում։') },
  { level: 'B1', sit: p('Está nevando muchísimo y tienes una cita en el centro.', 'Շատ ուժեղ ձյուն է գալիս, և ժամադրություն ունես կենտրոնում։'), options: [p('Llamo para proponer cambiar la cita a otro día.', 'Զանգում եմ՝ առաջարկելու ժամադրությունը տեղափոխել այլ օր։'), p('No voy y no aviso.', 'Չեմ գնում և չեմ զգուշացնում։'), p('Voy en bici muy rápido.', 'Շատ արագ հեծանիվով եմ գնում։')], best: 0, why: p('Avisar es lo más respetuoso y seguro.', 'Զգուշացնելը ամենահարգալից և անվտանգ տարբերակն է։') },
  { level: 'B2', sit: p('Una amiga te pregunta qué opinas de su jersey nuevo, que no te gusta nada.', 'Ընկերուհիդ հարցնում է՝ ինչ կարծիքի ես իր նոր սվիտերի մասին, որն ընդհանրապես դուր չի գալիս քեզ։'), options: [p('Le digo con tacto que el otro color le quedaba todavía mejor.', 'Նրբանկատորեն ասում եմ, որ մյուս գույնն ավելի լավ էր սազում նրան։'), p('Le digo que es horrible.', 'Ասում եմ, որ սարսափելի է։'), p('Cambio de tema sin contestar.', 'Փոխում եմ թեման՝ առանց պատասխանելու։')], best: 0, why: p('Se puede ser sincera sin herir a nadie.', 'Կարելի է անկեղծ լինել՝ առանց որևէ մեկին վիրավորելու։') },
  { level: 'B2', sit: p('Alguien se resbala en el hielo justo delante de ti.', 'Ինչ-որ մեկը սայթաքում է սառույցի վրա հենց քո առջև։'), options: [p('Le ayudo a levantarse y le pregunto si se ha hecho daño.', 'Օգնում եմ վեր կենալ և հարցնում, թե արդյոք չի վնասվել։'), p('Me río y sigo caminando.', 'Ծիծաղում եմ և շարունակում քայլել։'), p('Le saco una foto.', 'Լուսանկարում եմ նրան։')], best: 0, why: p('Lo primero es comprobar que la persona esté bien.', 'Առաջին հերթին պետք է համոզվել, որ մարդը լավ է։') },
];
