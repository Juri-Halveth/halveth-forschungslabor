/** Human-readable reference translation, standard genetic code only (NCBI table 1).
 * No genome editing, no wet-lab procedure, no prediction of traits or consciousness.
 */
const rows = [
  ['UUU','F'],['UUC','F'],['UUA','L'],['UUG','L'],
  ['UCU','S'],['UCC','S'],['UCA','S'],['UCG','S'],
  ['UAU','Y'],['UAC','Y'],['UAA','*'],['UAG','*'],
  ['UGU','C'],['UGC','C'],['UGA','*'],['UGG','W'],
  ['CUU','L'],['CUC','L'],['CUA','L'],['CUG','L'],
  ['CCU','P'],['CCC','P'],['CCA','P'],['CCG','P'],
  ['CAU','H'],['CAC','H'],['CAA','Q'],['CAG','Q'],
  ['CGU','R'],['CGC','R'],['CGA','R'],['CGG','R'],
  ['AUU','I'],['AUC','I'],['AUA','I'],['AUG','M'],
  ['ACU','T'],['ACC','T'],['ACA','T'],['ACG','T'],
  ['AAU','N'],['AAC','N'],['AAA','K'],['AAG','K'],
  ['AGU','S'],['AGC','S'],['AGA','R'],['AGG','R'],
  ['GUU','V'],['GUC','V'],['GUA','V'],['GUG','V'],
  ['GCU','A'],['GCC','A'],['GCA','A'],['GCG','A'],
  ['GAU','D'],['GAC','D'],['GAA','E'],['GAG','E'],
  ['GGU','G'],['GGC','G'],['GGA','G'],['GGG','G'],
];
export const STANDARD_CODON_TABLE=Object.freeze(Object.fromEntries(rows));
export function transcribeCodingDNA(sequence){
  if(typeof sequence==='string'&&sequence.length>100000)throw new RangeError('DNA reference length exceeds 100000 bases');
  if(typeof sequence!=='string'||!/^[ACGT]+$/i.test(sequence))throw new TypeError('DNA coding-strand ACGT sequence required');
  return sequence.toUpperCase().replaceAll('T','U');
}
export function translateRNA(rna,{frame=0,requireStart=true}={}){
  if(typeof rna==='string'&&rna.length>100000)throw new RangeError('RNA reference length exceeds 100000 bases');
  if(typeof rna!=='string'||!/^[ACGU]+$/i.test(rna))throw new TypeError('RNA ACGU sequence required');
  if(!Number.isInteger(frame)||frame<0||frame>2)throw new TypeError('frame must be 0, 1 or 2');
  if(typeof requireStart!=='boolean')throw new TypeError('requireStart must be boolean');
  const sequence=rna.toUpperCase();let start=frame;
  if(requireStart){start=-1;for(let i=frame;i<=sequence.length-3;i+=3)if(sequence.slice(i,i+3)==='AUG'){start=i;break;}}
  if(start===-1)return {status:'NO_START_FOUND',protein:'',start:null,stop:null,frame,codons:[],direction:'5_PRIME_TO_3_PRIME',geneticCode:1,trailingBases:sequence.slice(frame)};
  let protein='',stop=null;const codons=[];
  for(let i=start;i<=sequence.length-3;i+=3){const codon=sequence.slice(i,i+3),aa=STANDARD_CODON_TABLE[codon];
    codons.push({index:i,codon,aminoAcid:aa});if(aa==='*'){stop=i;break;}protein+=aa;
  }
  return {status:stop===null?'INCOMPLETE_NO_STOP':'STOP_FOUND',protein,start,stop,frame,codons,direction:'5_PRIME_TO_3_PRIME',geneticCode:1,
    trailingBases:stop===null?sequence.slice(start+codons.length*3):sequence.slice(stop+3)};
}
export function expressCodingDNA(dna,options){const rna=transcribeCodingDNA(dna);return {schema:'halveth.genetic-coding-reference.v1',
  sourceDNA:dna,normalizedDNA:dna.toUpperCase(),normalization:'EXPLICIT_ASCII_CASE_FOLD',rna,translation:translateRNA(rna,options),note:'symbolic standard codon table with AUG-start heuristic, not protein synthesis simulation'};}
export function attachGeneReadout(world,{entityId,processId='gene-readout',codingDNA,everyTicks=100}={}){
  const rna=transcribeCodingDNA(codingDNA);
  return world.addProcess({id:processId,entityId,everyTicks,description:'Reference gene readout; not a molecular dynamics simulation',
    sourceRef:'STANDARD_GENETIC_CODE_DEMONSTRATION',behaviorId:'halveth:gene-reference:1',parameters:{codingDNA,rna},run:ctx=>{
      if(ctx.read(entityId).dimensions.last_rna!==rna){const result=translateRNA(rna);
        ctx.update('last_rna',rna,'CODE_REFERENCE');ctx.update('last_translation',result,'CODE_REFERENCE');}
    }});
}
