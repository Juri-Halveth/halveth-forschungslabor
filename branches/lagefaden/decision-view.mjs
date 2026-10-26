// SPDX-License-Identifier: MIT
import {decisionProfiles,makeDecisionExport} from './decision-relevance.mjs';
const el=(tag,text,className)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
const byId=id=>document.getElementById(id);
const outcomes={INPUT_REQUIREMENTS_BOUND:'Benötigte Angaben vorhanden',REVIEW_DERIVED_INPUTS:'Ableitungen prüfen',REVIEW_OPEN_REQUIREMENTS:'Benötigte Angabe fehlt',PENDING:'Snapshot lädt',UNAVAILABLE:'Quelle nicht auswertbar'};
const requirements={BOUND_INPUT:'gebunden',REQUIRES_DERIVATION_REVIEW:'abgeleitet · prüfen',REQUIRED_UNKNOWN:'fehlt',BASIS_NOT_ACCEPTED:'andere Belegbasis nötig'};
const basis={DATA:'Datenfeld',RECEIPT:'Abrufreceipt',DERIVED:'belegte Ableitung'};

export function mountDecisionReview(onChange,onInspect) {
  const picker=byId('decision-profile');
  for(const profile of decisionProfiles){const option=el('option',profile.title);option.value=profile.id;picker.append(option);}
  let matrix;
  picker.addEventListener('change',onChange);
  byId('decision-export').addEventListener('click',()=>{
    const data=makeDecisionExport(matrix,picker.value);
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'}));
    const a=el('a');a.href=url;a.download='lagefaden-prueffrage-'+picker.value.toLowerCase()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  return {
    getProfileId:()=>picker.value,
    render(nextMatrix,review) {
      matrix=nextMatrix;
      byId('decision-description').textContent=review.profile.description;
      const rules=byId('decision-rules');rules.replaceChildren();
      for(const requirement of review.profile.required) {
        const li=el('li');li.append(el('strong',requirement.label),el('p',requirement.why),el('small','Akzeptierte Antwortbasis: '+requirement.acceptedBasis.map(state=>basis[state]).join(' oder ')));rules.append(li);
      }
      const cards=byId('decision-cards');cards.replaceChildren();
      for(const source of review.sourceReviews) {
        const card=el('article',undefined,'decision-card');card.dataset.source=source.sourceId;card.dataset.state=source.state;
        card.append(el('h4',source.sourceLabel),el('small',source.caseId??'Noch kein gültiger Fall','decision-case'),el('p',outcomes[source.state],'decision-outcome'));
        const list=el('ul',undefined,'decision-requirements');
        for(const requirement of source.requirements) {
          const li=el('li');li.dataset.requirement=requirement.facetId;li.dataset.state=requirement.state;
          const inspect=el('button',requirement.label);inspect.type='button';inspect.dataset.facet=requirement.facetId;
          inspect.setAttribute('aria-label',source.sourceLabel+' · '+requirement.label+' anzeigen');inspect.setAttribute('aria-controls','coverage-detail');
          inspect.addEventListener('click',()=>onInspect(source.sourceId,requirement.facetId));
          li.append(inspect,el('strong',requirements[requirement.state]));list.append(li);
        }
        card.append(list);
        if(source.state==='PENDING'||source.state==='UNAVAILABLE')card.append(el('p','Die Eingaben dieses Profils werden erst mit einem gültigen Snapshot bewertet.','decision-next'));
        else if(source.openRequirementIds.length===1) {
          const required=source.requirements.find(r=>r.facetId===source.openRequirementIds[0]);
          card.append(el('p','Letzte offene Pflichtfrage in diesem Profil: '+required.label+'. Eine beleggebundene Ergänzung würde diese Eingabelücke schließen.','decision-next'));
        } else if(source.openRequirementIds.length>1)card.append(el('p',source.openRequirementIds.length+' Pflichtfragen sind offen. Die Ergänzung einer einzelnen lässt '+(source.openRequirementIds.length-1)+' weitere offen.','decision-next'));
        else if(source.state==='REVIEW_DERIVED_INPUTS')card.append(el('p','Die benötigten Antworten liegen vor. Ihre ausgewiesene Ableitung bleibt als eigener Prüfschritt sichtbar.','decision-next'));
        else card.append(el('p','Die benötigten Datenfelder und Receipts liegen in diesem Fall vor. Weitere offene Teilfragen bleiben in der Coverage-Karte erhalten.','decision-next'));
        if(source.scopeState==='DECLARED_REVIEW_PROFILE_ONLY')card.append(el('small',source.otherUnknown.length+' weitere offene Teilfragen außerhalb dieses Profils','decision-other-gaps'));
        cards.append(card);
      }
      byId('decision-export').disabled=!matrix.sources.some(source=>source.availability==='PRESENT');
    }
  };
}
