// SPDX-License-Identifier: MIT
const t = '2026-10-19T10:10:00+02:00';
const root = (id, originId, observedAt, receivedAt, finding) =>
  ({id, originId, parentId: null, observedAt, receivedAt, finding});
const copy = (id, parent, receivedAt) =>
  ({...parent, id, parentId: parent.id, receivedAt});
const a = root('A', 'camera_A_declared', '2026-10-19T10:02:00+02:00', '2026-10-19T10:03:00+02:00', 'possible_object');
const b = copy('B', a, '2026-10-19T10:05:00+02:00');
const old = root('C', 'witness_C_declared', '2026-10-18T10:00:00+02:00', '2026-10-19T10:06:00+02:00', 'alternative_explanation');
const current = {...old, observedAt: '2026-10-19T10:04:00+02:00'};
export const cases = [
  {title:'Drei Meldungen, zwei deklarierte Ursprünge', explanation:'B ist eine Weitergabe von A. C ist eine alte, anderslautende Beobachtung.',
    packet:{caseId:'COPY_AND_OLD', referenceTime:t, freshnessMinutes:60, reports:[a,b,old]}},
  {title:'Zwei frische, widersprüchliche Ursprünge', explanation:'C ist diesmal frisch. Die Aussagen widersprechen sich: Rückfrage statt Gewissheit.',
    packet:{caseId:'CURRENT_CONFLICT', referenceTime:t, freshnessMinutes:60, reports:[a,b,current]}},
  {title:'Eine neue Beobachtung, keine Kopie', explanation:'D meldet ein eigenes Ereignis. Sie erhält eine eigene Zeile, auch wenn die Aussage gleich lautet.',
    packet:{caseId:'NEW_OBSERVATION', referenceTime:t, freshnessMinutes:60, reports:[a,b,root('D','camera_D_declared','2026-10-19T10:07:00+02:00','2026-10-19T10:08:00+02:00','possible_object')]}},
  {title:'Empfang heute, Beobachtung gestern', explanation:'Eine frische Weiterleitung macht den alten Ursprung nicht frisch.',
    packet:{caseId:'LATE_COPY', referenceTime:t, freshnessMinutes:60, reports:[old,copy('E',old,'2026-10-19T10:09:00+02:00')]}},
  {title:'Zwei Kennungen, eine unbekannte Herkunft', explanation:'Gegenfall: Im erfundenen Szenario stammen beide Einträge in Wahrheit von derselben Stelle. Die eingegebenen IDs verraten das nicht. Genau deshalb ist das Ergebnis keine bestätigte Unabhängigkeit.',
    packet:{caseId:'CLAIMED_INDEPENDENCE', referenceTime:t, freshnessMinutes:60,
      reports:[a,root('X','invented_second_origin','2026-10-19T10:06:00+02:00','2026-10-19T10:07:00+02:00','possible_object')]}}
];
