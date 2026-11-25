// Finds which files carry which stand-in flag, by reading the source as the compiler reads it, and hashes the files of a part.
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

export const FLAG_KEYS = ['part', 'standIn']
export const STATES = ['stand-in', 'fallback', 'general fallback', 'last resort', 'finished']
const NAME = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/
const posix = (p) => p.split(path.sep).join('/')

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const name of fs.readdirSync(dir).sort()) {
    if (name === '.DS_Store' || name === 'node_modules') continue
    const p = path.join(dir, name)
    if (fs.statSync(p).isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

export const isSource = (file) => /\.(ts|tsx|mts)$/.test(file) && !/\.test\.[a-z]+$/.test(file) && !file.endsWith('.d.ts')

// The flags written out in data: "part": "name" or "standIn": "name" in a JSON file.
export function flagsInData(text) {
  const out = new Set()
  for (const m of text.matchAll(/"(?:part|standIn)"\s*:\s*"([^"]+)"/g)) if (NAME.test(m[1])) out.add(m[1])
  return [...out].sort()
}

// The names a template can make, as a test: `model-${id}` gives every name that starts with model-.
export function templateTest(parts) {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^${parts.map(esc).join('[a-z0-9-]+')}$`)
}

const isFn = (n) => n && (n.type === 'ArrowFunctionExpression' || n.type === 'FunctionExpression' || n.type === 'FunctionDeclaration')
const paramName = (p) => (p.type === 'Identifier' ? p.name : p.type === 'AssignmentPattern' && p.left.type === 'Identifier' ? p.left.name : p.type === 'TSParameterProperty' ? paramName(p.parameter) : null)
const keyName = (k) => (k && k.type === 'Identifier' ? k.name : k && k.type === 'Literal' && typeof k.value === 'string' ? k.value : null)
const children = (n) => {
  const out = []
  for (const k of Object.keys(n)) {
    if (k === 'typeAnnotation' || k === 'returnType' || k === 'typeParameters' || k === 'typeArguments') continue
    const v = n[k]
    if (Array.isArray(v)) for (const x of v) if (x && typeof x.type === 'string') out.push(x)
    if (v && !Array.isArray(v) && typeof v.type === 'string') out.push(v)
  }
  return out
}

// One file as the scan needs it: its functions by name, its variables by name, and where its imported names come from.
export function readModule(file, text, parse) {
  const ast = parse(text, { lang: /x$/.test(file) ? 'tsx' : 'ts' })
  const m = { file, ast, functions: new Map(), variables: new Map(), imports: new Map() }
  const fn = (name, node) => {
    if (!m.functions.has(name)) m.functions.set(name, [])
    m.functions.get(name).push(node)
    node.fnName = name
  }
  const visit = (n) => {
    if (n.type === 'ImportDeclaration') {
      for (const sp of n.specifiers) if (sp.type === 'ImportSpecifier') m.imports.set(sp.local.name, { from: n.source.value, name: keyName(sp.imported) })
      return
    }
    if (n.type === 'FunctionDeclaration' && n.id) fn(n.id.name, n)
    if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier') {
      if (isFn(n.init)) fn(n.id.name, n.init)
      else if (n.init) {
        if (!m.variables.has(n.id.name)) m.variables.set(n.id.name, [])
        m.variables.get(n.id.name).push(n.init)
      }
    }
    if ((n.type === 'MethodDefinition' || n.type === 'Property' || n.type === 'PropertyDefinition') && isFn(n.value) && keyName(n.key)) fn(keyName(n.key), n.value)
    for (const c of children(n)) visit(c)
  }
  visit(ast)
  return m
}

// Every flag in the TypeScript given as { file, text }. Gives a map from a flag's name to the files it is written in, and the templates that make names at run time.
// A name is followed back from where it is used as a flag: through a constant, a default, a parameter and the calls that fill it, in the file itself and in the files it imports from.
export function flagsInCode(sources, parse) {
  const modules = new Map(sources.map((x) => [x.file, readModule(x.file, x.text, parse)]))
  const found = new Map()
  const templates = new Map()
  const flagged = new Set()
  const done = new Set()
  let grew = true
  const add = (name, file) => {
    if (typeof name !== 'string' || !NAME.test(name)) return
    if (!found.has(name)) found.set(name, new Set())
    if (!found.get(name).has(file)) {
      found.get(name).add(file)
      grew = true
    }
  }
  const moduleOf = (m, from) => {
    if (!from.startsWith('.')) return null
    const base = path.posix.normalize(path.posix.join(path.posix.dirname(m.file), from))
    for (const tail of ['', '.ts', '.tsx', '/index.ts']) if (modules.has(base + tail)) return modules.get(base + tail)
    return null
  }
  // Where a name used in a file is declared: the file itself, or the file it is imported from.
  const home = (m, name) => {
    const imp = m.imports.get(name)
    if (imp && !m.functions.has(name) && !m.variables.has(name)) {
      const other = moduleOf(m, imp.from)
      return other ? { m: other, name: imp.name } : null
    }
    return { m, name }
  }
  const flagParam = (m, fnName, index) => {
    const key = `${m.file}#${fnName}#${index}`
    if (flagged.has(key)) return
    flagged.add(key)
    grew = true
  }
  function sink(e, m, stack) {
    if (!e) return
    if (e.type === 'Literal') return add(e.value, m.file)
    if (e.type === 'TemplateLiteral') {
      if (!e.expressions.length) return add(e.quasis[0].value.cooked, m.file)
      const parts = e.quasis.map((q) => q.value.cooked)
      const key = `${m.file}|${parts.join('|')}`
      if (!templates.has(key)) {
        templates.set(key, { file: m.file, parts })
        grew = true
      }
      return
    }
    if (e.type === 'TSAsExpression' || e.type === 'TSNonNullExpression' || e.type === 'TSSatisfiesExpression' || e.type === 'ParenthesizedExpression' || e.type === 'TSTypeAssertion') return sink(e.expression, m, stack)
    if (e.type === 'ConditionalExpression') {
      sink(e.consequent, m, stack)
      return sink(e.alternate, m, stack)
    }
    if (e.type === 'LogicalExpression') {
      if (e.operator !== '&&') sink(e.left, m, stack)
      return sink(e.right, m, stack)
    }
    if (e.type === 'ArrayExpression') return e.elements.forEach((x) => sink(x, m, stack))
    if (e.type === 'ObjectExpression') return e.properties.forEach((p) => p.type === 'Property' && sink(p.value, m, stack))
    if (e.type === 'MemberExpression') return e.computed ? sink(e.object, m, stack) : undefined
    if (e.type === 'CallExpression' && e.callee.type === 'Identifier') {
      const h = home(m, e.callee.name)
      for (const f of (h && h.m.functions.get(h.name)) || []) returns(f, h.m)
      return
    }
    if (e.type !== 'Identifier') return
    for (let k = stack.length - 1; k >= 0; k--) {
      const index = stack[k].params.findIndex((p) => paramName(p) === e.name)
      if (index < 0) continue
      const p = stack[k].params[index]
      if (p.type === 'AssignmentPattern') sink(p.right, m, stack.slice(0, k))
      if (stack[k].fnName) flagParam(m, stack[k].fnName, index)
      return
    }
    const h = home(m, e.name)
    if (!h) return
    const key = `${h.m.file}#var#${h.name}`
    if (done.has(key)) return
    done.add(key)
    grew = true
    for (const init of h.m.variables.get(h.name) || []) sink(init, h.m, [])
  }
  function returns(f, m) {
    const key = `${m.file}#returns#${f.start}`
    if (done.has(key)) return
    done.add(key)
    if (f.body.type !== 'BlockStatement') return sink(f.body, m, [f])
    const visit = (n) => {
      if (n.type === 'ReturnStatement') sink(n.argument, m, [f])
      else if (!isFn(n)) for (const c of children(n)) visit(c)
    }
    visit(f.body)
  }
  const walkModule = (m) => {
    const visit = (n, stack) => {
      const inner = isFn(n) ? [...stack, n] : stack
      if (n.type === 'Property' && FLAG_KEYS.includes(keyName(n.key)) && !n.computed) sink(n.value, m, inner)
      if (n.type === 'AssignmentExpression' && n.operator === '=' && n.left.type === 'MemberExpression' && !n.left.computed && FLAG_KEYS.includes(keyName(n.left.property))) sink(n.right, m, inner)
      if (isFn(n)) for (const p of n.params) if (p.type === 'AssignmentPattern' && FLAG_KEYS.includes(paramName(p))) sink(p.right, m, stack)
      if (n.type === 'CallExpression' || n.type === 'NewExpression') {
        const name = n.callee.type === 'Identifier' ? n.callee.name : n.callee.type === 'MemberExpression' && !n.callee.computed ? keyName(n.callee.property) : null
        const h = name ? (n.callee.type === 'Identifier' ? home(m, name) : { m, name }) : null
        if (h) for (let i = 0; i < n.arguments.length; i++) if (flagged.has(`${h.m.file}#${h.name}#${i}`)) sink(n.arguments[i], m, inner)
      }
      for (const c of children(n)) visit(c, inner)
    }
    visit(m.ast, [])
  }
  let rounds = 0
  while (grew && rounds < 30) {
    grew = false
    rounds++
    for (const m of modules.values()) walkModule(m)
  }
  const flags = {}
  for (const name of [...found.keys()].sort()) flags[name] = [...found.get(name)].sort()
  return { flags, templates: [...templates.values()], rounds }
}

// Every flag under the folders that hold what the site is made of.
export function scan(root, parse, folders = ['src', 'public', 'assets-src']) {
  const all = folders.flatMap((f) => walk(path.join(root, f)))
  const name = (f) => posix(path.relative(root, f))
  const code = flagsInCode(all.filter(isSource).map((f) => ({ file: name(f), text: fs.readFileSync(f, 'utf8') })), parse)
  const flags = {}
  const put = (flag, file) => {
    if (!flags[flag]) flags[flag] = new Set()
    flags[flag].add(file)
  }
  for (const [flag, files] of Object.entries(code.flags)) for (const f of files) put(flag, f)
  for (const file of all.filter((f) => f.endsWith('.json'))) for (const flag of flagsInData(fs.readFileSync(file, 'utf8'))) put(flag, name(file))
  const out = {}
  for (const flag of Object.keys(flags).sort()) out[flag] = [...flags[flag]].sort()
  return { flags: out, templates: code.templates, rounds: code.rounds }
}

// The files of each part of the register: those that carry its name, and those whose template can make it.
export function filesOfParts(names, found) {
  const out = {}
  for (const name of names) {
    const files = new Set(found.flags[name] || [])
    for (const t of found.templates) if (templateTest(t.parts).test(name)) files.add(t.file)
    out[name] = [...files].sort()
  }
  return out
}

// sha256 over the files in the order given: each file's name, a zero byte, its bytes, a zero byte. Empty for no files; null when a file is gone.
export function hashOf(root, files) {
  if (!files.length) return ''
  const h = crypto.createHash('sha256')
  for (const f of files) {
    const p = path.join(root, f)
    if (!fs.existsSync(p)) return null
    h.update(f)
    h.update('\0')
    h.update(fs.readFileSync(p))
    h.update('\0')
  }
  return h.digest('hex')
}

// Fills the parts that are stand-ins and have no hash yet. A recorded hash is never touched.
export function fill(register, files, hash, commit) {
  let filled = 0
  const parts = register.parts.map((p) => {
    if (p.state !== 'stand-in' || p.standInHash || !files[p.name] || !files[p.name].length) return p
    filled++
    return { ...p, files: files[p.name], standInHash: hash(files[p.name]), commit }
  })
  return { register: { ...register, parts }, filled }
}

export function setState(register, name, state, commit) {
  if (!STATES.includes(state)) throw new Error(`"${state}" is not a state. The states are ${STATES.join(', ')}`)
  if (!register.parts.some((p) => p.name === name)) throw new Error(`no part called "${name}" in the register`)
  return { ...register, parts: register.parts.map((p) => (p.name === name ? { ...p, state, commit } : p)) }
}

// What the register and the code disagree on.
export function compare(register, files, found) {
  const names = new Set(register.parts.map((p) => p.name))
  const notCarried = register.parts.filter((p) => !files[p.name] || !files[p.name].length).map((p) => p.name)
  const notInRegister = Object.keys(found.flags).filter((n) => !names.has(n)).sort()
  const idleTemplates = found.templates.filter((t) => !register.parts.some((p) => templateTest(t.parts).test(p.name)))
  return { notCarried, notInRegister, idleTemplates }
}
