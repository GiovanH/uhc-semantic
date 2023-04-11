let api;

var dom;

var cache = {};

const re_convo_line_with_speaker = /^<span style="[^"]*?color: #(?<color>[A-Fa-f0-9]+)"[^>]*?>(?<label>\??[()A-Za-z0-9_^]{2,})[<:]/
const re_convo_line_no_speaker   = /^<span style="[^"]*?color: #(?<color>[A-Fa-f0-9]+)"[^>]*?>(?!(CURRENT|PAST|FUTURE|\?\?\?)?[a-z]+[A-Z][a-z]+ )(?!\[[A-Z]{2}\])/

const simpleHash = str => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash; // Convert to 32bit integer
  }
  return new Uint32Array([hash])[0].toString(36);
};

function apiStoreMemoized(funkey, fun){
  return function(content_str, options) {
    return fun(content_str, options)

    cache[funkey] = cache[funkey] || {}
    const argkey = simpleHash(content_str)

    const cached_result = cache[funkey][argkey]
    if (cached_result) return cached_result
    else {
      const result = fun(content_str, options)
      cache[funkey][argkey] = result
      return result
    }
  }
}

function labelPredicateFactory(labels) {
  const all_matchers = labels.map(v => [
    new RegExp(`^${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
    new RegExp(`^[PCF?]?${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[0-9]?\\??$`),
    // new RegExp(`^\\(${v}\\)$`),
  ]).flat()
  return function(node) {
    return all_matchers.some(m => m.exec(node.getAttribute('data-sem-label')))
  }
}

function labelColorPairPredicateFactory(labels, color) {
  return function(node) {
    sem_color = node.getAttribute('data-sem-color')
    if (
      (sem_color == color || Array.isArray(color) && color.includes(sem_color))
      && labelPredicateFactory(labels)(node)
    ) {
      return true
    }
  }
}

function naiveInnerText(node) {
  const Node = node; // We need Node(DOM's Node) for the constants, but Node doesn't exist in the nodejs global space, and any Node instance references the constants through the prototype chain
  return [...node.childNodes].map(node => {
    switch (node.nodeType) {
      case Node.TEXT_NODE:
        return node.textContent;
      case Node.ELEMENT_NODE:
        return naiveInnerText(node);
      default:
        return "";
    }
  }).join("\n");
}

const person_matchers = [
  { name: "andrew", predicate(node) {
    if (node.getAttribute('data-sem-color') == '000000' && node.getAttribute('data-sem-logtype') == 'authorlog') {
      return true
    }
    return false;
  }},
  { name: "aradia", predicate: labelColorPairPredicateFactory(["AA", "ARADIASPRITE", "ARADIABOT", "ARADIA"], 'A10000') },
  { name: "aradia.bot", predicate: labelColorPairPredicateFactory(["AA"], '000056') },
  { name: "aranea", predicate: labelColorPairPredicateFactory(["ARANEA", "NEYTIRI", "undefined"], '005682') },
  { name: "bec.sprite", predicate: labelColorPairPredicateFactory(["BECSPRITE"], '1F9400') },
  { name: "calliope", predicate: labelColorPairPredicateFactory(["CALLIOPE", "UU"], ['929292', 'FF0000', '323232']) },
  { name: "caliborn", predicate(node) {
    if (['2ED73A', '323232', '126628', '929292'].includes(node.getAttribute('data-sem-color'))) {
      if (node.getAttribute('data-sem-label') == "uu" || node.getAttribute('data-sem-logtype') == 'authorlog')
        return true
    }
    return false;
  }},
  { name: "calsprite", predicate: labelPredicateFactory(["CALSPRITE"]) },
  { name: "condesce", predicate: labelPredicateFactory([")(IC"]) },
  { name: "dave", predicate: labelColorPairPredicateFactory(["TG", "DAVE", "CTG"], 'E00707') },
  { name: "dave.nepeta.sprite", predicate: labelPredicateFactory(["DAVEPETASPRITE^2"]) },
  { name: "dave.sprite", predicate: labelColorPairPredicateFactory(["DAVESPRITE", "TG"], 'F2A400') },
  { name: "dirk", predicate: labelColorPairPredicateFactory(["TT", "DIRK"], ['F2A400', 'FFCC00']) },
  { name: "dirk.alt", predicate: labelColorPairPredicateFactory(["TT", "DIRK"], ['E00707']) },
  { name: "dirk.ar.equius.sprite", predicate: labelPredicateFactory(["ARQUIUSPRITE"]) },
  { name: "dirk.equius.gamzee.docscratch", predicate: labelColorPairPredicateFactory(["undefined"], 'FFFFFF') },
  { name: "equius", predicate: labelColorPairPredicateFactory(["CT", "EQUIUS"], '000056') },
  { name: "equius.sprite", predicate: labelPredicateFactory(["EQUIUSPRITE"]) },
  { name: "eridan", predicate: labelColorPairPredicateFactory(["CA"], '6A006A') },
  { name: "eridan.sollux.sprite", predicate: labelPredicateFactory(["ERISOLSPRITE"]) },
  { name: "feferi", predicate: labelPredicateFactory(["CC", "FEFERI"]) },
  { name: "feferi.nepeta.sprite", predicate: labelPredicateFactory(["FEFETASPRITE"]) },
  { name: "gamzee", predicate: labelPredicateFactory(["TC", "GAMZEE"]) },
  { name: "gcat.tavros.sprite", predicate: labelPredicateFactory(["GCATAVROSPRITE"]) },

  { name: "dad", predicate: labelColorPairPredicateFactory(["pipefan413"], ['4B4B4B']) },

  { name: "hatfans", predicate(node) {
    return [
      "fedorafreak", "1dapperblackshell", "FineryFiend", "NoNeed4PantsThx",
      "ChuffedAboutDuds", "HATLIKER", "WANT_MORE_SOCKS"
    ].includes(node.getAttribute('data-sem-label'))
  }},
  { name: "jade", predicate: labelColorPairPredicateFactory(["GG", "JADE"], '4AC925') },
  { name: "jade.sprite", predicate: labelPredicateFactory(["JADESPRITE"]) },
  { name: "jade.grimbark", predicate: labelColorPairPredicateFactory(["JADE", "BARK"], '000000') },
  { name: "jake", predicate: labelColorPairPredicateFactory(["JAKE", "GT"], '1F9400') },
  { name: "jane", predicate: labelColorPairPredicateFactory(["GG", "JANE"], '00D5F2') },
  { name: "jane.crockertier", predicate: labelColorPairPredicateFactory(["JANE"], 'FF0000') },
  { name: "jane.sprite", predicate: labelColorPairPredicateFactory(["NANNASPRITE", "NANNASPRITEx2", "pipefan413"], '00D5F2') },
  { name: "jasper.rose.sprite", predicate: labelPredicateFactory(["JASPROSESPRITE^2"]) },
  { name: "jasper.sprite", predicate: labelPredicateFactory(["JASPERSPRITE"]) },
  { name: "john", predicate: labelColorPairPredicateFactory(["EB", "JOHN", "GT", "(JOHN)", "E8", "CEB"], '0715CD') },
  { name: "kanaya", predicate: labelColorPairPredicateFactory(["GA", "CGA", "FGA", "KANAYA"], '008141') },
  { name: "kanayamom", predicate: labelPredicateFactory(["MOTHERSPRITE"]) },
  { name: "karkat", predicate: labelColorPairPredicateFactory(["CG", "KARKAT"], ['FF0000', '626262']) },
  { name: "meenah", predicate: labelPredicateFactory(["MEENAH"]) },
  { name: "nepeta", predicate: labelColorPairPredicateFactory(["AC", "NEPETA"], '416600') },
  { name: "nepeta.sprite", predicate: labelPredicateFactory(["NEPETASPRITE"]) },
  { name: "rose", predicate: labelColorPairPredicateFactory(["TT", "ROSE"], 'B536DA') },
  { name: "rose.sprite", predicate: labelPredicateFactory(["ROSESPRITE"]) },
  { name: "roxy", predicate: labelColorPairPredicateFactory(["TG", "ROXY", "undefined"], ['FBBAFF', 'FF6FF2']) },
  { name: "sollux", predicate: labelColorPairPredicateFactory(["TA", "SOLLUX"], 'A1A100') },
  { name: "tavros", predicate: labelColorPairPredicateFactory(["AT", "TAVROS"], 'A15000') },
  { name: "tavros.sprite", predicate: labelPredicateFactory(["TAVROSPRITE"]) },
  { name: "tavros.vriska.sprite", predicate: labelPredicateFactory(["TAVRISPRITE"]) },
  { name: "terezi", predicate: labelColorPairPredicateFactory(["GC", "TEREZI", "TER3Z1"], '008282') },
  { name: "terezimom", predicate: labelPredicateFactory(["DRAGONSPRITE"]) },
  { name: "vriska", predicate: labelColorPairPredicateFactory(["AG", "VRISKA", "(VRISKA)"], '005682') },
]

function identifyPerson(node, guess, jobnote) {
  // let res = undefined
  for (const {name, predicate} of person_matchers) {
    if (predicate(node) == true) {
      return name
      // VERY EXPENSIVE: TESTING ONLY
      // if (res) api.logger.warn("Matched twice!", node.outerHTML)
      // res = name
    }
  }
  // if (res) return res
  api.logger.error(jobnote, "Unknown person", node.outerHTML, guess)
  // return guess
}


function getTextType(content) {
  if (!content) return null

  if (/^\|AUTHORLOG\|/.test(content)){
      return "authorlog"
  } else if (/^\|.*?\|/.test(content)){
      return "log"
  } else {
      return "prattle"
  }
}

const makeSemanticContent = apiStoreMemoized('makeSemanticContent', function(orig_content, options) {
  // Optimization: skip image-only pages
  if (!orig_content.trim()) {
    return {
      sem_participants: [], // emptyset
      sem_wordcount: 0
    }
  }

  options = options || {}

  const { JSDOM } = require('./node_modules/jsdom')
  // if (!dom) api.logger.warn("Creating new DOM")
  dom = dom || new JSDOM('<!DOCTYPE html><body></body>').window.document;

  container = dom.createElement('div')
  container.innerHTML = orig_content

  function processLinesWithMatcher(re_matcher, querySelector, jobnote) {
    // SPEAKER: Text formatted logs
    container.querySelectorAll(querySelector).forEach(line => {
      const loh = line.outerHTML
      if (re_matcher == re_convo_line_no_speaker && (!line.nextSibling || line.nextSibling.nodeType == line.TEXT_NODE)) {
        // Just inline emphasized text
        return
      }
      try {
        const match = re_matcher.exec(loh)
        if (match) {
          const label = match.groups['label']
          line.setAttribute('data-sem-label', label)
          line.setAttribute('data-sem-color', match.groups['color'].toUpperCase())

          let line_identifying_node = line;

          const person = identifyPerson(line_identifying_node, label, jobnote)
          if (person) line.setAttribute(`data-sem-person`, person) // Don't set "undefined" string.

          // Check for spr2/crockertier/grimbark and process next span
          const real_line = line.nextElementSibling
          const line_is_just_label_and_maybe_emote = label && (label.length + 10 > line.textContent.length)
          if (
            re_matcher == re_convo_line_with_speaker         // We are searching for labels, not partial text
            && label && line_is_just_label_and_maybe_emote   // We found a label, and we are (approx, davepeta) just a label
            && real_line && real_line.matches('span[style]') // The next element sibling is a styled span
          ) {
            // real_line.setAttribute(`data-sem-leapfrog`, "target")
            // line.setAttribute(`data-sem-leapfrog`, "jumper")

            // Recompute line based on combined information (our label, next color)
            // Copy color from real line to label (don't reprocess it)
            next_line_match = re_convo_line_no_speaker.exec(real_line.outerHTML)
            if (next_line_match) {
              // api.logger.debug(`Replacing our color ${match.groups['color']} with their color ${next_line_match.groups['color']}`)
              line.setAttribute('data-sem-color', next_line_match.groups['color'].toUpperCase())
            } else {
              api.logger.error(jobnote, `Real line didn't match color regex\n`, real_line.outerHTML)
            }
            const person_retry = identifyPerson(line, label, "recompute person w copied color")
            if (person_retry) line.setAttribute(`data-sem-person`, person_retry)

            // Hoist label into span
            const extra_space = line.nextSibling
            if (extra_space && extra_space.nodeType == line.TEXT_NODE)
              real_line.insertAdjacentText('afterBegin', extra_space.textContent)

            real_line.insertAdjacentElement('afterBegin', line)

            // Copy person from label to real line (don't reprocess it)
            real_line.setAttribute('data-sem-person', line.getAttribute('data-sem-person'))
          } else {
            // shrug
          }
        }
        else {
          // Just a styled span, probably.
          // if (re_matcher == re_convo_line_no_speaker && !/(\[[A-Z]{2}\])|(\[uu]\])/.exec(loh))
          //   api.logger.warn(jobnote, "Couldn't match", loh)
        }
      } catch (e) { api.logger.error(loh, e); throw e; }
    })
  }

  const text_type = getTextType(orig_content)

  let re_matcher = re_convo_line_with_speaker
  if (text_type == 'authorlog') {
    container.querySelectorAll('span[style]').forEach(line => {
      line.setAttribute(`data-sem-logtype`, text_type)
    })
    processLinesWithMatcher(re_convo_line_no_speaker, 'span[style]', 'authorlog no_speaker')
  } else if (text_type == 'log') {
    processLinesWithMatcher(re_convo_line_with_speaker, 'br + span[style], span[style]:first-child', 'log firstpass with_speaker')
    processLinesWithMatcher(re_convo_line_no_speaker, 'span[style]:not([data-sem-person])', 'log second no_speaker')
  } else if (options.crawl_footnotes) {
    processLinesWithMatcher(re_convo_line_with_speaker, 'span[style]', 'footnotes')
  }

  // if (res != orig_content) {
  //   api.logger.warn(orig_content, '\n-------\n', res)
  // }
  res = {
    sem_participants: [...new Set(
      [...container.querySelectorAll("[data-sem-person]")].map(e => e.getAttribute('data-sem-person'))
    )],
    sem_wordcount: (container.innerHTML ? naiveInnerText(container).split(' ').length : 0)
  }
  new_content = container.innerHTML.replace(/<br>/g, '<br />')
  if (new_content != orig_content)
    res['content'] = new_content

  return res
})

module.exports = {
  title: "Semantic Info",
  description: "Annotates the story with semantic info. Optionally, put ABOVE readmspa in the load order so readmspa runs first.",
  author: "GiovanH",
  version: 0.1,

  computed(api_) {
    api = api_
    if (api.store.get("clearcache")) {
      api.logger.info("Got clearcache: Clearing cache and unsetting clearcache flag")
      api.store.set("cache", {})
      api.store.set("clearcache", false)
    }
    cache = api.store.get("cache", {})
  },

  settings: {
    boolean: [{
      model: "clearcache",
      label: "Clear cache",
      desc: "Next time the archive reload, clear the semantic cache and regenerate data."
    }]
  },

  edit(archive) {
    Object.keys(archive.mspa.story).forEach(page_num => {
    // ;[
    //   '009907', '009362', '005527',
    //   '008346',
    //   '005881', '005660'
    // ].forEach(page_num => {
      archive.mspa.story[page_num] = {
        ...archive.mspa.story[page_num],
        ...makeSemanticContent(archive.mspa.story[page_num].content)
      }
      // api.logger.info(page_num, archive.footnotes.story[page_num])
      if (archive.footnotes.story[page_num]) {
        for (const i in archive.footnotes.story[page_num]) {
          archive.footnotes.story[page_num][i] = {
            ...archive.footnotes.story[page_num][i],
            ...makeSemanticContent(archive.footnotes.story[page_num][i].content, {crawl_footnotes: true})
          }
          // api.logger.info(archive.footnotes.story[page_num][i])
        }
      }
    })

    archive.tweaks.modHomeRowItems.unshift({
      href: "/semantic",
      thumbsrc: "/archive/collection/archive_ryanquest.png",
      date: "",
      title: 'Semantic panel',
      description: `<p>You can do anything</p>`
    })

    archive.flags['mod.semantic'] = true

    // Save cache
    api.store.set("cache", cache)
  },

  browserPages: {
    'SEMANTIC': {
      component: {
        title: () => "Semantic conversation browser",
        template: `
<div class="pageBody">
  <NavBanner />
  <div class="pageFrame">
    <div class="pageContent">
      <div class="testSection">
        <h2>Conversations</h2>
        <p>filter conversations by speaker</p>
        <p>multiple selections load the intersection ("convos with both dirk and jane")</p>
        <ul style="column-count: 2;">
          <li v-for="person in allPeople" :key="person">
            <label>
              <input type="checkbox" v-model="selectedPersonsDict[person]" />
              <span v-text="person" />
            </label>
          </li>
        </ul>
        <label>
          <input type="checkbox" v-model="includePartial" />
          <span>Include "partial" matches (jade matches jade.sprite)</span>
        </label>
        <ul class="output" v-if="Object.values(selectedPersonsDict).some(Boolean)">
          <li v-for='p in convoMatches' :key='p.pageId'>
            <StoryPageLink long :mspaId='p.pageId' />
            <span v-text="' ' + pageSummary(p)" />
          </li>
        </ul>
      </div>
    </div>
  </div>
</div>`,
        scss: `& {
  color: var(--font-default);
  background: var(--page-pageBody);

  margin: 0;
  padding: 0;
  display: flex;
  flex-flow: column;
  flex: 1 0 auto;
  align-items: center;

  .pageFrame {
    background: var(--page-pageFrame);

    width: 950px;
    padding-top: 7px;
    padding-bottom: 23px;
    margin: 0 auto;

    flex: 0 1 auto;
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;
    align-content: center;

    .pageContent{
      background: var(--page-pageContent);
      width: 650px;
    }
  }
}
.testSection {
  border-top: 1em solid var(--page-pageFrame);
  padding: 30px;

  font-family: Verdana, Geneva, Tahoma, sans-serif;
  font-size: 12px;
  font-weight: normal;
  label {
    font-weight: bold;
  }
  div, ul {
    padding: 2em 1em;
  }
  ul, ol {
    list-style: inside;
  }
}
.output {
  border: 1px dashed grey;
  padding: 4px;
  ul, ol {
    list-style: inside;
  }
}`,
        data: function() {
          return {
            selectedPersonsDict: {},
            includePartial: false
          }
        },
        computed: {
          allPeople(){
            return [...new Set(
                Object.values(this.$archive.mspa.story)
                  .map(p => p.sem_participants).filter(Boolean)
                  .reduce((acc, nset) => [...nset, ...acc], []))
              ].sort()
          },
          selectedPersonsList(){
            return Object.keys(this.selectedPersonsDict).filter(k => this.selectedPersonsDict[k])
          },
          convoMatches(){
            return Object.values(vm.$archive.mspa.story)
              .filter(p => p.sem_participants)
              .filter(p => this.selectedPersonsList.every(v => this.effectiveParticipants(p.sem_participants).has(v)))
          }
        },
        methods: {
          effectiveParticipants(particpants_list) {
            if (this.includePartial) {
              return new Set([...particpants_list].reduce(
                (acc, s) => [s, ...s.split('.'), ...acc],
              []))
            } else {
              return new Set(particpants_list)
            }
          },
          pageSummary(p){
            return `${p.sem_wordcount} words. ${[...p.sem_participants].join(', ')}`
          }
        },
      }
    }
  },
}
