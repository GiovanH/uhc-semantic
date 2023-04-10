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

const person_matchers = [
  { name: "aradia", predicate: labelColorPairPredicateFactory(["AA", "ARADIASPRITE", "ARADIABOT", "FAA", "PAA", "CAA", "ARADIA"], 'A10000') },
  { name: "aradia.bot", predicate: labelColorPairPredicateFactory(["AA"], '000056') },
  { name: "aranea", predicate: labelColorPairPredicateFactory(["ARANEA", "NEYTIRI"], '005682') },
  { name: "bec.sprite", predicate: labelColorPairPredicateFactory(["BECSPRITE"], '1F9400') },
  { name: "calliope", predicate: labelColorPairPredicateFactory(["CALLIOPE", "UU"], ['929292', 'FF0000']) },
  { name: "calsprite", predicate: labelColorPairPredicateFactory(["CALSPRITE"], 'F2A400') },
  { name: "condesce", predicate: labelColorPairPredicateFactory([")(IC"], '77003C') },
  { name: "dave", predicate: labelColorPairPredicateFactory(["TG", "DAVE", "CTG"], 'E00707') },
  { name: "dave.sprite", predicate: labelColorPairPredicateFactory(["DAVESPRITE", "TG"], 'F2A400') },
  { name: "dirk", predicate: labelColorPairPredicateFactory(["TT", "DIRK"], ['F2A400', 'FFCC00']) },
  { name: "dirk.alt", predicate: labelColorPairPredicateFactory(["TT"], 'E00707') },
  { name: "equius", predicate: labelColorPairPredicateFactory(["CT", "EQUIUS", "CCT", "FCT"], '000056') },
  { name: "equius.sprite", predicate: labelColorPairPredicateFactory(["EQUIUSPRITE"], 'E00707') },
  { name: "eridan", predicate: labelColorPairPredicateFactory(["CA", "FCA", "PCA"], '6A006A') },
  { name: "F2A400", predicate: labelColorPairPredicateFactory(["CALSPRITE", "DAVESPRITE", "TG", "TT", "DIRK"], 'F2A400') },
  { name: "feferi", predicate: labelColorPairPredicateFactory(["CC", "CCC", "PCC", "FEFERI"], '77003C') },
  { name: "gamzee", predicate: labelColorPairPredicateFactory(["TC", "PTC", "FTC", "GAMZEE"], ['4200B0', '2B0057']) },
  { name: "hatliker", predicate: labelColorPairPredicateFactory(["HATLIKER"], '000000') },
  { name: "jade", predicate: labelColorPairPredicateFactory(["GG", "JADE"], '4AC925') },
  { name: "jade.sprite", predicate: labelColorPairPredicateFactory(["JADESPRITE"], '1F9400') },
  { name: "jake", predicate: labelColorPairPredicateFactory(["JAKE", "GT"], '1F9400') },
  { name: "jane", predicate: labelColorPairPredicateFactory(["GG", "JANE"], '00D5F2') },
  { name: "jane.sprite", predicate: labelColorPairPredicateFactory(["NANNASPRITE"], '00D5F2') },
  { name: "jasper.sprite", predicate: labelColorPairPredicateFactory(["JASPERSPRITE"], ['F141EF', 'FF6FF2']) },
  { name: "john", predicate: labelColorPairPredicateFactory(["EB", "JOHN", "GT", "(JOHN)", "E8", "CEB"], '0715CD') },
  { name: "kanaya", predicate: labelColorPairPredicateFactory(["GA", "CGA", "FGA", "KANAYA"], '008141') },
  { name: "kanayamom", predicate: labelColorPairPredicateFactory(["MOTHERSPRITE"], '008141') },
  { name: "karkat", predicate: labelColorPairPredicateFactory(
    ["CG", "CCG", "FCG", "PCG", "FCG2", "PCG2", "PCG3", "PCG4", "PCG5", "PCG6", "PCG7", "KARKAT"],
    ['FF0000', '626262']) },
  { name: "meenah", predicate: labelColorPairPredicateFactory(["MEENAH"], '77003C') },
  { name: "nepeta", predicate: labelColorPairPredicateFactory(["AC", "CAC", "FAC", "NEPETA"], '416600') },
  { name: "nepeta.sprite", predicate: labelColorPairPredicateFactory(["NEPETASPRITE"], '4AC925') },
  { name: "rose", predicate: labelColorPairPredicateFactory(["TT", "ROSE"], 'B536DA') },
  { name: "rose.sprite", predicate: labelColorPairPredicateFactory(["ROSESPRITE"], 'B536DA') },
  { name: "roxy", predicate: labelColorPairPredicateFactory(["TG", "ROXY"], ['FBBAFF', 'FF6FF2']) },
  { name: "sollux", predicate: labelColorPairPredicateFactory(["TA", "PTA", "CTA", "SOLLUX"], 'A1A100') },
  { name: "spr2.arquiusprite", predicate: labelColorPairPredicateFactory(["ARQUIUSPRITE"], 'E00707') },
  { name: "spr2.davepetasprite", predicate: labelColorPairPredicateFactory(["DAVEPETASPRITE^2"], '4AC925') },
  { name: "spr2.erisolsprite", predicate: labelColorPairPredicateFactory(["ERISOLSPRITE"], '4AC925') },
  { name: "spr2.erisolsprite", predicate: labelColorPairPredicateFactory(["ERISOLSPRITE"], '50F520') },
  { name: "spr2.fefetasprite", predicate: labelColorPairPredicateFactory(["FEFETASPRITE"], 'B536DA') },
  { name: "spr2.gcatavrosprite", predicate: labelColorPairPredicateFactory(["GCATAVROSPRITE"], '0715CD') },
  { name: "spr2.jasprosesprite", predicate: labelColorPairPredicateFactory(["JASPROSESPRITE^2"], ['FF6FF2', 'F141EF']) },
  { name: "spr2.tavrisprite", predicate: labelColorPairPredicateFactory(["TAVRISPRITE"], '0715CD') },
  { name: "tavros", predicate: labelColorPairPredicateFactory(["AT", "PAT", "FAT", "TAVROS"], 'A15000') },
  { name: "tavros.sprite", predicate: labelColorPairPredicateFactory(["TAVROSPRITE"], '0715CD') },
  { name: "terezi", predicate: labelColorPairPredicateFactory(["GC", "PGC", "CGC", "FGC", "TEREZI", "TER3Z1"], '008282') },
  { name: "terezimom", predicate: labelColorPairPredicateFactory(["DRAGONSPRITE"], '008282') },
  { name: "vriska", predicate: labelColorPairPredicateFactory(["AG", "FAG", "PAG", "CAG", "VRISKA", "(VRISKA)"], '005682') },
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

  // SPEAKER: Text formatted logs
  container.querySelectorAll('span[style]').forEach(line => {
    try {
      const loh = line.outerHTML
      const match_fb = re_convo_line_no_speaker.exec(loh)
      if (match_fb) {
        const match = re_convo_line_with_speaker.exec(loh)
        if (match) {
          Object.keys(match.groups).forEach(prop => {
            if (prop == 'color') return
            line.setAttribute(`data-sem-${prop}`, match.groups[prop])
          })
          line.setAttribute(`data-sem-color`, match.groups['color'].toUpperCase())

          // Check for spr2 and process next span
          if (match.groups['color'].includes('^2')) {
            const real_line = line.nextElementSibling
            assert(real_line.tag == "SPAN")
            // real_line.setAttribute(`data-sem-color`, match_fb.groups['color'].toUpperCase())

            // Shenanigans:
            // Hoist label into span
            real_line.insertAdjacentElement('afterBegin', line)
            // Move data from label to real line
            ;['label', 'person'].forEach(prop => {
              const attr = `data-sem-${prop}`
              real_line.setAttribute(attr, prev_el.getAttribute(attr))
              line.removeAttribute(attr)
            })
          }
          line.setAttribute(`data-sem-person`, line.getAttribute(`data-sem-person`) || identifyPerson(line))
        } else {
          // Just a colored span, probably.
          // api.logger.warn('no label, but not sprite^2:', loh)
        }
      } else {
        // Span is styled, make sure it's not colored too (tricking our regex)
        // if (line.style.color)
        //   api.logger.warn('unmatched:', loh)
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
    Object.keys(archive.mspa.story).forEach(page_num => {
      archive.mspa.story[page_num] = {
        ...archive.mspa.story[page_num],
        ...makeSemanticContent(archive.mspa.story[page_num].content)
      }
    })

    archive.flags['mod.semantic'] = true
  }
}
