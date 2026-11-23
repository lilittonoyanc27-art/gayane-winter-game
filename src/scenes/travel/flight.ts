import { p } from '../../core/types';

/** Fictional flight data (realistic structure, invented values). */
export const FLIGHT = {
  code: 'AU 482',
  airline: 'Aurora Air',
  from: 'Madrid',
  to: 'Lisboa',
  dep: '10:45',
  boarding: '10:10',
  newBoarding: '10:20',
  terminal: 'T2',
  counters: '14–16',
  gate: 'B14',
  newGate: 'B22',
  arrival: '11:05',
};

export const BOARD = [
  { time: '09:35', city: p('Ámsterdam', 'Ամստերդամ'), code: 'NV 210', term: 'T2', desk: '20–22', gate: 'B08', st: p('Embarcando', 'Նստեցում') },
  { time: '09:50', city: p('Sevilla', 'Սևիլյա'), code: 'IA 117', term: 'T1', desk: '03–05', gate: 'A04', st: p('A la hora', 'Ժամանակին') },
  { time: '10:15', city: p('Roma', 'Հռոմ'), code: 'SR 731', term: 'T2', desk: '10–12', gate: 'B10', st: p('Retrasado', 'Ուշանում է') },
  { time: '10:45', city: p('Lisboa', 'Լիսաբոն'), code: 'AU 482', term: 'T2', desk: '14–16', gate: 'B14', st: p('A la hora', 'Ժամանակին'), mine: true },
  { time: '11:00', city: p('Lisboa', 'Լիսաբոն'), code: 'TL 590', term: 'T2', desk: '24–26', gate: 'B30', st: p('A la hora', 'Ժամանակին') },
  { time: '11:20', city: p('Viena', 'Վիեննա'), code: 'MX 118', term: 'T2', desk: '17–19', gate: 'B18', st: p('Cancelado', 'Չեղարկված') },
  { time: '11:40', city: p('Bilbao', 'Բիլբաո'), code: 'IA 233', term: 'T1', desk: '06–08', gate: 'A12', st: p('A la hora', 'Ժամանակին') },
];
