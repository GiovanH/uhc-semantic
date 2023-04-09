let api;

const { JSDOM } = require('./node_modules/jsdom')

var dom;

const re_convo_line_with_speaker = /<span style="color: #(?<color>[A-Fa-f0-9]+)">(?<label>[()A-Z0-9^]+):/
const re_convo_line_no_speaker = /<span style="color: #(?<color>[A-Fa-f0-9]+)">/

function labelColorPairPredicateFactory(labels, color) {
  return function(node) {
    sem_color = node.getAttribute('data-sem-color')
    if (
      (sem_color == color || Array.isArray(color) && color.includes(sem_color))
      && labels.includes(node.getAttribute('data-sem-label'))
    ) {
      return true
    }
  }
}

// Object.keys($vm0.speakerColorData.speakersByColor).map(hex => `  { name: "${hex}",
//     predicate: labelInListPredicateFactory(${JSON.stringify($vm0.speakerColorData.speakersByColor[hex])}) },`).join('\n')

const person_matchers = [
  { name: "nepeta",
    predicate: labelColorPairPredicateFactory(
      ["AC", "CAC", "FAC", "NEPETA"], '416600') },
  { name: "karkat",
    predicate: labelColorPairPredicateFactory(
      ["CG", "CCG", "FCG", "PCG", "FCG2", "PCG2", "PCG3", "PCG4", "PCG5", "PCG6", "PCG7", "KARKAT"], '626262') },
  { name: "calliope",
    predicate: labelColorPairPredicateFactory(
      ["UU", "CALLIOPE"], '929292') },
  { name: "dave",
    predicate: labelColorPairPredicateFactory(
      ["TG", "DAVE", "CTG"], 'E00707') },
  { name: "dirk.ar",
    predicate: labelColorPairPredicateFactory(
      ["TT"], 'E00707') },
  { name: "equius.sprite",
    predicate: labelColorPairPredicateFactory(
      ["EQUIUSPRITE"], 'E00707') },
  { name: "spr2.arquiusprite",
    predicate: labelColorPairPredicateFactory(
      ["ARQUIUSPRITE"], 'E00707') },
  { name: "john",
    predicate: labelColorPairPredicateFactory(
      ["EB", "JOHN", "GT"], '0715CD') },
  { name: "john",
    predicate: labelColorPairPredicateFactory(
      ["E8", "CEB"], '0715CD') },
  { name: "spr2.tavrisprite",
    predicate: labelColorPairPredicateFactory(
      ["TAVRISPRITE"], '0715CD') },
  { name: "tavros.sprite",
    predicate: labelColorPairPredicateFactory(
      ["TAVROSPRITE"], '0715CD') },
  { name: "spr2.gcatavrosprite",
    predicate: labelColorPairPredicateFactory(
      ["GCATAVROSPRITE"], '0715CD') },
  { name: "rose",
    predicate: labelColorPairPredicateFactory(
      ["TT", "ROSE"], 'B536DA') },
  { name: "rose.sprite",
    predicate: labelColorPairPredicateFactory(
      ["ROSESPRITE"], 'B536DA') },
  { name: "spr2.fefetasprite",
    predicate: labelColorPairPredicateFactory(
      ["FEFETASPRITE"], 'B536DA') },
  { name: "jade",
    predicate: labelColorPairPredicateFactory(
      ["GG", "JADE"], '4AC925') },
  { name: "spr2.erisolsprite",
    predicate: labelColorPairPredicateFactory(
      ["ERISOLSPRITE"], '4AC925') },
  { name: "nepeta.sprite",
    predicate: labelColorPairPredicateFactory(
      ["NEPETASPRITE"], '4AC925') },
  { name: "spr2.davepetasprite",
    predicate: labelColorPairPredicateFactory(
      ["DAVEPETASPRITE^2"], '4AC925') },
  { name: "jane.sprite",
    predicate: labelColorPairPredicateFactory(
      ["NANNASPRITE"], '00D5F2') },
  { name: "jane",
    predicate: labelColorPairPredicateFactory(
      ["GG", "JANE"], '00D5F2') },
  { name: "kanaya",
    predicate: labelColorPairPredicateFactory(
      ["GA", "CGA", "FGA", "KANAYA"], '008141') },
  { name: "kanayamom",
    predicate: labelColorPairPredicateFactory(
      ["MOTHERSPRITE"], '008141') },
  { name: "tavros",
    predicate: labelColorPairPredicateFactory(
      ["AT", "PAT", "FAT", "TAVROS"], 'A15000') },
  { name: "terezimom",
    predicate: labelColorPairPredicateFactory(
      ["DRAGONSPRITE"], '008282') },
  { name: "008282",
    predicate: labelColorPairPredicateFactory(
      ["GC", "PGC", "CGC", "FGC", "TEREZI", "TER3Z1"], '008282') },
  { name: "jasper.sprite",
    predicate: labelColorPairPredicateFactory(
      ["JASPERSPRITE"], 'F141EF') },
  { name: "spr2.jasprosesprite",
    predicate: labelColorPairPredicateFactory(
      ["JASPROSESPRITE^2"], 'F141EF') },
  { name: "calsprite",
    predicate: labelColorPairPredicateFactory(
      ["CALSPRITE"], 'F2A400') },
  { name: "dave.sprite",
    predicate: labelColorPairPredicateFactory(
      ["DAVESPRITE", "TG"], 'F2A400') },
  { name: "dirk",
    predicate: labelColorPairPredicateFactory(
      ["TT", "DIRK"], 'F2A400') },
  { name: "F2A400",
    predicate: labelColorPairPredicateFactory(
      ["CALSPRITE", "DAVESPRITE", "TG", "TT", "DIRK"], 'F2A400') },
  { name: "sollux",
    predicate: labelColorPairPredicateFactory(
      ["TA", "PTA", "CTA", "SOLLUX"], 'A1A100') },
  { name: "gamzee",
    predicate: labelColorPairPredicateFactory(
      ["TC", "PTC", "FTC", "GAMZEE"], '2B0057') },
  { name: "aradia",
    predicate: labelColorPairPredicateFactory(
      ["AA", "ARADIASPRITE", "ARADIABOT", "FAA", "PAA", "CAA", "ARADIA"], 'A10000') },
  { name: "vriska",
    predicate: labelColorPairPredicateFactory(
      ["AG", "FAG", "PAG", "CAG", "VRISKA", "(VRISKA)"], '005682') },
  { name: "aranea",
    predicate: labelColorPairPredicateFactory(
      ["ARANEA", "NEYTIRI"], '005682') },
  { name: "equius",
    predicate: labelColorPairPredicateFactory(
      ["CT", "EQUIUS", "CCT", "FCT"], '000056') },
  { name: "aradia.bot",
    predicate: labelColorPairPredicateFactory(
      ["AA"], '000056') },
  { name: "feferi",
    predicate: labelColorPairPredicateFactory(
      ["CC", "CCC", "PCC", "FEFERI"], '77003C') },
  { name: "meenah",
    predicate: labelColorPairPredicateFactory(
      ["MEENAH"], '77003C') },
  { name: "eridan",
    predicate: labelColorPairPredicateFactory(
      ["CA", "FCA", "PCA"], '6A006A') },
  { name: "bec.sprite",
    predicate: labelColorPairPredicateFactory(
      ["BECSPRITE"], '1F9400') },
  { name: "jade.sprite",
    predicate: labelColorPairPredicateFactory(
      ["JADESPRITE"], '1F9400') },
  { name: "jake",
    predicate: labelColorPairPredicateFactory(
      ["JAKE"], '1F9400') },
  { name: "gamzee",
    predicate: labelColorPairPredicateFactory(
      ["TC"], '4200B0') },
  { name: "roxy",
    predicate: labelColorPairPredicateFactory(
      ["TG", "ROXY"], 'FF6FF2') },
  { name: "jasper.sprite",
    predicate: labelColorPairPredicateFactory(
      ["JASPERSPRITE"], 'FF6FF2') },
  { name: "calliope",
    predicate: labelColorPairPredicateFactory(
      ["CALLIOPE"], 'FF0000') },
  { name: "karkat",
    predicate: labelColorPairPredicateFactory(
      ["FCG", "CCG"], 'FF0000') },
  { name: "hatliker",
    predicate: labelColorPairPredicateFactory(
      ["HATLIKER"], '000000') },
  { name: "spr2.erisolsprite",
    predicate: labelColorPairPredicateFactory(
      ["ERISOLSPRITE"], '50F520') },
  { name: "roxy",
    predicate: labelColorPairPredicateFactory(
      ["TG", "ROXY"], 'FBBAFF') },
  { name: "dirk",
    predicate: labelColorPairPredicateFactory(
      ["DIRK"], 'FFCC00') },
].sort(function(a, b) {
  // Check children before parents
  return b.name.split('.').length - a.name.split('.').length
})

function identifyPerson(node) {
  for (const i in person_matchers) {
    const {name, predicate} = person_matchers[i]
    if (predicate(node) == true) {
      return name
    }
  }
  api.logger.warn("Unknown person", node.outerHTML)
  return "UNKNOWN"
}

function makeSemanticContent(orig_content) {
  dom = dom || new JSDOM('<!DOCTYPE html><body></body>').window.document;

  container = dom.createElement('div')
  container.innerHTML = orig_content
  api.logger.info(container)

  // SPEAKER: Text formatted logs
  container.querySelectorAll('span[style]').forEach(line => {
    try {
      const loh = line.outerHTML
      const match_fb = re_convo_line_no_speaker.exec(loh)
      if (match_fb) {
        const match = re_convo_line_with_speaker.exec(loh)
        if (match) {
          Object.keys(match.groups).forEach(prop => {
            line.setAttribute(`data-sem-${prop}`, match.groups[prop])
          })
          line.setAttribute(`data-sem-color`, match.groups['color'].toUpperCase())
        } else {
          // Dialogue-ish line, but no speaker label
          // Detect sprite^2
          const prev_el = line.previousElementSibling
          if (prev_el.getAttribute('data-sem-label').includes('^2')) {
            // Object.keys(match_fb.groups).forEach(prop => {
            //   line.setAttribute(`data-sem-${prop}`, match_fb.groups[prop])
            // })
            line.setAttribute(`data-sem-color`, match_fb.groups['color'].toUpperCase())
            // Shenanigans:
            // Hoist label into span
            line.insertAdjacentElement('afterBegin', prev_el)
            // Move data from label to real line
            ;['label', 'person'].forEach(prop => {
              const attr = `data-sem-${prop}`
              line.setAttribute(attr, prev_el.getAttribute(attr))
              prev_el.removeAttribute(attr)
            })
          } else {
            // Did not match hs2
            api.logger.warn('no label, but not sprite^2:', loh)
          }
        }
        // Cleanup for sem'd dialogue line (unless we just set it or copied it over from a spr2 thing)
        line.setAttribute(`data-sem-person`, line.getAttribute(`data-sem-person`) || identifyPerson(line))
      } else {
        // Did not match fallback
        api.logger.warn('unmatched:', loh)
      }
    } catch (e) { api.logger.error(line); throw e; }
  })

  res = container.innerHTML.replace(/<br>/g, '<br />')
  // if (res != orig_content) {
  //   api.logger.warn(orig_content, '\n-------\n', res)
  // }
  return {
    content: res
  }
}

module.exports = {
  title: "Semantic Info",
  summary: "",
  author: "GiovanH",
  version: 0.1,

  computed(api_) {
    api = api_
  },

  edit(archive) {
    // Object.keys(archive.mspa.story)
    ;['009548'].forEach(page_num => {
      archive.mspa.story[page_num] = {
        ...archive.mspa.story[page_num],
        ...makeSemanticContent(archive.mspa.story[page_num].content)
      }
    })

    archive.flags['mod.semantic'] = true
  }
}
